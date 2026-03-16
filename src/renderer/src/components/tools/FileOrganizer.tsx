import { useState, useEffect, useRef } from 'react'
import { ToolView } from '../layout/ToolView'

interface TaskProgress {
  current: number
  total: number
  message?: string
}

interface Task {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'dry-run'
  progress: TaskProgress
  result?: OrganizeResult[]
  error?: string
}

interface OrganizeResult {
  source: string
  destination: string
  success: boolean
  timestampCorrected?: boolean
  error?: string
}

interface FileOrganizerProps {
  onBack: () => void
}

export function FileOrganizer({ onBack }: FileOrganizerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [fileTypes, setFileTypes] = useState<string>('*')
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskData, setTaskData] = useState<Task | null>(null)
  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  // Subscribe to task progress
  useEffect(() => {
    const handleProgress = (_event: any, updatedTask: Task) => {
      if (taskId && updatedTask.id === taskId) {
        setTaskData(updatedTask)

        // Append log entries from progress messages
        if (updatedTask.progress?.message) {
          setLogEntries((prev) => {
            const last = prev[prev.length - 1]
            if (last !== updatedTask.progress.message) {
              return [...prev, updatedTask.progress.message!]
            }
            return prev
          })
        }
      }
    }

    // @ts-ignore
    window.api.onTaskProgress(handleProgress)

    return () => {
      // @ts-ignore
      window.api.removeTaskProgress()
    }
  }, [taskId])

  // Auto-scroll log area
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore
      const folderPaths = await window.api.selectFolder()
      if (folderPaths) {
        setTargetFolder(folderPaths)
      }
    } catch (e: any) {
      alert(`Error selecting folder: ${e.message}`)
    }
  }

  const handleStartOrganize = async () => {
    if (!targetFolder) {
      alert('Please select a folder first.')
      return
    }

    // Reset state for new run
    setLogEntries([])
    setTaskData(null)

    try {
      const typesArray = fileTypes.split(',').map((s) => s.trim()).filter(Boolean)

      // @ts-ignore
      const id = await window.api.startOrganizeTask(targetFolder, typesArray, isDryRun)
      setTaskId(id)
    } catch (e: any) {
      alert(`Error starting organize task: ${e.message}`)
    }
  }

  const handleOpenFolder = async () => {
    if (targetFolder) {
      try {
        // @ts-ignore
        await window.api.openPath(targetFolder)
      } catch (e: any) {
        console.error('Failed to open folder', e)
      }
    }
  }

  // ── Progress percentage ──
  const pct =
    taskData && taskData.progress.total > 0
      ? Math.floor((taskData.progress.current / taskData.progress.total) * 100)
      : 0

  const isFinished =
    taskData &&
    (taskData.status === 'completed' || taskData.status === 'error' || taskData.status === 'dry-run')

  // ── Result summary ──
  const results = taskData?.result ?? []
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  // ==================== SECTIONS ====================

  const inputSection = (
    <>
      <div className="control-group">
        <label>Target Folder:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            readOnly
            value={targetFolder || 'No folder selected...'}
            className="brutalist-input flex-grow"
          />
          <button className="brutalist-button info" onClick={handleSelectFolder}>
            Browse...
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>File Extensions (comma separated, or * for all):</label>
        <input
          type="text"
          value={fileTypes}
          onChange={(e) => setFileTypes(e.target.value)}
          placeholder=".jpg, .png, .mp4"
          className="brutalist-input"
        />
      </div>

      <div className="control-group check-group">
        <label>
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={(e) => setIsDryRun(e.target.checked)}
          />
          <span className="checkbox-label">Dry Run (Simulate Changes)</span>
        </label>
        <small className="help-text">
          We strongly recommend running a dry run first to preview where files will be moved.
        </small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartOrganize}
          disabled={!targetFolder}
        >
          {isDryRun ? 'Simulate Organization' : 'Execute Move Command'}
        </button>
      </div>
    </>
  )

  const progressSection =
    taskData ? (
      <>
        <div className="tool-progress-bar-container">
          <div className="tool-progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="tool-progress-stats">
          <span>
            {pct}% — {taskData.progress.current} / {taskData.progress.total} files
          </span>
          <span style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>
            {taskData.status}
          </span>
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

  const outputSection = isFinished ? (
    <div className="tool-output-summary">
      {taskData.status === 'completed' || taskData.status === 'dry-run' ? (
        <>
          <div className="result-stat">
            <span className="stat-icon">✅</span>
            <span>{successCount} file(s) {isDryRun ? 'would be moved' : 'moved'} successfully</span>
          </div>
          {failCount > 0 && (
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>{failCount} file(s) failed</span>
            </div>
          )}
          {taskData.status === 'dry-run' && (
            <div className="result-stat">
              <span className="stat-icon">⚠️</span>
              <span>This was a dry run — no files were actually moved.</span>
            </div>
          )}
        </>
      ) : (
        <div className="result-stat">
          <span className="stat-icon">❌</span>
          <span>Error: {taskData.error}</span>
        </div>
      )}

      <div className="tool-output-actions">
        <button className="brutalist-button success" onClick={handleOpenFolder}>
          Open Folder
        </button>
      </div>
    </div>
  ) : null

  return (
    <ToolView
      toolName="File Organizer"
      description="Organize files in a directory into Year/Month/Day folder structure based on their creation dates. Supports EXIF metadata, filename patterns, and file-system timestamps."
      onBack={onBack}
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
