import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './utils/taskReporter'
import { FileWalker } from './utils/fileWalker'
import { getUniqueFilePath } from './utils/pathUtils'

export interface FileScraperOptions {
  sourcePath: string
  destinationPath: string
  extensions: string[] // e.g. ['.jpg', '.png'] or ['*']
  isDryRun: boolean
  ignorePaths?: string[]
}

export interface FileScraperResult {
  originalPath: string
  newPath: string
  success: boolean
  error?: string
  isDirectoryError?: boolean
}

export async function fileScraperTask(
  taskId: string,
  options: FileScraperOptions
): Promise<FileScraperResult[]> {
  const reporter = new TaskReporter(taskId)
  reporter.setStatus(options.isDryRun ? 'dry-run' : 'running')
  const results: FileScraperResult[] = []

  try {
    // 1. Ensure target source exists
    try {
      await fs.stat(options.sourcePath)
    } catch {
      throw new Error(`Source path does not exist: ${options.sourcePath}`)
    }

    // 2. Build flat list of all files recursively
    const allFiles: string[] = []
    const walker = new FileWalker(reporter, {
      ignorePaths: options.ignorePaths,
      extensions: options.extensions
    })

    reporter.updateProgress({
      current: 0,
      total: 0,
      message: 'Starting initial directory scan...'
    })

    await walker.walk(options.sourcePath, async (fullPath, entry) => {
      allFiles.push(fullPath)
      reporter.updateProgressThrottled({
        current: allFiles.length,
        total: 0, // 0 indicating 'unknown total' still scanning
        message: `Scanning... Found ${allFiles.length} matches. Looking at: ${entry.name}`
      })
    })

    // 3. Process matches
    if (allFiles.length > 0 && !options.isDryRun) {
      // Create destination directory if it doesn't exist
      await fs.mkdir(options.destinationPath, { recursive: true })
    }

    let current = 0
    for (const sourceFilePath of allFiles) {
      await reporter.yieldAndCheck()

      const parsedSource = parse(sourceFilePath)

      let newPath: string
      if (options.isDryRun) {
        newPath = join(options.destinationPath, `${parsedSource.name}${parsedSource.ext}`)
      } else {
        newPath = await getUniqueFilePath(
          options.destinationPath,
          parsedSource.name,
          parsedSource.ext
        )
      }

      let success = true
      let errorMsg: string | undefined

      if (!options.isDryRun) {
        try {
          await fs.rename(sourceFilePath, newPath)
        } catch (e: unknown) {
          success = false
          errorMsg = e instanceof Error ? e.message : String(e)
          console.error(`Failed to move ${sourceFilePath} to ${newPath}`, errorMsg)
        }
      }

      results.push({
        originalPath: sourceFilePath,
        newPath,
        success,
        error: errorMsg
      })

      current++
      reporter.updateProgress({
        current,
        total: allFiles.length,
        message: `Scraped ${parsedSource.base}`
      })
    }

    if (allFiles.length === 0) {
      reporter.updateProgress({
        current: 0,
        total: 0,
        message: 'No matching files found.'
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
