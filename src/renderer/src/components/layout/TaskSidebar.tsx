import { useState, useEffect } from 'react'

export interface TaskProgress {
  current: number
  total: number
  message?: string
}

export interface Task {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'dry-run'
  progress: TaskProgress
  result?: any
  error?: string
  createdAt: number
  updatedAt: number
}

export function TaskSidebar(): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (window.api?.getActiveTasks) {
      window.api
        .getActiveTasks()
        .then((activeTasks: unknown) => setTasks((activeTasks as Task[]) || []))
        .catch((err: unknown) => console.error('Failed to fetch tasks', err))
    }

    const handleTaskProgress = (_event: Electron.IpcRendererEvent, updatedTask: unknown) => {
      const task = updatedTask as Task
      setTasks((prevTasks) => {
        const existingInd = prevTasks.findIndex((t) => t.id === task.id)
        if (existingInd >= 0) {
          const newTasks = [...prevTasks]
          newTasks[existingInd] = task
          return newTasks
        } else {
          return [task, ...prevTasks]
        }
      })
    }

    if (window.api?.onTaskProgress) {
      window.api.onTaskProgress(handleTaskProgress)
    }

    return () => {
      if (window.api?.removeTaskProgress) {
        window.api.removeTaskProgress()
      }
    }
  }, [])

  const handleCancel = async (taskId: string) => {
    try {
      if (window.api?.cancelTask) {
        await window.api.cancelTask(taskId)
      }
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: 'error', error: 'Cancelled by user' } : t
        )
      )
    } catch (err) {
      console.error('Failed to cancel task', err)
    }
  }

  const activeCount = tasks.filter((t) => t.status === 'running' || t.status === 'pending').length

  return (
    <>
      <div className="task-sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close Tasks' : `Tasks (${activeCount})`}
      </div>

      <div className={`task-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="task-sidebar-header">
          <h3>Background Tasks</h3>
          <button className="brutalist-button" onClick={() => setIsOpen(false)}>
            X
          </button>
        </div>
        <div className="task-list">
          {tasks.length === 0 && <p className="empty-state">No active tasks</p>}

          {tasks.map((task) => {
            const pct =
              task.progress.total > 0
                ? Math.floor((task.progress.current / task.progress.total) * 100)
                : 0

            return (
              <div key={task.id} className={`task-item status-${task.status}`}>
                <div className="task-info">
                  <strong>{task.type}</strong> <span className="task-id">#{task.id}</span>
                </div>

                {task.status === 'running' && (
                  <>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="task-stats">
                      <span>
                        {pct}% ({task.progress.current} / {task.progress.total})
                      </span>
                      <span className="task-msg">{task.progress.message}</span>
                    </div>
                    <button
                      className="brutalist-button danger small"
                      onClick={() => handleCancel(task.id)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {task.status === 'dry-run' && (
                  <div className="task-stats">
                    <span className="warning-text">Dry Run Completed. Pending UI review.</span>
                  </div>
                )}

                {task.status === 'completed' && (
                  <div className="task-stats success-text">Completed successfully.</div>
                )}

                {task.status === 'error' && (
                  <div className="task-stats danger-text">Failed: {task.error}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
