import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      selectFolder: () => Promise<string | null>
      startOrganizeTask: (
        folderPath: string,
        fileTypes: string[],
        isDryRun: boolean
      ) => Promise<string>
      startFolderMetadataTask: (
        folderPath: string,
        includeSize: boolean,
        includeElements: boolean,
        isDryRun: boolean
      ) => Promise<string>
      startThresholdMergerTask: (
        folderPath: string,
        thresholdX: number,
        maxCapacityY: number,
        isDryRun: boolean
      ) => Promise<string>
      startFileScraperTask: (
        sourcePath: string,
        destinationPath: string,
        extensions: string[],
        isDryRun: boolean,
        ignorePaths?: string[]
      ) => Promise<string>
      startFindEmptyFoldersTask: (rootPath: string) => Promise<string>
      startDeleteFoldersTask: (foldersToDelete: string[], isDryRun: boolean) => Promise<string>
      getActiveTasks: () => Promise<unknown[]>
      cancelTask: (taskId: string) => Promise<boolean>
      onTaskProgress: (
        callback: (event: Electron.IpcRendererEvent, task: unknown) => void
      ) => Electron.IpcRenderer
      removeTaskProgress: () => Electron.IpcRenderer
      openPath: (targetPath: string) => Promise<string>
      getPreferences: () => Promise<Record<string, unknown>>
      setPreferences: (preferences: Record<string, unknown>) => Promise<boolean>
      getSatProfile: () => Promise<Record<string, unknown> | null>
      saveSatProfile: (profile: Record<string, unknown>) => Promise<boolean>
      listGpgFiles: (folderPath: string) => Promise<string[]>
      decryptGpgFile: (
        filePath: string,
        passphrase: string
      ) => Promise<{
        tempFilePath: string
        mimeType: string
        originalFileName: string
        extractedFiles?: { name: string; path: string; isDirectory: boolean }[]
        extractedDir?: string
      }>
      cleanupGpgTempFile: (tempFilePath: string) => Promise<boolean>
      saveGpgFile: (tempFilePath: string, defaultName: string) => Promise<boolean>
    }
  }
}
