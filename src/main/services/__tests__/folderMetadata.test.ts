import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { folderMetadataTask } from '../folderMetadata'
import { getFolderStats, collectDirectories } from '../utils/folderUtils'
import { taskManager } from '../TaskManager'

describe('Folder Metadata Service', () => {
  let tmpDir: string

  let rootPathsToClean: string[] = []

  beforeEach(async () => {
    // Create a temporary sandbox directory for each test
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-metadata-test-'))
    rootPathsToClean = [tmpDir]
  })

  afterEach(async () => {
    // Clean up temporary directories
    for (const dir of rootPathsToClean) {
      await fs.rm(dir, { recursive: true, force: true })
    }
  })

  describe('getFolderStats', () => {
    it('should calculate size and element count correctly', async () => {
      // Setup: 1 file, 1 subfolder with 1 file
      await fs.writeFile(path.join(tmpDir, 'file1.txt'), 'Hello') // 5 bytes
      const subFolder = path.join(tmpDir, 'sub')
      await fs.mkdir(subFolder)
      await fs.writeFile(path.join(subFolder, 'file2.txt'), 'World!') // 6 bytes

      const stats = await getFolderStats(tmpDir)

      // Total size: 5 + 6 = 11 bytes
      expect(stats.sizeBytes).toBe(11)

      // Total elements: file1.txt, sub (direct), and file2.txt (inside sub) -> 3 elements
      expect(stats.elementCount).toBe(3)
    })
  })

  describe('collectDirectories', () => {
    it('should list all directories recursively including root', async () => {
      const sub1 = path.join(tmpDir, 'sub1')
      const sub2 = path.join(tmpDir, 'sub2')
      const sub1_nested = path.join(sub1, 'nested')

      await fs.mkdir(sub1)
      await fs.mkdir(sub2)
      await fs.mkdir(sub1_nested)

      const dirs = await collectDirectories(tmpDir)
      expect(dirs).toHaveLength(4)
      expect(dirs).toContain(tmpDir)
      expect(dirs).toContain(sub1)
      expect(dirs).toContain(sub2)
      expect(dirs).toContain(sub1_nested)
    })
  })

  describe('folderMetadataTask', () => {
    const DUMMY_TASK_ID = 'test-task-123'

    beforeEach(() => {
      // Create a dummy task in the manager so updates don't throw warnings
      taskManager['tasks'].set(DUMMY_TASK_ID, {
        id: DUMMY_TASK_ID,
        type: 'folder-metadata',
        status: 'pending',
        progress: { current: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    })

    it('should perform a dry run and project paths correctly', async () => {
      const subFolder = path.join(tmpDir, 'sub')
      await fs.mkdir(subFolder)
      await fs.writeFile(path.join(subFolder, 'test.txt'), 'A'.repeat(1024 * 1024)) // 1MB

      const results = await folderMetadataTask(DUMMY_TASK_ID, {
        rootPath: tmpDir,
        includeSize: true,
        includeElements: true,
        isDryRun: true
      })

      // 2 directories: root, and sub
      expect(results).toHaveLength(2)

      const subResult = results.find((r) => r.originalName === 'sub')
      expect(subResult).toBeDefined()
      expect(subResult?.newName).toBe('sub_1MB_1')
      expect(subResult?.newPath).toBe(path.join(tmpDir, 'sub_1MB_1'))

      // Ensure that in a dry run, the folder was NOT actually renamed
      const stat = await fs.stat(subFolder)
      expect(stat.isDirectory()).toBe(true)
    })

    it('should actually rename folders when not a dry run', async () => {
      const subFolder = path.join(tmpDir, 'sub')
      await fs.mkdir(subFolder)

      const results = await folderMetadataTask(DUMMY_TASK_ID, {
        rootPath: tmpDir,
        includeSize: false,
        includeElements: true,
        isDryRun: false
      })

      // The root directory also gets renamed, so we need to track its new name for cleanup
      const rootResult = results.find((r) => r.originalPath === tmpDir)
      const newRootPath = rootResult ? rootResult.newPath : tmpDir
      if (rootResult) {
        rootPathsToClean.push(newRootPath)
      }

      // Should be renamed to sub_1 since it contains 0 elements but it is an element itself of root?
      // Wait, let's re-check getFolderStats. elementCount is entries.length + recursive.
      // subFolder is empty, so entries.length is 0. elementCount is 0.
      const renamedSubPath = path.join(newRootPath, 'sub_0')
      const stat = await fs.stat(renamedSubPath)
      expect(stat.isDirectory()).toBe(true)
    })
  })
})
