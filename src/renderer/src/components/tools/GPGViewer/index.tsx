import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGPGViewer } from './useGPGViewer'
import { ToolView } from '../../layout/ToolView'

export function GPGViewer(): React.JSX.Element {
  const { t } = useTranslation()
  const {
    folderPath,
    files,
    selectedFile,
    isDecrypting,
    decryptError,
    decryptedFile,
    selectedExtractedFile,
    handleSelectFolder,
    handleSelectFile,
    handleSelectExtractedFile,
    handleDecrypt,
    handleCloseViewer,
    handleSaveFile
  } = useGPGViewer()

  const [passphrase, setPassphrase] = useState('')

  const handleDecryptSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!passphrase) return
    handleDecrypt(passphrase)
    setPassphrase('') // Clear immediately for security
  }

  const renderViewer = (): React.JSX.Element | null => {
    if (!decryptedFile) return null

    // We use the custom protocol we registered in main/index.ts
    // Encode the path to handle spaces and special characters correctly.
    // Ensure we handle Windows paths by replacing backslashes with forward slashes for the URL
    const normalizedPath = decryptedFile.tempFilePath.replace(/\\/g, '/')
    const fileUrl = `gpg-media://${encodeURIComponent(normalizedPath)}`

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b-4 border-black dark:border-white bg-blue-100 dark:bg-blue-900">
            <div className="flex items-center gap-2">
              {selectedExtractedFile && (
                <button
                  onClick={() => handleSelectExtractedFile(null)}
                  className="brutalist-button small"
                  style={{ padding: '4px 8px' }}
                >
                  &larr; Back
                </button>
              )}
              <h3 className="text-xl font-bold truncate pr-4">
                {selectedExtractedFile
                  ? selectedExtractedFile.name.split(/[/\\]/).pop()
                  : decryptedFile.originalFileName}
              </h3>
            </div>

            <div className="flex gap-2">
              {(!decryptedFile.extractedFiles || selectedExtractedFile) && (
                <button
                  onClick={() =>
                    handleSaveFile(
                      selectedExtractedFile?.path,
                      selectedExtractedFile?.name.split(/[/\\]/).pop()
                    )
                  }
                  className="brutalist-button info small"
                >
                  Save As...
                </button>
              )}
              <button onClick={handleCloseViewer} className="brutalist-button danger small">
                {t('gpg_close_viewer')}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
            {decryptedFile.extractedFiles && !selectedExtractedFile ? (
              <div className="w-full h-full bg-white dark:bg-black p-4 font-mono overflow-auto border-2 border-black dark:border-white flex flex-col">
                <h4 className="font-bold mb-4 border-b-2 border-black dark:border-white pb-2 uppercase">
                  Extracted Archive Contents ({decryptedFile.extractedFiles.length})
                </h4>
                <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {decryptedFile.extractedFiles.map((file) => (
                    <li key={file.path}>
                      <button
                        onClick={() => !file.isDirectory && handleSelectExtractedFile(file)}
                        disabled={file.isDirectory}
                        className={`w-full flex items-center gap-3 p-2 text-left border-[var(--border-width)] border-[var(--border-color)] transition-all ${
                          file.isDirectory
                            ? 'bg-[var(--bg-color)] opacity-70 cursor-not-allowed'
                            : 'bg-white hover:bg-blue-100 dark:bg-zinc-800 dark:hover:bg-blue-900 active:translate-y-0.5 shadow-[2px_2px_0px_var(--border-color)]'
                        }`}
                      >
                        <span className="text-xl">{file.isDirectory ? '📁' : '📄'}</span>
                        <span className="break-all font-bold">{file.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {decryptedFile.mimeType.startsWith('image/') && (
                  <img
                    src={fileUrl}
                    alt="Decrypted"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                {decryptedFile.mimeType.startsWith('video/') && (
                  <video src={fileUrl} controls className="max-w-full max-h-full" />
                )}
                {decryptedFile.mimeType.startsWith('text/') ||
                decryptedFile.mimeType === 'application/json' ? (
                  <iframe
                    src={fileUrl}
                    className="w-full h-full bg-white dark:bg-black font-mono p-4"
                    title="Decrypted Text"
                  />
                ) : (
                  !decryptedFile.mimeType.startsWith('image/') &&
                  !decryptedFile.mimeType.startsWith('video/') &&
                  !decryptedFile.mimeType.startsWith('text/') &&
                  decryptedFile.mimeType !== 'application/json' && (
                    <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500 flex flex-col items-center">
                      <p className="font-bold">Preview not available for this file type.</p>
                      <p className="text-sm mt-2 mb-4">MIME Type: {decryptedFile.mimeType}</p>
                      <button onClick={() => handleSaveFile()} className="brutalist-button info">
                        Save As...
                      </button>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const inputSection = (
    <div className="control-group">
      <label>{t('gpg_select_folder')}</label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          readOnly
          value={folderPath || t('no_folder_selected')}
          className="brutalist-input flex-grow"
        />
        <button className="brutalist-button info" onClick={handleSelectFolder}>
          {t('browse')}
        </button>
      </div>
    </div>
  )

  const outputSection = folderPath ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* File List */}
      <div className="brutalist-panel flex flex-col h-[400px]">
        <div className="p-3 border-b-[var(--border-width)] border-[var(--border-color)] bg-[var(--bg-color)] font-bold uppercase">
          GPG Files ({files.length})
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {files.length === 0 ? (
            <div className="p-4 text-center italic" style={{ color: 'var(--text-color)' }}>
              {t('gpg_no_files')}
            </div>
          ) : (
            files.map((file) => {
              // Extract filename properly considering windows backslashes and posix forward slashes
              const fileName = file.replace(/\\/g, '/').split('/').pop() || file
              const isSelected = selectedFile === file
              return (
                <button
                  key={file}
                  onClick={() => handleSelectFile(file)}
                  className={`brutalist-button w-full text-left p-3 font-mono truncate transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-primary)] font-bold translate-x-2 shadow-[4px_4px_0_var(--border-color)]'
                      : 'bg-[var(--bg-color)] hover:bg-[var(--accent-secondary)]'
                  }`}
                >
                  {fileName}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Decryption Panel */}
      <div className="brutalist-panel flex flex-col p-6">
        {!selectedFile ? (
          <div
            className="flex-1 flex items-center justify-center italic text-lg text-center"
            style={{ color: 'var(--text-color)' }}
          >
            Select a file from the list to decrypt
          </div>
        ) : (
          <form onSubmit={handleDecryptSubmit} className="flex flex-col h-full">
            <h3 className="text-xl font-bold mb-4 uppercase pb-2 border-b-[var(--border-width)] border-[var(--border-color)]">
              Unencrypt File
            </h3>
            <div className="mb-4">
              <p className="font-mono text-sm break-all mb-2">
                {t('gpg_enter_passphrase')} <br />
                <strong>{selectedFile.replace(/\\/g, '/').split('/').pop()}</strong>
              </p>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={t('gpg_passphrase_placeholder')}
                className="brutalist-input w-full font-mono"
                autoFocus
              />
            </div>

            {decryptError && (
              <div
                className="mb-4 p-3 font-bold"
                style={{
                  backgroundColor: 'var(--accent-danger)',
                  color: 'white',
                  border: 'var(--border-width) solid var(--border-color)'
                }}
              >
                {t(decryptError)}
              </div>
            )}

            <button
              type="submit"
              disabled={isDecrypting || !passphrase}
              className={`mt-auto brutalist-button w-full uppercase text-xl py-4 ${
                isDecrypting || !passphrase ? '' : 'primary'
              }`}
              style={{
                cursor: isDecrypting || !passphrase ? 'not-allowed' : 'pointer',
                opacity: isDecrypting || !passphrase ? 0.7 : 1
              }}
            >
              {isDecrypting ? t('gpg_decrypting') : 'UNENCRYPT & VIEW'}
            </button>

            <div
              className="mt-4 p-3 text-sm"
              style={{
                backgroundColor: 'var(--accent-warning)',
                border: 'var(--border-width) solid var(--border-color)',
                color: 'black'
              }}
            >
              {t('gpg_passphrase_note')}
            </div>
          </form>
        )}
      </div>
    </div>
  ) : null

  return (
    <>
      <ToolView
        description={t('tool_gpg_viewer_desc')}
        inputSection={inputSection}
        outputSection={outputSection}
      />
      {renderViewer()}
    </>
  )
}

export default GPGViewer
