import { join } from 'path'
import { promises as fs } from 'fs'

/**
 * Summary of physical statistics for a given folder.
 */
export interface FolderStats {
  /** The total size of all files contained within the folder (in bytes). */
  sizeInBytes: number
  /** The total count of entries (files and subfolders) within the folder. */
  totalElementCount: number
}

/**
 * Result of the metadata appendage operation for a single folder.
 */
export interface FolderMetadataResult {
  /** Original name of the folder before processing. */
  originalName: string
  /** The new name of the folder (including size and element count, if applicable). */
  newName: string
  /** The original absolute path of the folder. */
  originalPath: string
  /** The new absolute path of the folder after renaming. */
  newPath: string
  /** Whether the folder was successfully renamed. */
  success: boolean
  /** Any error message produced if the operation failed. */
  error?: string
}

/**
 * Recursively calculates the total physical size (in bytes) and the number of elements
 * (files and folders) within a given directory tree.
 *
 * @param directoryPath The absolute path of the directory to analyze.
 * @returns A FolderStats object containing total size and count.
 */
export async function getFolderStats(directoryPath: string): Promise<FolderStats> {
  let sizeInBytes = 0
  let totalElementCount = 0

  try {
    const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true })
    totalElementCount += directoryEntries.length // Count immediate children

    for (const entry of directoryEntries) {
      const entryFullPath = join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        const subdirectoryStats = await getFolderStats(entryFullPath)
        sizeInBytes += subdirectoryStats.sizeInBytes
        totalElementCount += subdirectoryStats.totalElementCount
      } else if (entry.isFile()) {
        try {
          const fileMetadata = await fs.stat(entryFullPath)
          sizeInBytes += fileMetadata.size
        } catch {
          // File might have been moved or is inaccessible; ignore and continue
        }
      }
    }
  } catch {
    // Silently ignore errors from inaccessible directories and return whatever was collected
  }

  return { sizeInBytes, totalElementCount }
}

/**
 * Converts a byte value into a human-readable format (e.g., "1.5 MB").
 *
 * @param byteCount The number of bytes to format.
 * @returns A formatted string representation (e.g., "0B", "5.2 KB", "100 MB").
 */
export function formatBytesToHumanReadable(byteCount: number): string {
  if (byteCount === 0) return '0B'
  const k = 1024
  const sizeLabels = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const sizeIndex = Math.floor(Math.log(byteCount) / Math.log(k))
  const roundedValue = parseFloat((byteCount / Math.pow(k, sizeIndex)).toFixed(2))

  return roundedValue + sizeLabels[sizeIndex]
}

/**
 * Recursively collects the absolute paths of all directories found within a root path,
 * including the root directory itself.
 *
 * @param rootDirectoryPath The starting path for the collection.
 * @returns An array of strings representing directory paths.
 */
export async function collectAllDirectoryPaths(rootDirectoryPath: string): Promise<string[]> {
  const directoryPaths: string[] = [rootDirectoryPath]

  try {
    const entries = await fs.readdir(rootDirectoryPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subdirectoryFullPath = join(rootDirectoryPath, entry.name)
        const nestedSubdirectories = await collectAllDirectoryPaths(subdirectoryFullPath)
        directoryPaths.push(...nestedSubdirectories)
      }
    }
  } catch {
    // Ignore errors for directories that cannot be read
  }

  return directoryPaths
}
