import {
  extractDateFromFilenamePattern,
  getMonthLabelFromIndex,
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

      test.each(nonIntegersFixture)(
        'throws an error for non-integer number %d',
        (invalidIndex) => {
          // Assert
          expect(() => getMonthLabelFromIndex(invalidIndex)).toThrow(
            `Invalid month index: ${invalidIndex}. Must be an integer.`
          )
        }
      )
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
