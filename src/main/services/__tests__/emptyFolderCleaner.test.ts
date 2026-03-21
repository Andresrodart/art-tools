import { join } from 'path'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { findEmptyFoldersTask, deleteFoldersTask } from '../emptyFolderCleaner'
import { taskManager } from '../TaskManager'

describe('Empty Folder Cleaner Service', () => {
  let testRoot: string

  beforeEach(async () => {
    testRoot = join(tmpdir(), `empty-folder-test-${Math.random().toString(36).substring(7)}`)
    await fs.mkdir(testRoot, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(testRoot, { recursive: true, force: true })
  })

  describe('findEmptyFoldersTask', () => {
    it('should find empty folders and folders with only empty subfolders', async () => {
      // Setup structure:
      // testRoot/
      //   empty1/
      //   notEmpty/
      //     file1.txt
      //   recursiveEmpty/
      //     empty2/
      //   mixed/
      //     empty3/
      //     file2.txt

      const empty1 = join(testRoot, 'empty1')
      const notEmpty = join(testRoot, 'notEmpty')
      const recursiveEmpty = join(testRoot, 'recursiveEmpty')
      const empty2 = join(recursiveEmpty, 'empty2')
      const mixed = join(testRoot, 'mixed')
      const empty3 = join(mixed, 'empty3')

      await fs.mkdir(empty1)
      await fs.mkdir(notEmpty)
      await fs.writeFile(join(notEmpty, 'file1.txt'), 'hello')
      await fs.mkdir(recursiveEmpty)
      await fs.mkdir(empty2)
      await fs.mkdir(mixed)
      await fs.mkdir(empty3)
      await fs.writeFile(join(mixed, 'file2.txt'), 'world')

      const task = taskManager.createTask('findEmptyFolders')
      const results = await findEmptyFoldersTask(task.id, { rootPath: testRoot })

      expect(results).toContain(empty1)
      expect(results).toContain(empty2)
      expect(results).toContain(recursiveEmpty)
      expect(results).toContain(empty3)
      expect(results).not.toContain(notEmpty)
      expect(results).not.toContain(mixed)
      expect(results).not.toContain(testRoot) // Root itself is excluded in the task logic
      expect(results.length).toBe(4)
    })
  })

  describe('deleteFoldersTask', () => {
    it('should delete folders in dry run mode without affecting filesystem', async () => {
      const empty1 = join(testRoot, 'empty1')
      await fs.mkdir(empty1)

      const task = taskManager.createTask('deleteFolders')
      const results = await deleteFoldersTask(task.id, {
        foldersToDelete: [empty1],
        isDryRun: true
      })

      expect(results[0].success).toBe(true)
      expect(
        await fs
          .access(empty1)
          .then(() => true)
          .catch(() => false)
      ).toBe(true)
    })

    it('should delete folders for real when dry run is false', async () => {
      const empty1 = join(testRoot, 'empty1')
      await fs.mkdir(empty1)

      const task = taskManager.createTask('deleteFolders')
      const results = await deleteFoldersTask(task.id, {
        foldersToDelete: [empty1],
        isDryRun: false
      })

      expect(results[0].success).toBe(true)
      expect(
        await fs
          .access(empty1)
          .then(() => true)
          .catch(() => false)
      ).toBe(false)
    })

    it('should handle recursive deletion of selected folders from deep to shallow', async () => {
      const parent = join(testRoot, 'parent')
      const child = join(parent, 'child')
      await fs.mkdir(parent)
      await fs.mkdir(child)

      const task = taskManager.createTask('deleteFolders')
      // Even if passed in wrong order, task should sort them
      const results = await deleteFoldersTask(task.id, {
        foldersToDelete: [parent, child],
        isDryRun: false
      })

      expect(results.every((r) => r.success)).toBe(true)
      expect(
        await fs
          .access(parent)
          .then(() => true)
          .catch(() => false)
      ).toBe(false)
    })
  })
})
