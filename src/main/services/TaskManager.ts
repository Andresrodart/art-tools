import { EventEmitter } from 'events'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'error' | 'dry-run'

export interface TaskProgress {
  current: number
  total: number
  message?: string
}

export interface Task {
  id: string
  type: string
  status: TaskStatus
  progress: TaskProgress
  result?: unknown
  error?: string
  createdAt: number
  updatedAt: number
}

class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map()

  constructor() {
    super()
  }

  createTask(type: string): Task {
    const id = Math.random().toString(36).substring(2, 9)
    const task: Task = {
      id,
      type,
      status: 'pending',
      progress: { current: 0, total: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    this.tasks.set(id, task)
    this.emit('task-updated', task)
    return task
  }

  updateTaskStatus(id: string, status: TaskStatus, error?: string): void {
    const task = this.tasks.get(id)
    if (task) {
      task.status = status
      task.error = error
      task.updatedAt = Date.now()
      this.emit('task-updated', task)
    }
  }

  updateTaskProgress(id: string, progress: Partial<TaskProgress>): void {
    const task = this.tasks.get(id)
    if (task) {
      task.progress = { ...task.progress, ...progress }
      task.updatedAt = Date.now()
      this.emit('task-updated', task)
    }
  }

  completeTask(id: string, result?: unknown): void {
    const task = this.tasks.get(id)
    if (task) {
      task.status = 'completed'
      task.result = result
      task.updatedAt = Date.now()
      this.emit('task-updated', task)
    }
  }

  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === 'running' || task.status === 'pending' || task.status === 'dry-run'
    )
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id)
  }

  cancelTask(id: string): void {
    const task = this.tasks.get(id)
    if (
      task &&
      (task.status === 'running' || task.status === 'pending' || task.status === 'dry-run')
    ) {
      task.status = 'error'
      task.error = 'Task cancelled by user'
      task.updatedAt = Date.now()
      this.emit('task-updated', task)
    }
  }
}

// Export singleton instance
export const taskManager = new TaskManager()
