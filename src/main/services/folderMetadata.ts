import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { taskManager } from './TaskManager'

export interface FolderMetadataOptions {
  rootPath: string
  includeSize: boolean
  includeElements: boolean
  isDryRun: boolean
}

export interface FolderMetadataResult {
  originalName: string
  newName: string
  originalPath: string
  newPath: string
  success: boolean
  error?: string
}

export interface FolderStats {
  sizeBytes: number
  elementCount: number
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

function formatBytes(bytes: number): string {
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

/**
 * Core task executor for folder metadata appender.
 */
export async function folderMetadataTask(
  taskId: string,
  options: FolderMetadataOptions
): Promise<FolderMetadataResult[]> {
  taskManager.updateTaskStatus(taskId, options.isDryRun ? 'dry-run' : 'running')
  const results: FolderMetadataResult[] = []

  try {
    const directories = await collectDirectories(options.rootPath)

    taskManager.updateTaskProgress(taskId, {
      current: 0,
      total: directories.length,
      message: 'Scanning directories...'
    })

    let current = 0
    // Sort descending by depth so we rename leaf folders first.
    // Otherwise, renaming a parent folder breaks the paths for its children.
    directories.sort((a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length)

    for (const dir of directories) {
      const task = taskManager.getActiveTasks().find((t) => t.id === taskId)
      if (task?.status === 'error') {
        throw new Error('Task cancelled by user')
      }

      const stats = await getFolderStats(dir)
      const parsedPath = parse(dir)

      const parts: string[] = []
      if (options.includeSize) {
        parts.push(formatBytes(stats.sizeBytes))
      }

      if (options.includeElements) {
        parts.push(stats.elementCount.toString())
      }

      let newName = parsedPath.name
      if (parts.length > 0 && newName) {
        // Prevent appending over and over if it already ends with this pattern.
        // For simplicity right now, we just append blindly as requested,
        // but maybe we can just do a very basic check.
        // We'll append if it doesn't already end with exactly this suffix.
        const suffix = `_${parts.join('_')}`
        if (!newName.endsWith(suffix)) {
          newName = `${newName}${suffix}`
        }
      }

      if (newName !== parsedPath.name) {
        const newPath = join(parsedPath.dir, newName)

        let success = true
        let errorMsg: string | undefined

        if (!options.isDryRun) {
          try {
            await fs.rename(dir, newPath)
          } catch (e: any) {
            success = false
            errorMsg = e.message
            console.error(`Failed to rename ${dir} to ${newPath}`, e.message)
          }
        }

        results.push({
          originalName: parsedPath.name,
          newName,
          originalPath: dir,
          newPath,
          success,
          error: errorMsg
        })
      }

      current++
      taskManager.updateTaskProgress(taskId, {
        current,
        total: directories.length,
        message: `Processed ${parsedPath.name}`
      })
    }

    taskManager.updateTaskStatus(taskId, 'completed')
    taskManager.completeTask(taskId, results)
    return results
  } catch (error: any) {
    taskManager.updateTaskStatus(taskId, 'error', error.message)
    throw error
  }
}
