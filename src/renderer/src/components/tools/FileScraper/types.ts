export interface FileScraperResult {
  originalPath: string
  newPath: string
  success: boolean
  error?: string
  isDirectoryError?: boolean
}

export const PRESETS = {
  Images: [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.svg',
    '.webp',
    '.raw',
    '.cr2',
    '.cr3',
    '.nef',
    '.arw',
    '.dng',
    '.orf',
    '.rw2',
    '.raf'
  ],
  Videos: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  Audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
  Documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv', '.xlsx']
}

export type PresetKey = keyof typeof PRESETS | 'Custom' | 'All'

export interface TreeNode {
  name: string
  fullPath: string
  filesCount: number
  isError: boolean
  errorMsg?: string
  children: Record<string, TreeNode>
}
