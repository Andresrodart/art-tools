import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import React from 'react'

export const FacturaOrganizer = (): React.JSX.Element => {
  const { t } = useTranslation()
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const handleSelectFolder = async (): Promise<void> => {
    const folderPath = await window.api.selectFolder()
    if (folderPath) {
      setSelectedFolder(folderPath)
    }
  }

  return (
    <div className="tool-view">
      <div className="tool-view-description">
        <h2>{t('tool_factura_organizer_title')}</h2>
        <p>{t('tool_factura_organizer_desc')}</p>
      </div>

      <div className="tool-view-section">
        <h3 className="tool-view-section-title">Select Invoice Directory</h3>
        <div className="tool-view-section-body">
          <div className="control-group">
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="brutalist-input flex-grow"
                placeholder="Select a directory containing .xml and .pdf CFDIs"
                value={selectedFolder || ''}
                readOnly
              />
              <button onClick={handleSelectFolder} className="brutalist-button info">
                {t('browse')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedFolder && (
        <div className="tool-view-section" style={{ marginTop: '1.5rem' }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
            ℹ️ Selected folder: {selectedFolder}. The full viewer and parsing logic will be
            implemented in future iterations.
          </div>
        </div>
      )}
    </div>
  )
}
