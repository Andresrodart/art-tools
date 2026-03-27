export interface TreeNode {
  name: string
  fullPath: string
  filesCount: number
  isError: boolean
  isDirectory: boolean
  errorMsg?: string
  children: Record<string, TreeNode>
}

export interface BaseTaskResult {
  originalPath: string
  newPath: string
  success: boolean
  error?: string
  isDirectoryError?: boolean
}
