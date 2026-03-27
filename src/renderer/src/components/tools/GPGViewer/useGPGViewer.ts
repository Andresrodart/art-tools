import { useState, useEffect } from 'react'

export interface DecryptedFile {
  tempFilePath: string
  mimeType: string
  originalFileName: string
  extractedFiles?: { name: string; path: string; isDirectory: boolean }[]
  extractedDir?: string
}

interface UseGPGViewerResult {
  folderPath: string | null
  files: string[]
  selectedFile: string | null
  isDecrypting: boolean
  decryptError: string | null
  decryptedFile: DecryptedFile | null
  handleSelectFolder: () => Promise<void>
  handleSelectFile: (file: string) => void
  handleDecrypt: (passphrase: string) => Promise<void>
  handleCloseViewer: () => Promise<void>
  handleSaveFile: (customPath?: string, customName?: string) => Promise<void>
}

export function useGPGViewer(): UseGPGViewerResult {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState<string | null>(null)
  const [decryptedFile, setDecryptedFile] = useState<DecryptedFile | null>(null)

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const path = await window.api.selectFolder()
      if (path) {
        setFolderPath(path)
        const fileList = await window.api.listGpgFiles(path)
        setFiles(fileList)
        // Reset state on new folder
        setSelectedFile(null)
        setDecryptedFile(null)
        setDecryptError(null)
      }
    } catch (error) {
      console.error('Error selecting folder:', error)
    }
  }

  const handleSelectFile = (file: string): void => {
    setSelectedFile(file)
    setDecryptError(null)
    setDecryptedFile(null) // Close any open viewer
  }

  const handleDecrypt = async (passphrase: string): Promise<void> => {
    if (!selectedFile) return
    setIsDecrypting(true)
    setDecryptError(null)

    try {
      const result = await window.api.decryptGpgFile(selectedFile, passphrase)
      setDecryptedFile(result)
    } catch (error) {
      console.error('Decryption failed:', error)
      setDecryptError('gpg_error')
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleCloseViewer = async (): Promise<void> => {
    if (decryptedFile?.tempFilePath) {
      try {
        await window.api.cleanupGpgTempFile(decryptedFile.tempFilePath)
      } catch (error) {
        console.error('Error cleaning up temp file:', error)
      }
    }
    setDecryptedFile(null)
  }

  const handleSaveFile = async (customPath?: string, customName?: string): Promise<void> => {
    const pathToSave = customPath || decryptedFile?.tempFilePath
    const nameToSave = customName || decryptedFile?.originalFileName
    if (pathToSave && nameToSave) {
      try {
        await window.api.saveGpgFile(pathToSave, nameToSave)
      } catch (error) {
        console.error('Error saving file:', error)
      }
    }
  }

  // Cleanup on unmount or when selecting a different file/folder
  useEffect(() => {
    const currentDecryptedFile = decryptedFile
    return () => {
      if (currentDecryptedFile?.tempFilePath) {
        window.api.cleanupGpgTempFile(currentDecryptedFile.tempFilePath).catch(console.error)
      }
    }
  }, [decryptedFile])

  return {
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
  }
}
