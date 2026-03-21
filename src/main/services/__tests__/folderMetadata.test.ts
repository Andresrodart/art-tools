import { promises as fs } from 'fs'
import * as path from 'path'
import { folderMetadataTask, FolderMetadataOptions } from '../folderMetadata'
import { getFolderStats, collectAllDirectoryPaths } from '../utils/folderUtils'
import { TestSandbox, setupDummyTask } from './testHelpers.fixture'

/**
 * Test suite for the Folder Metadata Service.
 * Verifies calculation of directory stats, collection of directories, and naming logic.
 */
describe('Folder Metadata Service', () => {
  const sandbox = new TestSandbox()

  beforeEach(async () => {
    // Initialize a unique temporary sandbox root for each test case
    await sandbox.setup('metadata-test-')
  })

  afterEach(async () => {
    // Clean up all temporary files and directories after the test finishes
    await sandbox.teardown()
  })

  describe('getFolderStats', () => {
    test('calculates folder size and element count correctly across nested structures', async () => {
      // Setup: Create a file and a subfolder containing another file
      await sandbox.createFile('file1.txt', 'Hello') // 5 bytes
      await sandbox.createDirectory('sub')
      await sandbox.createFile('sub/file2.txt', 'World!') // 6 bytes

      const statistics = await getFolderStats(sandbox.rootPath)

      // Total size: 5 (file1.txt) + 6 (file2.txt) = 11 bytes
      expect(statistics.sizeInBytes).toBe(11)

      // Total elements: 'file1.txt', 'sub', 'file2.txt' (inside sub) -> 3 elements
      expect(statistics.totalElementCount).toBe(3)
    })
  })

  describe('collectAllDirectoryPaths', () => {
    test('successfully lists all directory paths recursively, including the root', async () => {
      // Setup: Create several nested and sibling folders
      const subFolder1 = await sandbox.createDirectory('sub1')
      const subFolder2 = await sandbox.createDirectory('sub2')
      const nestedSubFolder1 = await sandbox.createDirectory('sub1/nested')

      const collectedPaths = await collectAllDirectoryPaths(sandbox.rootPath)

      // Total folders: root, sub1, sub2, nestedSubFolder1 -> 4 total
      expect(collectedPaths).toHaveLength(4)
      expect(collectedPaths).toContain(sandbox.rootPath)
      expect(collectedPaths).toContain(subFolder1)
      expect(collectedPaths).toContain(subFolder2)
      expect(collectedPaths).toContain(nestedSubFolder1)
    })
  })

  describe('folderMetadataTask', () => {
    const DUMMY_TASK_ID = 'test-metadata-task'

    beforeEach(() => {
      // Initialize the TaskManager state with a dummy task for testing
      setupDummyTask(DUMMY_TASK_ID, 'folder-metadata')
    })

    test('performs a dry-run and calculates the projected names without renaming', async () => {
      // Setup: Create a folder with 1MB of data
      await sandbox.createDirectory('sub')
      await sandbox.createFile('sub/test.txt', 'A'.repeat(1024 * 1024)) // Exactly 1MB

      const metadataOptions: FolderMetadataOptions = {
        rootPath: sandbox.rootPath,
        includeSize: true,
        includeElements: true,
        isDryRun: true
      }

      const taskResults = await folderMetadataTask(DUMMY_TASK_ID, metadataOptions)

      // Results for: root and sub
      expect(taskResults).toHaveLength(2)

      const subResult = taskResults.find((result) => result.originalName === 'sub')
      expect(subResult).toBeDefined()
      // Projected name should append the size and element count
      expect(subResult?.newName).toBe('sub_1MB_1')
      expect(subResult?.newPath).toBe(sandbox.getAbsolutePath('sub_1MB_1'))

      // Ensure that in a dry-run, the folder was NOT actually renamed on disk
      expect(await sandbox.exists('sub')).toBe(true)
    })

    test('renames folders correctly when isDryRun is false', async () => {
      // Setup: Create a subfolder to rename
      await sandbox.createDirectory('sub')

      const metadataOptions: FolderMetadataOptions = {
        rootPath: sandbox.rootPath,
        includeSize: false,
        includeElements: true,
        isDryRun: false
      }

      const taskResults = await folderMetadataTask(DUMMY_TASK_ID, metadataOptions)

      // When the root folder is also renamed, the paths in the task results are built
      // relative to the old parent path.

      // Let's find the result for the root folder
      const rootResult = taskResults.find((result) => result.originalPath === sandbox.rootPath)
      expect(rootResult).toBeDefined()
      expect(rootResult?.success).toBe(true)
      const newRootPath = rootResult!.newPath
      sandbox.trackPathForCleanup(newRootPath)

      // The subfolder was renamed first. Its name is "sub_0".
      // Since the parent (root) was also renamed, its final physical path is <newRootPath>/sub_0.
      const finalSubFolderPath = path.join(newRootPath, 'sub_0')

      // Check the filesystem directly
      const resultStat = await fs.stat(finalSubFolderPath)
      expect(resultStat.isDirectory()).toBe(true)
    })
  })
})
