/**
 * Represents the result of a single file organization operation.
 */
export interface OrganizeResult {
  /** The original source path of the file. */
  source: string
  /** The final destination path where the file was moved. */
  destination: string
  /** Whether the file move was successful. */
  success: boolean
  /** Whether the file's filesystem timestamp was corrected using EXIF metadata. */
  timestampCorrected?: boolean
  /** Descriptive error message if the operation failed. */
  error?: string
}

/**
 * Represents the result of a folder metadata operation.
 */
export interface MetadataResult {
  /** Original name of the folder. */
  originalName: string
  /** New name of the folder with metadata appended. */
  newName: string
  /** Original absolute path of the folder. */
  originalPath: string
  /** New absolute path of the folder. */
  newPath: string
  /** Indicates if the renaming was successful. */
  success: boolean
  /** Error message if the renaming failed. */
  error?: string
}

/**
 * Represents the result of a file scraping operation.
 */
export interface ScraperResult {
  /** The original path of the file before processing. */
  originalPath: string
  /** The new path of the file after processing. */
  newPath: string
  /** Whether the file was successfully moved. */
  success: boolean
  /** Descriptive error message if the operation failed. */
  error?: string
  /** Whether the error occurred on a directory level (e.g., permission denied). */
  isDirectoryError?: boolean
}

/**
 * Represents the result of a folder merging operation.
 */
export interface MergerResult {
  /** The list of original absolute paths of the folders that were merged. */
  originalPaths: string[]
  /** The newly created merged folder path containing all items. */
  newPath: string
  /** Whether the merge operation was successful. */
  success: boolean
  /** Descriptive error message if the merge failed. */
  error?: string
}
