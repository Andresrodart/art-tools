import { join, sep, parse } from 'path'
import { promises as fs } from 'fs'
import { TaskReporter } from './taskReporter'

/**
 * Options for configuring the behavior of the FileWalker.
 */
export interface WalkerOptions {
  /** A list of absolute paths or directory names to be excluded from the walk. */
  ignorePaths?: string[]
  /** A list of allowed file extensions (e.g., ['.jpg', '.png']). If empty or ['*'], all files are matched. */
  extensions?: string[]
  /** If true, directories with 4-digit numeric names (representing years) will be skipped. */
  skipYearFolders?: boolean
  /** If true, files or folders starting with a dot ('.') will be ignored. */
  skipHidden?: boolean
  /** Maximum recursion depth. */
  maxDepth?: number
}

/**
 * Callback function signature for processing matched file paths.
 */
export type WalkCallback = (filePath: string, entry: import('fs').Dirent) => Promise<void> | void

/**
 * The FileWalker class is responsible for recursively traversing a directory tree,
 * filtering results based on options, and reporting progress via a TaskReporter.
 */
export class FileWalker {
  private totalFilesSeen: number = 0
  private matchedFilesCount: number = 0
  private directoriesScanned: number = 0
  private entriesProcessedSinceLastYield: number = 0

  /**
   * Initializes a FileWalker instance.
   * @param reporter Optional TaskReporter for progress updates and cancellation checks.
   * @param options Configuration for the walk (filters, skip logic).
   */
  constructor(
    private readonly reporter?: TaskReporter,
    private readonly options: WalkerOptions = {}
  ) {}

  /**
   * Returns the total number of files encountered during the walk.
   */
  getTotalFilesSeen(): number {
    return this.totalFilesSeen
  }

  /**
   * Returns the number of files that matched the walker's criteria.
   */
  getMatchedFilesCount(): number {
    return this.matchedFilesCount
  }

  /**
   * Recursively walks the directory tree starting from the root directory.
   * Calls the provided callback for every file matching the specified criteria.
   *
   * @param directoryPath The root directory to start the walk from.
   * @param fileFoundCallback The function called whenever a matching file is found.
   * @param currentDepth The current recursion depth (internal use).
   */
  async walk(
    directoryPath: string,
    fileFoundCallback: WalkCallback,
    currentDepth: number = 0
  ): Promise<void> {
    const { ignorePaths, extensions, skipYearFolders, skipHidden, maxDepth = 10 } = this.options

    if (currentDepth > maxDepth) return

    // Check if the current directory is in the ignore list
    if (ignorePaths && ignorePaths.length > 0) {
      const isIgnored = ignorePaths.some(
        (ignoredPath) =>
          directoryPath === ignoredPath || directoryPath.startsWith(ignoredPath + sep)
      )
      if (isIgnored) return
    }

    // Determine the base name of the current directory to evaluate skip rules
    const directoryBaseName = parse(directoryPath).base

    // Skip year-named folders (e.g., "2024") if requested
    if (skipYearFolders && /^\d{4}$/.test(directoryBaseName)) {
      return
    }

    // Skip hidden folders (e.g., ".git") if requested
    if (skipHidden && directoryBaseName.startsWith('.')) {
      return
    }

    this.directoriesScanned++
    if (this.reporter) {
      this.reporter.updateProgressThrottled({
        message: `Scanning [${this.directoriesScanned} dirs]: ${directoryPath}`
      })
    }

    try {
      const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true })
      for (const entry of directoryEntries) {
        // Yield to the event loop and check for cancellation periodically (every 100 entries)
        // to balance performance with responsiveness.
        if (this.reporter) {
          this.entriesProcessedSinceLastYield++
          if (this.entriesProcessedSinceLastYield >= 100) {
            this.entriesProcessedSinceLastYield = 0
            await this.reporter.yieldAndCheckCancellation()
          } else {
            this.reporter.checkCancellation()
          }
        }

        const fullEntryPath = join(directoryPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively traverse subdirectories
          await this.walk(fullEntryPath, fileFoundCallback, currentDepth + 1)
        } else if (entry.isFile()) {
          this.totalFilesSeen++

          // Process files in the current directory
          if (skipHidden && entry.name.startsWith('.')) continue

          if (this.isMatchingExtension(entry.name, extensions)) {
            this.matchedFilesCount++
            await fileFoundCallback(fullEntryPath, entry)
          }
        }
      }
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException
      // Silently log and ignore certain filesystem access errors to continue the walk
      if (nodeError.code && ['EPERM', 'EACCES', 'EBUSY'].includes(nodeError.code)) {
        console.warn(`Skipped inaccessible directory (${nodeError.code}): ${directoryPath}`)
      } else {
        throw error
      }
    }
  }

  /**
   * Checks if the filename matches the provided file extensions.
   *
   * @param filename The name of the file to check.
   * @param extensionsList An optional list of allowed extensions (case-insensitive).
   * @returns True if the file matches or if no extensions are specified.
   */
  private isMatchingExtension(filename: string, extensionsList?: string[]): boolean {
    if (!extensionsList || extensionsList.length === 0 || extensionsList.includes('*')) {
      return true
    }

    const fileExtension = parse(filename).ext.toLowerCase()
    const normalizedExtensions = extensionsList.map((ext) =>
      ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
    )

    return normalizedExtensions.includes(fileExtension)
  }
}
