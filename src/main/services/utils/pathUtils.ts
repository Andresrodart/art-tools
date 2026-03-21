import { join, parse } from 'path'
import { promises as fs } from 'fs'

/**
 * Generates a unique filename in the destination directory to prevent overwrites.
 * e.g., if "image.jpg" exists, returns "image_1.jpg".
 */
export async function getUniqueFilePath(
  destDir: string,
  originalName: string,
  ext: string
): Promise<string> {
  let newName = `${originalName}${ext}`
  let newPath = join(destDir, newName)
  let counter = 1

  while (true) {
    try {
      await fs.stat(newPath)
      // File exists, try another name
      newName = `${originalName}_${counter}${ext}`
      newPath = join(destDir, newName)
      counter++
    } catch {
      // stat throws if file doesn't exist, which means this path is safe to use
      break
    }
  }

  return newPath
}

/**
 * Returns a unique path by checking existence using a custom function.
 * Used for dry-run simulations.
 */
export function getUniquePathWithCheck(
  destPath: string,
  checkExists: (p: string) => boolean
): string {
  if (!checkExists(destPath)) return destPath

  const { dir, ext, name } = parse(destPath)

  let counter = 1
  let newPath = join(dir, `${name}_${counter}${ext}`)

  while (checkExists(newPath)) {
    counter++
    newPath = join(dir, `${name}_${counter}${ext}`)
  }

  return newPath
}
