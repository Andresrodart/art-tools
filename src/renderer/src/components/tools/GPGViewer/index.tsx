import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderTree } from '../../common/FolderTree'
import { buildArchiveTree } from '../../common/utils'
import { TreeNode } from '../../common/types'
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
    handleSelectFolder,
    handleSelectFile,
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

  const renderArchiveNodeAction = (node: TreeNode): React.ReactNode => {
    if (node.isDirectory) return null
    return (
      <button
        onClick={() => handleSaveFile(node.fullPath, node.name)}
        className="brutalist-button primary small flex-shrink-0"
        style={{ minWidth: '100px' }}
      >
        SAVE AS...
      </button>
    )
  }

  const renderViewer = (): React.JSX.Element | null => {
    if (!decryptedFile) return null

    const normalizedPath = decryptedFile.tempFilePath.replace(/\\/g, '/')
    const fileUrl = `gpg-media://${encodeURIComponent(normalizedPath)}`

    const archiveTree = decryptedFile.extractedFiles
      ? buildArchiveTree(decryptedFile.extractedFiles, decryptedFile.originalFileName)
      : null

    return (
      <div className="tool-output-summary" style={{ marginTop: 0 }}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b-[var(--border-width)] border-[var(--border-color)]">
          <h3 className="text-xl font-bold truncate pr-4">{decryptedFile.originalFileName}</h3>
          <button onClick={handleCloseViewer} className="brutalist-button danger small px-4">
            {t('gpg_close_viewer').toUpperCase()}
          </button>
        </div>

        <div className="flex-1 min-h-[400px] flex items-center justify-center p-6 border-[var(--border-width)] border-[var(--border-color)] bg-[var(--bg-color)] shadow-[4px_4px_0_var(--border-color)]">
          {archiveTree ? (
            <div className="w-full h-full font-mono flex flex-col">
              <h4 className="font-bold mb-4 border-b-[var(--border-width)] border-[var(--border-color)] pb-2 uppercase text-lg">
                Archive Explorer ({decryptedFile.extractedFiles?.length || 0} items)
              </h4>
              <div className="overflow-y-auto max-h-[60vh] pr-2">
                <FolderTree node={archiveTree} renderAction={renderArchiveNodeAction} depth={0} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl py-12 p-6">
              <div className="text-7xl">🔓</div>
              <div className="text-center">
                <p className="text-2xl font-bold mb-3 uppercase tracking-wider">
                  Decryption Successful!
                </p>
                <div className="p-4 bg-[var(--bg-color-alt)] border-[var(--border-width)] border-[var(--border-color)] font-mono text-lg break-all">
                  {decryptedFile.originalFileName}
                </div>
              </div>

              {decryptedFile.mimeType.startsWith('image/') && (
                <div className="w-full flex justify-center border-[var(--border-width)] border-[var(--border-color)] p-2 bg-white">
                  <img
                    src={fileUrl}
                    alt="Decrypted"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                </div>
              )}

              {decryptedFile.mimeType.startsWith('video/') && (
                <div className="w-full flex justify-center border-[var(--border-width)] border-[var(--border-color)] p-2 bg-black">
                  <video src={fileUrl} controls className="max-w-full max-h-[400px]" />
                </div>
              )}

              <button
                onClick={() => handleSaveFile()}
                className="brutalist-button success text-xl px-12 py-4"
              >
                {t('gpg_save_decrypted').toUpperCase()}
              </button>
            </div>
          )}
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

  const progressSection = (
    <div className="p-4 text-center">
      <div className="mb-4 animate-pulse text-xl font-bold">{t('gpg_decrypting')}...</div>
      <div className="tool-progress-bar-container">
        <div className="tool-progress-bar-fill w-full animate-marquee" />
      </div>
    </div>
  )

  const outputSection = (
    <>
      {decryptedFile ? (
        renderViewer()
      ) : folderPath ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File List */}
          <div className="brutalist-panel flex flex-col h-[500px]">
            <div className="p-3 border-b-[var(--border-width)] border-[var(--border-color)] bg-[var(--bg-color)] font-bold uppercase tracking-wide">
              GPG Files ({files.length})
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2 bg-[var(--bg-color-alt)]">
              {files.length === 0 ? (
                <div className="p-8 text-center italic text-[#666]">{t('gpg_no_files')}</div>
              ) : (
                files.map((file) => {
                  const fileName = file.replace(/\\/g, '/').split('/').pop() || file
                  const isSelected = selectedFile === file
                  return (
                    <button
                      key={file}
                      onClick={() => handleSelectFile(file)}
                      className={`brutalist-button w-full text-left p-4 font-mono truncate transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] font-bold translate-x-3 shadow-[6px_6px_0_var(--border-color)] z-10'
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
          <div className="brutalist-panel flex flex-col p-8 bg-[var(--bg-color)]">
            {!selectedFile ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4 p-10">
                <div className="text-6xl">📁</div>
                <p className="text-xl italic">Select a file from the list to decrypt</p>
              </div>
            ) : (
              <form onSubmit={handleDecryptSubmit} className="flex flex-col h-full">
                <h3 className="text-2xl font-bold mb-6 uppercase pb-3 border-b-[var(--border-width)] border-[var(--border-color)] tracking-wider">
                  Unencrypt File
                </h3>
                <div className="mb-8">
                  <p className="font-mono text-sm break-all mb-4 bg-[var(--bg-color-alt)] p-3 border border-[var(--border-color)]">
                    {t('gpg_enter_passphrase')} <br />
                    <strong className="text-lg mt-1 block">
                      {selectedFile.replace(/\\/g, '/').split('/').pop()}
                    </strong>
                  </p>
                  <label className="block mb-2 font-bold uppercase text-xs tracking-widest">
                    {t('gpg_passphrase_label') || 'Secret Passphrase'}
                  </label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder={t('gpg_passphrase_placeholder')}
                    className="brutalist-input w-full font-mono text-lg py-4"
                    autoFocus
                  />
                </div>

                {decryptError && (
                  <div
                    className="mb-6 p-4 font-bold animate-shake"
                    style={{
                      backgroundColor: 'var(--accent-danger)',
                      color: 'white',
                      border: 'var(--border-width) solid var(--border-color)',
                      boxShadow: '4px 4px 0 var(--border-color)'
                    }}
                  >
                    ⚠️ {t(decryptError)}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isDecrypting || !passphrase}
                  className={`mt-auto brutalist-button w-full uppercase text-2xl py-6 ${
                    isDecrypting || !passphrase ? '' : 'primary'
                  }`}
                  style={{
                    cursor: isDecrypting || !passphrase ? 'not-allowed' : 'pointer',
                    opacity: isDecrypting || !passphrase ? 0.7 : 1
                  }}
                >
                  {isDecrypting ? t('gpg_decrypting').toUpperCase() : 'UNENCRYPT & VIEW'}
                </button>

                <div
                  className="mt-6 p-4 text-sm font-bold italic"
                  style={{
                    backgroundColor: 'var(--accent-warning)',
                    border: 'var(--border-width) solid var(--border-color)',
                    color: 'black'
                  }}
                >
                  💡 {t('gpg_passphrase_note')}
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )

  return (
    <ToolView
      description={t('tool_gpg_viewer_desc')}
      inputSection={inputSection}
      progressSection={isDecrypting ? progressSection : null}
      outputSection={outputSection}
    />
  )
}

export default GPGViewer
