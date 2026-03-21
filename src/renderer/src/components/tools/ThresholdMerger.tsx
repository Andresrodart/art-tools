import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'
import { useTaskStore } from '../../store/taskStore'

interface ThresholdMergerResult {
  originalPaths: string[]
  newPath: string
  success: boolean
  error?: string
}

interface ThresholdMergerProps {
  onBack: () => void
  tabId: string
}

export function ThresholdMerger({ onBack, tabId }: ThresholdMergerProps): React.JSX.Element {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [thresholdX, setThresholdX] = useState<number>(5)
  const [maxCapacityY, setMaxCapacityY] = useState<number>(10)
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

  useEffect(() => {
    setTitle(t('tool_threshold_merger_title'))
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
      alert(`Error selecting folder: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const handleStartTask = async (): Promise<void> => {
    if (!targetFolder) {
      alert('Please select a folder first.')
      return
    }

    if (thresholdX < 1 || maxCapacityY < 1) {
      alert('Thresholds must be at least 1')
      return
    }

    if (thresholdX >= maxCapacityY) {
      alert(
        'X (Threshold) must be smaller than Y (Max Capacity). Otherwise groups will exceed your limit on the first merge!'
      )
      return
    }

    // Reset state for new run
    setLogEntries([])

    try {
      // @ts-ignore: electron api
      if (!window.api?.startThresholdMergerTask) throw new Error('API not available')

      // @ts-ignore: electron api
      const id = await window.api.startThresholdMergerTask(
        targetFolder,
        thresholdX,
        maxCapacityY,
        isDryRun
      )

      updateTab(tabId, { taskId: id, title: `Merge: ${targetFolder.split(/[/\\]/).pop()}` })
    } catch (e: unknown) {
      alert(`Error starting threshold merger task: ${e instanceof Error ? e.message : String(e)}`)
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
  const results = (taskData?.result as ThresholdMergerResult[]) ?? []
  const mergedGroupsCount = results.filter(
    (r) => r.success || taskData?.status === 'dry-run'
  ).length
  const failCount = results.filter((r) => !r.success && taskData?.status !== 'dry-run').length
  const totalFoldersMerged = results.reduce(
    (acc, current) =>
      acc + (current.success || taskData?.status === 'dry-run' ? current.originalPaths.length : 0),
    0
  )

  // ==================== SECTIONS ====================

  const isTaskRunning = taskData?.status === 'running' || taskData?.status === 'pending'

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

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div className="control-group" style={{ flex: 1, minWidth: '200px' }}>
          <label>{t('merge_under_x')}</label>
          <input
            type="number"
            min={1}
            value={thresholdX}
            onChange={(e) => setThresholdX(parseInt(e.target.value) || 1)}
            className="brutalist-input"
          />
          <small className="help-text">
            {t('merge_under_x_help_1')}
            <b>{thresholdX}</b>
            {t('merge_under_x_help_2')}
          </small>
        </div>

        <div className="control-group" style={{ flex: 1, minWidth: '200px' }}>
          <label>{t('max_elements_y')}</label>
          <input
            type="number"
            min={2}
            value={maxCapacityY}
            onChange={(e) => setMaxCapacityY(parseInt(e.target.value) || 2)}
            className="brutalist-input"
          />
          <small className="help-text">
            {t('max_elements_y_help_1')}
            <b>{maxCapacityY}</b>
            {t('max_elements_y_help_2')}
          </small>
        </div>
      </div>

      <div className="control-group check-group" style={{ marginTop: '10px' }}>
        <label>
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={(e) => setIsDryRun(e.target.checked)}
          />
          <span className="checkbox-label">{t('dry_run')}</span>
        </label>
        <small className="help-text">{t('dry_run_help_merge')}</small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartTask}
          disabled={!targetFolder || isTaskRunning}
        >
          {isDryRun ? t('btn_sim_merge') : t('btn_exec_merge')}
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
            width: `${taskData.status === 'running' && taskData.progress.total === 0 ? 100 : pct}%`
          }}
        />
      </div>
      <div className="tool-progress-stats">
        <span>
          Processed {taskData.progress.current}{' '}
          {taskData.status === 'completed' || taskData.status === 'dry-run'
            ? 'groups'
            : 'operations'}
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

  const getSlashedPath = (path: string): string => path.split(/[/\\]/).pop() || path

  const outputSection = isFinished ? (
    <div className="tool-output-summary">
      {taskData.status === 'completed' || taskData.status === 'dry-run' ? (
        <>
          <div className="result-stat">
            <span className="stat-icon">📦</span>
            <span>
              {totalFoldersMerged} original folder(s) combined into {mergedGroupsCount} new group(s)
            </span>
          </div>
          {failCount > 0 && (
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>{failCount} group(s) failed to merge (permissions/locked files)</span>
            </div>
          )}
          {taskData.status === 'dry-run' && (
            <div className="result-stat" style={{ color: 'var(--accent-primary, #ffd166)' }}>
              <span className="stat-icon">⚠️</span>
              <span>This was a dry run — no folders were actually merged.</span>
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
              <h4>{taskData.status === 'dry-run' ? 'Projected Merges:' : 'Actions Performed:'}</h4>
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
                      <span style={{ color: '#ff6b6b' }}>
                        From ({res.originalPaths.length} folders):
                      </span>{' '}
                      {res.originalPaths.map(getSlashedPath).join(', ')}
                    </div>
                    <div style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                      <span style={{ color: '#51cf66' }}>To:</span>{' '}
                      <b>{getSlashedPath(res.newPath)}</b>
                    </div>
                    {!res.success && res.error && taskData.status !== 'dry-run' && (
                      <div
                        style={{
                          wordBreak: 'break-all',
                          color: '#ff6b6b',
                          marginTop: '4px',
                          fontSize: '0.8rem'
                        }}
                      >
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
      description={t('desc_merge')}
      inputSection={inputSection}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
