import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { folderMetadataTask } from '../folderMetadata'
import { getFolderStats, collectAllDirectoryPaths } from '../utils/folderUtils'
import { taskManager } from '../TaskManager'

/**
 * Test suite for the Folder Metadata Service.
 * Verifies calculation of directory stats, collection of directories, and naming logic.
 */
describe('Folder Metadata Service', () => {
  let temporaryRootPath: string
  let directoriesToCleanUp: string[] = []

  beforeEach(async () => {
    // Create a unique temporary root directory for each individual test
    temporaryRootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-metadata-test-'))
    directoriesToCleanUp = [temporaryRootPath]
  })

  afterEach(async () => {
    // Clean up all temporary files and directories after the test finishes
    for (const directoryPath of directoriesToCleanUp) {
      await fs.rm(directoryPath, { recursive: true, force: true })
    }
  })

  describe('getFolderStats', () => {
    test('calculates folder size and element count correctly across nested structures', async () => {
      // Setup: Create a file and a subfolder containing another file
      await fs.writeFile(path.join(temporaryRootPath, 'file1.txt'), 'Hello') // 5 bytes
      const subFolderPath = path.join(temporaryRootPath, 'sub')
      await fs.mkdir(subFolderPath)
      await fs.writeFile(path.join(subFolderPath, 'file2.txt'), 'World!') // 6 bytes

      const statistics = await getFolderStats(temporaryRootPath)

      // Total size: 5 (file1.txt) + 6 (file2.txt) = 11 bytes
      expect(statistics.sizeInBytes).toBe(11)

      // Total elements: 'file1.txt', 'sub', 'file2.txt' (inside sub) -> 3 elements
      expect(statistics.totalElementCount).toBe(3)
    })
  })

  describe('collectAllDirectoryPaths', () => {
    test('successfully lists all directory paths recursively, including the root', async () => {
      // Setup: Create several nested and sibling folders
      const subFolder1 = path.join(temporaryRootPath, 'sub1')
      const subFolder2 = path.join(temporaryRootPath, 'sub2')
      const nestedSubFolder1 = path.join(subFolder1, 'nested')

      await fs.mkdir(subFolder1)
      await fs.mkdir(subFolder2)
      await fs.mkdir(nestedSubFolder1)

      const collectedPaths = await collectAllDirectoryPaths(temporaryRootPath)

      // Total folders: root, sub1, sub2, nestedSubFolder1 -> 4 total
      expect(collectedPaths).toHaveLength(4)
      expect(collectedPaths).toContain(temporaryRootPath)
      expect(collectedPaths).toContain(subFolder1)
      expect(collectedPaths).toContain(subFolder2)
      expect(collectedPaths).toContain(nestedSubFolder1)
    })
  })

  describe('folderMetadataTask', () => {
    const DUMMY_TASK_ID = 'test-metadata-task'

    beforeEach(() => {
      // Mock the TaskManager state for the duration of the test
      taskManager['tasks'].set(DUMMY_TASK_ID, {
        id: DUMMY_TASK_ID,
        type: 'folder-metadata',
        status: 'pending',
        progress: { current: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
    })

    test('performs a dry-run and calculates the projected names without renaming', async () => {
      // Setup: Create a folder with 1MB of data
      const subFolderPath = path.join(temporaryRootPath, 'sub')
      await fs.mkdir(subFolderPath)
      await fs.writeFile(path.join(subFolderPath, 'test.txt'), 'A'.repeat(1024 * 1024)) // Exactly 1MB

      const taskResults = await folderMetadataTask(DUMMY_TASK_ID, {
        rootPath: temporaryRootPath,
        includeSize: true,
        includeElements: true,
        isDryRun: true
      })

      // Results for: root and sub
      expect(taskResults).toHaveLength(2)

      const subResult = taskResults.find((result) => result.originalName === 'sub')
      expect(subResult).toBeDefined()
      // Projected name should append the size and element count
      expect(subResult?.newName).toBe('sub_1MB_1')
      expect(subResult?.newPath).toBe(path.join(temporaryRootPath, 'sub_1MB_1'))

      // Ensure that in a dry-run, the folder was NOT actually renamed on disk
      const folderStat = await fs.stat(subFolderPath)
      expect(folderStat.isDirectory()).toBe(true)
    })

    test('renames folders correctly when isDryRun is false', async () => {
      // Setup: Create a subfolder to rename
      const subFolderPath = path.join(temporaryRootPath, 'sub')
      await fs.mkdir(subFolderPath)

      const taskResults = await folderMetadataTask(DUMMY_TASK_ID, {
        rootPath: temporaryRootPath,
        includeSize: false,
        includeElements: true,
        isDryRun: false
      })

      // Renaming a root folder changes child paths, so track the new root path for assertions
      const rootFolderResult = taskResults.find(
        (result) => result.originalPath === temporaryRootPath
      )
      const newRootPath = rootFolderResult ? rootFolderResult.newPath : temporaryRootPath

      if (rootFolderResult) {
        directoriesToCleanUp.push(newRootPath)
      }

      // Assert that the subfolder was renamed to include its count (0 elements)
      const renamedSubFolderPath = path.join(newRootPath, 'sub_0')
      const renamedFolderStat = await fs.stat(renamedSubFolderPath)
      expect(renamedFolderStat.isDirectory()).toBe(true)
    })
  })
})
