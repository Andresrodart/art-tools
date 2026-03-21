import { fileScraperTask, FileScraperOptions } from '../fileScraper'
import { taskManager } from '../TaskManager'
import { promises as fs } from 'fs'
import { TestSandbox } from './testHelpers.fixture'

/**
 * Test suite for the fileScraperTask service.
 * Verifies finding nested files, moving them to a flat folder, and handling collisions.
 */
describe('fileScraperTask', () => {
  const sandbox = new TestSandbox()

  beforeEach(async () => {
    // Initialize a new unique temporary sandbox for each test case
    await sandbox.setup('scraper-test-')
    // Create the required source and destination directory structures
    await sandbox.createDirectory('source')
  })

  afterEach(async () => {
    // Ensure all temporary files and directories are completely removed
    await sandbox.teardown()
  })

  test('successfully finds nested files and moves them to a flat destination directory', async () => {
    const sourceDirectory = sandbox.getAbsolutePath('source')
    const destinationDirectory = sandbox.getAbsolutePath('dest')

    // Setup nested source files for testing
    await sandbox.createFile('source/root.jpg', 'content')
    await sandbox.createFile('source/level1/nested1.jpg', 'content')
    await sandbox.createFile('source/level1/level2/nested2.txt', 'content')
    await sandbox.createFile('source/level1/level2/nested3.jpg', 'content')

    const taskId = 'test-scrape-flat'
    const scraperOptions: FileScraperOptions = {
      sourcePath: sourceDirectory,
      destinationPath: destinationDirectory,
      extensions: ['.jpg'],
      isDryRun: false
    }

    // Mock the TaskManager to return our custom task ID
    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const taskResults = await fileScraperTask(taskId, scraperOptions)

    // Verify correct identification: root.jpg, nested1.jpg, and nested3.jpg should be matched
    expect(taskResults).toHaveLength(3)
    expect(taskResults.every((result) => result.success)).toBe(true)

    // Verify all files were correctly moved to the flat destination directory
    const destinationFiles = await fs.readdir(destinationDirectory)
    expect(destinationFiles).toHaveLength(3)
    expect(destinationFiles).toContain('root.jpg')
    expect(destinationFiles).toContain('nested1.jpg')
    expect(destinationFiles).toContain('nested3.jpg')

    // Verify original source files were successfully removed after the move
    expect(await sandbox.exists('source/root.jpg')).toBe(false)
    expect(await sandbox.exists('source/level1/nested1.jpg')).toBe(false)

    // Verify the .txt file was skipped and remains in its original location
    expect(await sandbox.exists('source/level1/level2/nested2.txt')).toBe(true)
  })

  test('correctly handles filename collisions in the destination directory', async () => {
    const sourceDirectory = sandbox.getAbsolutePath('source')
    const destinationDirectory = sandbox.getAbsolutePath('dest')

    // Setup nested files with identical names to trigger a collision
    await sandbox.createFile('source/folderA/image.jpg', 'fileA')
    await sandbox.createFile('source/folderB/image.jpg', 'fileB')

    const taskId = 'test-scrape-collision'
    const scraperOptions: FileScraperOptions = {
      sourcePath: sourceDirectory,
      destinationPath: destinationDirectory,
      extensions: ['*'],
      isDryRun: false
    }

    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const taskResults = await fileScraperTask(taskId, scraperOptions)

    expect(taskResults).toHaveLength(2)
    expect(taskResults.every((result) => result.success)).toBe(true)

    // Verify both files were moved and assigned unique names in the destination
    const destinationFiles = await fs.readdir(destinationDirectory)
    expect(destinationFiles).toHaveLength(2)
    expect(destinationFiles).toContain('image.jpg')
    expect(destinationFiles).toContain('image_1.jpg')
  })

  test('does not modify the filesystem when isDryRun is set to true', async () => {
    const sourceDirectory = sandbox.getAbsolutePath('source')
    const destinationDirectory = sandbox.getAbsolutePath('dest')
    await sandbox.createFile('source/test.jpg', 'content')

    const taskId = 'test-scrape-dryrun'
    const scraperOptions: FileScraperOptions = {
      sourcePath: sourceDirectory,
      destinationPath: destinationDirectory,
      extensions: ['.jpg'],
      isDryRun: true
    }

    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const taskResults = await fileScraperTask(taskId, scraperOptions)

    expect(taskResults).toHaveLength(1)
    expect(taskResults[0].success).toBe(true)

    // Verify the destination directory was not created during a dry-run
    expect(await sandbox.exists('dest')).toBe(false)

    // Verify the original source file remains untouched
    expect(await sandbox.exists('source/test.jpg')).toBe(true)
  })
})
