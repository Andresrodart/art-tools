import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { organizeFilesTask } from '../organizeFiles'
import { taskManager } from '../TaskManager'

describe('organizeFilesTask integration', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create a fresh temp directory for each test
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'art-tools-test-'))
  })

  afterEach(async () => {
    // Clean up temp directory recursively
    await fs.promises.rm(tempDir, { recursive: true, force: true })
  })

  it('should organize files and emit progress correctly', async () => {
    // 1. Create mock files in temp directory
    const file1 = path.join(tempDir, 'test1.jpg')
    const file2 = path.join(tempDir, 'test2.png')
    const file3 = path.join(tempDir, 'test3.txt')

    await fs.promises.writeFile(file1, 'fake content 1')
    await fs.promises.writeFile(file2, 'fake content 2')
    await fs.promises.writeFile(file3, 'fake content 3')

    // Prepare task reporting tracking
    const taskId = taskManager.createTask('organize-files').id
    const progressUpdates: number[] = []

    const onTaskUpdated = (task: import('../TaskManager').Task): void => {
      if (task.id === taskId && task.progress) {
        progressUpdates.push(task.progress.current)
      }
    }

    taskManager.on('task-updated', onTaskUpdated)

    try {
      // 2. Execute the organization
      const results = await organizeFilesTask(taskId, {
        folderPath: tempDir,
        fileTypes: ['*'],
        isDryRun: false
      })

      // 3. Verify results
      expect(results.length).toBe(3)
      expect(results.filter((r) => r.success).length).toBe(3)

      // 4. Verify progress updates
      // At a minimum, the last progress update should match the total number of files
      expect(progressUpdates.length).toBeGreaterThan(0)
      const lastProgress = progressUpdates[progressUpdates.length - 1]
      expect(lastProgress).toBe(3)

      // 5. Verify the full Year/Month/Day folder structure
      const rootFiles = await fs.promises.readdir(tempDir)
      expect(rootFiles.length).toBeGreaterThan(0)

      for (const yearDir of rootFiles) {
        const yearPath = path.join(tempDir, yearDir)
        const yearStats = await fs.promises.stat(yearPath)
        expect(yearStats.isDirectory()).toBe(true)
        // Ensure year pattern for the generated directory
        expect(/^\d{4}$/.test(yearDir)).toBe(true)

        const monthFiles = await fs.promises.readdir(yearPath)
        expect(monthFiles.length).toBeGreaterThan(0)

        for (const monthDir of monthFiles) {
          const monthPath = path.join(yearPath, monthDir)
          const monthStats = await fs.promises.stat(monthPath)
          expect(monthStats.isDirectory()).toBe(true)
          // Month should be a full month name
          expect(
            /^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(
              monthDir
            )
          ).toBe(true)

          const dayFiles = await fs.promises.readdir(monthPath)
          expect(dayFiles.length).toBeGreaterThan(0)

          for (const dayDir of dayFiles) {
            const dayPath = path.join(monthPath, dayDir)
            const dayStats = await fs.promises.stat(dayPath)
            expect(dayStats.isDirectory()).toBe(true)

            // Day folder format: FullDayOfWeek MonthName DayOrdinal
            // e.g., "Monday January 1st" or "Monday January 01st"
            // Based on organizeUtils.ts: `${dayOfWeek} ${monthLabel} ${dayOfMonth}${dayOrdinal}`
            expect(/^[A-Z][a-z]+ [A-Z][a-z]+ \d{1,2}(st|nd|rd|th)$/.test(dayDir)).toBe(true)

            const finalFiles = await fs.promises.readdir(dayPath)
            expect(finalFiles.length).toBeGreaterThan(0)
            for (const file of finalFiles) {
              expect(['test1.jpg', 'test2.png', 'test3.txt']).toContain(file)
            }
          }
        }
      }
    } finally {
      taskManager.off('task-updated', onTaskUpdated)
    }
  })
})
