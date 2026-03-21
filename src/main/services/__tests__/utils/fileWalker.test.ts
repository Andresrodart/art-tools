import { promises as fs } from 'fs'
import { join } from 'path'
import { FileWalker } from '../../utils/fileWalker'

// Mock the native filesystem modules to keep tests isolated and fast
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn()
  }
}))

/**
 * Test suite for the FileWalker utility.
 * Verifies recursive traversal, extension filtering, and path ignoring.
 */
describe('FileWalker', () => {
  beforeEach(() => {
    // Reset all mock call data before each test run
    jest.clearAllMocks()
  })

  test('walk successfully traverses directories and calls the callback for found files', async () => {
    const rootPath = '/tmp/test'

    // Mock readdir to return files and a subdirectory recursively
    ;(fs.readdir as jest.Mock)
      .mockResolvedValueOnce([
        { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ])
      .mockResolvedValueOnce([{ name: 'image2.png', isDirectory: () => false, isFile: () => true }])

    const fileFoundCallback = jest.fn()
    const walkerInstance = new FileWalker()
    await walkerInstance.walk(rootPath, fileFoundCallback)

    // Verify the callback was called twice with correct full absolute paths
    expect(fileFoundCallback).toHaveBeenCalledTimes(2)
    expect(fileFoundCallback).toHaveBeenCalledWith(join(rootPath, 'image1.jpg'), expect.anything())
    expect(fileFoundCallback).toHaveBeenCalledWith(
      join(rootPath, 'subdir', 'image2.png'),
      expect.anything()
    )
  })

  test('filters files correctly based on the provided extensions', async () => {
    const rootPath = '/tmp/test'

    // Mock readdir to return one matching file and one non-matching file
    ;(fs.readdir as jest.Mock).mockResolvedValueOnce([
      { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
      { name: 'document.txt', isDirectory: () => false, isFile: () => true }
    ])

    const fileFoundCallback = jest.fn()
    // Configure the walker to only care about .jpg files
    const walkerInstance = new FileWalker(undefined, { extensions: ['.jpg'] })
    await walkerInstance.walk(rootPath, fileFoundCallback)

    // Verify only the matching file was processed
    expect(fileFoundCallback).toHaveBeenCalledTimes(1)
    expect(fileFoundCallback).toHaveBeenCalledWith(join(rootPath, 'image1.jpg'), expect.anything())
  })

  test('correctly ignores specified paths during the walk', async () => {
    const rootPath = '/tmp/test'
    const ignoredFolderPath = join(rootPath, 'ignored')

    // Mock readdir to return a file and a folder that should be ignored
    ;(fs.readdir as jest.Mock).mockResolvedValueOnce([
      { name: 'image1.jpg', isDirectory: () => false, isFile: () => true },
      { name: 'ignored', isDirectory: () => true, isFile: () => false }
    ])

    const fileFoundCallback = jest.fn()
    // Configure the walker to ignore the 'ignored' subdirectory
    const walkerInstance = new FileWalker(undefined, { ignorePaths: [ignoredFolderPath] })
    await walkerInstance.walk(rootPath, fileFoundCallback)

    // Verify only the non-ignored file was processed and readdir was not called on the ignored folder
    expect(fileFoundCallback).toHaveBeenCalledTimes(1)
    expect(fs.readdir).not.toHaveBeenCalledWith(ignoredFolderPath, expect.anything())
  })
})
