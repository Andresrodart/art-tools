import {
  extractDateFromFilenamePattern,
  getMonthLabelFromIndex,
  getDayOrdinal,
  buildDateBasedDestination
} from '../organizeUtils'
import * as path from 'path'

/**
 * Test suite for the organizeUtils utility functions.
 * Using standard industry conventions: Arrange-Act-Assert and strict fixture-based tests.
 */
describe('organizeUtils', () => {
  describe('getMonthLabelFromIndex', () => {
    // Standard fixture-based approach for all valid inputs
    const validMonthsFixture = [
      { index: 0, expected: 'January' },
      { index: 1, expected: 'February' },
      { index: 2, expected: 'March' },
      { index: 3, expected: 'April' },
      { index: 4, expected: 'May' },
      { index: 5, expected: 'June' },
      { index: 6, expected: 'July' },
      { index: 7, expected: 'August' },
      { index: 8, expected: 'September' },
      { index: 9, expected: 'October' },
      { index: 10, expected: 'November' },
      { index: 11, expected: 'December' }
    ]

    test.each(validMonthsFixture)(
      'returns correct month label "$expected" for valid index $index',
      ({ index, expected }) => {
        // Act
        const result = getMonthLabelFromIndex(index)
        // Assert
        expect(result).toBe(expected)
      }
    )

    // Fuzz testing for edge cases and out-of-bounds indices
    describe('Fuzz Testing / Edge Cases', () => {
      const invalidIntegersFixture = [-1, -100, 12, 13, 999]

      test.each(invalidIntegersFixture)(
        'throws an error for out-of-bounds integer %i',
        (invalidIndex) => {
          // Assert
          expect(() => getMonthLabelFromIndex(invalidIndex)).toThrow(
            `Invalid month index: ${invalidIndex}. Must be between 0 and 11.`
          )
        }
      )

      const nonIntegersFixture = [0.5, 3.14, 11.99, NaN, Infinity, -Infinity]

      test.each(nonIntegersFixture)('throws an error for non-integer number %d', (invalidIndex) => {
        // Assert
        expect(() => getMonthLabelFromIndex(invalidIndex)).toThrow(
          `Invalid month index: ${invalidIndex}. Must be an integer.`
        )
      })
    })
  })

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
  // getDayOrdinal
  // -----------------------------------------------------------------------
  describe('getDayOrdinal', () => {
    const ordinalFixture = [
      { day: 1, expected: 'st' },
      { day: 2, expected: 'nd' },
      { day: 3, expected: 'rd' },
      { day: 4, expected: 'th' },
      { day: 11, expected: 'th' },
      { day: 12, expected: 'th' },
      { day: 13, expected: 'th' },
      { day: 21, expected: 'st' },
      { day: 22, expected: 'nd' },
      { day: 23, expected: 'rd' },
      { day: 30, expected: 'th' },
      { day: 31, expected: 'st' }
    ]

    test.each(ordinalFixture)('returns correct ordinal "$expected" for day $day', ({ day, expected }) => {
      expect(getDayOrdinal(day)).toBe(expected)
    })
  })

  // -----------------------------------------------------------------------
  // buildDateBasedDestination
  // -----------------------------------------------------------------------
  describe('buildDateBasedDestination', () => {
    test('correctly constructs a descriptive Year/Month/Day folder structure', () => {
      const sourceDate = new Date('2023-06-15T12:00:00')
      const { destinationDirectory, destinationFilePath } = buildDateBasedDestination(
        '/root',
        'photo.jpg',
        sourceDate
      )
      // 2023/June/Thursday June 15th
      const expectedDayFolder = 'Thursday June 15th'
      expect(destinationDirectory).toBe(path.join('/root', '2023', 'June', expectedDayFolder))
      expect(destinationFilePath).toBe(
        path.join('/root', '2023', 'June', expectedDayFolder, 'photo.jpg')
      )
    })

    test('correctly handles first day of month with st suffix', () => {
      const sourceDate = new Date('2024-01-01T12:00:00')
      const { destinationDirectory } = buildDateBasedDestination('/root', 'img.png', sourceDate)
      // 2024/January/Monday January 1st
      const expectedDayFolder = 'Monday January 1st'
      expect(destinationDirectory).toBe(path.join('/root', '2024', 'January', expectedDayFolder))
    })

    test('correctly handles 22nd with nd suffix', () => {
      const sourceDate = new Date('2024-03-22T12:00:00')
      const { destinationDirectory } = buildDateBasedDestination('/root', 'img.png', sourceDate)
      // 2024/March/Friday March 22nd
      const expectedDayFolder = 'Friday March 22nd'
      expect(destinationDirectory).toBe(path.join('/root', '2024', 'March', expectedDayFolder))
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
