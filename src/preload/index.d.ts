import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      readFile: (filePath: string) => Promise<string>
      writeFile: (filePath: string, content: string) => Promise<boolean>
      execCommand: (
        command: string
      ) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
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
      getActiveTasks: () => Promise<unknown[]>
      cancelTask: (taskId: string) => Promise<boolean>
      onTaskProgress: (
        callback: (event: Electron.IpcRendererEvent, task: unknown) => void
      ) => Electron.IpcRenderer
      removeTaskProgress: () => Electron.IpcRenderer
      openPath: (targetPath: string) => Promise<string>
    }
  }
}
