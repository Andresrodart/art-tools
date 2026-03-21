import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'
import {
  getFolderStats,
  formatBytesToHumanReadable,
  collectAllDirectoryPaths,
  FolderMetadataResult
} from './utils/folderUtils'

/**
 * Configuration for the folder metadata appendage task.
 */
export interface FolderMetadataOptions {
  /** The root directory to start analyzing folders. */
  rootPath: string
  /** Whether to append the folder's total size (e.g., "_1.5MB"). */
  includeSize: boolean
  /** Whether to append the total element count (e.g., "_10"). */
  includeElements: boolean
  /** If true, simulates folder renaming without modifying the filesystem. */
  isDryRun: boolean
}

/**
 * Appends metadata (total size and element count) to directory names within a root path.
 * This is a recursive operation starting from the deepest directories upwards.
 *
 * @param taskId The unique ID for the task in the TaskManager.
 * @param options Configuration for what metadata to append and where.
 * @returns A promise that resolves to the rename results for each folder.
 */
export async function folderMetadataTask(
  taskId: string,
  options: FolderMetadataOptions
): Promise<FolderMetadataResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const metadataResults: FolderMetadataResult[] = []

  try {
    // 1. Collect all directory paths recursively to prepare for the analysis
    const allDirectoryPaths = await collectAllDirectoryPaths(options.rootPath)

    reporter.updateProgress({
      current: 0,
      total: allDirectoryPaths.length,
      message: 'Scanning directories...'
    })

    let processedDirectoryCount = 0

    // 2. Sort directories descending by depth so we rename leaf folders first.
    // This is crucial because renaming a parent folder would break child paths.
    allDirectoryPaths.sort(
      (pathA, pathB) => pathB.split(/[\\/]/).length - pathA.split(/[\\/]/).length
    )

    for (const directoryPath of allDirectoryPaths) {
      // Yield to the event loop and check for cancellation before processing each directory
      await reporter.yieldAndCheckCancellation()

      const folderStatistics = await getFolderStats(directoryPath)
      const parsedPathMetadata = parse(directoryPath)

      const nameSuffixParts: string[] = []
      if (options.includeSize) {
        nameSuffixParts.push(formatBytesToHumanReadable(folderStatistics.sizeInBytes))
      }

      if (options.includeElements) {
        nameSuffixParts.push(folderStatistics.totalElementCount.toString())
      }

      let newDirectoryName = parsedPathMetadata.name
      if (nameSuffixParts.length > 0 && newDirectoryName) {
        // Prevent appending the same suffix multiple times if it already ends with it
        const suffixString = `_${nameSuffixParts.join('_')}`
        if (!newDirectoryName.endsWith(suffixString)) {
          newDirectoryName = `${newDirectoryName}${suffixString}`
        }
      }

      // Rename the directory only if its name has actually changed
      if (newDirectoryName !== parsedPathMetadata.name) {
        const newDirectoryFullPath = join(parsedPathMetadata.dir, newDirectoryName)

        let renameSuccess = true
        let renameErrorMessage: string | undefined

        if (!options.isDryRun) {
          try {
            await fs.rename(directoryPath, newDirectoryFullPath)
          } catch (error: unknown) {
            renameSuccess = false
            renameErrorMessage = error instanceof Error ? error.message : String(error)
            console.error(
              `Failed to rename ${directoryPath} to ${newDirectoryFullPath}`,
              renameErrorMessage
            )
          }
        }

        metadataResults.push({
          originalName: parsedPathMetadata.name,
          newName: newDirectoryName,
          originalPath: directoryPath,
          newPath: newDirectoryFullPath,
          success: renameSuccess,
          error: renameErrorMessage
        })
      }

      processedDirectoryCount++
      reporter.updateProgress({
        current: processedDirectoryCount,
        total: allDirectoryPaths.length,
        message: `Processed ${parsedPathMetadata.name}`
      })
    }

    // Mark task as complete with the resulting metadata results
    reporter.complete(metadataResults)
    return metadataResults
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    reporter.error(message)
    throw error
  }
}
