import { taskManager } from '../../TaskManager'
import { TaskReporter } from '../../utils/taskReporter'

jest.mock('../../TaskManager', () => ({
  taskManager: {
    updateTaskStatus: jest.fn(),
    updateTaskProgress: jest.fn(),
    completeTask: jest.fn(),
    getAllTasks: jest.fn()
  }
}))

describe('TaskReporter', () => {
  const taskId = 'test-task'
  let reporter: TaskReporter

  beforeEach(() => {
    jest.clearAllMocks()
    reporter = new TaskReporter(taskId)
  })

  test('setStatus updates task status', () => {
    reporter.setStatus('running')
    expect(taskManager.updateTaskStatus).toHaveBeenCalledWith(taskId, 'running', undefined)
  })

  test('updateProgress updates task progress', () => {
    const progress = { current: 10, total: 100 }
    reporter.updateProgress(progress)
    expect(taskManager.updateTaskProgress).toHaveBeenCalledWith(taskId, progress)
  })

  test('complete completes the task', () => {
    const result = { success: true }
    reporter.complete(result)
    expect(taskManager.completeTask).toHaveBeenCalledWith(taskId, result)
  })

  test('checkCancellation throws error if task status is error', () => {
    ;(taskManager.getAllTasks as jest.Mock).mockReturnValue([{ id: taskId, status: 'error' }])
    expect(() => reporter.checkCancellation()).toThrow('Task cancelled by user')
  })

  test('checkCancellation does not throw if task status is not error', () => {
    ;(taskManager.getAllTasks as jest.Mock).mockReturnValue([{ id: taskId, status: 'running' }])
    expect(() => reporter.checkCancellation()).not.toThrow()
  })
})
