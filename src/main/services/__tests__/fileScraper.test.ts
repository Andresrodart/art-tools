import { fileScraperTask, FileScraperOptions } from '../fileScraper'
import { taskManager } from '../TaskManager'
import { promises as fs } from 'fs'
import { join } from 'path'
import * as os from 'os'

describe('fileScraperTask', () => {
  let testRoot: string
  let sourceDir: string
  let destDir: string

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testRoot = await fs.mkdtemp(join(os.tmpdir(), 'art-tools-scraper-test-'))
    sourceDir = join(testRoot, 'source')
    destDir = join(testRoot, 'dest')

    await fs.mkdir(sourceDir)
  })

  afterEach(async () => {
    // Clean up
    await fs.rm(testRoot, { recursive: true, force: true })
  })

  it('should find nested files and move them to a flat destination directory', async () => {
    // Setup nested source files
    const sub1 = join(sourceDir, 'level1')
    const sub2 = join(sub1, 'level2')
    await fs.mkdir(sub2, { recursive: true })

    await fs.writeFile(join(sourceDir, 'root.jpg'), 'content')
    await fs.writeFile(join(sub1, 'nested1.jpg'), 'content')
    await fs.writeFile(join(sub2, 'nested2.txt'), 'content')
    await fs.writeFile(join(sub2, 'nested3.jpg'), 'content')

    const taskId = 'test-scrape-1'
    const options: FileScraperOptions = {
      sourcePath: sourceDir,
      destinationPath: destDir,
      extensions: ['.jpg'],
      isDryRun: false
    }

    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const results = await fileScraperTask(taskId, options)

    expect(results).toHaveLength(3) // root.jpg, nested1.jpg, nested3.jpg
    expect(results.every((r) => r.success)).toBe(true)

    // Verify files were actually moved
    const newFiles = await fs.readdir(destDir)
    expect(newFiles).toHaveLength(3)
    expect(newFiles).toContain('root.jpg')
    expect(newFiles).toContain('nested1.jpg')
    expect(newFiles).toContain('nested3.jpg')

    // Verify source files are gone
    await expect(fs.stat(join(sourceDir, 'root.jpg'))).rejects.toThrow()
    await expect(fs.stat(join(sub1, 'nested1.jpg'))).rejects.toThrow()

    // txt file should remain
    const txtStat = await fs.stat(join(sub2, 'nested2.txt'))
    expect(txtStat.isFile()).toBe(true)
  })

  it('should handle filename collisions correctly', async () => {
    // Setup nested source files with identical names
    const sub1 = join(sourceDir, 'folderA')
    const sub2 = join(sourceDir, 'folderB')
    await fs.mkdir(sub1)
    await fs.mkdir(sub2)

    await fs.writeFile(join(sub1, 'image.jpg'), 'file1')
    await fs.writeFile(join(sub2, 'image.jpg'), 'file2')

    const taskId = 'test-scrape-collision'
    const options: FileScraperOptions = {
      sourcePath: sourceDir,
      destinationPath: destDir,
      extensions: ['*'],
      isDryRun: false
    }

    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const results = await fileScraperTask(taskId, options)

    expect(results).toHaveLength(2)
    expect(results.every((r) => r.success)).toBe(true)

    // Verify both files exist with correct names in destination
    const newFiles = await fs.readdir(destDir)
    expect(newFiles).toHaveLength(2)
    expect(newFiles).toContain('image.jpg')
    expect(newFiles).toContain('image_1.jpg')
  })

  it('should not modify files if isDryRun is true', async () => {
    await fs.writeFile(join(sourceDir, 'test.jpg'), 'content')

    const taskId = 'test-scrape-dryrun'
    const options: FileScraperOptions = {
      sourcePath: sourceDir,
      destinationPath: destDir,
      extensions: ['.jpg'],
      isDryRun: true
    }

    taskManager.createTask = jest.fn().mockReturnValue({ id: taskId })

    const results = await fileScraperTask(taskId, options)

    expect(results).toHaveLength(1)
    expect(results[0].success).toBe(true)

    // Verify destination dir wasn't even implicitly created
    await expect(fs.stat(destDir)).rejects.toThrow()

    // Verify source file still exists
    const srcStat = await fs.stat(join(sourceDir, 'test.jpg'))
    expect(srcStat.isFile()).toBe(true)
  })
})
