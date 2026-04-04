import React from 'react'
import { useTranslation } from 'react-i18next'
import { Task } from '../../../store/taskStore'

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
