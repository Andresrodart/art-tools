import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderTree } from '../../common/FolderTree'
import { buildArchiveTree } from '../../common/utils'
import { TreeNode } from '../../common/types'
import { DecryptedFile, useGPGViewer } from './useGPGViewer'
import { ToolView } from '../../layout/ToolView'
import styles from './GPGViewer.module.scss'

/**
 * Result View Component: Displays the decrypted archive tree or file preview
 */
function GPGResultView({
  decryptedFile,
  onClose,
  onSave,
  renderAction
}: {
  decryptedFile: DecryptedFile
  onClose: () => void
  onSave: (path?: string, name?: string) => Promise<void>
  renderAction: (node: TreeNode) => React.ReactNode
}): React.JSX.Element | null {
  const { t } = useTranslation()
  if (!decryptedFile) return null

  const normalizedPath = decryptedFile.tempFilePath.replace(/\\/g, '/')
  const fileUrl = `gpg-media://${encodeURIComponent(normalizedPath)}`

  const archiveTree = decryptedFile.extractedFiles
    ? buildArchiveTree(decryptedFile.extractedFiles, decryptedFile.originalFileName)
    : null

  return (
    <div className={styles.resultContainer}>
      <div className={styles.resultHeader}>
        <h3>{decryptedFile.originalFileName}</h3>
        <button onClick={onClose} className="brutalist-button danger small px-4">
          {t('gpg_close_viewer').toUpperCase()}
        </button>
      </div>

      <div className={styles.resultBody}>
        {archiveTree ? (
          <div className={styles.archiveExplorer}>
            <h4>Archive Explorer ({decryptedFile.extractedFiles?.length || 0} items)</h4>
            <div className={styles.treeScroll}>
              <FolderTree node={archiveTree} renderAction={renderAction} depth={0} />
            </div>
          </div>
        ) : (
          <div className={styles.decryptionSuccess}>
            <div className={styles.icon}>🔓</div>
            <div className={styles.centerText}>
              <p className={styles.title}>Decryption Successful!</p>
              <div className={styles.fileName}>{decryptedFile.originalFileName}</div>
            </div>

            {decryptedFile.mimeType.startsWith('image/') && (
              <div className={styles.previewImage}>
                <img src={fileUrl} alt="Decrypted" />
              </div>
            )}

            {decryptedFile.mimeType.startsWith('video/') && (
              <div className={styles.previewVideo}>
                <video src={fileUrl} controls />
              </div>
            )}

            <button
              onClick={() => onSave()}
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

/**
 * File List Component: Displays the found GPG files in the selected folder
 */
function GPGFileList({
  files,
  selectedFile,
  onSelect
}: {
  files: string[]
  selectedFile: string | null
  onSelect: (file: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className={styles.fileListPanel}>
      <div className={styles.header}>GPG Files ({files.length})</div>
      <div className={styles.listBody}>
        {files.length === 0 ? (
          <div className={styles.empty}>{t('gpg_no_files')}</div>
        ) : (
          files.map((file) => {
            const fileName = file.replace(/\\/g, '/').split('/').pop() || file
            const isSelected = selectedFile === file
            return (
              <button
                key={file}
                onClick={() => onSelect(file)}
                className={`brutalist-button w-full text-left p-4 font-mono truncate transition-all ${
                  isSelected
                    ? 'primary active shadow-[6px_6px_0_var(--border-color)] z-10 translate-x-3'
                    : ''
                }`}
              >
                {fileName}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * Decryption Panel Component: Passphrase entry and decryption trigger
 */
function GPGDecryptionPanel({
  selectedFile,
  isDecrypting,
  decryptError,
  onSubmit
}: {
  selectedFile: string | null
  isDecrypting: boolean
  decryptError: string | null
  onSubmit: (passphrase: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!passphrase) return
    onSubmit(passphrase)
    setPassphrase('')
  }

  if (!selectedFile) {
    return (
      <div className={styles.decryptionPanel}>
        <div className={styles.emptyState}>
          <div className={styles.icon}>📁</div>
          <p>Select a file from the list to decrypt</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.decryptionPanel}>
      <form onSubmit={handleSubmit}>
        <h3 className={styles.title}>Unencrypt File</h3>
        <div className={styles.field}>
          <div className={styles.note}>
            {t('gpg_enter_passphrase')} <br />
            <strong>{selectedFile.replace(/\\/g, '/').split('/').pop()}</strong>
          </div>
          <label>{t('gpg_passphrase_label') || 'Secret Passphrase'}</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder={t('gpg_passphrase_placeholder')}
            className="brutalist-input w-full font-mono text-lg py-4"
            autoFocus
          />
        </div>

        {decryptError && <div className={styles.error}>⚠️ {t(decryptError)}</div>}

        <button
          type="submit"
          disabled={isDecrypting || !passphrase}
          className={`${styles.submitButton} ${isDecrypting || !passphrase ? '' : 'primary'}`}
          style={{
            cursor: isDecrypting || !passphrase ? 'not-allowed' : 'pointer',
            opacity: isDecrypting || !passphrase ? 0.7 : 1
          }}
        >
          {isDecrypting ? t('gpg_decrypting').toUpperCase() : 'UNENCRYPT & VIEW'}
        </button>

        <div className={styles.passphraseNote}>💡 {t('gpg_passphrase_note')}</div>
      </form>
    </div>
  )
}

/**
 * Main GPGViewer Component
 */
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
    <div className={styles.viewerContainer}>
      {decryptedFile ? (
        <GPGResultView
          decryptedFile={decryptedFile}
          onClose={handleCloseViewer}
          onSave={handleSaveFile}
          renderAction={renderArchiveNodeAction}
        />
      ) : folderPath ? (
        <div className={styles.outputGrid}>
          <GPGFileList files={files} selectedFile={selectedFile} onSelect={handleSelectFile} />
          <GPGDecryptionPanel
            selectedFile={selectedFile}
            isDecrypting={isDecrypting}
            decryptError={decryptError}
            onSubmit={handleDecrypt}
          />
        </div>
      ) : null}
    </div>
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
