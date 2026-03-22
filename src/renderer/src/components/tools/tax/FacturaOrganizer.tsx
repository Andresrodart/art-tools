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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase text-text-main">
          {t('tool_factura_organizer_title')}
        </h2>
      </div>

      <p className="text-text-main/80 border-l-4 border-bg-main-accent pl-4">
        {t('tool_factura_organizer_desc')}
      </p>

      <div className="neo-brutal-box flex flex-col gap-4 bg-white">
        <h3 className="text-xl font-bold border-b-2 border-black pb-2">Select Invoice Directory</h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="neo-brutal-input flex-1 bg-bg-main/20 cursor-not-allowed"
            placeholder="Select a directory containing .xml and .pdf CFDIs"
            value={selectedFolder || ''}
            readOnly
          />
          <button
            onClick={handleSelectFolder}
            className="neo-brutal-btn bg-bg-main-accent text-white whitespace-nowrap"
          >
            Browse Directory
          </button>
        </div>
      </div>

      {selectedFolder && (
        <div className="p-4 border-2 border-blue-500 bg-blue-100/50 text-blue-900 font-bold flex gap-2 items-center w-full">
          <span>ℹ️</span> Selected folder: {selectedFolder}. The full viewer and parsing logic will be implemented in future iterations.
        </div>
      )}
    </div>
  )
}
