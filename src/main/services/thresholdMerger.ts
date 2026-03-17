import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { taskManager } from './TaskManager'

export interface ThresholdMergerOptions {
  rootPath: string
  thresholdX: number // Merge if items < X
  maxCapacityY: number // Stop merging when group items >= Y
  isDryRun: boolean
}

export interface ThresholdMergerResult {
  originalPaths: string[] // Array of original folder paths that were merged
  newPath: string // The new merged folder path
  success: boolean
  error?: string
}

/**
 * Gets the number of immediate elements (files and folders) within a directory.
 */
export async function getImmediateElementCount(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir)
    return entries.length
  } catch {
    return 0 // Inaccessible or non-existent
  }
}

/**
 * Finds all subdirectories of a given directory.
 */
export async function getSubdirectories(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => join(dir, e.name))
  } catch {
    return []
  }
}

interface MergableFolder {
  path: string
  name: string
  elementCount: number
}

/**
 * Handles the merging of a group of folders into a single folder.
 */
async function performMerge(
  parentPath: string,
  folders: MergableFolder[],
  isDryRun: boolean
): Promise<ThresholdMergerResult> {
  const originalPaths = folders.map((f) => f.path)

  // Construct the new folder name: folderA___folderB___folderC
  const newFolderName = folders.map((f) => f.name).join('___')
  const newPath = join(parentPath, newFolderName)

  let success = true
  let errorMsg: string | undefined

  if (!isDryRun) {
    try {
      // 1. Create the new target directory
      await fs.mkdir(newPath, { recursive: true })

      // 2. Move contents of all folders into the new directory
      for (const folder of folders) {
        const entries = await fs.readdir(folder.path)
        for (const entry of entries) {
          const oldEntryPath = join(folder.path, entry)
          const newEntryPath = join(newPath, entry)
          await fs.rename(oldEntryPath, newEntryPath)
        }
      }

      // 3. Delete the original empty folders
      for (const folder of folders) {
        await fs.rmdir(folder.path)
      }
    } catch (e: unknown) {
      success = false
      errorMsg = e instanceof Error ? e.message : String(e)
      console.error(`Merge failed for ${newPath}: ${errorMsg}`)
    }
  }

  return {
    originalPaths,
    newPath,
    success,
    error: errorMsg
  }
}

/**
 * Recursively processes directories bottom-up to merge siblings.
 */
export async function mergeSiblingsRecursive(
  currentDir: string,
  options: ThresholdMergerOptions,
  results: ThresholdMergerResult[],
  taskId: string
): Promise<void> {
  // Check cancellation
  const task = taskManager.getActiveTasks().find((t) => t.id === taskId)
  if (task?.status === 'error') {
    throw new Error('Task cancelled by user')
  }

  // 1. First traverse children (bottom-up approach)
  const subDirs = await getSubdirectories(currentDir)
  for (const subDir of subDirs) {
    await mergeSiblingsRecursive(subDir, options, results, taskId)
  }

  // Re-fetch subdirectories since the recursive calls might have merged/renamed them!
  const currentSubDirs = await getSubdirectories(currentDir)

  // 2. Evaluate all children of currentDir for merging
  const mergableCandidates: MergableFolder[] = []

  for (const dirPath of currentSubDirs) {
    const elementCount = await getImmediateElementCount(dirPath)
    if (elementCount < options.thresholdX) {
      mergableCandidates.push({
        path: dirPath,
        name: parse(dirPath).name,
        elementCount
      })
    }
  }

  // 3. Group and merge
  // We process candidates sequentially.
  // If we have less than 2 candidates, there is nothing to merge
  let i = 0
  while (i < mergableCandidates.length) {
    const currentGroup: MergableFolder[] = []
    let currentGroupCount = 0

    // Build the group
    while (i < mergableCandidates.length) {
      const candidate = mergableCandidates[i]

      // If adding this would exceed Y, and we already have at least 1 item, stop this group
      if (
        currentGroup.length > 0 &&
        currentGroupCount + candidate.elementCount > options.maxCapacityY
      ) {
        break
      }

      currentGroup.push(candidate)
      currentGroupCount += candidate.elementCount
      i++

      // If we reached exact capacity, stop this group
      if (currentGroupCount >= options.maxCapacityY) {
        break
      }
    }

    // A group must have at least 2 folders to be a merge
    if (currentGroup.length > 1) {
      taskManager.updateTaskProgress(taskId, {
        current: results.length + 1,
        total: results.length + 1, // We don't know total upfront due to tree structure
        message: `Merging ${currentGroup.length} folders in ${currentDir}...`
      })

      const result = await performMerge(currentDir, currentGroup, options.isDryRun)
      results.push(result)
    }
  }
}

/**
 * Core task executor for threshold merger.
 */
export async function thresholdMergerTask(
  taskId: string,
  options: ThresholdMergerOptions
): Promise<ThresholdMergerResult[]> {
  taskManager.updateTaskStatus(taskId, options.isDryRun ? 'dry-run' : 'running')
  const results: ThresholdMergerResult[] = []

  try {
    taskManager.updateTaskProgress(taskId, {
      current: 0,
      total: 1,
      message: 'Starting threshold merger...'
    })

    await mergeSiblingsRecursive(options.rootPath, options, results, taskId)

    // Ensure total is realistic at the end
    const finalCount = results.length
    taskManager.updateTaskProgress(taskId, {
      current: finalCount,
      total: finalCount,
      message: 'Processing complete.'
    })

    taskManager.completeTask(taskId, results)
    return results
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    taskManager.updateTaskStatus(taskId, 'error', msg)
    throw error
  }
}
