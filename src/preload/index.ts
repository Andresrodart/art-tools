import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // File Organizer & Tasks
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  startOrganizeTask: (folderPath: string, fileTypes: string[], isDryRun: boolean) =>
    ipcRenderer.invoke('task:start-organize', folderPath, fileTypes, isDryRun),
  startFolderMetadataTask: (
    folderPath: string,
    includeSize: boolean,
    includeElements: boolean,
    isDryRun: boolean
  ) =>
    ipcRenderer.invoke(
      'task:start-folder-metadata',
      folderPath,
      includeSize,
      includeElements,
      isDryRun
    ),
  startThresholdMergerTask: (
    folderPath: string,
    thresholdX: number,
    maxCapacityY: number,
    isDryRun: boolean
  ) =>
    ipcRenderer.invoke(
      'task:start-threshold-merger',
      folderPath,
      thresholdX,
      maxCapacityY,
      isDryRun
    ),
  startFileScraperTask: (
    sourcePath: string,
    destinationPath: string,
    extensions: string[],
    isDryRun: boolean,
    ignorePaths?: string[]
  ) =>
    ipcRenderer.invoke(
      'task:start-file-scraper',
      sourcePath,
      destinationPath,
      extensions,
      isDryRun,
      ignorePaths
    ),
  startFindEmptyFoldersTask: (rootPath: string) =>
    ipcRenderer.invoke('task:find-empty-folders', rootPath),
  startDeleteFoldersTask: (foldersToDelete: string[], isDryRun: boolean) =>
    ipcRenderer.invoke('task:delete-folders', foldersToDelete, isDryRun),
  getActiveTasks: () => ipcRenderer.invoke('task:get-active'),
  cancelTask: (taskId: string) => ipcRenderer.invoke('task:cancel', taskId),
  onTaskProgress: (callback: (event: Electron.IpcRendererEvent, task: unknown) => void) =>
    ipcRenderer.on('task-progress', callback),
  removeTaskProgress: () => ipcRenderer.removeAllListeners('task-progress'),
  openPath: (targetPath: string) => ipcRenderer.invoke('open-path', targetPath),

  // Preferences
  getPreferences: () => ipcRenderer.invoke('preferences:get'),
  setPreferences: (preferences: Record<string, unknown>) =>
    ipcRenderer.invoke('preferences:set', preferences),

  // SAT Profile
  getSatProfile: () => ipcRenderer.invoke('sat-profile:get'),
  saveSatProfile: (profile: unknown) => ipcRenderer.invoke('sat-profile:save', profile),

  // GPG Viewer
  listGpgFiles: (folderPath: string) => ipcRenderer.invoke('gpg:list-files', folderPath),
  decryptGpgFile: (filePath: string, passphrase: string) =>
    ipcRenderer.invoke('gpg:decrypt-file', filePath, passphrase),
  cleanupGpgTempFile: (tempFilePath: string) =>
    ipcRenderer.invoke('gpg:cleanup-temp-file', tempFilePath),
  saveGpgFile: (tempFilePath: string, defaultName: string) =>
    ipcRenderer.invoke('gpg:save-file', tempFilePath, defaultName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
