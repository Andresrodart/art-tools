import * as path from 'path'
import { thresholdMergerTask, getImmediateElementCount } from '../thresholdMerger'
import { promises as fs } from 'fs'
import { TestSandbox, setupDummyTask } from './testHelpers.fixture'

/**
 * Test suite for the Threshold Merger Service.
 * Verifies grouping of sibling folders based on item count and capacity.
 */
describe('Threshold Merger Service', () => {
  const sandbox = new TestSandbox()

  beforeEach(async () => {
    // Initialize a new unique temporary sandbox for each test case
    await sandbox.setup('threshold-merger-test-')
  })

  afterEach(async () => {
    // Clean up all temporary files and folders
    await sandbox.teardown()
  })

  describe('getImmediateElementCount', () => {
    test('returns the correct number of direct children in a folder', async () => {
      // Setup: 1 folder and 1 file
      await sandbox.createDirectory('folder1')
      await sandbox.createFile('file1.txt', 'data')

      const elementCount = await getImmediateElementCount(sandbox.rootPath)
      expect(elementCount).toBe(2)
    })
  })

  describe('thresholdMergerTask', () => {
    test('groups sibling folders into batches when below the item threshold', async () => {
      // Setup tree:
      // A (2 elements) -> A1.txt, A2.txt
      // B (3 elements) -> B1.txt, B2.txt, B3.txt
      // C (4 elements) -> C1.txt, C2.txt, C3.txt, C4.txt
      // D (1 element)  -> D1.txt
      // E (10 elements) -> Too big, should not be merged if thresholdX=5

      await sandbox.createFile('A/A1.txt', '')
      await sandbox.createFile('A/A2.txt', '')
      await sandbox.createFile('B/B1.txt', '')
      await sandbox.createFile('B/B2.txt', '')
      await sandbox.createFile('B/B3.txt', '')
      await sandbox.createFile('C/C1.txt', '')
      await sandbox.createFile('C/C2.txt', '')
      await sandbox.createFile('C/C3.txt', '')
      await sandbox.createFile('C/C4.txt', '')
      await sandbox.createFile('D/D1.txt', '')
      for (let i = 0; i < 10; i++) {
        await sandbox.createFile(`E/E${i}.txt`, '')
      }

      const taskId = 'test-threshold-merge'
      setupDummyTask(taskId, 'threshold-merger')

      // Logic: X = 5, Y = 6
      const taskResults = await thresholdMergerTask(taskId, {
        rootPath: sandbox.rootPath,
        thresholdX: 5,
        maxCapacityY: 6,
        isDryRun: false
      })

      // We expect:
      // A (2) + B(3) = 5 (<= 6) -> A___B
      // C (4) + D(1) = 5 (<= 6) -> C___D
      // E (10) is >= X, so not merged at all.

      expect(taskResults).toHaveLength(2)

      const mergedNames = taskResults.map((result) => path.basename(result.newPath)).sort()
      expect(mergedNames).toEqual(['A___B', 'C___D'])

      // Verify that files were correctly moved into the new merged folders
      const mergedABCount = await getImmediateElementCount(sandbox.getAbsolutePath('A___B'))
      expect(mergedABCount).toBe(5) // (A1, A2, B1, B2, B3)

      const mergedCDCount = await getImmediateElementCount(sandbox.getAbsolutePath('C___D'))
      expect(mergedCDCount).toBe(5) // (C1...C4, D1)

      // Verify the source folders have been removed after the merge
      const remainingRootFolders = await fs.readdir(sandbox.rootPath)
      expect(remainingRootFolders).not.toContain('A')
      expect(remainingRootFolders).not.toContain('B')
      expect(remainingRootFolders).not.toContain('C')
      expect(remainingRootFolders).not.toContain('D')
      expect(remainingRootFolders).toContain('E')
    })

    test('performs no changes to the filesystem when isDryRun is true', async () => {
      // Setup folders A and B for a potential merge
      await sandbox.createFile('A/A1.txt', '')
      await sandbox.createFile('B/B1.txt', '')

      const taskId = 'test-threshold-dryrun'
      setupDummyTask(taskId, 'threshold-merger')

      const taskResults = await thresholdMergerTask(taskId, {
        rootPath: sandbox.rootPath,
        thresholdX: 5,
        maxCapacityY: 10,
        isDryRun: true
      })

      expect(taskResults).toHaveLength(1)
      expect(path.basename(taskResults[0].newPath)).toBe('A___B')

      // Verify that in dry-run, the folders were NOT actually merged on disk
      const remainingRootFolders = await fs.readdir(sandbox.rootPath)
      expect(remainingRootFolders).toContain('A')
      expect(remainingRootFolders).toContain('B')
      expect(remainingRootFolders).not.toContain('A___B')
    })
  })
})
