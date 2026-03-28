import { isSafeDirectory, getSafePathInfo } from '../pathUtils'
import { promises as fs } from 'fs'

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn()
  }
}))

describe('pathUtils', () => {
  describe('getSafePathInfo', () => {
    it('returns info for a valid directory', async () => {
      // Mocking fs.stat because pathUtils imports { promises as fs }
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
      // @ts-ignore: testing invalid input
      const result = await getSafePathInfo(123)
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
})
