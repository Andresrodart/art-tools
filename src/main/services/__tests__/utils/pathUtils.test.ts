import { promises as fs } from 'fs'
import { join } from 'path'
import { getUniqueFilePath, getUniquePathWithCheck } from '../../utils/pathUtils'

// Mock the Node.js promises filesystem to control the test environment
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}))

/**
 * Test suite for the pathUtils module.
 * Verifies the generation of unique file paths for avoiding collisions.
 */
describe('pathUtils', () => {
  describe('getUniqueFilePath', () => {
    const destinationDirectory = '/tmp/dest'
    const baseName = 'image'
    const extension = '.jpg'

    beforeEach(() => {
      // Clear the call history of all mocks before each test
      jest.clearAllMocks()
    })

    test('returns original path if the file does not already exist on disk', async () => {
      // Mock stat() to fail (ENOENT), indicating the file doesn't exist
      ;(fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'))
      const resultPath = await getUniqueFilePath(destinationDirectory, baseName, extension)
      expect(resultPath).toBe(join(destinationDirectory, 'image.jpg'))
    })

    test('returns a unique path if the initial filename already exists', async () => {
      // Mock stat() to find the first file, but not the second
      ;(fs.stat as jest.Mock)
        .mockResolvedValueOnce({}) // image.jpg exists
        .mockRejectedValueOnce(new Error('ENOENT')) // image_1.jpg does not exist

      const resultPath = await getUniqueFilePath(destinationDirectory, baseName, extension)
      expect(resultPath).toBe(join(destinationDirectory, 'image_1.jpg'))
    })

    test('increments the counter multiple times until it finds a unique path', async () => {
      // Mock stat() to simulate several existing files
      ;(fs.stat as jest.Mock)
        .mockResolvedValueOnce({}) // image.jpg exists
        .mockResolvedValueOnce({}) // image_1.jpg exists
        .mockRejectedValueOnce(new Error('ENOENT')) // image_2.jpg does not exist

      const resultPath = await getUniqueFilePath(destinationDirectory, baseName, extension)
      expect(resultPath).toBe(join(destinationDirectory, 'image_2.jpg'))
    })
  })

  describe('getUniquePathWithCheck', () => {
    const initialTargetFilePath = '/tmp/dest/image.jpg'

    test('returns the original path if the custom check function returns false', async () => {
      // The check function indicates the file is not taken
      const mockExistenceCheck = jest.fn().mockReturnValue(false)
      const resultPath = await getUniquePathWithCheck(initialTargetFilePath, mockExistenceCheck)
      expect(resultPath).toBe(initialTargetFilePath)
      expect(mockExistenceCheck).toHaveBeenCalledWith(initialTargetFilePath)
    })

    test('returns a unique path if the custom check function returns true for collisions', async () => {
      // The check function indicates the first path is taken, but the second one isn't
      const mockExistenceCheck = jest
        .fn()
        .mockReturnValueOnce(true) // image.jpg exists
        .mockReturnValueOnce(false) // image_1.jpg does not exist

      const resultPath = await getUniquePathWithCheck(initialTargetFilePath, mockExistenceCheck)
      expect(resultPath).toBe('/tmp/dest/image_1.jpg')
    })
  })
})
