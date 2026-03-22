import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileManagerInput } from '../../common/FileManagerInput'
import { PresetKey } from './types'

interface FileScraperInputProps {
  sourcePath: string | null
  destinationPath: string | null
  ignorePaths: string[]
  preset: PresetKey
  customExtensions: string
  isDryRun: boolean
  isTaskRunning: boolean
  handleSelectFolder: (isSource: boolean) => Promise<void>
  handleAddIgnorePath: () => Promise<void>
  handleRemoveIgnorePath: (pathToRemove: string) => void
  setPreset: (preset: PresetKey) => void
  getActiveExtensions: () => string[]
  handleRemoveExtension: (extToRemove: string) => void
  setCustomExtensions: (exts: string) => void
  setIsDryRun: (isDryRun: boolean) => void
  handleStartTask: () => Promise<void>
}

export function FileScraperInput({
  sourcePath,
  destinationPath,
  ignorePaths,
  preset,
  customExtensions,
  isDryRun,
  isTaskRunning,
  handleSelectFolder,
  handleAddIgnorePath,
  handleRemoveIgnorePath,
  setPreset,
  getActiveExtensions,
  handleRemoveExtension,
  setCustomExtensions,
  setIsDryRun,
  handleStartTask
}: FileScraperInputProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <FileManagerInput
      sourcePath={sourcePath}
      destinationPath={destinationPath}
      ignorePaths={ignorePaths}
      isDryRun={isDryRun}
      isTaskRunning={isTaskRunning}
      handleSelectFolder={handleSelectFolder}
      handleAddIgnorePath={handleAddIgnorePath}
      handleRemoveIgnorePath={handleRemoveIgnorePath}
      setIsDryRun={setIsDryRun}
      handleStartTask={handleStartTask}
      dryRunHelpText={t('dry_run_help_scraper')}
      actionButtonText={{
        sim: t('btn_sim_scraper'),
        exec: t('btn_exec_scraper')
      }}
    >
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
    </FileManagerInput>
  )
}
