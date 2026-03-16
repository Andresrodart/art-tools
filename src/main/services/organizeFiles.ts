import * as fs from 'fs'
import * as path from 'path'
import exifr from 'exifr'
import { taskManager } from './TaskManager'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrganizeOptions {
  folderPath: string
  fileTypes: string[] // e.g. ['.jpg', '.png']
  isDryRun: boolean
}

export interface OrganizeResult {
  source: string
  destination: string
  success: boolean
  timestampCorrected?: boolean
  error?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Pure Utilities (easily testable, no side-effects)
// ---------------------------------------------------------------------------

/** Yield control back to the event loop so the UI stays responsive. */
const yieldThread = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

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

/**
 * Return a destination path that doesn't collide with existing files.
 * Appends `_1`, `_2`, … until a free slot is found.
 */
export function getUniquePath(
  destPath: string,
  checkExists: (p: fs.PathLike) => boolean = fs.existsSync
): string {
  if (!checkExists(destPath)) return destPath

  const dir = path.dirname(destPath)
  const ext = path.extname(destPath)
  const name = path.basename(destPath, ext)

  let counter = 1
  let newPath = path.join(dir, `${name}_${counter}${ext}`)

  while (checkExists(newPath)) {
    counter++
    newPath = path.join(dir, `${name}_${counter}${ext}`)
  }

  return newPath
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

// ---------------------------------------------------------------------------
// Date Resolution (modular chain: filename → EXIF → file stats)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Timestamp Correction
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Directory Walker
// ---------------------------------------------------------------------------

/** Recursively yield every file path inside `dir`, skipping hidden and year folders. */
async function* walkDir(dir: string): AsyncGenerator<string> {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const fullPath = path.resolve(dir, entry.name)

    if (entry.isDirectory()) {
      if (/^\d{4}$/.test(entry.name)) continue // skip year folders
      await yieldThread()
      yield* walkDir(fullPath)
    } else {
      yield fullPath
    }
  }
}

// ---------------------------------------------------------------------------
// File Filtering
// ---------------------------------------------------------------------------

/** Return `true` if `filePath` matches the requested type filter. */
function matchesTypeFilter(filePath: string, normalizedTypes: string[]): boolean {
  if (normalizedTypes.length === 0 || normalizedTypes.includes('*')) return true
  const ext = path.extname(filePath).toLowerCase()
  return normalizedTypes.includes(ext)
}

// ---------------------------------------------------------------------------
// Main Task Orchestrator
// ---------------------------------------------------------------------------

export async function organizeFilesTask(
  taskId: string,
  options: OrganizeOptions
): Promise<OrganizeResult[]> {
  const { folderPath, fileTypes, isDryRun } = options
  const results: OrganizeResult[] = []

  if (!path.isAbsolute(folderPath)) {
    throw new Error('Folder path must be absolute')
  }

  // --- Phase 1: Scan & filter ---
  taskManager.updateTaskStatus(taskId, isDryRun ? 'dry-run' : 'running')
  taskManager.updateTaskProgress(taskId, { message: 'Scanning directory…' })

  const normalizedTypes = fileTypes.map((t) => t.toLowerCase())
  const validFiles: string[] = []

  for await (const fp of walkDir(folderPath)) {
    if (matchesTypeFilter(fp, normalizedTypes)) validFiles.push(fp)
  }

  taskManager.updateTaskProgress(taskId, { total: validFiles.length, current: 0 })

  // --- Phase 2: Organize ---
  let processed = 0
  const simulatedExists = new Set<string>()

  const checkExists = (p: fs.PathLike): boolean => {
    if (isDryRun) return simulatedExists.has(String(p)) || fs.existsSync(p)
    return fs.existsSync(p)
  }

  for (const filePath of validFiles) {
    const filename = path.basename(filePath)
    processed++
    taskManager.updateTaskProgress(taskId, {
      current: processed,
      message: `Processing: ${filename}`
    })

    if (processed % 50 === 0) await yieldThread()

    // --- Resolve date ---
    const { date, source } = await resolveFileDate(filePath)

    if (!date || isNaN(date.getTime())) {
      results.push({
        source: filePath,
        destination: '',
        success: false,
        error: 'Could not determine a valid date'
      })
      continue
    }

    // --- Correct file timestamp if EXIF differs from fs ---
    let timestampCorrected = false
    if (source === 'exif' && !isDryRun) {
      timestampCorrected = correctTimestamp(filePath, date)
    }

    // --- Compute destination ---
    const { destDir, destPath } = buildDestination(folderPath, filename, date)
    if (filePath === destPath) continue // already in place

    const uniquePath = getUniquePath(destPath, checkExists)

    // --- Move or simulate ---
    if (isDryRun) {
      simulatedExists.add(uniquePath)
      results.push({
        source: filePath,
        destination: uniquePath,
        success: true,
        timestampCorrected
      })
    } else {
      try {
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
        fs.renameSync(filePath, uniquePath)
        results.push({
          source: filePath,
          destination: uniquePath,
          success: true,
          timestampCorrected
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        results.push({ source: filePath, destination: uniquePath, success: false, error: msg })
      }
    }
  }

  taskManager.completeTask(taskId, results)
  return results
}
