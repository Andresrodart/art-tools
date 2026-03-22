import { TaskManager } from '../TaskManager'

describe('TaskManager', (): void => {
  let taskManager: TaskManager

  beforeEach((): void => {
    taskManager = new TaskManager()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z').getTime())
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789)
  })

  afterEach((): void => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('createTask', (): void => {
    it('should create a task with correct initial properties', (): void => {
      const taskType = 'test-task'
      const task = taskManager.createTask(taskType)

      // Expected ID logic: Math.random().toString(36).substring(2, 9)
      // 0.123456789.toString(36) -> "0.4fzzzxj..."
      // substring(2, 9) -> "4fzzzxj"
      const expectedId = '4fzzzxj'
      const expectedTimestamp = new Date('2024-01-01T12:00:00.000Z').getTime()

      expect(task).toEqual({
        id: expectedId,
        type: taskType,
        status: 'pending',
        progress: { current: 0, total: 0 },
        createdAt: expectedTimestamp,
        updatedAt: expectedTimestamp
      })
    })

    it('should store the created task internally', (): void => {
      const taskType = 'test-task'
      const task = taskManager.createTask(taskType)

      const storedTask = taskManager.getTask(task.id)
      expect(storedTask).toBe(task)
    })

    it('should emit a "task-updated" event when a task is created', (): void => {
      const taskType = 'test-task'
      const emitSpy = jest.spyOn(taskManager, 'emit')

      const task = taskManager.createTask(taskType)

      expect(emitSpy).toHaveBeenCalledTimes(1)
      expect(emitSpy).toHaveBeenCalledWith('task-updated', task)
    })

    it('should handle creating a task with an empty string type', (): void => {
      const task = taskManager.createTask('')
      expect(task.type).toBe('')
      expect(task.status).toBe('pending')
    })
  })
})
