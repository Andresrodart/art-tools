import React from 'react'
import { useTranslation } from 'react-i18next'
import { Task } from '../../../store/taskStore'
import { OrganizeResult } from './types'

interface FileOrganizerOutputProps {
  isFinished: boolean | undefined
  taskData: Task | undefined
  successCount: number
  failCount: number
  handleOpenFolder: () => void
}

export function FileOrganizerOutput({
  isFinished,
  taskData,
  successCount,
  failCount,
  handleOpenFolder
}: FileOrganizerOutputProps): React.JSX.Element | null {
  const { t } = useTranslation()

  if (!isFinished || !taskData) return null

  return (
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

          {/* Detailed results list */}
          {taskData.result && Array.isArray(taskData.result) && (
            <div
              className="detailed-results"
              style={{
                marginTop: '16px',
                maxHeight: '250px',
                overflowY: 'auto',
                background: 'var(--bg-tertiary, #f4f4f4)',
                border: '2px solid var(--border-color, #000)',
                padding: '8px',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.9rem',
                color: 'var(--text-primary, #000)'
              }}
            >
              {(taskData.result as OrganizeResult[]).map((res, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '8px',
                    paddingBottom: '4px',
                    borderBottom: '1px dashed #aaa'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: res.success ? '#2d6a4f' : '#d00000' }}>
                    {res.success ? '✔' : '✖'} {res.source.split(/[/\\]/).pop()}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginLeft: '16px' }}>
                    {res.success ? (
                      res.alreadyOrganized ? (
                        <span style={{ color: 'var(--text-secondary, #666)' }}>
                          Already in correct folder
                        </span>
                      ) : (
                        <>
                          <span style={{ opacity: 0.6 }}>→</span>{' '}
                          <strong>{res.destination.split(/[/\\]/).slice(-4).join('/')}</strong>
                        </>
                      )
                    ) : (
                      <>Error: {res.error}</>
                    )}
                  </div>
                </div>
              ))}
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
  )
}
