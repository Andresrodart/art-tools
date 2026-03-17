import { useState, useEffect, useRef } from 'react'
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

const COMMON_EXTENSIONS = [
  '*',
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
  '.mp4', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.flac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.md', '.csv',
  '.zip', '.rar', '.7z', '.tar.gz'
]

interface FileOrganizerProps {
  onBack: () => void
}

export function FileOrganizer({ onBack }: FileOrganizerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(['*'])
  const [extensionInput, setExtensionInput] = useState<string>('')
  const [showExtDropdown, setShowExtDropdown] = useState<boolean>(false)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskData, setTaskData] = useState<Task | null>(null)
  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)

  const addExtension = (ext: string) => {
    let newExt = ext.trim().toLowerCase()
    if (!newExt.startsWith('.') && newExt !== '*') {
      newExt = `.${newExt}`
    }
    
    if (newExt === '*') {
      setSelectedExtensions(['*'])
    } else {
      setSelectedExtensions(prev => {
        const filtered = prev.filter(e => e !== '*')
        if (!filtered.includes(newExt)) {
          return [...filtered, newExt]
        }
        return prev
      })
    }
    setExtensionInput('')
    setShowExtDropdown(false)
  }

  const removeExtension = (ext: string) => {
    setSelectedExtensions(prev => {
      const newExts = prev.filter(e => e !== ext)
      return newExts.length > 0 ? newExts : ['*']
    })
  }

  useEffect(() => {
    setTitle('File Organizer')
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; Back
      </button>
    )
    setActions([])

    return () => {
      reset()
    }
  }, [onBack])

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

  const handleStartOrganize = async () => {
    if (!targetFolder) {
      alert('Please select a folder first.')
      return
    }

    // Reset state for new run
    setLogEntries([])
    setTaskData(null)

    try {
      const typesArray = selectedExtensions.length > 0 ? selectedExtensions : ['*']

      // @ts-ignore
      if (!window.api?.startOrganizeTask) throw new Error('API not available')

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
        <label>File Extensions:</label>
        
        {/* Selected Extension Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {selectedExtensions.map(ext => (
            <div 
              key={ext} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'var(--bg-tertiary, #e0e0e0)', 
                padding: '4px 8px', 
                border: '2px solid var(--border-color, #000)', 
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono, monospace)',
                boxShadow: '2px 2px 0 var(--border-color, #000)'
              }}
            >
              {ext === '*' ? 'All Files (*)' : ext}
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  removeExtension(ext)
                }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: '0 4px', 
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  lineHeight: '1',
                  color: 'inherit'
                }}
                title="Remove"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Dropdown Input */}
        <div style={{ position: 'relative' }} className="brutalist-dropdown-container">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={extensionInput}
              onChange={(e) => {
                setExtensionInput(e.target.value)
                setShowExtDropdown(true)
              }}
              onFocus={() => setShowExtDropdown(true)}
              onBlur={() => setTimeout(() => setShowExtDropdown(false), 200)}
              placeholder="Type extension (e.g. .jpg) or select..."
              className="brutalist-input flex-grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && extensionInput) {
                  e.preventDefault()
                  addExtension(extensionInput)
                }
              }}
            />
            <button 
              className="brutalist-button" 
              onClick={(e) => {
                e.preventDefault()
                if (extensionInput) {
                   addExtension(extensionInput)
                } else {
                   setShowExtDropdown(!showExtDropdown)
                }
              }}
              type="button"
            >
              {extensionInput ? 'Add' : (showExtDropdown ? '▴' : '▾')}
            </button>
          </div>
          
          {showExtDropdown && (
            <div 
              className="dropdown-menu" 
              style={{ 
                position: 'absolute', 
                top: 'calc(100% + 4px)', 
                left: 0, 
                right: 0, 
                zIndex: 10, 
                background: 'var(--bg-primary, #fff)', 
                border: '2px solid var(--border-color, #000)', 
                maxHeight: '200px', 
                overflowY: 'auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                padding: '8px', 
                gap: '8px',
                boxShadow: '4px 4px 0 var(--border-color, #000)'
              }}
            >
              <style>{`
                .ext-option-btn:hover {
                  background: var(--bg-secondary, #f0f0f0);
                }
                .ext-option-btn {
                  font-family: var(--font-mono, monospace);
                  text-align: center;
                  padding: 8px 4px;
                  border: 2px solid var(--border-color, #000);
                  background: var(--bg-tertiary, #e0e0e0);
                  cursor: pointer;
                  font-weight: bold;
                  transition: all 0.2s;
                }
              `}</style>
              {COMMON_EXTENSIONS
                .filter(ext => !selectedExtensions.includes(ext) && (extensionInput ? ext.includes(extensionInput.toLowerCase()) : true))
                .map(ext => (
                  <button
                    key={ext}
                    className="ext-option-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      addExtension(ext)
                    }}
                    type="button"
                  >
                    {ext === '*' ? 'All (*)' : ext}
                  </button>
              ))}
              {extensionInput && !COMMON_EXTENSIONS.includes(extensionInput.toLowerCase()) && !COMMON_EXTENSIONS.includes(`.${extensionInput.toLowerCase()}`) && (
                <button
                  className="ext-option-btn"
                  style={{ gridColumn: '1 / -1', background: 'var(--accent-primary, #ffd166)' }}
                  onClick={(e) => {
                    e.preventDefault()
                    addExtension(extensionInput)
                  }}
                  type="button"
                >
                  Add custom: "{extensionInput.startsWith('.') || extensionInput === '*' ? extensionInput : `.${extensionInput}`}"
                </button>
              )}
            </div>
          )}
        </div>
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
      description="Organize files in a directory into Year/Month/Day folder structure based on their creation dates. Supports EXIF metadata, filename patterns, and file-system timestamps."
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
