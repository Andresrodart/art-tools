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
 * Returns a unique path by checking existence using a custom verification function.
 * This is particularly useful for simulating file operations during a 'dry-run'
 * without actually creating files on disk.
 *
 * @param destinationFilePath The initial target file path to verify.
 * @param existenceCheckFunction A custom function that returns true if the path is considered "taken".
 * @returns A unique version of the target file path.
 */
export function getUniquePathWithCheck(
  destinationFilePath: string,
  existenceCheckFunction: (filePath: string) => boolean
): string {
  if (!existenceCheckFunction(destinationFilePath)) return destinationFilePath

  const { dir, ext, name } = parse(destinationFilePath)

  let collisionCounter = 1
  let uniquePath = join(dir, `${name}_${collisionCounter}${ext}`)

  while (existenceCheckFunction(uniquePath)) {
    collisionCounter++
    uniquePath = join(dir, `${name}_${collisionCounter}${ext}`)
  }

  return uniquePath
}
