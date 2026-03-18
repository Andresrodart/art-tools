import { join, parse } from 'path'
import { promises as fs } from 'fs'
import { taskManager } from './TaskManager'

export interface FileScraperOptions {
  sourcePath: string
  destinationPath: string
  extensions: string[] // e.g. ['.jpg', '.png'] or ['*']
  isDryRun: boolean
}

export interface FileScraperResult {
  originalPath: string
  newPath: string
  success: boolean
  error?: string
}

/**
 * Checks if a file matches the provided extensions.
 */
function isExtensionMatch(filename: string, extensions: string[]): boolean {
  if (extensions.includes('*')) return true
  const ext = parse(filename).ext.toLowerCase()
  return extensions.includes(ext)
}

/**
 * Generates a unique filename in the destination directory to prevent overwrites.
 * e.g., if "image.jpg" exists, returns "image_1.jpg".
 */
async function getUniqueFilePath(
  destDir: string,
  originalName: string,
  ext: string
): Promise<string> {
  let newName = `${originalName}${ext}`
  let newPath = join(destDir, newName)
  let counter = 1

  while (true) {
    try {
      await fs.stat(newPath)
      // File exists, try another name
      newName = `${originalName}_${counter}${ext}`
      newPath = join(destDir, newName)
      counter++
    } catch {
      // stat throws if file doesn't exist, which means this path is safe to use
      break
    }
  }

  return newPath
}

export async function fileScraperTask(
  taskId: string,
  options: FileScraperOptions
): Promise<FileScraperResult[]> {
  taskManager.updateTaskStatus(taskId, options.isDryRun ? 'dry-run' : 'running')
  const results: FileScraperResult[] = []

  // Ensure extensions are lowercase and formatted
  const validExtensions = options.extensions.map((ext) =>
    ext === '*'
      ? '*'
      : ext.toLowerCase().startsWith('.')
        ? ext.toLowerCase()
        : `.${ext.toLowerCase()}`
  )

  try {
    // 1. Ensure target source exists
    try {
      await fs.stat(options.sourcePath)
    } catch {
      throw new Error(`Source path does not exist: ${options.sourcePath}`)
    }

    // 2. Build flat list of all files recursively (DFS)
    const allFiles: string[] = []
    let scannedItemsCount = 0

    async function walk(dir: string): Promise<void> {
      // Check cancellation
      const task = taskManager.getActiveTasks().find((t) => t.id === taskId)
      if (task?.status === 'error') throw new Error('Task cancelled by user')

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          scannedItemsCount++

          // Report progress roughly every 100 items to avoid IPC bottleneck
          if (scannedItemsCount % 100 === 0) {
            taskManager.updateTaskProgress(taskId, {
              current: allFiles.length,
              total: 0, // 0 indicating 'unknown total' still scanning
              message: `Scanning... Found ${allFiles.length} matches. Looking at: ${entry.name}`
            })
          }

          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            await walk(fullPath)
          } else if (entry.isFile()) {
            if (isExtensionMatch(entry.name, validExtensions)) {
              allFiles.push(fullPath)
            }
          }
        }
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException
        if (err.code && ['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
          // Log graciously without spamming stack trace
          console.warn(`Skipped inaccessible directory (${err.code}): ${dir}`)
        } else {
          console.warn(`Could not read directory ${dir}`, e)
        }
      }
    }

    taskManager.updateTaskProgress(taskId, {
      current: 0,
      total: 0,
      message: 'Starting initial directory scan...'
    })

    await walk(options.sourcePath)

    // 3. Process matches
    if (allFiles.length > 0 && !options.isDryRun) {
      // Create destination directory if it doesn't exist
      await fs.mkdir(options.destinationPath, { recursive: true })
    }

    let current = 0
    for (const sourceFilePath of allFiles) {
      // Check cancellation again within the loop
      const task = taskManager.getActiveTasks().find((t) => t.id === taskId)
      if (task?.status === 'error') throw new Error('Task cancelled by user')

      const parsedSource = parse(sourceFilePath)

      let newPath: string
      if (options.isDryRun) {
        // Just construct a fast naive path for dry runs, realistic but skipping stat calls for speed
        // in a production level scale, dry-run exactness can be debated, but this is sufficient.
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
      taskManager.updateTaskProgress(taskId, {
        current,
        total: allFiles.length,
        message: `Scraped ${parsedSource.base}`
      })
    }

    if (allFiles.length === 0) {
      taskManager.updateTaskProgress(taskId, {
        current: 0,
        total: 0,
        message: 'No matching files found.'
      })
    }

    taskManager.completeTask(taskId, results)
    return results
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    taskManager.updateTaskStatus(taskId, 'error', msg)
    throw error
  }
}
