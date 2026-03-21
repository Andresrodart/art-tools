import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'
import { FileWalker } from './utils/fileWalker'
import { getUniqueFilePath } from './utils/pathUtils'

/**
 * Configuration options for the file scraper task.
 */
export interface FileScraperOptions {
  /** The absolute path to the directory being scanned. */
  sourcePath: string
  /** The absolute path to the directory where matching files will be moved. */
  destinationPath: string
  /** A list of file extensions to move (e.g., ['.jpg', '.png']) or ['*'] for all files. */
  extensions: string[]
  /** If true, simulates the operation without moving any files. */
  isDryRun: boolean
  /** A list of directory paths to ignore during the scan. */
  ignorePaths?: string[]
}

/**
 * Result object for a single file scraped and moved.
 */
export interface FileScraperResult {
  /** The original path of the file before processing. */
  originalPath: string
  /** The new path of the file after processing. */
  newPath: string
  /** Whether the file was successfully moved. */
  success: boolean
  /** Descriptive error message if the operation failed. */
  error?: string
  /** Whether the error occurred on a directory level (e.g., permission denied). */
  isDirectoryError?: boolean
}

/**
 * Scans a source directory for files matching certain extensions and moves them to a flat
 * destination folder. This is a recursive operation that flattens the file structure.
 *
 * @param taskId The unique ID of the task in the TaskManager.
 * @param options Configuration for the scraper operation.
 * @returns A promise that resolves to an array of results for each file processed.
 */
export async function fileScraperTask(
  taskId: string,
  options: FileScraperOptions
): Promise<FileScraperResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const scrapeResults: FileScraperResult[] = []

  try {
    // 1. Ensure the source path exists before starting
    try {
      await fs.stat(options.sourcePath)
    } catch {
      throw new Error(`Source path does not exist: ${options.sourcePath}`)
    }

    // 2. Build a flat list of all matching files recursively
    const matchingFilePaths: string[] = []
    const directoryWalker = new FileWalker(reporter, {
      ignorePaths: options.ignorePaths,
      extensions: options.extensions
    })

    reporter.updateProgress({
      current: 0,
      total: 0,
      message: 'Starting initial directory scan...'
    })

    // Walk the directory and collect all files that match the extension criteria
    await directoryWalker.walk(options.sourcePath, async (fullPath, entry) => {
      matchingFilePaths.push(fullPath)
      reporter.updateProgressThrottled({
        current: matchingFilePaths.length,
        total: 0, // Total is unknown while scanning
        message: `Scanning... Found ${matchingFilePaths.length} matches. Looking at: ${entry.name}`
      })
    })

    // 3. Process each matched file (Move to destination)
    if (matchingFilePaths.length > 0 && !options.isDryRun) {
      // Ensure the destination folder exists before moving files
      await fs.mkdir(options.destinationPath, { recursive: true })
    }

    let processedFileCount = 0
    for (const sourceFilePath of matchingFilePaths) {
      // Yield control and check for task cancellation before processing each file
      await reporter.yieldAndCheckCancellation()

      const parsedSourcePath = parse(sourceFilePath)

      let targetFilePath: string
      if (options.isDryRun) {
        // In dry-run, we simply join paths without checking for name collisions on the disk
        targetFilePath = join(
          options.destinationPath,
          `${parsedSourcePath.name}${parsedSourcePath.ext}`
        )
      } else {
        // Ensure the filename is unique in the destination folder to prevent overwrites
        targetFilePath = await getUniqueFilePath(
          options.destinationPath,
          parsedSourcePath.name,
          parsedSourcePath.ext
        )
      }

      let operationSuccess = true
      let operationErrorMessage: string | undefined

      if (!options.isDryRun) {
        try {
          await fs.rename(sourceFilePath, targetFilePath)
        } catch (error: unknown) {
          operationSuccess = false
          operationErrorMessage = error instanceof Error ? error.message : String(error)
          console.error(
            `Failed to move ${sourceFilePath} to ${targetFilePath}`,
            operationErrorMessage
          )
        }
      }

      scrapeResults.push({
        originalPath: sourceFilePath,
        newPath: targetFilePath,
        success: operationSuccess,
        error: operationErrorMessage
      })

      processedFileCount++
      reporter.updateProgress({
        current: processedFileCount,
        total: matchingFilePaths.length,
        message: `Scraped ${parsedSourcePath.base}`
      })
    }

    if (matchingFilePaths.length === 0) {
      reporter.updateProgress({
        current: 0,
        total: 0,
        message: 'No matching files found.'
      })
    }

    // Finalize the task in the manager
    reporter.complete(scrapeResults)
    return scrapeResults
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    reporter.error(message)
    throw error
  }
}
