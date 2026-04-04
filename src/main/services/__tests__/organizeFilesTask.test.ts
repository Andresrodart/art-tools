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

      // Ensure that files were actually moved out of the root directory
      const rootFiles = await fs.promises.readdir(tempDir)
      // The only items remaining in root should be the newly created year directories (e.g. "2024" or "2025")
      for (const item of rootFiles) {
        const itemPath = path.join(tempDir, item)
        const stats = await fs.promises.stat(itemPath)
        expect(stats.isDirectory()).toBe(true)
        // Ensure year pattern for the generated directory
        expect(/^\d{4}$/.test(item)).toBe(true)
      }
    } finally {
      taskManager.off('task-updated', onTaskUpdated)
    }
  })
})
