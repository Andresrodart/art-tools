import * as fs from 'fs'
import * as path from 'path'
import exifr from 'exifr'

/**
 * Standard image and video file extensions for date-based organization.
 */
const DATE_ORCHESTRATION_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.heic', '.webp']

/**
 * Full English names for each month of the year (0-indexed).
 */
const MONTH_NAME_LABELS = [
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

/**
 * Returns the full name of a month for a given index (0-11).
 *
 * @param monthIndex 0-indexed integer (0 for January, 11 for December).
 * @returns The full English label for the month.
 */
export const getMonthLabelFromIndex = (monthIndex: number): string => MONTH_NAME_LABELS[monthIndex]

/**
 * Attempts to parse a Date object from common file naming patterns.
 * For example:
 * - DJI_20231024_... (DJI Drone)
 * - 20220101_... (Generic)
 *
 * @param filename The name of the file to check.
 * @returns A Date object if a pattern is found, otherwise null.
 */
export function extractDateFromFilenamePattern(filename: string): Date | null {
  // DJI_YYYYMMDD_...
  const djiDroneMatch = filename.match(/DJI_(\d{4})(\d{2})(\d{2})_/)
  if (djiDroneMatch) {
    const [, year, month, day] = djiDroneMatch
    return new Date(`${year}-${month}-${day}T12:00:00`)
  }

  // YYYYMMDD_...
  const genericDateMatch = filename.match(/^(\d{4})(\d{2})(\d{2})_/)
  if (genericDateMatch) {
    const [, year, month, day] = genericDateMatch
    return new Date(`${year}-${month}-${day}T12:00:00`)
  }

  return null
}

/**
 * Constructs a target directory and file path based on a Year/Month/Day folder structure.
 *
 * @param rootDirectoryPath The top-level folder for the organization.
 * @param filename The name of the file being moved.
 * @param sourceDate The date used to determine the target folder.
 * @returns An object containing the destination directory and the full destination file path.
 */
export function buildDateBasedDestination(
  rootDirectoryPath: string,
  filename: string,
  sourceDate: Date
): { destinationDirectory: string; destinationFilePath: string } {
  const yearString = sourceDate.getFullYear().toString()
  const monthLabel = getMonthLabelFromIndex(sourceDate.getMonth())
  const dayOfMonthString = sourceDate.getDate().toString().padStart(2, '0')

  const destinationDirectory = path.join(
    rootDirectoryPath,
    yearString,
    monthLabel,
    dayOfMonthString
  )
  const destinationFilePath = path.join(destinationDirectory, filename)

  return { destinationDirectory, destinationFilePath }
}

/**
 * Reads EXIF metadata from an image file to find the capture date.
 * It checks 'DateTimeOriginal' first, then 'CreateDate'.
 *
 * @param filePath The absolute path of the file to parse.
 * @returns A Date object if metadata is found, otherwise null.
 */
export async function getExifCaptureDate(filePath: string): Promise<Date | null> {
  try {
    const metadata = await exifr.parse(filePath, ['DateTimeOriginal', 'CreateDate'])
    if (metadata?.DateTimeOriginal) return new Date(metadata.DateTimeOriginal)
    if (metadata?.CreateDate) return new Date(metadata.CreateDate)
  } catch {
    // File might be unreadable or has no EXIF data; ignore and fall through
  }
  return null
}

/**
 * Retrieves the most reliable date from the filesystem stats.
 * It prioritizes the birth (creation) time if valid (>1970), otherwise falls back to modification time.
 *
 * @param filePath The absolute path of the file to check.
 * @returns A promise resolving to a Date object representing the file's age.
 */
export async function getFileStatsResolutionDate(filePath: string): Promise<Date | null> {
  try {
    const fileStats = await fs.promises.stat(filePath)
    const birthTime = fileStats.birthtime
    if (!isNaN(birthTime.getTime()) && birthTime.getFullYear() > 1970) return birthTime

    return fileStats.mtime
  } catch {
    // Access error; ignore and return null
    return null
  }
}

/**
 * Determines the most accurate date for a file using a prioritized resolution chain:
 * 1. Filename pattern
 * 2. EXIF metadata (only for supported image files)
 * 3. File-system stats (creation or modification time)
 *
 * @param filePath The absolute path of the file to analyze.
 * @returns A promise resolving to an object containing the resolved date and the source used for determination.
 */
export async function resolveReliableFileDate(
  filePath: string
): Promise<{ resolvedDate: Date | null; source: 'filename' | 'exif' | 'stats' | 'none' }> {
  const filename = path.basename(filePath)
  const fileExtension = path.extname(filePath).toLowerCase()

  // 1 — Priority: Filename date pattern
  const dateFromFilename = extractDateFromFilenamePattern(filename)
  if (dateFromFilename) return { resolvedDate: dateFromFilename, source: 'filename' }

  // 2 — Priority: EXIF metadata (only for certain image extensions)
  if (DATE_ORCHESTRATION_EXTENSIONS.includes(fileExtension)) {
    const dateFromExif = await getExifCaptureDate(filePath)
    if (dateFromExif) return { resolvedDate: dateFromExif, source: 'exif' }
  }

  // 3 — Priority: File-system statistics
  const dateFromStats = await getFileStatsResolutionDate(filePath)
  if (dateFromStats) return { resolvedDate: dateFromStats, source: 'stats' }

  return { resolvedDate: null, source: 'none' }
}

/**
 * Corrects the file's filesystem access and modification times to match the EXIF capture date,
 * but only if the discrepancy is greater than 60 seconds.
 *
 * @param filePath The absolute path of the file to update.
 * @param exifCaptureDate The date extracted from EXIF metadata.
 * @returns A promise resolving to true if the file's timestamps were updated, otherwise false.
 */
export async function synchronizeTimestampWithExif(
  filePath: string,
  exifCaptureDate: Date
): Promise<boolean> {
  try {
    const fileStats = await fs.promises.stat(filePath)
    const timeDiscrepancyMs = Math.abs(fileStats.mtime.getTime() - exifCaptureDate.getTime())

    // Update if the time difference exceeds 60 seconds
    if (timeDiscrepancyMs > 60_000) {
      const epochSeconds = exifCaptureDate.getTime() / 1000
      await fs.promises.utimes(filePath, epochSeconds, epochSeconds)
      return true
    }
  } catch {
    // Non-critical operation; silently skip errors
  }
  return false
}
