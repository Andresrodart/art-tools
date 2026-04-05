import { join, parse } from 'path'
import { promises as fs } from 'fs'

/**
 * Generates a unique filename in the destination directory to prevent overwrites.
 * For example, if "image.jpg" already exists, this function will return "image_1.jpg".
 * It checks the physical filesystem for file existence.
 *
 * @param destinationDirectory The directory where the file will be placed.
 * @param originalFilenameWithoutExtension The name of the file before its extension.
 * @param fileExtension The file extension (e.g., ".jpg").
 * @returns An absolute path that is guaranteed not to exist in the filesystem at the time of calculation.
 */
export async function getUniqueFilePath(
  destinationDirectory: string,
  originalFilenameWithoutExtension: string,
  fileExtension: string
): Promise<string> {
  let uniqueName = `${originalFilenameWithoutExtension}${fileExtension}`
  let uniquePath = join(destinationDirectory, uniqueName)
  let collisionCounter = 1

  while (true) {
    try {
      await fs.stat(uniquePath)
      // If fs.stat() succeeds, the file exists, so we must generate a new name
      uniqueName = `${originalFilenameWithoutExtension}_${collisionCounter}${fileExtension}`
      uniquePath = join(destinationDirectory, uniqueName)
      collisionCounter++
    } catch {
      // If fs.stat() throws, the file likely doesn't exist, so this path is safe to use
      break
    }
  }

  return uniquePath
}

/**
 * Validates that a URL uses a safe protocol for external opening.
 * Only 'http:' and 'https:' are considered safe to prevent
 * potential security risks like 'file:' access or 'javascript:' execution.
 *
 * @param urlString The URL to validate.
 * @returns True if the protocol is http or https, false otherwise.
 */
export function isValidExternalProtocol(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validates if the provided path is safe to open.
 * Returns information about the path if it exists and is valid.
 *
 * @param targetPath The path to validate.
 * @returns A promise resolving to an object with safety info, or null if invalid.
 */
export async function getSafePathInfo(
  targetPath: string
): Promise<{ exists: boolean; isDirectory: boolean } | null> {
  if (typeof targetPath !== 'string' || !targetPath) {
    return null
  }

  try {
    const stats = await fs.stat(targetPath)
    return {
      exists: true,
      isDirectory: stats.isDirectory()
    }
  } catch {
    return null
  }
}

/**
 * Validates if the provided path is a string, exists, and is a directory.
 * This is used to ensure that shell.openPath is only called on directories,
 * preventing arbitrary file execution of malicious scripts or binaries.
 *
 * @param targetPath The path to validate.
 * @returns A promise resolving to true if valid, false otherwise.
 */
export async function isSafeDirectory(targetPath: string): Promise<boolean> {
  const info = await getSafePathInfo(targetPath)
  return !!info && info.isDirectory
}

/**
 * Returns a unique path by checking existence using a custom verification function.
 * This is particularly useful for simulating file operations during a 'dry-run'
 * without actually creating files on disk.
 *
 * @param destinationFilePath The initial target file path to verify.
 * @param existenceCheckFunction A custom function that returns true if the path is considered "taken".
 * @returns A promise resolving to a unique version of the target file path.
 */
export async function getUniquePathWithCheck(
  destinationFilePath: string,
  existenceCheckFunction: (filePath: string) => boolean | Promise<boolean>
): Promise<string> {
  if (!(await existenceCheckFunction(destinationFilePath))) return destinationFilePath

  const { dir, ext, name } = parse(destinationFilePath)

  let collisionCounter = 1
  let uniquePath = join(dir, `${name}_${collisionCounter}${ext}`)

  while (await existenceCheckFunction(uniquePath)) {
    collisionCounter++
    uniquePath = join(dir, `${name}_${collisionCounter}${ext}`)
  }

  return uniquePath
}
