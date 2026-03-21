import { ipcMain } from 'electron'

/**
 * Security test to ensure that dangerous IPC handlers are not registered.
 */
describe('Main Process IPC Security', () => {
  const dangerousHandlers = ['read-file', 'write-file', 'exec-command']

  it('should not register dangerous IPC handlers', () => {
    // @ts-ignore: Accessing internal _handlers for verification
    const registeredHandlers = Array.from(ipcMain._handlers.keys())

    dangerousHandlers.forEach(handler => {
      expect(registeredHandlers).not.toContain(handler)
    })
  })
})
