import React from 'react'
import { useTranslation } from 'react-i18next'

interface FileManagerInputProps {
  sourcePath: string | null
  destinationPath: string | null
  ignorePaths: string[]
  isDryRun: boolean
  isTaskRunning: boolean
  handleSelectFolder: (isSource: boolean) => Promise<void>
  handleAddIgnorePath: () => Promise<void>
  handleRemoveIgnorePath: (pathToRemove: string) => void
  setIsDryRun: (isDryRun: boolean) => void
  handleStartTask: () => Promise<void>
  dryRunHelpText: string
  actionButtonText: { sim: string; exec: string }
  children?: React.ReactNode // For tool-specific inputs (e.g. File Types)
}

export function FileManagerInput({
  sourcePath,
  destinationPath,
  ignorePaths,
  isDryRun,
  isTaskRunning,
  handleSelectFolder,
  handleAddIgnorePath,
  handleRemoveIgnorePath,
  setIsDryRun,
  handleStartTask,
  dryRunHelpText,
  actionButtonText,
  children
}: FileManagerInputProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
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

      {children}

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
          {dryRunHelpText}
        </small>
      </div>

      <div className="action-row">
        <button
          className={`brutalist-button ${isDryRun ? 'warning' : 'danger'}`}
          onClick={handleStartTask}
          disabled={!sourcePath || !destinationPath || isTaskRunning}
        >
          {isDryRun ? actionButtonText.sim : actionButtonText.exec}
        </button>
      </div>
    </>
  )
}
