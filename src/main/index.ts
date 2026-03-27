import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { taskManager } from './services/TaskManager'
import { organizeFilesTask, OrganizeOptions } from './services/organizeFiles'
import { folderMetadataTask } from './services/folderMetadata'
import { thresholdMergerTask } from './services/thresholdMerger'
import { fileScraperTask } from './services/fileScraper'
import { findEmptyFoldersTask, deleteFoldersTask } from './services/emptyFolderCleaner'
import { getSatProfile, saveSatProfile, SatProfile } from './services/satProfile'
import { listGpgFiles, decryptGpgFile, cleanupGpgTempFile } from './services/gpgViewer'
import { protocol } from 'electron'
import { net } from 'electron'
import fs from 'fs'
import { pathToFileURL } from 'url'

function getPreferencesPath(): string {
  return join(app.getPath('userData'), 'preferences.json')
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Register custom protocol for GPG media files
  protocol.handle('gpg-media', (request) => {
    let filePath = request.url.slice('gpg-media://'.length)
    if (process.platform === 'win32') {
      // Handle windows paths
      filePath = filePath.replace(/^\//, '')
    } else {
      filePath = '/' + filePath
    }
    filePath = decodeURIComponent(filePath)

    // Security check: ensure the file is from our specific temp prefix
    if (!filePath.includes('art-tools-gpg-')) {
      return new Response('Access Denied', { status: 403 })
    }

    return net.fetch(pathToFileURL(filePath).toString())
  })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Preferences APIs
  ipcMain.handle('preferences:get', async () => {
    try {
      const prefsPath = getPreferencesPath()
      if (fs.existsSync(prefsPath)) {
        const data = fs.readFileSync(prefsPath, 'utf8')
        return JSON.parse(data)
      }
    } catch (err) {
      console.error('Failed to read preferences:', err)
    }
    return {}
  })

  ipcMain.handle('preferences:set', async (_, preferences: Record<string, unknown>) => {
    try {
      const prefsPath = getPreferencesPath()
      fs.writeFileSync(prefsPath, JSON.stringify(preferences, null, 2), 'utf8')
      return true
    } catch (err) {
      console.error('Failed to save preferences:', err)
      return false
    }
  })

  // SAT Profile APIs
  ipcMain.handle('sat-profile:get', async () => {
    return getSatProfile()
  })

  ipcMain.handle('sat-profile:save', async (_, profile: SatProfile) => {
    return saveSatProfile(profile)
  })

  // Open a folder or file in the system explorer
  ipcMain.handle('open-path', async (_, targetPath: string) => {
    return shell.openPath(targetPath)
  })

  // --- NEW FILE ORGANIZER APIs ---
  ipcMain.handle('select-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) return null
    return filePaths[0]
  })

  // Task forwarding
  taskManager.on('task-updated', (task) => {
    // Broadcast task update to all windows
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('task-progress', task)
    })
  })

  ipcMain.handle(
    'task:start-organize',
    async (_, folderPath: string, fileTypes: string[], isDryRun: boolean) => {
      const task = taskManager.createTask('organize-files')
      const options: OrganizeOptions = { folderPath, fileTypes, isDryRun }

      // Fire and forget, TaskManager handles background progress output
      organizeFilesTask(task.id, options).catch((err) => {
        taskManager.updateTaskStatus(
          task.id,
          'error',
          err instanceof Error ? err.message : String(err)
        )
      })

      return task.id
    }
  )

  ipcMain.handle(
    'task:start-folder-metadata',
    async (
      _,
      folderPath: string,
      includeSize: boolean,
      includeElements: boolean,
      isDryRun: boolean
    ) => {
      const task = taskManager.createTask('folder-metadata')

      folderMetadataTask(task.id, {
        rootPath: folderPath,
        includeSize,
        includeElements,
        isDryRun
      }).catch((err: unknown) => {
        taskManager.updateTaskStatus(
          task.id,
          'error',
          err instanceof Error ? err.message : String(err)
        )
      })

      return task.id
    }
  )

  ipcMain.handle('task:get-active', async () => {
    return taskManager.getActiveTasks()
  })

  ipcMain.handle('task:cancel', async (_, taskId: string) => {
    taskManager.cancelTask(taskId)
    return true
  })

  // --------------- Threshold Merger ----------------
  ipcMain.handle(
    'task:start-threshold-merger',
    async (
      _event,
      rootPath: string,
      thresholdX: number,
      maxCapacityY: number,
      isDryRun: boolean
    ) => {
      const task = taskManager.createTask('thresholdMerger')

      thresholdMergerTask(task.id, {
        rootPath,
        thresholdX,
        maxCapacityY,
        isDryRun
      }).catch((err) => {
        console.error('Threshold Merger background error:', err)
      })

      return task.id
    }
  )

  // --------------- File Scraper ----------------
  ipcMain.handle(
    'task:start-file-scraper',
    async (
      _event,
      sourcePath: string,
      destinationPath: string,
      extensions: string[],
      isDryRun: boolean,
      ignorePaths?: string[]
    ) => {
      const task = taskManager.createTask('fileScraper')

      fileScraperTask(task.id, {
        sourcePath,
        destinationPath,
        extensions,
        isDryRun,
        ignorePaths
      }).catch((err) => {
        console.error('File Scraper background error:', err)
      })

      return task.id
    }
  )

  // --------------- Empty Folder Cleaner ----------------
  ipcMain.handle('task:find-empty-folders', async (_event, rootPath: string) => {
    const task = taskManager.createTask('findEmptyFolders')

    findEmptyFoldersTask(task.id, { rootPath }).catch((err) => {
      console.error('Find Empty Folders background error:', err)
      taskManager.updateTaskStatus(
        task.id,
        'error',
        err instanceof Error ? err.message : String(err)
      )
    })

    return task.id
  })

  ipcMain.handle(
    'task:delete-folders',
    async (_event, foldersToDelete: string[], isDryRun: boolean) => {
      const task = taskManager.createTask('deleteFolders')

      deleteFoldersTask(task.id, { foldersToDelete, isDryRun }).catch((err) => {
        console.error('Delete Folders background error:', err)
        taskManager.updateTaskStatus(
          task.id,
          'error',
          err instanceof Error ? err.message : String(err)
        )
      })

      return task.id
    }
  )

  // --------------- GPG Viewer ----------------
  ipcMain.handle('gpg:list-files', async (_event, folderPath: string) => {
    return await listGpgFiles(folderPath)
  })

  ipcMain.handle('gpg:decrypt-file', async (_event, filePath: string, passphrase: string) => {
    return await decryptGpgFile(filePath, passphrase)
  })

  ipcMain.handle('gpg:cleanup-temp-file', async (_event, tempFilePath: string) => {
    await cleanupGpgTempFile(tempFilePath)
    return true
  })

  ipcMain.handle('gpg:save-file', async (_event, tempFilePath: string, defaultName: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName
    })

    if (canceled || !filePath) return false

    try {
      await fs.promises.copyFile(tempFilePath, filePath)
      return true
    } catch (err) {
      console.error('Failed to save decrypted file:', err)
      return false
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
