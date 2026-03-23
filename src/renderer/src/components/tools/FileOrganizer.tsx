import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'
import { useTaskStore } from '../../store/taskStore'
import { useAlertStore } from '../../store/alertStore'

interface OrganizeResult {
  source: string
  destination: string
  success: boolean
  timestampCorrected?: boolean
  error?: string
}

const COMMON_EXTENSIONS = [
  '*',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.webp',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.mp3',
  '.wav',
  '.flac',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.csv',
  '.zip',
  '.rar',
  '.7z',
  '.tar.gz'
]

interface FileOrganizerProps {
  onBack: () => void
  tabId: string
}

export function FileOrganizer({ onBack, tabId }: FileOrganizerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(['*'])
  const [extensionInput, setExtensionInput] = useState<string>('')
  const [showExtDropdown, setShowExtDropdown] = useState<boolean>(false)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)

  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)
  const { t } = useTranslation()

  const { tasks, tabs, updateTab } = useTaskStore()
  const currentTab = tabs.find((t) => t.id === tabId)
  const taskData = currentTab?.taskId ? tasks[currentTab.taskId] : undefined

  const addExtension = (ext: string): void => {
    let newExt = ext.trim().toLowerCase()
    if (!newExt.startsWith('.') && newExt !== '*') {
      newExt = `.${newExt}`
    }

    if (newExt === '*') {
      setSelectedExtensions(['*'])
    } else {
      setSelectedExtensions((prev) => {
        const filtered = prev.filter((e) => e !== '*')
        if (!filtered.includes(newExt)) {
          return [...filtered, newExt]
        }
        return prev
      })
    }
    setExtensionInput('')
    setShowExtDropdown(false)
  }

  const removeExtension = (ext: string): void => {
    setSelectedExtensions((prev) => {
      const newExts = prev.filter((e) => e !== ext)
      return newExts.length > 0 ? newExts : ['*']
    })
  }

  useEffect(() => {
    setTitle(t('tool_file_organizer_title'))
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; Back
      </button>
    )
    setActions([])

    return () => {
      reset()
    }
  }, [onBack, setTitle, setNavigation, setActions, reset, t])

  // Sync log entries from global task store
  useEffect(() => {
    if (taskData?.progress?.message) {
      setLogEntries((prev) => {
        const last = prev[prev.length - 1]
        if (last !== taskData.progress.message) {
          return [...prev, taskData.progress.message!]
        }
        return prev
      })
    }
  }, [taskData?.progress?.message])

  // Auto-scroll log area
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  const handleSelectFolder = async (): Promise<void> => {
    try {
      // @ts-ignore: electron api
      if (!window.api?.selectFolder) throw new Error('API not available')
      // @ts-ignore: electron api
      const folderPaths = await window.api.selectFolder()
      if (folderPaths) {
        setTargetFolder(folderPaths)
      }
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error selecting folder: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
    }
  }

  const handleStartOrganize = async (): Promise<void> => {
    if (!targetFolder) {
      await useAlertStore
        .getState()
        .showAlert('Warning', 'Please select a folder first.', 'warning')
      return
    }

    // Reset state for new run
    setLogEntries([])

    try {
      const typesArray = selectedExtensions.length > 0 ? selectedExtensions : ['*']

      // @ts-ignore: electron api
      if (!window.api?.startOrganizeTask) throw new Error('API not available')

      // @ts-ignore: electron api
      const id = await window.api.startOrganizeTask(targetFolder, typesArray, isDryRun)

      updateTab(tabId, { taskId: id, title: `Org: ${targetFolder.split(/[/\\]/).pop()}` })
    } catch (e: unknown) {
      alert(`Error starting organize task: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    if (targetFolder) {
      try {
        // @ts-ignore: electron api
        if (window.api?.openPath) {
          // @ts-ignore: electron api
          await window.api.openPath(targetFolder)
        }
      } catch (e: unknown) {
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
  const results = (taskData?.result as OrganizeResult[]) ?? []
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  // ==================== SECTIONS ====================

  const isTaskRunning = taskData?.status === 'running' || taskData?.status === 'pending'

  const inputSection = (
    <>
      <div className="control-group">
        <label>{t('target_folder')}</label>
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

      <div className="control-group">
        <label>{t('file_extensions')}</label>

        {/* Selected Extension Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {selectedExtensions.map((ext) => (
            <div
              key={ext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-tertiary, #555)',
                color: 'var(--text-tertiary, #fff)',
                padding: '4px 8px',
                border: '2px solid var(--border-color, #000)',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono, monospace)',
                boxShadow: '2px 2px 0 var(--border-color, #000)'
              }}
            >
              {ext === '*' ? t('all_files') : ext}
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
              placeholder={t('type_ext_placeholder')}
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
              {extensionInput ? t('btn_add') : showExtDropdown ? '▴' : '▾'}
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
                  background: var(--bg-tertiary, #555);
                  color: var(--text-tertiary, #fff);
                  cursor: pointer;
                  font-weight: bold;
                  transition: all 0.2s;
                }
              `}</style>
              {COMMON_EXTENSIONS.filter(
                (ext) =>
                  !selectedExtensions.includes(ext) &&
                  (extensionInput ? ext.includes(extensionInput.toLowerCase()) : true)
              ).map((ext) => (
                <button
                  key={ext}
                  className="ext-option-btn"
                  onClick={(e) => {
                    e.preventDefault()
                    addExtension(ext)
                  }}
                  type="button"
                >
                  {ext === '*' ? t('all_files') : ext}
                </button>
              ))}
              {extensionInput &&
                !COMMON_EXTENSIONS.includes(extensionInput.toLowerCase()) &&
                !COMMON_EXTENSIONS.includes(`.${extensionInput.toLowerCase()}`) && (
                  <button
                    className="ext-option-btn"
                    style={{ gridColumn: '1 / -1', background: 'var(--accent-primary, #ffd166)' }}
                    onClick={(e) => {
                      e.preventDefault()
                      addExtension(extensionInput)
                    }}
                    type="button"
                  >
                    Add custom: &quot;
                    {extensionInput.startsWith('.') || extensionInput === '*'
                      ? extensionInput
                      : `.${extensionInput}`}
                    &quot;
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
          <span className="checkbox-label">{t('dry_run')}</span>
        </label>
        <small className="help-text">{t('dry_run_help_org')}</small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartOrganize}
          disabled={!targetFolder || isTaskRunning}
        >
          {isDryRun ? t('btn_sim_org') : t('btn_exec_org')}
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
          {pct}% — {taskData.progress.current} / {taskData.progress.total} files
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
              {successCount} file(s) {taskData.status === 'dry-run' ? 'would be moved' : 'moved'}{' '}
              successfully
            </span>
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
          {t('open_folder')}
        </button>
      </div>
    </div>
  ) : null

  return (
    <ToolView
      description={t('desc_org')}
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
