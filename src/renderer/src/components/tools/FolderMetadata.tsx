import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'

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
  result?: FolderMetadataResult[]
  error?: string
}

interface FolderMetadataResult {
  originalName: string
  newName: string
  originalPath: string
  newPath: string
  success: boolean
  error?: string
}

interface FolderMetadataProps {
  onBack: () => void
}

export function FolderMetadata({ onBack }: FolderMetadataProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [includeSize, setIncludeSize] = useState<boolean>(true)
  const [includeElements, setIncludeElements] = useState<boolean>(true)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)

  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskData, setTaskData] = useState<Task | null>(null)
  const [logEntries, setLogEntries] = useState<string[]>([])

  const logRef = useRef<HTMLDivElement>(null)

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)
  const { t } = useTranslation()

  useEffect(() => {
    setTitle(t('tool_folder_metadata_title'))
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; Back
      </button>
    )
    setActions([])

    return () => {
      reset()
    }
  }, [onBack, setTitle, setNavigation, setActions, reset])

  // Subscribe to task progress
  useEffect(() => {
    const handleProgress = (_event: any, updatedTask: any) => {
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
    if (window.api?.onTaskProgress) {
      window.api.onTaskProgress(handleProgress)
    }

    return () => {
      // @ts-ignore
      if (window.api?.removeTaskProgress) {
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

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore
      if (!window.api?.selectFolder) throw new Error('API not available')
      // @ts-ignore
      const folderPaths = await window.api.selectFolder()
      if (folderPaths) {
        setTargetFolder(folderPaths)
      }
    } catch (e: any) {
      alert(`Error selecting folder: ${e.message}`)
    }
  }

  const handleStartTask = async () => {
    if (!targetFolder) {
      alert('Please select a folder first.')
      return
    }

    // Reset state for new run
    setLogEntries([])
    setTaskData(null)

    try {
      // @ts-ignore
      if (!window.api?.startFolderMetadataTask) throw new Error('API not available')

      // @ts-ignore
      const id = await window.api.startFolderMetadataTask(
        targetFolder,
        includeSize,
        includeElements,
        isDryRun
      )
      setTaskId(id)
    } catch (e: any) {
      alert(`Error starting folder metadata task: ${e.message}`)
    }
  }

  const handleOpenFolder = async () => {
    if (targetFolder) {
      try {
        // @ts-ignore
        if (window.api?.openPath) {
          // @ts-ignore
          await window.api.openPath(targetFolder)
        }
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
    (taskData.status === 'completed' ||
      taskData.status === 'error' ||
      taskData.status === 'dry-run')

  // ── Result summary ──
  const results = taskData?.result ?? []
  const renamedCount = results.filter((r) => r.success || isDryRun).length
  const failCount = results.filter((r) => !r.success && !isDryRun).length

  // ==================== SECTIONS ====================

  const inputSection = (
    <>
      <div className="control-group">
        <label>{t('target_root_folder')}</label>
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

      <div className="control-group check-group">
        <label>
          <input
            type="checkbox"
            checked={includeSize}
            onChange={(e) => setIncludeSize(e.target.checked)}
          />
          <span className="checkbox-label">{t('append_size')}</span>
        </label>
        <small className="help-text">
          {t('append_size_help')}
        </small>
      </div>

      <div className="control-group check-group">
        <label>
          <input
            type="checkbox"
            checked={includeElements}
            onChange={(e) => setIncludeElements(e.target.checked)}
          />
          <span className="checkbox-label">{t('append_elements')}</span>
        </label>
        <small className="help-text">
          {t('append_elements_help')}
        </small>
      </div>

      <div className="control-group check-group">
        <label>
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={(e) => setIsDryRun(e.target.checked)}
          />
          <span className="checkbox-label">{t('dry_run')}</span>
        </label>
        <small className="help-text">
          {t('dry_run_help_meta')}
        </small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartTask}
          disabled={!targetFolder || (!includeSize && !includeElements)}
        >
          {isDryRun ? t('btn_sim_meta') : t('btn_exec_meta')}
        </button>
      </div>
    </>
  )

  const progressSection = taskData ? (
    <>
      <div className="tool-progress-bar-container">
        <div className="tool-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="tool-progress-stats">
        <span>
          {pct}% — Processed {taskData.progress.current} / {taskData.progress.total} folders
        </span>
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

  const outputSection = isFinished ? (
    <div className="tool-output-summary">
      {taskData.status === 'completed' || taskData.status === 'dry-run' ? (
        <>
          <div className="result-stat">
            <span className="stat-icon">✅</span>
            <span>
              {renamedCount} folder(s) {isDryRun ? 'would be renamed' : 'renamed'} successfully
            </span>
          </div>
          {failCount > 0 && (
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>{failCount} folder(s) failed to rename</span>
            </div>
          )}
          {taskData.status === 'dry-run' && (
            <div className="result-stat" style={{ color: 'var(--accent-primary, #ffd166)' }}>
              <span className="stat-icon">⚠️</span>
              <span>This was a dry run — no folders were actually renamed.</span>
            </div>
          )}

          {/* Show a preview of the changes */}
          {results.length > 0 && (
            <div
              style={{
                marginTop: '20px',
                borderTop: '2px solid var(--border-color)',
                paddingTop: '10px'
              }}
            >
              <h4>{isDryRun ? 'Projected Changes:' : 'Actions Performed:'}</h4>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginTop: '10px',
                  fontSize: '0.9rem',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {results.map((res, i) => (
                  <li
                    key={i}
                    style={{
                      marginBottom: '8px',
                      fontFamily: 'monospace',
                      paddingBottom: '8px',
                      borderBottom: '1px dashed #ccc'
                    }}
                  >
                    <div style={{ wordBreak: 'break-all' }}>
                      <span style={{ color: '#ff6b6b' }}>Old:</span> {res.originalName}
                    </div>
                    <div style={{ wordBreak: 'break-all' }}>
                      <span style={{ color: '#51cf66' }}>New:</span> <b>{res.newName}</b>
                    </div>
                    {!res.success && res.error && !isDryRun && (
                      <div style={{ wordBreak: 'break-all', color: '#ff6b6b', marginTop: '4px', fontSize: '0.8rem' }}>
                        Error: {res.error}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="result-stat">
          <span className="stat-icon">❌</span>
          <span>Error: {taskData.error}</span>
        </div>
      )}

      <div className="tool-output-actions" style={{ marginTop: '20px' }}>
        <button className="brutalist-button success" onClick={handleOpenFolder}>
          {t('open_target_folder')}
        </button>
      </div>
    </div>
  ) : null

  return (
    <ToolView
      description={t('desc_meta')}
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
