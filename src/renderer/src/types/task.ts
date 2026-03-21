/**
 * Represents the progress of a background task.
 */
export interface TaskProgress {
  /** The current item being processed. */
  current: number
  /** Total number of items to process. */
  total: number
  /** Optional message describing the current step. */
  message?: string
}

/**
 * Represents a background task executed from the renderer.
 */
export interface Task {
  /** Unique identifier for the task instance. */
  id: string
  /** The type of task being executed (e.g., 'organize-files'). */
  type: string
  /** Current status of the task. */
  status: 'pending' | 'running' | 'completed' | 'error' | 'dry-run'
  /** Progress information for the task. */
  progress: TaskProgress
  /** Optional result data returned by the task upon completion. */
  result?: unknown
  /** Error message if the task failed. */
  error?: string
  /** Timestamp when the task was created. */
  createdAt: number
  /** Timestamp when the task was last updated. */
  updatedAt: number
}

/**
 * Represents a tab in the application's navigation system.
 */
export interface TaskTab {
  /** Unique ID for the tab (e.g., 'home', taskId, or setup-toolId). */
  id: string
  /** Display title for the tab. */
  title: string
  /** Type of tab, either 'home' for the gallery or 'task' for tool screens. */
  type: 'home' | 'task'
}
