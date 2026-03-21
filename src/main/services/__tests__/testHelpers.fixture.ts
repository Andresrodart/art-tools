import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { taskManager } from '../TaskManager'

/**
 * A utility class to manage the lifecycle of a temporary filesystem sandbox for testing.
 * It handles creation, cleanup, and common file/folder operations.
 */
export class TestSandbox {
  /** The absolute path to the root of the temporary sandbox. */
  public rootPath: string = ''
  /** A list of additional root paths to clean up (e.g., if the root itself is renamed). */
  private extraCleanupPaths: string[] = []

  /**
   * Initializes a new unique temporary directory.
   * @param prefix A string prefix for the temporary folder name.
   */
  async setup(prefix: string = 'art-tools-test-'): Promise<void> {
    this.rootPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
    this.extraCleanupPaths = []
  }

  /**
   * Recursively deletes the sandbox and all its contents.
   */
  async teardown(): Promise<void> {
    const pathsToDestroy = [this.rootPath, ...this.extraCleanupPaths]
    for (const directoryPath of pathsToDestroy) {
      if (directoryPath) {
        await fs.rm(directoryPath, { recursive: true, force: true })
      }
    }
  }

  /**
   * Tracks an additional path for deletion during teardown.
   * Useful when a test operation renames the root directory.
   * @param directoryPath The path to be cleaned up.
   */
  trackPathForCleanup(directoryPath: string): void {
    if (directoryPath !== this.rootPath) {
      this.extraCleanupPaths.push(directoryPath)
    }
  }

  /**
   * Creates a file with the specified content within the sandbox.
   * @param relativePath The path relative to the sandbox root.
   * @param fileContent The text content to write to the file.
   * @returns The absolute path to the created file.
   */
  async createFile(relativePath: string, fileContent: string = ''): Promise<string> {
    const absolutePath = path.join(this.rootPath, relativePath)
    // Ensure the parent directory exists
    await fs.mkdir(path.dirname(absolutePath), { recursive: true })
    await fs.writeFile(absolutePath, fileContent)
    return absolutePath
  }

  /**
   * Creates a directory within the sandbox.
   * @param relativePath The path relative to the sandbox root.
   * @returns The absolute path to the created directory.
   */
  async createDirectory(relativePath: string): Promise<string> {
    const absolutePath = path.join(this.rootPath, relativePath)
    await fs.mkdir(absolutePath, { recursive: true })
    return absolutePath
  }

  /**
   * Checks if a file or directory exists at the given relative path.
   * @param relativePath The path relative to the sandbox root.
   * @returns True if it exists, otherwise false.
   */
  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.stat(path.join(this.rootPath, relativePath))
      return true
    } catch {
      return false
    }
  }

  /**
   * Retrieves the absolute path for a relative path within the sandbox.
   * @param relativePath The path relative to the sandbox root.
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.rootPath, relativePath)
  }
}

/**
 * Creates and registers a dummy task in the TaskManager for testing purposes.
 * @param taskId The ID to assign to the task.
 * @param type The task type (e.g., 'file-scraper').
 */
export function setupDummyTask(taskId: string, type: string = 'test-task'): void {
  taskManager['tasks'].set(taskId, {
    id: taskId,
    type,
    status: 'pending',
    progress: { current: 0, total: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
}
