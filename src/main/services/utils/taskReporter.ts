import { taskManager, TaskStatus, TaskProgress } from '../TaskManager'

/**
 * The TaskReporter class provides a standardized interface for updating the progress,
 * status, and completion of a background task. It also handles task cancellation checks
 * and progress update throttling to prevent performance bottlenecks.
 */
export class TaskReporter {
  /** The timestamp of the last time progress was updated, used for throttling. */
  private lastProgressUpdateTime: number = 0
  /** The minimum interval in milliseconds between progress updates. */
  private readonly PROGRESS_UPDATE_THROTTLE_INTERVAL_MS: number = 150

  /**
   * Creates an instance of TaskReporter.
   * @param taskId The unique identifier for the task being reported.
   */
  constructor(private readonly taskId: string) {}

  /**
   * Updates the overall status of the task (e.g., 'running', 'dry-run', 'error').
   * @param status The new status of the task.
   * @param errorMessage Optional error message if the status is 'error'.
   */
  setStatus(status: TaskStatus, errorMessage?: string): void {
    taskManager.updateTaskStatus(this.taskId, status, errorMessage)
  }

  /**
   * Directly updates the task progress metadata.
   * @param progress Partial task progress object containing current, total, and/or message.
   */
  updateProgress(progress: Partial<TaskProgress>): void {
    taskManager.updateTaskProgress(this.taskId, progress)
  }

  /**
   * Updates task progress with throttling. If called more frequently than the throttle interval,
   * it will skip updates to avoid saturating the IPC (Inter-Process Communication) bridge.
   * @param progress Partial task progress object containing current, total, and/or message.
   */
  updateProgressThrottled(progress: Partial<TaskProgress>): void {
    const currentTimeMillis = Date.now()
    if (
      currentTimeMillis - this.lastProgressUpdateTime >
      this.PROGRESS_UPDATE_THROTTLE_INTERVAL_MS
    ) {
      this.lastProgressUpdateTime = currentTimeMillis
      this.updateProgress(progress)
    }
  }

  /**
   * Marks the task as completed and optionally stores the result.
   * @param finalResult The output data produced by the task.
   */
  complete(finalResult?: unknown): void {
    taskManager.completeTask(this.taskId, finalResult)
  }

  /**
   * Marks the task as failed with a specific error message.
   * @param errorMessage Descriptive text explaining the failure.
   */
  error(errorMessage: string): void {
    taskManager.updateTaskStatus(this.taskId, 'error', errorMessage)
  }

  /**
   * Checks if the task has been marked as 'error' (cancelled) in the TaskManager.
   * If the task is cancelled, it throws an error to stop execution in the caller.
   * @throws Error "Task cancelled by user" if the task status is 'error'.
   */
  checkCancellation(): void {
    const taskDetails = taskManager.getTask(this.taskId)
    if (taskDetails?.status === 'error') {
      throw new Error('Task cancelled by user')
    }
  }

  /**
   * Yields control back to the Node.js event loop and checks for task cancellation.
   * This is essential for keeping the application responsive during heavy I/O tasks.
   */
  async yieldAndCheckCancellation(): Promise<void> {
    await new Promise((resolve) => setImmediate(resolve))
    this.checkCancellation()
  }
}
