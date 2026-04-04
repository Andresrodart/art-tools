import React from 'react'
import { useTranslation } from 'react-i18next'
import { COMMON_EXTENSIONS } from './types'
import { Task } from '../../../store/taskStore'

interface FileOrganizerInputProps {
  targetFolder: string | null
  selectedExtensions: string[]
  extensionInput: string
  setExtensionInput: (val: string) => void
  showExtDropdown: boolean
  setShowExtDropdown: (val: boolean) => void
  isDryRun: boolean
  setIsDryRun: (val: boolean) => void
  taskData?: Task
  addExtension: (ext: string) => void
  removeExtension: (ext: string) => void
  handleExtensionButtonClick: (e: React.MouseEvent) => void
  handleSelectFolder: () => void
  handleStartOrganize: () => void
}

export function FileOrganizerInput({
  targetFolder,
  selectedExtensions,
  extensionInput,
  setExtensionInput,
  showExtDropdown,
  setShowExtDropdown,
  isDryRun,
  setIsDryRun,
  taskData,
  addExtension,
  removeExtension,
  handleExtensionButtonClick,
  handleSelectFolder,
  handleStartOrganize
}: FileOrganizerInputProps): React.JSX.Element {
  const { t } = useTranslation()
  const isTaskRunning = taskData?.status === 'running' || taskData?.status === 'pending'

  return (
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
            <button className="brutalist-button" onClick={handleExtensionButtonClick} type="button">
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
}
