import { join, sep, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './taskReporter'

export interface WalkerOptions {
  ignorePaths?: string[]
  extensions?: string[] // e.g. ['.jpg', '.png'] or ['*']
  skipYearFolders?: boolean // For organizeFiles
  skipHidden?: boolean // For organizeFiles
}

export type WalkCallback = (filePath: string, entry: import('fs').Dirent) => Promise<void> | void

export class FileWalker {
  constructor(
    private readonly reporter?: TaskReporter,
    private readonly options: WalkerOptions = {}
  ) {}

  /**
   * Recursively walks a directory and calls the callback for each file.
   */
  async walk(dir: string, callback: WalkCallback): Promise<void> {
    const { ignorePaths, extensions, skipYearFolders, skipHidden } = this.options

    // Check if directory is ignored
    if (ignorePaths && ignorePaths.length > 0) {
      const isIgnored = ignorePaths.some(
        (ignored) => dir === ignored || dir.startsWith(ignored + sep)
      )
      if (isIgnored) return
    }

    // Skip year folders if requested (e.g., 2024, 2023)
    if (skipYearFolders && /^\d{4}$/.test(parse(dir).base)) {
      return
    }

    // Skip hidden folders
    if (skipHidden && parse(dir).base.startsWith('.')) {
      return
    }

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (this.reporter) {
          await this.reporter.yieldAndCheck()
        }

        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          await this.walk(fullPath, callback)
        } else if (entry.isFile()) {
          if (skipHidden && entry.name.startsWith('.')) continue

          if (this.isMatch(entry.name, extensions)) {
            await callback(fullPath, entry)
          }
        }
      }
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException
      if (err.code && ['EPERM', 'EACCES', 'EBUSY'].includes(err.code)) {
        console.warn(`Skipped inaccessible directory (${err.code}): ${dir}`)
      } else {
        throw e
      }
    }
  }

  private isMatch(filename: string, extensions?: string[]): boolean {
    if (!extensions || extensions.length === 0 || extensions.includes('*')) {
      return true
    }
    const ext = parse(filename).ext.toLowerCase()
    const normalizedExts = extensions.map((e) =>
      e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
    )
    return normalizedExts.includes(ext)
  }
}
