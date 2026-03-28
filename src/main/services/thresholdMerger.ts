import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'

/**
 * Configuration for the threshold folder merger task.
 */
export interface ThresholdMergerOptions {
  /** The root directory to start searching for small folders to merge. */
  rootPath: string
  /** The item count threshold. Folders with fewer items than this will be merged. */
  thresholdX: number
  /** The maximum capacity of a merged group. Merging stops if total items exceed this. */
  maxCapacityY: number
  /** If true, simulates folder merges without modifying the filesystem. */
  isDryRun: boolean
}

/**
 * Result object for each merged folder group.
 */
export interface ThresholdMergerResult {
  /** The list of original absolute paths of the folders that were merged. */
  originalPaths: string[]
  /** The newly created merged folder path containing all items. */
  newPath: string
  /** Whether the merge operation was successful. */
  success: boolean
  /** Descriptive error message if the merge failed. */
  error?: string
}

/**
 * Metadata for a directory being evaluated for a potential merge.
 */
interface MergableFolderMetadata {
  /** The absolute path of the directory. */
  path: string
  /** The name of the directory. */
  name: string
  /** The number of immediate elements (files and folders) it contains. */
  elementCount: number
}

/**
 * Retrieves the count of immediate elements (files and folders) within a directory.
 *
 * @param directoryPath The absolute path of the directory to inspect.
 * @returns The number of direct children found.
 */
export async function getImmediateElementCount(directoryPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(directoryPath)
    return entries.length
  } catch {
    // Inaccessible or non-existent; return 0 to consider it mergeable
    return 0
  }
}

/**
 * Finds all immediate subdirectories of a given directory.
 *
 * @param directoryPath The absolute path of the directory to search.
 * @returns A list of absolute paths for each subdirectory found.
 */
export async function getImmediateSubdirectoryPaths(directoryPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(directoryPath, entry.name))
  } catch {
    // Access error; return an empty list
    return []
  }
}

/**
 * Performs a physical merge of multiple folders into a single target directory.
 * The new folder name is derived by concatenating the names of the source folders.
 *
 * @param parentPath The common parent directory where the new merged folder will reside.
 * @param folderGroup A list of folders to be merged.
 * @param isDryRun If true, skips physical filesystem operations.
 * @returns A promise that resolves to the merge result.
 */
async function executeMergeOperation(
  parentPath: string,
  folderGroup: MergableFolderMetadata[],
  isDryRun: boolean
): Promise<ThresholdMergerResult> {
  const originalAbsolutePaths = folderGroup.map((folder) => folder.path)

  // Derive the new folder name: "folderA___folderB___folderC"
  const mergedFolderName = folderGroup.map((folder) => folder.name).join('___')
  const mergedFolderFullPath = join(parentPath, mergedFolderName)

  let mergeSuccess = true
  let mergeErrorMessage: string | undefined

  if (!isDryRun) {
    try {
      // 1. Create the target destination for all items
      await fs.mkdir(mergedFolderFullPath, { recursive: true })

      // 2. Move contents of each source folder into the new target directory
      const allEntries = await Promise.all(
        folderGroup.map(async (folder) => {
          const entries = await fs.readdir(folder.path)
          return { folder, entries }
        })
      )

      const renamePromises: Promise<void>[] = []
      for (const { folder, entries } of allEntries) {
        for (const entryName of entries) {
          const oldEntryPath = join(folder.path, entryName)
          const newEntryPath = join(mergedFolderFullPath, entryName)
          renamePromises.push(fs.rename(oldEntryPath, newEntryPath))
        }
      }
      await Promise.all(renamePromises)

      // 3. Delete the now-empty source folders
      await Promise.all(folderGroup.map((folder) => fs.rmdir(folder.path)))
    } catch (error: unknown) {
      mergeSuccess = false
      mergeErrorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Merge failed for ${mergedFolderFullPath}: ${mergeErrorMessage}`)
    }
  }

  return {
    originalPaths: originalAbsolutePaths,
    newPath: mergedFolderFullPath,
    success: mergeSuccess,
    error: mergeErrorMessage
  }
}

/**
 * Recursively scans a directory tree and merges sibling folders that fall below the item threshold.
 * It uses a bottom-up approach to ensure child folders are processed before their parents.
 *
 * @param currentDirectoryPath The directory to evaluate for merging its subfolders.
 * @param mergeOptions Configuration for the merge logic.
 * @param mergeResults Shared list to collect results of each merge.
 * @param reporter The task reporter for progress updates and cancellation.
 */
export async function mergeSiblingFoldersRecursively(
  currentDirectoryPath: string,
  mergeOptions: ThresholdMergerOptions,
  mergeResults: ThresholdMergerResult[],
  reporter: TaskReporter
): Promise<void> {
  // Yield and check for task cancellation at each depth
  await reporter.yieldAndCheckCancellation()

  // 1. Traverse all children first (bottom-up approach)
  const initialSubdirectoryPaths = await getImmediateSubdirectoryPaths(currentDirectoryPath)
  await Promise.all(
    initialSubdirectoryPaths.map((path) =>
      mergeSiblingFoldersRecursively(path, mergeOptions, mergeResults, reporter)
    )
  )

  // 2. Re-fetch children after recursion as sibling merges might have changed them!
  const currentSubdirectoryPaths = await getImmediateSubdirectoryPaths(currentDirectoryPath)

  // 3. Identify all subfolders that are candidates for merging based on their element count
  const itemsWithCounts = await Promise.all(
    currentSubdirectoryPaths.map(async (path) => ({
      path,
      elementCount: await getImmediateElementCount(path)
    }))
  )

  const mergeCandidates: MergableFolderMetadata[] = itemsWithCounts
    .filter((item) => item.elementCount < mergeOptions.thresholdX)
    .map((item) => ({
      path: item.path,
      name: parse(item.path).name,
      elementCount: item.elementCount
    }))

  // 4. Group candidate subfolders into batches and perform the merges
  let candidateIndex = 0
  while (candidateIndex < mergeCandidates.length) {
    const folderBatch: MergableFolderMetadata[] = []
    let currentBatchElementCount = 0

    // Build a batch that respects the maximum capacity (maxCapacityY)
    while (candidateIndex < mergeCandidates.length) {
      const folderCandidate = mergeCandidates[candidateIndex]

      // Stop if adding this folder would exceed the batch capacity
      if (
        folderBatch.length > 0 &&
        currentBatchElementCount + folderCandidate.elementCount > mergeOptions.maxCapacityY
      ) {
        break
      }

      folderBatch.push(folderCandidate)
      currentBatchElementCount += folderCandidate.elementCount
      candidateIndex++

      // Stop if the batch has reached the exact capacity limit
      if (currentBatchElementCount >= mergeOptions.maxCapacityY) {
        break
      }
    }

    // A merge requires at least 2 sibling folders
    if (folderBatch.length > 1) {
      reporter.updateProgress({
        current: mergeResults.length + 1,
        total: mergeResults.length + 1, // Total count is dynamic and unknown upfront
        message: `Merging ${folderBatch.length} folders in ${currentDirectoryPath}...`
      })

      const operationResult = await executeMergeOperation(
        currentDirectoryPath,
        folderBatch,
        mergeOptions.isDryRun
      )
      mergeResults.push(operationResult)
    }
  }
}

/**
 * Core task executor for the threshold folder merger.
 * Merges sibling directories that contain fewer items than a specified threshold.
 *
 * @param taskId Unique ID for task tracking.
 * @param options Logic configuration for the merge.
 * @returns A promise resolving to a summary of all merges performed.
 */
export async function thresholdMergerTask(
  taskId: string,
  options: ThresholdMergerOptions
): Promise<ThresholdMergerResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const totalMergeResults: ThresholdMergerResult[] = []

  try {
    reporter.updateProgress({
      current: 0,
      total: 1,
      message: 'Starting threshold merger...'
    })

    // Initiate recursive bottom-up sibling merging
    await mergeSiblingFoldersRecursively(options.rootPath, options, totalMergeResults, reporter)

    // Finalize the task with accurate progress counts
    const totalCount = totalMergeResults.length
    reporter.updateProgress({
      current: totalCount,
      total: totalCount,
      message: 'Processing complete.'
    })

    reporter.complete(totalMergeResults)
    return totalMergeResults
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    reporter.error(message)
    throw error
  }
}
