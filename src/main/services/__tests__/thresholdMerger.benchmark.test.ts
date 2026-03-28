import { thresholdMergerTask } from '../thresholdMerger'
import { TestSandbox, setupDummyTask } from './testHelpers.fixture'
import { performance } from 'perf_hooks'

describe('Threshold Merger Performance Benchmark', () => {
  const sandbox = new TestSandbox()

  beforeEach(async () => {
    await sandbox.setup('threshold-merger-perf-')
  })

  afterEach(async () => {
    await sandbox.teardown()
  })

  test('benchmark merge operation with many files', async () => {
    const numFolders = 20
    const filesPerFolder = 50

    // Create many files
    const createPromises: Promise<string>[] = []
    for (let i = 0; i < numFolders; i++) {
      const folderName = `folder_${i}`
      for (let j = 0; j < filesPerFolder; j++) {
        createPromises.push(sandbox.createFile(`${folderName}/file_${j}.txt`, 'some content'))
      }
    }
    await Promise.all(createPromises)

    const taskId = 'perf-test'
    setupDummyTask(taskId, 'threshold-merger')

    const iterations = 5
    let totalTime = 0

    for (let k = 0; k < iterations; k++) {
      // We need to recreate the files for each iteration if we want to be accurate,
      // but since the task deletes them, we must.
      // Re-creating them...
      if (k > 0) {
        const recreatePromises: Promise<string>[] = []
        for (let i = 0; i < numFolders; i++) {
          const folderName = `folder_${i}`
          for (let j = 0; j < filesPerFolder; j++) {
            recreatePromises.push(sandbox.createFile(`${folderName}/file_${j}.txt`, 'some content'))
          }
        }
        await Promise.all(recreatePromises)
      }

      const start = performance.now()
      await thresholdMergerTask(taskId, {
        rootPath: sandbox.rootPath,
        thresholdX: filesPerFolder + 1,
        maxCapacityY: (filesPerFolder + 1) * numFolders,
        isDryRun: false
      })
      const end = performance.now()
      totalTime += end - start
      console.log(`Iteration ${k + 1} took ${end - start}ms`)
    }

    console.log(`Average merge time: ${totalTime / iterations}ms`)
  }, 30000) // Increase timeout for benchmark
})
