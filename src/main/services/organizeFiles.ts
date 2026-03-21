import * as fs from 'fs'
import * as path from 'path'
import { TaskReporter } from './utils/taskReporter'
import { FileWalker } from './utils/fileWalker'
import { getUniquePathWithCheck } from './utils/pathUtils'
import {
  resolveFileDate,
  correctTimestamp,
  buildDestination
} from './utils/organizeUtils'

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
// Main Task Orchestrator
// ---------------------------------------------------------------------------

export async function organizeFilesTask(
  taskId: string,
  options: OrganizeOptions
): Promise<OrganizeResult[]> {
  const { folderPath, fileTypes, isDryRun } = options
  const reporter = new TaskReporter(taskId)
  const results: OrganizeResult[] = []

  if (!path.isAbsolute(folderPath)) {
    throw new Error('Folder path must be absolute')
  }

  // --- Phase 1: Scan & filter ---
  reporter.setStatus(isDryRun ? 'dry-run' : 'running')
  reporter.updateProgress({ message: 'Scanning directory…' })

  const validFiles: string[] = []
  const walker = new FileWalker(reporter, {
    extensions: fileTypes,
    skipHidden: true,
    skipYearFolders: true
  })

  await walker.walk(folderPath, async (fp) => {
    validFiles.push(fp)
  })

  reporter.updateProgress({ total: validFiles.length, current: 0 })

  // --- Phase 2: Organize ---
  let processed = 0
  const simulatedExists = new Set<string>()

  const checkExists = (p: string): boolean => {
    if (isDryRun) return simulatedExists.has(p) || fs.existsSync(p)
    return fs.existsSync(p)
  }

  for (const filePath of validFiles) {
    const filename = path.basename(filePath)
    processed++
    reporter.updateProgressThrottled({
      current: processed,
      message: `Processing: ${filename}`
    })

    if (processed % 50 === 0) {
      await reporter.yieldAndCheck()
    } else {
      reporter.checkCancellation()
    }

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

    const uniquePath = getUniquePathWithCheck(destPath, checkExists)

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

  reporter.complete(results)
  return results
}
