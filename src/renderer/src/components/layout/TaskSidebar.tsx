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

export function TaskSidebar() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchActiveTasks = async () => {
    try {
      // @ts-ignore
      const activeTasks = await window.api.getActiveTasks()
      setTasks(activeTasks)
    } catch (err) {
      console.error('Failed to fetch tasks', err)
    }
  }

  useEffect(() => {
    fetchActiveTasks()

    // @ts-ignore
    const handleTaskProgress = (_event, updatedTask: Task) => {
      setTasks((prevTasks) => {
        const existingInd = prevTasks.findIndex(t => t.id === updatedTask.id)
        if (existingInd >= 0) {
          const newTasks = [...prevTasks]
          newTasks[existingInd] = updatedTask
          return newTasks
        } else {
          return [updatedTask, ...prevTasks]
        }
      })
    }

    // @ts-ignore
    window.api.onTaskProgress(handleTaskProgress)

    return () => {
      // @ts-ignore
      window.api.removeTaskProgress()
    }
  }, [])

  const handleCancel = async (taskId: string) => {
    try {
      // @ts-ignore
      await window.api.cancelTask(taskId)
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: 'Cancelled by user' } : t))
    } catch (err) {
      console.error('Failed to cancel task', err)
    }
  }

  const activeCount = tasks.filter(t => t.status === 'running' || t.status === 'pending').length

  return (
    <>
      <div className="task-sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close Tasks' : `Tasks (${activeCount})`}
      </div>
      
      <div className={`task-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="task-sidebar-header">
          <h3>Background Tasks</h3>
          <button className="brutalist-button" onClick={() => setIsOpen(false)}>X</button>
        </div>
        <div className="task-list">
          {tasks.length === 0 && <p className="empty-state">No active tasks</p>}
          
          {tasks.map(task => {
            const pct = task.progress.total > 0 
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
                      <span>{pct}% ({task.progress.current} / {task.progress.total})</span>
                      <span className="task-msg">{task.progress.message}</span>
                    </div>
                    <button className="brutalist-button danger small" onClick={() => handleCancel(task.id)}>
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
                  <div className="task-stats success-text">
                    Completed successfully.
                  </div>
                )}

                {task.status === 'error' && (
                  <div className="task-stats danger-text">
                    Failed: {task.error}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
