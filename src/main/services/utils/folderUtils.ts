import { join, parse } from 'path'
import { promises as fs } from 'fs'

export interface FolderStats {
  sizeBytes: number
  elementCount: number
}

export interface FolderMetadataResult {
  originalName: string
  newName: string
  originalPath: string
  newPath: string
  success: boolean
  error?: string
}

/**
 * Recursively calculates the total size and number of elements (files + folders) in a directory.
 */
export async function getFolderStats(dir: string): Promise<FolderStats> {
  let sizeBytes = 0
  let elementCount = 0

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    elementCount += entries.length // Count direct children

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        const subStats = await getFolderStats(fullPath)
        sizeBytes += subStats.sizeBytes
        elementCount += subStats.elementCount
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(fullPath)
          sizeBytes += stat.size
        } catch {
          // File might have been removed or is inaccessible
        }
      }
    }
  } catch {
    // Ignore inaccessible directories
  }

  return { sizeBytes, elementCount }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
}

/**
 * Recursively collects all directories within a root path, including the root itself.
 */
export async function collectDirectories(dir: string): Promise<string[]> {
  const dirs: string[] = [dir]
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = join(dir, entry.name)
        const subDirs = await collectDirectories(fullPath)
        dirs.push(...subDirs)
      }
    }
  } catch {
    // Ignore inaccessible directories
  }
  return dirs
}
