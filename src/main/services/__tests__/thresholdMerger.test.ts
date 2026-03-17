import { thresholdMergerTask, getImmediateElementCount } from '../thresholdMerger'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { taskManager } from '../TaskManager'

describe('Threshold Merger Service', () => {
  let tmpDir: string

  beforeEach(async () => {
    // Create a temporary directory for each test
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'threshold-merger-test-'))
  })

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('getImmediateElementCount', () => {
    it('should return correct number of direct children', async () => {
      await fs.mkdir(path.join(tmpDir, 'folder1'))
      await fs.writeFile(path.join(tmpDir, 'file1.txt'), 'data')
      
      const count = await getImmediateElementCount(tmpDir)
      expect(count).toBe(2)
    })
  })

  describe('thresholdMergerTask', () => {
    it('should group siblings up to Y elements when < X', async () => {
      // Setup:
      // Root
      //  -> A (2 elements) -> A1.txt, A2.txt
      //  -> B (3 elements) -> B1.txt, B2.txt, B3.txt
      //  -> C (4 elements) -> C1.txt, C2.txt, C3.txt, C4.txt
      //  -> D (1 element)  -> D1.txt
      //  -> E (10 elements) -> Too big, should not be merged if X=5
      
      const dirA = path.join(tmpDir, 'A')
      const dirB = path.join(tmpDir, 'B')
      const dirC = path.join(tmpDir, 'C')
      const dirD = path.join(tmpDir, 'D')
      const dirE = path.join(tmpDir, 'E')

      await fs.mkdir(dirA); await fs.writeFile(path.join(dirA, 'A1.txt'), '') ; await fs.writeFile(path.join(dirA, 'A2.txt'), '')
      await fs.mkdir(dirB); await fs.writeFile(path.join(dirB, 'B1.txt'), '') ; await fs.writeFile(path.join(dirB, 'B2.txt'), '') ; await fs.writeFile(path.join(dirB, 'B3.txt'), '')
      await fs.mkdir(dirC); await fs.writeFile(path.join(dirC, 'C1.txt'), '') ; await fs.writeFile(path.join(dirC, 'C2.txt'), '') ; await fs.writeFile(path.join(dirC, 'C3.txt'), '') ; await fs.writeFile(path.join(dirC, 'C4.txt'), '')
      await fs.mkdir(dirD); await fs.writeFile(path.join(dirD, 'D1.txt'), '')
      await fs.mkdir(dirE); for(let i=0; i<10; i++) await fs.writeFile(path.join(dirE, `E${i}.txt`), '')

      const task = taskManager.createTask('thresholdMetadata')

      // X = 5, Y = 6
      const results = await thresholdMergerTask(task.id, {
        rootPath: tmpDir,
        thresholdX: 5,
        maxCapacityY: 6,
        isDryRun: false
      })

      // We expect:
      // A (2) + B(3) = 5 (<= 6) -> A___B
      // C (4) + D(1) = 5 (<= 6) -> C___D
      // E (10) is >= X, so not merged at all.

      expect(results.length).toBe(2)
      
      const merges = results.map(r => path.basename(r.newPath)).sort()
      expect(merges).toEqual(['A___B', 'C___D'])

      // Verify files were moved
      const mergedABCount = await getImmediateElementCount(path.join(tmpDir, 'A___B'))
      expect(mergedABCount).toBe(5) // (A1, A2, B1, B2, B3)

      const mergedCDCount = await getImmediateElementCount(path.join(tmpDir, 'C___D'))
      expect(mergedCDCount).toBe(5) // (C1...C4, D1)

      // Verify old folders are gone
      const rootFolders = await fs.readdir(tmpDir)
      expect(rootFolders).not.toContain('A')
      expect(rootFolders).not.toContain('B')
      expect(rootFolders).not.toContain('C')
      expect(rootFolders).not.toContain('D')
      expect(rootFolders).toContain('E')
    })

    it('should do nothing in a dry run', async () => {
      const dirA = path.join(tmpDir, 'A')
      const dirB = path.join(tmpDir, 'B')
      await fs.mkdir(dirA); await fs.writeFile(path.join(dirA, 'A1.txt'), '')
      await fs.mkdir(dirB); await fs.writeFile(path.join(dirB, 'B1.txt'), '')

      const task = taskManager.createTask('thresholdMetadata')

      const results = await thresholdMergerTask(task.id, {
        rootPath: tmpDir,
        thresholdX: 5,
        maxCapacityY: 10,
        isDryRun: true
      })

      expect(results.length).toBe(1)
      expect(path.basename(results[0].newPath)).toBe('A___B')

      // Since it's a dry run, the folders should still exist named A and B
      const rootFolders = await fs.readdir(tmpDir)
      expect(rootFolders).toContain('A')
      expect(rootFolders).toContain('B')
      expect(rootFolders).not.toContain('A___B')
    })
  })
})
