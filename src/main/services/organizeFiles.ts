import * as fs from 'fs'
import * as path from 'path'
import { TaskReporter } from './utils/taskReporter'
import { FileWalker } from './utils/fileWalker'
import { getUniquePathWithCheck } from './utils/pathUtils'
import {
  resolveReliableFileDate,
  synchronizeTimestampWithExif,
  buildDateBasedDestination
} from './utils/organizeUtils'

/**
 * Configuration for the photo and video organization task.
 */
export interface OrganizeOptions {
  /** The absolute path of the root directory containing unsorted files. */
  folderPath: string
  /** A list of allowed file extensions (e.g., ['.jpg', '.png']) or ['*'] for all files. */
  fileTypes: string[]
  /** If true, simulates the organization without moving files on disk. */
  isDryRun: boolean
  /** If true, avoids re-scanning folders that already look like year folders (e.g., "2024"). */
  skipYearFolders?: boolean
  /** If true, deletes all empty folders after the organization is complete. */
  cleanupEmptyFolders?: boolean
}

/**
 * Result object for each file moved or corrected during the organization process.
 */
export interface OrganizeResult {
  /** The original source path of the file. */
  source: string
  /** The final destination path where the file was (or would be) moved. */
  destination: string
  /** Whether the file move was successful. */
  success: boolean
  /** Whether the file was already in the correct destination. */
  alreadyOrganized?: boolean
  /** Whether the file's filesystem timestamp was corrected using EXIF metadata. */
  timestampCorrected?: boolean
  /** Descriptive error message if the operation failed. */
  error?: string
}

/**
 * Organizes files within a directory by placing them into subfolders based on their capture date (Year/Month/Day).
 * This service resolves the best possible date using filename patterns, EXIF metadata, and filesystem stats.
 *
 * @param taskId The unique task ID for tracking progress.
 * @param options Configuration for what and where to organize.
 * @returns A promise resolving to an array of results for each processed file.
 */
export async function organizeFilesTask(
  taskId: string,
  options: OrganizeOptions
): Promise<OrganizeResult[]> {
  const { folderPath, fileTypes, isDryRun, skipYearFolders, cleanupEmptyFolders } = options
  const reporter = new TaskReporter(taskId)
  const organizationResults: OrganizeResult[] = []

  // The folder path must be absolute to ensure correct path resolution
  if (!path.isAbsolute(folderPath)) {
    throw new Error('Folder path must be absolute')
  }

  // --- Phase 1: Directory Scanning & Initial Filtering ---
  reporter.setStatus(isDryRun ? 'dry-run' : 'running')
  reporter.updateProgress({ message: 'Scanning directory…' })

  const matchedFilePaths: string[] = []
  const directoryWalker = new FileWalker(reporter, {
    extensions: fileTypes,
    skipHidden: true,
    skipYearFolders: skipYearFolders ?? true // Default to true if not specified for backward compatibility
  })

  // Start the scan and collect all valid file paths
  await directoryWalker.walk(folderPath, async (fullPath) => {
    matchedFilePaths.push(fullPath)
    reporter.updateProgressThrottled({
      message: `Scanning... Found ${matchedFilePaths.length} files to organize. Last seen: ${path.basename(fullPath)}`
    })
  })

  const totalSeen = directoryWalker.getTotalFilesSeen()
  const totalMatched = directoryWalker.getMatchedFilesCount()

  reporter.updateProgress({
    total: totalMatched,
    current: 0,
    message: `Found ${totalMatched} files to organize out of ${totalSeen} total files.`
  })

  // --- Phase 2: Date Resolution & File Organization ---
  let processedFileCount = 0
  const dryRunSimulatedExistsSet = new Set<string>()

  // Helper function to check for path collisions, considering dry-run simulations
  const checkFileExistence = async (targetPath: string): Promise<boolean> => {
    if (isDryRun) {
      if (dryRunSimulatedExistsSet.has(targetPath)) return true
    }

    try {
      await fs.promises.stat(targetPath)
      return true
    } catch {
      return false
    }
  }

  for (const sourceFilePath of matchedFilePaths) {
    const filename = path.basename(sourceFilePath)
    processedFileCount++

    // Periodically update progress and check for cancellation during processing
    reporter.updateProgressThrottled({
      current: processedFileCount,
      message: `Processing matched file ${processedFileCount}/${totalMatched}: ${filename}`
    })

    if (processedFileCount % 50 === 0) {
      await reporter.yieldAndCheckCancellation()
    } else {
      reporter.checkCancellation()
    }

    // --- Step 2.1: Resolve the most accurate date for the file ---
    const { resolvedDate, source } = await resolveReliableFileDate(sourceFilePath)

    if (!resolvedDate || isNaN(resolvedDate.getTime())) {
      organizationResults.push({
        source: sourceFilePath,
        destination: '',
        success: false,
        error: 'Could not determine a valid date'
      })
      continue
    }

    // --- Step 2.2: Correct filesystem timestamp if using EXIF capture date ---
    let wasTimestampUpdated = false
    if (source === 'exif' && !isDryRun) {
      wasTimestampUpdated = await synchronizeTimestampWithExif(sourceFilePath, resolvedDate)
    }

    // --- Step 2.3: Build the destination path (Year/Month/Day) ---
    const { destinationDirectory, destinationFilePath } = buildDateBasedDestination(
      folderPath,
      filename,
      resolvedDate
    )

    // Skip if the file is already in the correct destination
    if (sourceFilePath === destinationFilePath) {
      organizationResults.push({
        source: sourceFilePath,
        destination: destinationFilePath,
        success: true,
        alreadyOrganized: true
      })
      continue
    }

    // Ensure the destination path is unique to prevent overwriting existing files
    const uniqueDestinationPath = await getUniquePathWithCheck(
      destinationFilePath,
      checkFileExistence
    )

    // --- Step 2.4: Execute Move or Simulate in Dry-Run ---
    if (isDryRun) {
      dryRunSimulatedExistsSet.add(uniqueDestinationPath)
      organizationResults.push({
        source: sourceFilePath,
        destination: uniqueDestinationPath,
        success: true,
        timestampCorrected: wasTimestampUpdated
      })
    } else {
      try {
        // Create the necessary Year/Month/Day directories on the fly
        try {
          await fs.promises.stat(destinationDirectory)
        } catch {
          await fs.promises.mkdir(destinationDirectory, { recursive: true })
        }

        await fs.promises.rename(sourceFilePath, uniqueDestinationPath)

        organizationResults.push({
          source: sourceFilePath,
          destination: uniqueDestinationPath,
          success: true,
          timestampCorrected: wasTimestampUpdated
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        organizationResults.push({
          source: sourceFilePath,
          destination: uniqueDestinationPath,
          success: false,
          error: message
        })
      }
    }
  }

  // Force final progress update to flush any throttled states and ensure UI reaches 100%
  reporter.updateProgress({
    current: processedFileCount,
    message: `Finished processing ${processedFileCount} matched files out of ${totalSeen} total files.`
  })

  // --- Phase 3: Optional Empty Folder Cleanup ---
  if (cleanupEmptyFolders && !isDryRun) {
    reporter.updateProgress({ message: 'Cleaning up empty folders...' })
    try {
      const emptyFolders: string[] = []

      async function scanForEmpty(currentPath: string): Promise<boolean> {
        await reporter.yieldAndCheckCancellation()

        let entries: string[] = []
        try {
          entries = await fs.promises.readdir(currentPath)
        } catch {
          return false
        }

        let isEmpty = true
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry)
          const stats = await fs.promises.stat(entryPath)

          if (stats.isDirectory()) {
            const isSubfolderEmpty = await scanForEmpty(entryPath)
            if (!isSubfolderEmpty) isEmpty = false
          } else {
            isEmpty = false
          }
        }

        if (isEmpty && currentPath !== folderPath) {
          emptyFolders.push(currentPath)
        }
        return isEmpty
      }

      await scanForEmpty(folderPath)

      if (emptyFolders.length > 0) {
        reporter.updateProgress({
          total: emptyFolders.length,
          current: 0,
          message: `Deleting ${emptyFolders.length} empty folders...`
        })

        // Sort folders by depth (deepest first) to ensure clean recursive deletion
        const sortedFolders = [...emptyFolders].sort(
          (a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length
        )

        let deletedCount = 0
        for (const folderToDelete of sortedFolders) {
          await reporter.yieldAndCheckCancellation()
          try {
            await fs.promises.rmdir(folderToDelete)
            deletedCount++
            reporter.updateProgress({
              current: deletedCount,
              total: sortedFolders.length,
              message: `Deleted empty folder: ${path.basename(folderToDelete)}`
            })
          } catch (err) {
            console.error(`Failed to delete empty folder ${folderToDelete}:`, err)
          }
        }
      }
    } catch (error) {
      console.error('Empty folder cleanup failed:', error)
    }
  }

  // Finalize the task with the complete results array
  if (isDryRun) {
    reporter.completeDryRun(organizationResults)
  } else {
    reporter.complete(organizationResults)
  }
  return organizationResults
}
