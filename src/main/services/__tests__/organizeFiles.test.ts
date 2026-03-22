import * as path from 'path'
import { getUniquePathWithCheck } from '../utils/pathUtils'

/**
 * Test suite for the file organizer utility functions (pathUtils testing part).
 */
describe('File Organizer Utility Functions', () => {
  // -----------------------------------------------------------------------
  // getUniquePathWithCheck
  // -----------------------------------------------------------------------
  describe('getUniquePathWithCheck', () => {
    test('returns the original destination path if there is no name collision', async () => {
      const mockCheckFunction = jest.fn(() => false) // No collision
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(await getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        targetDestinationPath
      )
      expect(mockCheckFunction).toHaveBeenCalledTimes(1)
    })

    test('appends a counter (e.g., _1) to the filename on the first collision', async () => {
      let mockCheckCallCount = 0
      const mockCheckFunction = jest.fn(() => {
        mockCheckCallCount++
        return mockCheckCallCount === 1 // Only the first path is taken
      })
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(await getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        path.join('folder', 'file_1.jpg')
      )
      expect(mockCheckFunction).toHaveBeenCalledTimes(2)
    })

    test('continues incrementing the counter until a unique path is found', async () => {
      let mockCheckCallCount = 0
      const mockCheckFunction = jest.fn(() => {
        mockCheckCallCount++
        return mockCheckCallCount <= 3 // Several paths are already taken
      })
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(await getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        path.join('folder', 'file_3.jpg')
      )
      expect(mockCheckCallCount).toBe(4)
    })
  })
})
