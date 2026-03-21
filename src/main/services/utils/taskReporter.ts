import { taskManager, TaskStatus, TaskProgress } from '../TaskManager'

export class TaskReporter {
  private lastProgressTime = 0
  private readonly PROGRESS_THROTTLE_MS = 150

  constructor(private readonly taskId: string) {}

  setStatus(status: TaskStatus, error?: string): void {
    taskManager.updateTaskStatus(this.taskId, status, error)
  }

  updateProgress(progress: Partial<TaskProgress>): void {
    taskManager.updateTaskProgress(this.taskId, progress)
  }

  /**
   * Updates progress with throttling to avoid IPC bottlenecks.
   */
  updateProgressThrottled(progress: Partial<TaskProgress>): void {
    const now = Date.now()
    if (now - this.lastProgressTime > this.PROGRESS_THROTTLE_MS) {
      this.lastProgressTime = now
      this.updateProgress(progress)
    }
  }

  complete(result?: unknown): void {
    taskManager.completeTask(this.taskId, result)
  }

  error(message: string): void {
    taskManager.updateTaskStatus(this.taskId, 'error', message)
  }

  /**
   * Checks if the task has been cancelled (marked as 'error' in TaskManager).
   * Throws an Error if cancelled.
   */
  checkCancellation(): void {
    const task = taskManager.getAllTasks().find((t) => t.id === this.taskId)
    if (task?.status === 'error') {
      throw new Error('Task cancelled by user')
    }
  }

  /**
   * Yields control to the event loop and checks for cancellation.
   */
  async yieldAndCheck(): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve))
    this.checkCancellation()
  }
}
