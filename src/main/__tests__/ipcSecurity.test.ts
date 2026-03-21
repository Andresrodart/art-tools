import { ipcMain } from 'electron'

// Mock Electron to control the test environment
jest.mock('electron', () => {
  const mIpcMain = {
    handle: jest.fn(),
    on: jest.fn()
  }
  const mApp = {
    whenReady: jest.fn().mockResolvedValue(true),
    on: jest.fn(),
    setAppUserModelId: jest.fn(),
    quit: jest.fn()
  }
  const mBrowserWindow = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    show: jest.fn(),
    webContents: {
      setWindowOpenHandler: jest.fn(),
      send: jest.fn()
    },
    loadURL: jest.fn(),
    loadFile: jest.fn()
  }))
  // @ts-ignore: Adding static method to mocked constructor
  mBrowserWindow.getAllWindows = jest.fn().mockReturnValue([])

  return {
    app: mApp,
    ipcMain: mIpcMain,
    shell: {
      openPath: jest.fn(),
      openExternal: jest.fn()
    },
    BrowserWindow: mBrowserWindow,
    dialog: {
      showOpenDialog: jest.fn()
    }
  }
})

// Mock @electron-toolkit/utils
jest.mock('@electron-toolkit/utils', () => ({
  electronApp: { setAppUserModelId: jest.fn() },
  optimizer: { watchWindowShortcuts: jest.fn() },
  is: { dev: true }
}))

// Mock services to avoid side effects and complex dependencies
jest.mock('../services/TaskManager', () => ({
  taskManager: {
    on: jest.fn(),
    createTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    getActiveTasks: jest.fn(),
    cancelTask: jest.fn()
  }
}))

/**
 * Security test suite for verifying the absence of insecure IPC handlers.
 */
describe('Main Process Security Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Test to ensure that generic, insecure file system and command execution
   * IPC handlers are not being registered in the main process.
   */
  it('should not register dangerous IPC handlers', async () => {
    // Load the main process entry point. It calls app.whenReady().then(...)
    require('../index')

    // Wait for the app.whenReady() promise and its subsequent .then() block to execute
    await new Promise((resolve) => setImmediate(resolve))

    // Capture all handlers that were registered during the initialization
    const registeredHandlers = (ipcMain.handle as jest.Mock).mock.calls.map(
      (call) => call[0]
    )

    const dangerousHandlers = ['read-file', 'write-file', 'exec-command']

    // Verify that none of the dangerous handlers were registered
    dangerousHandlers.forEach((handler) => {
      expect(registeredHandlers).not.toContain(handler)
    })
  })
})
