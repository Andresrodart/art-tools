import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../layout/ToolView'
import { useHeaderStore } from '../../store/headerStore'
import { useTaskStore } from '../../store/taskStore'
import { Task } from '../../types/task'

/**
 * Result of a file scraping operation.
 */
interface FileScraperResult {
  /** Original absolute path of the file. */
  originalPath: string
  /** New relative path in the destination folder. */
  newPath: string
  /** Indicates if the operation was successful. */
  success: boolean
  /** Error message if the operation failed. */
  error?: string
  /** Indicates if the error was related to directory access. */
  isDirectoryError?: boolean
}

/** Presets for common file extensions. */
const PRESETS = {
  Images: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
    '.raw',
    '.cr2',
    '.cr3',
    '.nef',
    '.arw',
    '.dng',
    '.orf',
    '.rw2',
    '.raf'
  ],
  Videos: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
  Documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx']
}

type PresetKey = keyof typeof PRESETS | 'Custom' | 'All'

/** Node structure for the directory tree visualization. */
interface TreeNode {
  name: string
  fullPath: string
  filesCount: number
  isError: boolean
  errorMsg?: string
  children: Record<string, TreeNode>
}

/**
 * Normalizes a path to use forward slashes.
 * @param p - The path to normalize.
 * @returns The normalized path string.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

/**
 * Builds a hierarchical tree from a flat list of scraper results.
 * @param results - List of scraper results.
 * @param sourcePath - The root path of the scan.
 * @returns The root TreeNode of the directory tree.
 */
const buildTree = (results: FileScraperResult[], sourcePath: string | null): TreeNode => {
  const root: TreeNode = {
    name: sourcePath ? sourcePath.split(/[/\\]/).pop() || 'Root' : 'Root',
    fullPath: sourcePath || '',
    filesCount: 0,
    isError: false,
    children: {}
  }

  const base = sourcePath ? normalizePath(sourcePath) : ''

  results.forEach((res) => {
    const isDirError = !!res.isDirectoryError
    const fullNormalized = normalizePath(res.originalPath)

    let rel = fullNormalized
    if (base && fullNormalized.startsWith(base)) {
      rel = fullNormalized.substring(base.length)
      if (rel.startsWith('/')) rel = rel.substring(1)
    }

    if (!rel) return

    const parts = rel.split('/')
    // If it's a dirError, path leads exactly to the error folder, else we strip filename
    const folderParts = isDirError ? parts : parts.slice(0, -1)

    let current = root
    let builtPath = base

    folderParts.forEach((part) => {
      builtPath = builtPath ? `${builtPath}/${part}` : part
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: builtPath.replace(/\//g, '\\'), // Revert to Windows path formatting natively
          filesCount: 0,
          isError: false,
          children: {}
        }
      }
      current = current.children[part]
    })

    if (isDirError) {
      current.isError = true
      current.errorMsg = res.error
    } else {
      current.filesCount += 1
    }
  })

  // compute recursive counts
  const computeCounts = (node: TreeNode): number => {
    let sum = node.filesCount
    Object.values(node.children).forEach((child) => {
      sum += computeCounts(child)
    })
    node.filesCount = sum
    return sum
  }
  computeCounts(root)

  return root
}

/**
 * Recursive component to render a directory tree node.
 */
const FolderTree = ({
  node,
  ignorePaths,
  toggleIgnore,
  depth = 0,
  isParentIgnored = false
}: {
  node: TreeNode
  ignorePaths: string[]
  toggleIgnore: (path: string) => void
  depth?: number
  isParentIgnored?: boolean
}): React.JSX.Element | null => {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = Object.keys(node.children).length > 0

  if (node.filesCount === 0 && !node.isError && depth > 0 && !hasChildren) return null

  const isDirectlyIgnored = ignorePaths.includes(node.fullPath)
  const isEffectivelyIgnored = isDirectlyIgnored || isParentIgnored

  return (
    <div
      style={{
        paddingLeft: depth === 0 ? 0 : '16px',
        marginTop: '2px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isParentIgnored
            ? 'rgba(255, 255, 255, 0.05)'
            : node.isError
              ? 'rgba(255, 107, 107, 0.15)'
              : 'transparent',
          border:
            node.isError && !isParentIgnored
              ? '1px dashed rgba(255, 107, 107, 0.3)'
              : '1px solid transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          width: '100%',
          boxSizing: 'border-box',
          opacity: isParentIgnored ? 0.4 : 1
        }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              width: '20px',
              fontSize: '0.8rem'
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: '20px' }}></span>
        )}

        <span
          style={{
            color: node.isError && !isParentIgnored ? '#ff8787' : 'inherit',
            fontWeight: node.isError && !isParentIgnored ? 'bold' : 'normal',
            textDecoration: isParentIgnored ? 'line-through' : 'none'
          }}
        >
          {node.isError ? '⚠️ ' : '📁 '}
          {node.name}
        </span>

        {!node.isError && (
          <span style={{ color: '#888', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            ({node.filesCount} files)
          </span>
        )}
        {node.isError && (
          <span style={{ color: '#ff8787', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            [{node.errorMsg}]
          </span>
        )}

        {/* Dotted Leader Line */}
        {depth > 0 && (
          <div
            style={{
              flexGrow: 1,
              borderBottom: '1px dotted #555',
              margin: '0 8px',
              position: 'relative',
              top: '-4px'
            }}
          />
        )}

        {depth > 0 &&
          (() => {
            if (isParentIgnored) {
              return (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    minWidth: '85px',
                    textAlign: 'center'
                  }}
                >
                  Skipped
                </span>
              )
            }

            return (
              <button
                onClick={() => toggleIgnore(node.fullPath)}
                title={isDirectlyIgnored ? 'Remove from Skip List' : 'Add to Skip List'}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.5)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
                style={{
                  background: isDirectlyIgnored ? '#495057' : 'var(--bg-tertiary, #e03131)',
                  border: isDirectlyIgnored ? '1px solid #777' : 'none',
                  borderRadius: '6px',
                  color: isDirectlyIgnored ? '#aaa' : 'white',
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  minWidth: '85px',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  opacity: isDirectlyIgnored ? 0.7 : 1
                }}
              >
                {isDirectlyIgnored ? '✔ Ignored' : '🚫 Ignore'}
              </button>
            )
          })()}
      </div>

      {expanded && hasChildren && (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {Object.values(node.children).map((child) => (
            <FolderTree
              key={child.fullPath}
              node={child}
              ignorePaths={ignorePaths}
              toggleIgnore={toggleIgnore}
              depth={depth + 1}
              isParentIgnored={isEffectivelyIgnored}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Props for the FileScraper component. */
interface FileScraperProps {
  /** Callback to return to the previous view. */
  onBack: () => void
}

/**
 * FileScraper component for extracting and flattening files from a directory tree.
 *
 * @param props The component properties.
 */
export function FileScraper({ onBack }: FileScraperProps): React.JSX.Element {
  const [sourcePath, setSourcePath] = useState<string | null>(null)
  const [destinationPath, setDestinationPath] = useState<string | null>(null)
  const [preset, setPreset] = useState<PresetKey>('Images')
  const [customExtensions, setCustomExtensions] = useState<string>('')
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [ignorePaths, setIgnorePaths] = useState<string[]>([])

  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)
  const { t } = useTranslation()

  const { tasks, activeTabId, addTab } = useTaskStore()
  const taskData = tasks[activeTabId] as Task | undefined

  useEffect(() => {
    setTitle(t('tool_file_scraper_title'))
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; {t('back')}
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

  /**
   * Opens the system folder selection dialog.
   * @param isSource - Whether we are selecting the source or destination.
   */
  const handleSelectFolder = async (isSource: boolean): Promise<void> => {
    try {
      // @ts-ignore: electron api
      if (!window.api?.selectFolder) throw new Error('API not available')
      // @ts-ignore: electron api
      const folderPaths = await window.api.selectFolder()
      if (folderPaths) {
        if (isSource) setSourcePath(folderPaths)
        else setDestinationPath(folderPaths)
      }
    } catch (e: unknown) {
      alert(`Error selecting folder: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Adds a folder to the ignore list.
   */
  const handleAddIgnorePath = async (): Promise<void> => {
    try {
      // @ts-ignore: electron api
      if (!window.api?.selectFolder) throw new Error('API not available')
      // @ts-ignore: electron api
      const folderPath = await window.api.selectFolder()
      if (folderPath && !ignorePaths.includes(folderPath)) {
        setIgnorePaths((prev) => [...prev, folderPath])
      }
    } catch (e: unknown) {
      alert(`Error selecting folder: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Removes a folder from the ignore list.
   * @param pathToRemove - The path to remove.
   */
  const handleRemoveIgnorePath = (pathToRemove: string): void => {
    setIgnorePaths((prev) => prev.filter((p) => p !== pathToRemove))
  }

  /**
   * Starts the scraping task.
   */
  const handleStartTask = async (): Promise<void> => {
    if (!sourcePath || !destinationPath) {
      alert('Please select both a source and destination folder.')
      return
    }

    let extensions: string[]
    if (preset === 'All') {
      extensions = ['*']
    } else if (preset === 'Custom') {
      extensions = customExtensions
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
      if (extensions.length === 0) {
        alert('Please enter at least one valid extension for Custom mode.')
        return
      }
    } else {
      extensions = PRESETS[preset]
    }

    // Reset state for new run
    setLogEntries([])

    try {
      // @ts-ignore: electron api
      if (!window.api?.startFileScraperTask) throw new Error('API not available')

      // @ts-ignore: electron api
      const id = await window.api.startFileScraperTask(
        sourcePath,
        destinationPath,
        extensions,
        isDryRun,
        ignorePaths
      )

      addTab({ id, title: `Scrape: ${sourcePath.split(/[/\\]/).pop()}`, type: 'task' })
    } catch (e: unknown) {
      alert(`Error starting file scraper: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  /**
   * Opens the destination folder in the system file explorer.
   */
  const handleOpenFolder = async (): Promise<void> => {
    if (destinationPath) {
      try {
        // @ts-ignore: electron api
        if (window.api?.openPath) {
          // @ts-ignore: electron api
          await window.api.openPath(destinationPath)
        }
      } catch (e: unknown) {
        console.error('Failed to open folder', e)
      }
    }
  }

  // ── Extensions Chips Logic ──
  const getActiveExtensions = (): string[] => {
    if (preset === 'All') return ['*']
    if (preset === 'Custom') {
      return customExtensions
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    }
    return PRESETS[preset]
  }

  const handleRemoveExtension = (extToRemove: string): void => {
    const currentList = getActiveExtensions()
    const newList = currentList.filter((ext) => ext !== extToRemove)
    setCustomExtensions(newList.join(', '))
    setPreset('Custom')
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
  const results = useMemo(() => (taskData?.result as FileScraperResult[]) ?? [], [taskData?.result])
  const scrapedCount = results.filter((r) => r.success || taskData?.status === 'dry-run').length
  const failCount = results.filter((r) => !r.success && taskData?.status !== 'dry-run').length

  // ==================== SECTIONS ====================

  const inputSection = (
    <>
      <div className="control-group">
        <label>{t('source_folder')}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            readOnly
            value={sourcePath || t('no_folder_selected')}
            className="brutalist-input flex-grow"
          />
          <button className="brutalist-button info" onClick={() => handleSelectFolder(true)}>
            {t('browse')}
          </button>
        </div>
        <small className="help-text">{t('source_folder_help')}</small>
      </div>

      <div className="control-group">
        <label>{t('destination_folder')}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            readOnly
            value={destinationPath || t('no_folder_selected')}
            className="brutalist-input flex-grow"
          />
          <button className="brutalist-button info" onClick={() => handleSelectFolder(false)}>
            {t('browse')}
          </button>
        </div>
        <small className="help-text">{t('destination_folder_help')}</small>
      </div>

      <div className="control-group">
        <label>Ignore/Skip Directories</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="brutalist-button info" onClick={handleAddIgnorePath}>
            + Add Folder to Ignore
          </button>
        </div>
        <small className="help-text">
          Select sub-folders that you want to avoid scanning entirely.
        </small>

        {ignorePaths.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {ignorePaths.map((ignoredPath, idx) => (
              <span
                key={`${ignoredPath}-${idx}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'var(--bg-tertiary, #e03131)',
                  color: '#ffffff',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  border: '1px solid var(--border-color, #c92a2a)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={ignoredPath}
              >
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ignoredPath.split(/[/\\]/).pop() || ignoredPath}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveIgnorePath(ignoredPath)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '1rem',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
                  title="Remove from ignore list"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="control-group">
        <label>{t('file_types')}</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {(['Images', 'Videos', 'Audio', 'Documents', 'All', 'Custom'] as PresetKey[]).map((p) => (
            <label
              key={p}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <input
                type="radio"
                name="preset"
                value={p}
                checked={preset === p}
                onChange={() => setPreset(p)}
              />
              {p}
            </label>
          ))}
        </div>

        {/* Interactive Extension Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          {getActiveExtensions().map((ext, idx) => (
            <span
              key={`${ext}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'var(--bg-tertiary, #2c2e33)',
                color: 'var(--text-tertiary, #ffffff)',
                borderRadius: '16px',
                fontSize: '0.85rem',
                border: '1px solid var(--border-color, #444)'
              }}
            >
              <span style={{ fontWeight: 500 }}>{ext}</span>
              <button
                type="button"
                onClick={() => handleRemoveExtension(ext)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '1rem',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '0.7')}
                title="Remove extension"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        {preset === 'Custom' && (
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              value={customExtensions}
              onChange={(e) => setCustomExtensions(e.target.value)}
              placeholder=".zip, .tar.gz"
              className="brutalist-input w-full"
            />
          </div>
        )}
      </div>

      <div className="control-group" style={{ marginTop: '10px' }}>
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'secondary'}`}
          onClick={() => setIsDryRun(!isDryRun)}
          style={{
            width: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px'
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isDryRun ? '#212529' : 'transparent',
              border: '2px solid #212529',
              transition: 'background 0.2s',
              boxSizing: 'border-box'
            }}
          />
          {t('dry_run')}
        </button>
        <small className="help-text" style={{ display: 'block', marginTop: '6px' }}>
          {t('dry_run_help_scraper')}
        </small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartTask}
          disabled={!sourcePath || !destinationPath}
        >
          {isDryRun ? t('btn_sim_scraper') : t('btn_exec_scraper')}
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
          {pct}% — Processed {taskData.progress.current} / {taskData.progress.total || '?'} matching
          files
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

  const scrapeTree = useMemo(() => {
    if (!isFinished || taskData.status !== 'dry-run' || results.length === 0) return null
    return buildTree(results, sourcePath)
  }, [results, sourcePath, isFinished, taskData?.status])

  const getSlashedPath = (path: string): string => path.split(/[/\\]/).pop() || path

  const outputSection = isFinished ? (
    <div className="tool-output-summary">
      {taskData.status === 'completed' || taskData.status === 'dry-run' ? (
        <>
          <div className="result-stat">
            <span className="stat-icon">✅</span>
            <span>
              {scrapedCount} files(s){' '}
              {taskData.status === 'dry-run' ? 'would be moved' : 'moved and flattened'}
            </span>
          </div>
          {failCount > 0 && (
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>{failCount} file(s) failed to move</span>
            </div>
          )}
          {taskData.status === 'dry-run' && (
            <div className="result-stat" style={{ color: 'var(--accent-primary, #ffd166)' }}>
              <span className="stat-icon">⚠️</span>
              <span>This was a dry run — no files were actually moved.</span>
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
              <h4>
                {taskData.status === 'dry-run' ? 'Projected Scrape Tree:' : 'Actions Performed:'}
              </h4>

              {taskData.status === 'dry-run' ? (
                <div
                  style={{
                    marginTop: '10px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'var(--bg-secondary)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <FolderTree
                    node={scrapeTree!}
                    ignorePaths={ignorePaths}
                    toggleIgnore={(p) => {
                      setIgnorePaths((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      )
                    }}
                  />
                </div>
              ) : (
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
                  {results
                    .filter((r) => !r.isDirectoryError)
                    .map((res, i) => (
                      <li
                        key={i}
                        style={{
                          marginBottom: '8px',
                          fontFamily: 'monospace',
                          paddingBottom: '8px',
                          borderBottom: '1px dashed #ccc'
                        }}
                      >
                        <div style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
                          <span style={{ color: '#ff6b6b' }}>Source: </span> {res.originalPath}
                        </div>
                        <div style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                          <span style={{ color: '#51cf66' }}>Dest: </span>
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
              )}
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
      description={t('desc_file_scraper')}
      inputSection={!taskData ? inputSection : undefined}
      progressSection={progressSection}
      outputSection={outputSection}
    />
  )
}
