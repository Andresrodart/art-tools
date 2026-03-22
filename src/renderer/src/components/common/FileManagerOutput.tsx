import React from 'react'
import { useTranslation } from 'react-i18next'
import { Task } from '../../store/taskStore'

interface FileManagerOutputProps {
  isFinished: boolean | undefined
  taskData: Task | undefined
  successCount: number
  failCount: number
  successMessage: {
    dryRun: string
    actual: string
  }
  handleOpenFolder: () => Promise<void>
  children?: React.ReactNode // E.g., for detailed FolderTree or list views
}

export function FileManagerOutput({
  isFinished,
  taskData,
  successCount,
  failCount,
  successMessage,
  handleOpenFolder,
  children
}: FileManagerOutputProps): React.JSX.Element | null {
  const { t } = useTranslation()

  if (!isFinished || !taskData) return null

  return (
    <div className="tool-output-summary">
      {taskData.status === 'completed' || taskData.status === 'dry-run' ? (
        <>
          <div className="result-stat">
            <span className="stat-icon">✅</span>
            <span>
              {successCount} {successCount === 1 ? 'file' : 'files'}{' '}
              {taskData.status === 'dry-run' ? successMessage.dryRun : successMessage.actual}
            </span>
          </div>
          {failCount > 0 && (
            <div className="result-stat">
              <span className="stat-icon">❌</span>
              <span>
                {failCount} {failCount === 1 ? 'file' : 'files'} failed
              </span>
            </div>
          )}
          {taskData.status === 'dry-run' && (
            <div className="result-stat" style={{ color: 'var(--accent-primary, #ffd166)' }}>
              <span className="stat-icon">⚠️</span>
              <span>This was a dry run — no files were actually moved or changed.</span>
            </div>
          )}

          {/* Show a preview of the changes via children */}
          {children}
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
