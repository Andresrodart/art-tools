import { promises as fs } from 'fs'
import { join } from 'path'
import { getUniqueFilePath, getUniquePathWithCheck } from '../../utils/pathUtils'

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}))

describe('pathUtils', () => {
  describe('getUniqueFilePath', () => {
    const destDir = '/tmp/dest'
    const name = 'image'
    const ext = '.jpg'

    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('returns original path if file does not exist', async () => {
      ;(fs.stat as jest.Mock).mockRejectedValue(new Error('ENOENT'))
      const result = await getUniqueFilePath(destDir, name, ext)
      expect(result).toBe(join(destDir, 'image.jpg'))
    })

    test('returns unique path if file already exists', async () => {
      ;(fs.stat as jest.Mock)
        .mockResolvedValueOnce({}) // image.jpg exists
        .mockRejectedValueOnce(new Error('ENOENT')) // image_1.jpg does not exist

      const result = await getUniqueFilePath(destDir, name, ext)
      expect(result).toBe(join(destDir, 'image_1.jpg'))
    })

    test('increments counter until path is unique', async () => {
      ;(fs.stat as jest.Mock)
        .mockResolvedValueOnce({}) // image.jpg exists
        .mockResolvedValueOnce({}) // image_1.jpg exists
        .mockRejectedValueOnce(new Error('ENOENT')) // image_2.jpg does not exist

      const result = await getUniqueFilePath(destDir, name, ext)
      expect(result).toBe(join(destDir, 'image_2.jpg'))
    })
  })

  describe('getUniquePathWithCheck', () => {
    const destPath = '/tmp/dest/image.jpg'

    test('returns original path if check function returns false', () => {
      const checkExists = jest.fn().mockReturnValue(false)
      const result = getUniquePathWithCheck(destPath, checkExists)
      expect(result).toBe(destPath)
      expect(checkExists).toHaveBeenCalledWith(destPath)
    })

    test('returns unique path if check function returns true', () => {
      const checkExists = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false)

      const result = getUniquePathWithCheck(destPath, checkExists)
      expect(result).toBe('/tmp/dest/image_1.jpg')
    })
  })
})
