import {
  isSafeDirectory,
  getSafePathInfo,
  isValidExternalProtocol,
  getUniqueFilePath,
  getUniquePathWithCheck
} from '../pathUtils'
import { promises as fs } from 'fs'
import { join } from 'path'

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}))

describe('pathUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSafePathInfo', () => {
    it('returns info for a valid directory', async () => {
      ;(fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true })
      const result = await getSafePathInfo('/valid/dir')
      expect(result).toEqual({ exists: true, isDirectory: true })
    })

    it('returns info for a valid file', async () => {
      ;(fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false })
      const result = await getSafePathInfo('/valid/file')
      expect(result).toEqual({ exists: true, isDirectory: false })
    })

    it('returns null for a non-existent path', async () => {
      ;(fs.stat as jest.Mock).mockRejectedValue(new Error('Not found'))
      const result = await getSafePathInfo('/invalid/path')
      expect(result).toBeNull()
    })

    it('returns null for non-string input', async () => {
      const result = await getSafePathInfo(123 as unknown as string)
      expect(result).toBeNull()
    })

    it('returns null for empty string', async () => {
      const result = await getSafePathInfo('')
      expect(result).toBeNull()
    })
  })

  describe('isSafeDirectory', () => {
    it('returns true for a valid directory', async () => {
      ;(fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true })
      const result = await isSafeDirectory('/valid/dir')
      expect(result).toBe(true)
    })

    it('returns false for a file', async () => {
      ;(fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false })
      const result = await isSafeDirectory('/valid/file')
      expect(result).toBe(false)
    })

    it('returns false for a non-existent path', async () => {
      ;(fs.stat as jest.Mock).mockRejectedValue(new Error('Not found'))
      const result = await isSafeDirectory('/invalid/path')
      expect(result).toBe(false)
    })
  })

  describe('isValidExternalProtocol', () => {
    it('returns true for https protocol', () => {
      expect(isValidExternalProtocol('https://example.com')).toBe(true)
    })

    it('returns true for http protocol', () => {
      expect(isValidExternalProtocol('http://example.com')).toBe(true)
    })

    it('returns true for mixed-case protocol', () => {
      expect(isValidExternalProtocol('HTTP://example.com')).toBe(true)
      expect(isValidExternalProtocol('hTTpS://example.com')).toBe(true)
    })

    it('returns false for file protocol', () => {
      expect(isValidExternalProtocol('file:///etc/passwd')).toBe(false)
    })

    it('returns false for ftp protocol', () => {
      expect(isValidExternalProtocol('ftp://example.com')).toBe(false)
    })

    it('returns false for mailto protocol', () => {
      expect(isValidExternalProtocol('mailto:user@example.com')).toBe(false)
    })

    it('returns false for javascript protocol', () => {
      expect(isValidExternalProtocol('javascript:alert(1)')).toBe(false)
    })

    it('returns false for data protocol', () => {
      expect(isValidExternalProtocol('data:text/html,<h1>Hello</h1>')).toBe(false)
    })

    it('returns false for malformed URLs', () => {
      expect(isValidExternalProtocol('not-a-url')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidExternalProtocol('')).toBe(false)
    })

    it('returns false for non-string inputs', () => {
      expect(isValidExternalProtocol(null as unknown as string)).toBe(false)
      expect(isValidExternalProtocol(undefined as unknown as string)).toBe(false)
      expect(isValidExternalProtocol(123 as unknown as string)).toBe(false)
    })
  })

  describe('getUniqueFilePath', () => {
    const destinationDirectory = '/tmp/dest'
    const baseName = 'image'
    const extension = '.jpg'

    test('returns original path if the file does not already exist on disk', async () => {
      ;(fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'))
      const resultPath = await getUniqueFilePath(destinationDirectory, baseName, extension)
      expect(resultPath).toBe(join(destinationDirectory, 'image.jpg'))
    })

    test('returns a unique path if the initial filename already exists', async () => {
      ;(fs.stat as jest.Mock)
        .mockResolvedValueOnce({}) // image.jpg exists
        .mockRejectedValueOnce(new Error('ENOENT')) // image_1.jpg does not exist

      const resultPath = await getUniqueFilePath(destinationDirectory, baseName, extension)
      expect(resultPath).toBe(join(destinationDirectory, 'image_1.jpg'))
    })

    test('increments the counter multiple times until it finds a unique path', async () => {
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
      const mockExistenceCheck = jest.fn().mockReturnValue(false)
      const resultPath = await getUniquePathWithCheck(initialTargetFilePath, mockExistenceCheck)
      expect(resultPath).toBe(initialTargetFilePath)
      expect(mockExistenceCheck).toHaveBeenCalledWith(initialTargetFilePath)
    })

    test('returns a unique path if the custom check function returns true for collisions', async () => {
      const mockExistenceCheck = jest
        .fn()
        .mockReturnValueOnce(true) // image.jpg exists
        .mockReturnValueOnce(false) // image_1.jpg does not exist

      const resultPath = await getUniquePathWithCheck(initialTargetFilePath, mockExistenceCheck)
      expect(resultPath).toBe(join('/tmp/dest', 'image_1.jpg'))
    })
  })
})
