import * as path from 'path'
import {
  extractDateFromFilenamePattern,
  getMonthLabelFromIndex,
  buildDateBasedDestination
} from '../utils/organizeUtils'
import { getUniquePathWithCheck } from '../utils/pathUtils'

/**
 * Test suite for the file organizer utility functions.
 * Verifies date parsing, month labels, and destination construction.
 */
describe('File Organizer Utility Functions', () => {
  // -----------------------------------------------------------------------
  // extractDateFromFilenamePattern
  // -----------------------------------------------------------------------
  describe('extractDateFromFilenamePattern', () => {
    test('extracts the correct date from the DJI drone filename pattern', () => {
      const parsedDate = extractDateFromFilenamePattern('DJI_20231024_153022.jpg')
      expect(parsedDate).not.toBeNull()
      expect(parsedDate?.getFullYear()).toBe(2023)
      expect(parsedDate?.getMonth()).toBe(9) // 0-indexed month (October)
      expect(parsedDate?.getDate()).toBe(24)
    })

    test('extracts the correct date from a generic YYYYMMDD prefix pattern', () => {
      const parsedDate = extractDateFromFilenamePattern('20220101_Party.png')
      expect(parsedDate).not.toBeNull()
      expect(parsedDate?.getFullYear()).toBe(2022)
      expect(parsedDate?.getMonth()).toBe(0) // January
      expect(parsedDate?.getDate()).toBe(1)
    })

    test('returns null for filenames that do not match known date patterns', () => {
      expect(extractDateFromFilenamePattern('random_image.jpg')).toBeNull()
      expect(extractDateFromFilenamePattern('IMG_9999.png')).toBeNull()
      expect(extractDateFromFilenamePattern('Screenshot 2024-01-01.png')).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // getUniquePathWithCheck
  // -----------------------------------------------------------------------
  describe('getUniquePathWithCheck', () => {
    test('returns the original destination path if there is no name collision', () => {
      const mockCheckFunction = jest.fn(() => false) // No collision
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        targetDestinationPath
      )
      expect(mockCheckFunction).toHaveBeenCalledTimes(1)
    })

    test('appends a counter (e.g., _1) to the filename on the first collision', () => {
      let mockCheckCallCount = 0
      const mockCheckFunction = jest.fn(() => {
        mockCheckCallCount++
        return mockCheckCallCount === 1 // Only the first path is taken
      })
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        path.join('folder', 'file_1.jpg')
      )
      expect(mockCheckFunction).toHaveBeenCalledTimes(2)
    })

    test('continues incrementing the counter until a unique path is found', () => {
      let mockCheckCallCount = 0
      const mockCheckFunction = jest.fn(() => {
        mockCheckCallCount++
        return mockCheckCallCount <= 3 // Several paths are already taken
      })
      const targetDestinationPath = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(targetDestinationPath, mockCheckFunction)).toBe(
        path.join('folder', 'file_3.jpg')
      )
      expect(mockCheckCallCount).toBe(4)
    })
  })

  // -----------------------------------------------------------------------
  // getMonthLabelFromIndex
  // -----------------------------------------------------------------------
  describe('getMonthLabelFromIndex', () => {
    test('returns the correct full month names for a given index', () => {
      expect(getMonthLabelFromIndex(0)).toBe('January')
      expect(getMonthLabelFromIndex(5)).toBe('June')
      expect(getMonthLabelFromIndex(11)).toBe('December')
    })
  })

  // -----------------------------------------------------------------------
  // buildDateBasedDestination
  // -----------------------------------------------------------------------
  describe('buildDateBasedDestination', () => {
    test('correctly constructs a Year/Month/Day destination path', () => {
      const sourceDate = new Date('2023-06-15T12:00:00')
      const { destinationDirectory, destinationFilePath } = buildDateBasedDestination(
        '/root',
        'photo.jpg',
        sourceDate
      )
      expect(destinationDirectory).toBe(path.join('/root', '2023', 'June', '15'))
      expect(destinationFilePath).toBe(path.join('/root', '2023', 'June', '15', 'photo.jpg'))
    })

    test('properly zero-pads single-digit days in the folder name', () => {
      const sourceDate = new Date('2024-01-03T12:00:00')
      const { destinationDirectory } = buildDateBasedDestination('/root', 'img.png', sourceDate)
      expect(destinationDirectory).toBe(path.join('/root', '2024', 'January', '03'))
    })
  })

  // -----------------------------------------------------------------------
  // Date Resolution Priority Integration
  // -----------------------------------------------------------------------
  describe('Date Resolution Priority Integration', () => {
    test('ensures filename date pattern is used for parsing if present', () => {
      const parsedDate = extractDateFromFilenamePattern('DJI_20230615_120000.jpg')
      expect(parsedDate).not.toBeNull()
      expect(parsedDate?.getFullYear()).toBe(2023)
      expect(parsedDate?.getMonth()).toBe(5) // June
      expect(parsedDate?.getDate()).toBe(15)
    })

    test('returns null for filenames without date prefixes to allow falling back to EXIF', () => {
      expect(extractDateFromFilenamePattern('IMG_1234.jpg')).toBeNull()
      expect(extractDateFromFilenamePattern('vacation_photo.heic')).toBeNull()
      expect(extractDateFromFilenamePattern('sunset.webp')).toBeNull()
    })
  })
})
