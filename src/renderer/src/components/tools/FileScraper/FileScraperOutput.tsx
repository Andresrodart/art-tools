import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Task } from '../../../store/taskStore'
import { FileScraperResult } from './types'
import { buildTree } from './utils'
import { FolderTree } from './FolderTree'

interface FileScraperOutputProps {
  isFinished: boolean | undefined
  taskData: Task | undefined
  sourcePath: string | null
  scrapedCount: number
  failCount: number
  results: FileScraperResult[]
  ignorePaths: string[]
  setIgnorePaths: React.Dispatch<React.SetStateAction<string[]>>
  handleOpenFolder: () => Promise<void>
}

export function FileScraperOutput({
  isFinished,
  taskData,
  sourcePath,
  scrapedCount,
  failCount,
  results,
  ignorePaths,
  setIgnorePaths,
  handleOpenFolder
}: FileScraperOutputProps): React.JSX.Element | null {
  const { t } = useTranslation()

  const scrapeTree = useMemo(() => {
    if (!isFinished || taskData?.status !== 'dry-run' || results.length === 0) return null
    return buildTree(results, sourcePath)
  }, [results, sourcePath, isFinished, taskData?.status])

  const getSlashedPath = (path: string): string => path.split(/[/\\]/).pop() || path

  if (!isFinished || !taskData) return null

  return (
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
  )
}
