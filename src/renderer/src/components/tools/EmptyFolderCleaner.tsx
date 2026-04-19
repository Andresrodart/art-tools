import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'
import { Checkbox } from '../common/Checkbox'
import { useTaskStore } from '../../store/taskStore'
import { useAlertStore } from '../../store/alertStore'

/**
 * Props for the EmptyFolderCleaner component.
 */
interface EmptyFolderCleanerProps {
  /** Callback to return to the previous view. */
  onBack: () => void
  tabId: string
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
export function EmptyFolderCleaner({ onBack, tabId }: EmptyFolderCleanerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [logEntries, setLogEntries] = useState<string[]>([])
  const [lastRunWasDryRun, setLastRunWasDryRun] = useState<boolean>(false)
  const logRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const reset = useHeaderStore((state) => state.reset)

  const { tasks, tabs, updateTab } = useTaskStore()
  const currentTab = tabs.find((t) => t.id === tabId)
  const taskData = currentTab?.taskId ? tasks[currentTab.taskId] : undefined

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

  // Sync log entries and results from global task store
  useEffect(() => {
    if (taskData?.progress?.message) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogEntries((prev) => {
        const last = prev[prev.length - 1]
        if (last !== taskData.progress.message) {
          return [...prev, taskData.progress.message!]
        }
        return prev
      })
    }

    if (taskData?.status === 'completed') {
      if (taskData.type === 'findEmptyFolders') {
        const folders = taskData.result as string[]
        setEmptyFolders(folders)
        setSelectedFolders(new Set(folders))
        setLastRunWasDryRun(false)
      } else if (taskData.type === 'deleteFolders') {
        setLastRunWasDryRun(false)
      }
    } else if (taskData?.status === 'dry-run') {
      if (taskData.type === 'deleteFolders') {
        setLastRunWasDryRun(true)
      }
    }
  }, [taskData?.progress?.message, taskData?.status, taskData?.type, taskData?.result])

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
      const folderPaths = window.api?.selectFolder
        ? await window.api.selectFolder()
        : ((await (window.api as { invoke?: (...args: unknown[]) => Promise<unknown> })?.invoke?.(
            'select-folder'
          )) as string | null)
      if (!folderPaths) throw new Error('Failed to select folder, API unavailable')
      if (folderPaths) {
        setTargetFolder(folderPaths)
        setEmptyFolders([])
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

  /**
   * Initiates the task to scan for empty folders.
   */
  const handleScan = async (): Promise<void> => {
    if (!targetFolder) return
    setLogEntries([])
    setEmptyFolders([])
    setLastRunWasDryRun(false)
    try {
      // @ts-ignore: electron api
      const id = await window.api.startFindEmptyFoldersTask(targetFolder)
      updateTab(tabId, { taskId: id, title: `Scan: ${targetFolder.split(/[/\\]/).pop()}` })
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error starting scan: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
    }
  }

  /**
   * Initiates the task to delete the selected folders.
   */
  const handleDelete = async (): Promise<void> => {
    if (selectedFolders.size === 0) return
    setLogEntries([])
    try {
      // @ts-ignore: electron api
      const id = await window.api.startDeleteFoldersTask(Array.from(selectedFolders), isDryRun)
      updateTab(tabId, { taskId: id, title: `Delete: ${selectedFolders.size} folders` })
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error starting deletion: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
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

  const shouldShowResults = isFinishedFind || (isFinishedDelete && lastRunWasDryRun)

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
      {targetFolder && (shouldShowResults || isFinishedDelete) && (
        <div
          style={{
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: 'var(--border-width) solid var(--border-color)'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0' }}>{t('target_folder')}</h4>
          <div style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>{targetFolder}</div>
        </div>
      )}

      {shouldShowResults && (
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
                  {isDryRun
                    ? t('btn_sim_delete_empty')
                    : lastRunWasDryRun
                      ? t('btn_execute_delete')
                      : t('btn_delete_empty')}
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
        <div className="result-stat" style={{ marginTop: lastRunWasDryRun ? '1rem' : '0' }}>
          <span className="stat-icon">✅</span>
          <span>
            {taskData?.status === 'dry-run'
              ? t('simulation_success_note')
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
      outputSection={shouldShowResults || isFinishedDelete ? outputSection : undefined}
    />
  )
}
