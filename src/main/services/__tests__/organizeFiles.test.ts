import * as path from 'path'
import {
  parseDateFromFilename,
  getMonthName,
  buildDestination
} from '../utils/organizeUtils'
import { getUniquePathWithCheck } from '../utils/pathUtils'

describe('File Organizer Utility Functions', () => {
  // -----------------------------------------------------------------------
  // parseDateFromFilename
  // -----------------------------------------------------------------------
  describe('parseDateFromFilename', () => {
    it('should extract correct date from DJI pattern', () => {
      const result = parseDateFromFilename('DJI_20231024_153022.jpg')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2023)
      expect(result?.getMonth()).toBe(9) // 0-indexed
      expect(result?.getDate()).toBe(24)
    })

    it('should extract correct date from generic YYYYMMDD_ prefix', () => {
      const result = parseDateFromFilename('20220101_Party.png')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2022)
      expect(result?.getMonth()).toBe(0)
      expect(result?.getDate()).toBe(1)
    })

    it('should return null for unmatched filenames', () => {
      expect(parseDateFromFilename('random_image.jpg')).toBeNull()
      expect(parseDateFromFilename('IMG_9999.png')).toBeNull()
      expect(parseDateFromFilename('Screenshot 2024-01-01.png')).toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // getUniquePathWithCheck
  // -----------------------------------------------------------------------
  describe('getUniquePathWithCheck', () => {
    it('should return original path when no collision', () => {
      const mock = jest.fn(() => false)
      const dest = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(dest, mock)).toBe(dest)
      expect(mock).toHaveBeenCalledTimes(1)
    })

    it('should append _1 on first collision', () => {
      let calls = 0
      const mock = jest.fn(() => {
        calls++
        return calls === 1
      })
      const dest = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(dest, mock)).toBe(path.join('folder', 'file_1.jpg'))
      expect(mock).toHaveBeenCalledTimes(2)
    })

    it('should keep incrementing until a free slot', () => {
      let calls = 0
      const mock = jest.fn(() => {
        calls++
        return calls <= 3
      })
      const dest = path.join('folder', 'file.jpg')
      expect(getUniquePathWithCheck(dest, mock)).toBe(path.join('folder', 'file_3.jpg'))
      expect(mock).toHaveBeenCalledTimes(4)
    })
  })

  // -----------------------------------------------------------------------
  // getMonthName
  // -----------------------------------------------------------------------
  describe('getMonthName', () => {
    it('should return correct month names', () => {
      expect(getMonthName(0)).toBe('January')
      expect(getMonthName(5)).toBe('June')
      expect(getMonthName(11)).toBe('December')
    })
  })

  // -----------------------------------------------------------------------
  // buildDestination
  // -----------------------------------------------------------------------
  describe('buildDestination', () => {
    it('should build Year/MonthName/Day path', () => {
      const date = new Date('2023-06-15T12:00:00')
      const { destDir, destPath } = buildDestination('/root', 'photo.jpg', date)
      expect(destDir).toBe(path.join('/root', '2023', 'June', '15'))
      expect(destPath).toBe(path.join('/root', '2023', 'June', '15', 'photo.jpg'))
    })

    it('should zero-pad single-digit days', () => {
      const date = new Date('2024-01-03T12:00:00')
      const { destDir } = buildDestination('/root', 'img.png', date)
      expect(destDir).toBe(path.join('/root', '2024', 'January', '03'))
    })
  })

  // -----------------------------------------------------------------------
  // Date Resolution Priority
  // -----------------------------------------------------------------------
  describe('Date Resolution Priority', () => {
    it('should prefer filename date over any other source', () => {
      const result = parseDateFromFilename('DJI_20230615_120000.jpg')
      expect(result).not.toBeNull()
      expect(result?.getFullYear()).toBe(2023)
      expect(result?.getMonth()).toBe(5)
      expect(result?.getDate()).toBe(15)
    })

    it('should return null for filenames without dates (defers to EXIF/stats)', () => {
      expect(parseDateFromFilename('IMG_1234.jpg')).toBeNull()
      expect(parseDateFromFilename('vacation_photo.heic')).toBeNull()
      expect(parseDateFromFilename('sunset.webp')).toBeNull()
    })
  })
})
