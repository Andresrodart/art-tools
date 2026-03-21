import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'
import {
  getFolderStats,
  formatBytes,
  collectDirectories,
  FolderMetadataResult
} from './utils/folderUtils'

export interface FolderMetadataOptions {
  rootPath: string
  includeSize: boolean
  includeElements: boolean
  isDryRun: boolean
}

/**
 * Core task executor for folder metadata appender.
 */
export async function folderMetadataTask(
  taskId: string,
  options: FolderMetadataOptions
): Promise<FolderMetadataResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const results: FolderMetadataResult[] = []

  try {
    const directories = await collectDirectories(options.rootPath)

    reporter.updateProgress({
      current: 0,
      total: directories.length,
      message: 'Scanning directories...'
    })

    let current = 0
    // Sort descending by depth so we rename leaf folders first.
    directories.sort((a, b) => b.split(/[\\/]/).length - a.split(/[\\/]/).length)

    for (const dir of directories) {
      await reporter.yieldAndCheck()

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
          } catch (e: unknown) {
            success = false
            errorMsg = e instanceof Error ? e.message : String(e)
            console.error(`Failed to rename ${dir} to ${newPath}`, errorMsg)
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
      reporter.updateProgress({
        current,
        total: directories.length,
        message: `Processed ${parsedPath.name}`
      })
    }

    reporter.complete(results)
    return results
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    reporter.error(msg)
    throw error
  }
}
