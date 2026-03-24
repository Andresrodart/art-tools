import fs from 'fs'
import path from 'path'
import os from 'os'
import * as openpgp from 'openpgp'
import * as tar from 'tar'
import * as unzipper from 'unzipper'

const TEMP_DIR_PREFIX = 'art-tools-gpg-'

export interface ExtractedFile {
  name: string
  path: string
  isDirectory: boolean
}

export interface DecryptResult {
  tempFilePath: string
  mimeType: string
  originalFileName: string
  extractedFiles?: ExtractedFile[]
  extractedDir?: string
}

export async function listGpgFiles(folderPath: string): Promise<string[]> {
  try {
    const files = await fs.promises.readdir(folderPath)
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return ext === '.gpg' || ext === '.pgp' || ext === '.asc'
      })
      .map((file) => path.join(folderPath, file))
  } catch (error) {
    console.error('Error listing GPG files:', error)
    throw error
  }
}

export async function decryptGpgFile(filePath: string, passphrase: string): Promise<DecryptResult> {
  try {
    const encryptedData = await fs.promises.readFile(filePath)
    const message = await openpgp.readMessage({ binaryMessage: encryptedData })

    const { data: decryptedData } = await openpgp.decrypt({
      message,
      passwords: [passphrase],
      format: 'binary'
    })

    // Create a temporary directory for this specific decryption
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), TEMP_DIR_PREFIX))

    // Attempt to guess original filename by removing .gpg/.pgp/.asc extension
    let originalFileName = path.basename(filePath)
    const ext = path.extname(originalFileName).toLowerCase()
    if (ext === '.gpg' || ext === '.pgp' || ext === '.asc') {
      originalFileName = originalFileName.slice(0, -ext.length)
    } else {
      originalFileName = 'decrypted_file'
    }

    const tempFilePath = path.join(tempDir, originalFileName)
    await fs.promises.writeFile(tempFilePath, Buffer.from(decryptedData))

    let mimeType = 'application/octet-stream'
    const decryptedExt = path.extname(tempFilePath).toLowerCase()
    if (['.jpg', '.jpeg'].includes(decryptedExt)) mimeType = 'image/jpeg'
    else if (decryptedExt === '.png') mimeType = 'image/png'
    else if (decryptedExt === '.gif') mimeType = 'image/gif'
    else if (decryptedExt === '.webp') mimeType = 'image/webp'
    else if (decryptedExt === '.mp4') mimeType = 'video/mp4'
    else if (decryptedExt === '.webm') mimeType = 'video/webm'
    else if (decryptedExt === '.txt') mimeType = 'text/plain'
    else if (decryptedExt === '.md') mimeType = 'text/markdown'
    else if (decryptedExt === '.json') mimeType = 'application/json'
    else if (
      originalFileName.toLowerCase().endsWith('.tar.gz') ||
      originalFileName.toLowerCase().endsWith('.tgz') ||
      decryptedExt === '.tar'
    )
      mimeType = 'application/x-tar'
    else if (decryptedExt === '.zip') mimeType = 'application/zip'

    let extractedFiles: ExtractedFile[] | undefined
    let extractedDir: string | undefined

    // Extract tar/zip if applicable
    if (mimeType === 'application/x-tar' || mimeType === 'application/zip') {
      extractedDir = path.join(tempDir, 'extracted')
      await fs.promises.mkdir(extractedDir, { recursive: true })

      try {
        if (mimeType === 'application/x-tar') {
          await tar.x({
            file: tempFilePath,
            cwd: extractedDir
          })
        } else if (mimeType === 'application/zip') {
          await fs
            .createReadStream(tempFilePath)
            .pipe(unzipper.Extract({ path: extractedDir }))
            .promise()
        }

        // Recursively list extracted files
        const getFiles = async (dir: string, base: string = ''): Promise<ExtractedFile[]> => {
          const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
          let files: ExtractedFile[] = []
          for (const dirent of dirents) {
            const relativePath = path.join(base, dirent.name)
            const fullPath = path.join(dir, dirent.name)
            files.push({ name: relativePath, path: fullPath, isDirectory: dirent.isDirectory() })
            if (dirent.isDirectory()) {
              files = files.concat(await getFiles(fullPath, relativePath))
            }
          }
          return files
        }
        extractedFiles = await getFiles(extractedDir)
      } catch (err) {
        console.error('Failed to extract archive:', err)
      }
    }

    return { tempFilePath, mimeType, originalFileName, extractedFiles, extractedDir }
  } catch (error) {
    console.error('Error decrypting GPG file:', error)
    throw error
  }
}

export async function cleanupGpgTempFile(tempFilePath: string): Promise<void> {
  try {
    if (!tempFilePath || !tempFilePath.includes(TEMP_DIR_PREFIX)) return

    // Check if it's within our managed temp directories
    const tempDir = path.dirname(tempFilePath)
    if (!path.basename(tempDir).startsWith(TEMP_DIR_PREFIX)) {
      return
    }

    await fs.promises.unlink(tempFilePath)
    await fs.promises.rmdir(tempDir)
  } catch (error) {
    console.error('Error cleaning up temporary GPG file:', error)
    // Non-fatal, just log it
  }
}
