import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'

/**
 * Configuration for the empty folder cleaner task.
 */
export interface EmptyFolderOptions {
  /** The root directory to start scanning for empty folders. */
  rootPath: string
  /** If true, simulates deletion without modifying the filesystem. */
  isDryRun: boolean
  /** List of folder paths to delete (used for the execution step). */
  foldersToDelete?: string[]
}

/**
 * Result of an individual folder deletion operation.
 */
export interface DeletionResult {
  /** Original path of the folder. */
  path: string
  /** Whether the deletion was successful. */
  success: boolean
  /** Error message if the operation failed. */
  error?: string
}

/**
 * Recursively scans a directory tree to find folders that are empty
 * or contain only empty subfolders.
 *
 * @param taskId The unique ID for the task in the TaskManager.
 * @param options Configuration for the scan.
 * @returns A promise that resolves to the list of empty folder paths found.
 */
export async function findEmptyFoldersTask(
  taskId: string,
  options: { rootPath: string }
): Promise<string[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus('running')
  const emptyFolders: string[] = []

  try {
    reporter.updateProgress({
      current: 0,
      total: 0,
      message: 'Scanning for empty folders...'
    })

    async function scan(currentPath: string): Promise<boolean> {
      await reporter.yieldAndCheckCancellation()

      let entries: import('fs').Dirent[] = []
      try {
        entries = await fs.readdir(currentPath, { withFileTypes: true })
      } catch {
        // Skip inaccessible folders
        return false
      }

      let isEmpty = true

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const entryPath = join(currentPath, entry.name)
          const isSubfolderEmpty = await scan(entryPath)
          if (!isSubfolderEmpty) {
            isEmpty = false
          }
        } else {
          // It's a file, so the folder is not empty
          isEmpty = false
        }
      }

      if (isEmpty) {
        emptyFolders.push(currentPath)
      }

      return isEmpty
    }

    await scan(options.rootPath)

    // Filter out the root path if it was identified as empty
    const finalResults = emptyFolders.filter((path) => path !== options.rootPath)

    reporter.complete(finalResults)
    return finalResults
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    reporter.error(message)
    throw error
  }
}

/**
 * Deletes a list of folder paths. Handles them from deepest to shallowest
 * to ensure that if a folder becomes empty because its subfolders were deleted,
 * it can also be deleted (if it was included in the original list).
 *
 * @param taskId The unique ID for the task in the TaskManager.
 * @param options Configuration for the deletion.
 * @returns A promise that resolves to the results of the deletion operations.
 */
export async function deleteFoldersTask(
  taskId: string,
  options: { foldersToDelete: string[]; isDryRun: boolean }
): Promise<DeletionResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const deletionResults: DeletionResult[] = []

  try {
    const { foldersToDelete, isDryRun } = options

    // Sort folders by depth (deepest first) to ensure clean recursive deletion
    const sortedFolders = [...foldersToDelete].sort(
      (a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length
    )

    reporter.updateProgress({
      current: 0,
      total: sortedFolders.length,
      message: isDryRun ? 'Simulating deletion...' : 'Deleting folders...'
    })

    let processedCount = 0

    for (const folderPath of sortedFolders) {
      await reporter.yieldAndCheckCancellation()

      let success = true
      let error: string | undefined

      if (!isDryRun) {
        try {
          await fs.rmdir(folderPath)
        } catch (err) {
          success = false
          error = err instanceof Error ? err.message : String(err)
        }
      }

      deletionResults.push({
        path: folderPath,
        success,
        error
      })

      processedCount++
      reporter.updateProgress({
        current: processedCount,
        total: sortedFolders.length,
        message: `Processed ${parse(folderPath).name}`
      })
    }

    reporter.complete(deletionResults)
    return deletionResults
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    reporter.error(message)
    throw error
  }
}
