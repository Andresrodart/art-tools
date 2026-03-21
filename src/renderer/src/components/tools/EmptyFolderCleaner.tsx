import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'
import { Checkbox } from '../common/Checkbox'

/**
 * Representation of a task's progress state.
 */
interface TaskProgress {
  /** The current number of items processed. */
  current: number
  /** The total number of items to process. */
  total: number
  /** An optional message describing the current progress step. */
  message?: string
}

/**
 * Representation of a background task state.
 */
interface Task {
  /** The unique identifier for the task. */
  id: string
  /** The type of task (e.g., 'findEmptyFolders'). */
  type: string
  /** The current execution status. */
  status: 'pending' | 'running' | 'completed' | 'error' | 'dry-run'
  /** The progress information. */
  progress: TaskProgress
  /** The final result of the task. */
  result?: unknown
  /** The error message if the task failed. */
  error?: string
}

/**
 * Props for the EmptyFolderCleaner component.
 */
interface EmptyFolderCleanerProps {
  /** Callback to return to the previous view. */
  onBack: () => void
}

/**
 * EmptyFolderCleaner component allows users to scan for empty folders within a directory
 * and selectively delete them.
 *
 * It follows Separation of Concerns by using the main process (via IPC) to perform
 * the actual filesystem operations, while the renderer handles the UI and user interaction.
 *
 * @param props The component properties.
 */
export function EmptyFolderCleaner({ onBack }: EmptyFolderCleanerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskData, setTaskData] = useState<Task | null>(null)
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const reset = useHeaderStore((state) => state.reset)

  useEffect(() => {
    setTitle(t('tool_empty_folder_cleaner_title'))
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; Back
      </button>
    )

    return () => {
      reset()
    }
  }, [onBack, setTitle, setNavigation, reset, t])

  // Subscribe to task progress
  useEffect(() => {
    const handleProgress = (_event: Electron.IpcRendererEvent, updatedTask: unknown): void => {
      const task = updatedTask as Task
      if (taskId && task.id === taskId) {
        setTaskData(task)

        if (task.progress?.message) {
          setLogEntries((prev) => {
            const last = prev[prev.length - 1]
            if (last !== task.progress.message) {
              return [...prev, task.progress.message!]
            }
            return prev
          })
        }

        if (task.status === 'completed') {
          if (task.type === 'findEmptyFolders') {
            const folders = task.result as string[]
            setEmptyFolders(folders)
            setSelectedFolders(new Set(folders))
          }
        }
      }
    }

    // @ts-ignore: electron api
    if (window.api?.onTaskProgress) {
      // @ts-ignore: electron api
      window.api.onTaskProgress(handleProgress)
    }

    return () => {
      // @ts-ignore: electron api
      if (window.api?.removeTaskProgress) {
        // @ts-ignore: electron api
        window.api.removeTaskProgress()
      }
    }
  }, [taskId])

  // Auto-scroll log area
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  /**
   * Opens the system directory picker and sets the selected folder.
   */
  const handleSelectFolder = async (): Promise<void> => {
    try {
      // @ts-ignore: electron api
      if (!window.api?.selectFolder) throw new Error('API not available')
      // @ts-ignore: electron api
      const folderPaths = await window.api.selectFolder()
      if (folderPaths) {
        setTargetFolder(folderPaths)
        setEmptyFolders([])
        setTaskData(null)
        setTaskId(null)
      }
    } catch (e: unknown) {
      alert(`Error selecting folder: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Initiates the task to scan for empty folders.
   */
  const handleScan = async (): Promise<void> => {
    if (!targetFolder) return
    setLogEntries([])
    setEmptyFolders([])
    setTaskData(null)
    try {
      // @ts-ignore: electron api
      const id = await window.api.startFindEmptyFoldersTask(targetFolder)
      setTaskId(id)
    } catch (e: unknown) {
      alert(`Error starting scan: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Initiates the task to delete the selected folders.
   */
  const handleDelete = async (): Promise<void> => {
    if (selectedFolders.size === 0) return
    setLogEntries([])
    setTaskData(null)
    try {
      // @ts-ignore: electron api
      const id = await window.api.startDeleteFoldersTask(Array.from(selectedFolders), isDryRun)
      setTaskId(id)
    } catch (e: unknown) {
      alert(`Error starting deletion: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Toggles the selection state of a folder path.
   * @param path The absolute path of the folder to toggle.
   */
  const toggleFolder = (path: string): void => {
    setSelectedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  /**
   * Toggles the selection state of all identified empty folders.
   */
  const toggleAll = (): void => {
    if (selectedFolders.size === emptyFolders.length) {
      setSelectedFolders(new Set())
    } else {
      setSelectedFolders(new Set(emptyFolders))
    }
  }

  const pct =
    taskData && taskData.progress.total > 0
      ? Math.floor((taskData.progress.current / taskData.progress.total) * 100)
      : 0

  const isScanning = taskData?.type === 'findEmptyFolders' && taskData.status === 'running'
  const isDeleting =
    taskData?.type === 'deleteFolders' &&
    (taskData.status === 'running' || taskData.status === 'dry-run')
  const isFinishedFind = taskData?.type === 'findEmptyFolders' && taskData.status === 'completed'
  const isFinishedDelete =
    taskData?.type === 'deleteFolders' &&
    (taskData.status === 'completed' || taskData.status === 'dry-run')

  const inputSection = (
    <>
      <div className="control-group">
        <label>{t('source_folder')}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            readOnly
            value={targetFolder || t('no_folder_selected')}
            className="brutalist-input flex-grow"
          />
          <button className="brutalist-button info" onClick={handleSelectFolder}>
            {t('browse')}
          </button>
        </div>
      </div>

      <div className="action-row">
        <button
          className="brutalist-button primary"
          onClick={handleScan}
          disabled={!targetFolder || isScanning || isDeleting}
        >
          {t('btn_scan_empty')}
        </button>
      </div>
    </>
  )

  const progressSection = taskData ? (
    <>
      <div className="tool-progress-bar-container">
        <div
          className="tool-progress-bar-fill"
          style={{
            width: `${taskData.status === 'running' && taskData.progress.total === 0 ? '100' : pct}%`
          }}
        />
      </div>
      <div className="tool-progress-stats">
        <span>{taskData.progress.message}</span>
        <span style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{taskData.status}</span>
      </div>
      {logEntries.length > 0 && (
        <div className="tool-log-area" ref={logRef}>
          {logEntries.map((entry, i) => (
            <div key={i} className="log-entry">
              {entry}
            </div>
          ))}
        </div>
      )}
    </>
  ) : null

  const outputSection = (
    <div className="tool-output-summary">
      {isFinishedFind && (
        <>
          {emptyFolders.length > 0 ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}
              >
                <h4 style={{ margin: 0 }}>{t('empty_folders_found')}</h4>
                <button className="brutalist-button small" onClick={toggleAll}>
                  {selectedFolders.size === emptyFolders.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div
                className="empty-folders-list"
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: 'var(--border-width) solid var(--border-color)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: 'var(--bg-color)'
                }}
              >
                {emptyFolders.map((path) => (
                  <Checkbox
                    key={path}
                    label={path.replace(targetFolder || '', '...')}
                    checked={selectedFolders.has(path)}
                    onChange={() => toggleFolder(path)}
                  />
                ))}
              </div>

              <div className="control-group check-group" style={{ marginTop: '1rem' }}>
                <Checkbox label={t('dry_run')} checked={isDryRun} onChange={setIsDryRun} />
                <small className="help-text">{t('dry_run_help_org')}</small>
              </div>

              <div className="action-row" style={{ marginTop: '1rem' }}>
                <button
                  className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
                  onClick={handleDelete}
                  disabled={selectedFolders.size === 0 || isDeleting}
                >
                  {isDryRun ? t('btn_sim_delete_empty') : t('btn_delete_empty')}
                </button>
              </div>
            </>
          ) : (
            <div className="result-stat">
              <span className="stat-icon">ℹ️</span>
              <span>{t('no_empty_folders')}</span>
            </div>
          )}
        </>
      )}

      {isFinishedDelete && (
        <div className="result-stat">
          <span className="stat-icon">✅</span>
          <span>
            {isDryRun
              ? 'Simulation complete. Check log for details.'
              : 'Deletion complete successfully.'}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <ToolView
      description={t('desc_empty_folder_cleaner')}
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={isFinishedFind || isFinishedDelete ? outputSection : undefined}
    />
  )
}
