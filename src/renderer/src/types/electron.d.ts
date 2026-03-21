import { ElectronAPI } from '@electron-toolkit/preload'

/**
 * Interface for the custom API exposed via contextBridge.
 */
interface Api {
  /** Reads a file from the disk. */
  readFile: (filePath: string) => Promise<string>
  /** Writes content to a file on the disk. */
  writeFile: (filePath: string, content: string) => Promise<boolean>
  /** Executes a system command. */
  execCommand: (
    command: string
  ) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
  /** Selects a folder using the system dialog. */
  selectFolder: () => Promise<string | null>
  /** Starts a file organization task. */
  startOrganizeTask: (folderPath: string, fileTypes: string[], isDryRun: boolean) => Promise<string>
  /** Starts a folder metadata appending task. */
  startFolderMetadataTask: (
    folderPath: string,
    includeSize: boolean,
    includeElements: boolean,
    isDryRun: boolean
  ) => Promise<string>
  /** Starts a threshold merger task. */
  startThresholdMergerTask: (
    folderPath: string,
    thresholdX: number,
    maxCapacityY: number,
    isDryRun: boolean
  ) => Promise<string>
  /** Starts a file scraper task. */
  startFileScraperTask: (
    sourcePath: string,
    destinationPath: string,
    extensions: string[],
    isDryRun: boolean,
    ignorePaths?: string[]
  ) => Promise<string>
  /** Starts a task to find empty folders. */
  startFindEmptyFoldersTask: (rootPath: string) => Promise<string>
  /** Starts a task to delete specified folders. */
  startDeleteFoldersTask: (foldersToDelete: string[], isDryRun: boolean) => Promise<string>
  /** Retrieves all active tasks. */
  getActiveTasks: () => Promise<unknown[]>
  /** Cancels a running task. */
  cancelTask: (taskId: string) => Promise<boolean>
  /** Sets up a listener for task progress updates. */
  onTaskProgress: (callback: (event: unknown, task: unknown) => void) => void
  /** Removes the task progress listener. */
  removeTaskProgress: () => void
  /** Opens a path in the system file explorer. */
  openPath: (targetPath: string) => Promise<void>
  /** Retrieves user preferences. */
  getPreferences: () => Promise<Record<string, unknown>>
  /** Saves user preferences. */
  setPreferences: (prefs: Record<string, unknown>) => Promise<boolean>
}

declare global {
  interface Window {
    /** Electron toolkit API. */
    electron: ElectronAPI
    /** Custom API exposed via contextBridge. */
    api: Api
  }
}
