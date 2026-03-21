import * as fs from 'fs'
import * as path from 'path'
import exifr from 'exifr'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp']

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

/** Convert a 0-indexed month number to its full English name. */
export const getMonthName = (monthIndex: number): string => MONTH_NAMES[monthIndex]

/** Try to extract a date from well-known filename patterns. */
export function parseDateFromFilename(filename: string): Date | null {
  // DJI_YYYYMMDD_...
  const djiMatch = filename.match(/DJI_(\d{4})(\d{2})(\d{2})_/)
  if (djiMatch) {
    const [, year, month, day] = djiMatch
    return new Date(`${year}-${month}-${day}T12:00:00`)
  }

  // YYYYMMDD_...
  const genericMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_/)
  if (genericMatch) {
    const [, year, month, day] = genericMatch
    return new Date(`${year}-${month}-${day}T12:00:00`)
  }

  return null
}

/** Build the `Year/MonthName/Day` destination folder for a given date. */
export function buildDestination(
  rootFolder: string,
  filename: string,
  date: Date
): { destDir: string; destPath: string } {
  const year = date.getFullYear().toString()
  const month = getMonthName(date.getMonth())
  const day = date.getDate().toString().padStart(2, '0')
  const destDir = path.join(rootFolder, year, month, day)
  const destPath = path.join(destDir, filename)
  return { destDir, destPath }
}

/** Attempt to read EXIF DateTimeOriginal / CreateDate from an image file. */
export async function getExifDate(filePath: string): Promise<Date | null> {
  try {
    const data = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    if (data?.DateTimeOriginal) return new Date(data.DateTimeOriginal)
    if (data?.CreateDate) return new Date(data.CreateDate)
  } catch {
    // File has no EXIF or is unreadable — fall through silently
  }
  return null
}

/** Get the best date from file-system stats (birthtime → mtime). */
export function getFileStatsDate(filePath: string): Date | null {
  try {
    const stats = fs.statSync(filePath)
    const birth = stats.birthtime
    if (!isNaN(birth.getTime()) && birth.getFullYear() > 1970) return birth
    return stats.mtime
  } catch {
    return null
  }
}

/**
 * Resolve the most accurate date for a file using the priority chain:
 *   1. Filename pattern
 *   2. EXIF metadata (for image files)
 *   3. File-system stats (birthtime → mtime)
 */
export async function resolveFileDate(
  filePath: string
): Promise<{ date: Date | null; source: 'filename' | 'exif' | 'stats' | 'none' }> {
  const filename = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  // 1 — filename
  const fnDate = parseDateFromFilename(filename)
  if (fnDate) return { date: fnDate, source: 'filename' }

  // 2 — EXIF (only for image files)
  if (IMAGE_EXTENSIONS.includes(ext)) {
    const exifDate = await getExifDate(filePath)
    if (exifDate) return { date: exifDate, source: 'exif' }
  }

  // 3 — file stats
  const statsDate = getFileStatsDate(filePath)
  if (statsDate) return { date: statsDate, source: 'stats' }

  return { date: null, source: 'none' }
}

/**
 * If the file's filesystem creation/modification time differs from the EXIF
 * date by more than 60 seconds, update the file's access + modification times
 * to match the EXIF date so the OS reflects the real capture date.
 */
export function correctTimestamp(filePath: string, exifDate: Date): boolean {
  try {
    const stats = fs.statSync(filePath)
    const diff = Math.abs(stats.mtime.getTime() - exifDate.getTime())
    if (diff > 60_000) {
      const epochSecs = exifDate.getTime() / 1000
      fs.utimesSync(filePath, epochSecs, epochSecs)
      return true
    }
  } catch {
    // non-critical — skip silently
  }
  return false
}
