import { taskManager } from '../../TaskManager'
import { TaskReporter } from '../../utils/taskReporter'

// Mock the TaskManager to isolate the TaskReporter behavior
jest.mock('../../TaskManager', () => ({
  taskManager: {
    updateTaskStatus: jest.fn(),
    updateTaskProgress: jest.fn(),
    completeTask: jest.fn(),
    getAllTasks: jest.fn()
  }
}))

/**
 * Test suite for the TaskReporter class.
 * Ensures it correctly calls TaskManager and handles cancellation logic.
 */
describe('TaskReporter', () => {
  const taskId = 'test-task'
  let reporterInstance: TaskReporter

  beforeEach(() => {
    // Clear all mock call history before each test
    jest.clearAllMocks()
    reporterInstance = new TaskReporter(taskId)
  })

  test('setStatus updates task status correctly', () => {
    reporterInstance.setStatus('running')
    expect(taskManager.updateTaskStatus).toHaveBeenCalledWith(taskId, 'running', undefined)
  })

  test('updateProgress updates task progress correctly', () => {
    const progressData = { current: 10, total: 100 }
    reporterInstance.updateProgress(progressData)
    expect(taskManager.updateTaskProgress).toHaveBeenCalledWith(taskId, progressData)
  })

  test('complete marks the task as finished with a result', () => {
    const resultData = { success: true }
    reporterInstance.complete(resultData)
    expect(taskManager.completeTask).toHaveBeenCalledWith(taskId, resultData)
  })

  test('checkCancellation throws an error if task status is "error"', () => {
    // Mock the TaskManager to return a cancelled task status
    ;(taskManager.getAllTasks as jest.Mock).mockReturnValue([{ id: taskId, status: 'error' }])

    expect(() => reporterInstance.checkCancellation()).toThrow('Task cancelled by user')
  })

  test('checkCancellation does not throw if task status is not "error"', () => {
    // Mock the TaskManager to return a running task status
    ;(taskManager.getAllTasks as jest.Mock).mockReturnValue([{ id: taskId, status: 'running' }])

    expect(() => reporterInstance.checkCancellation()).not.toThrow()
  })
})
