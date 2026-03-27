import { TreeNode, BaseTaskResult } from './types'

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}

export const buildTree = (results: BaseTaskResult[], sourcePath: string | null): TreeNode => {
  const root: TreeNode = {
    name: sourcePath ? sourcePath.split(/[/\\]/).pop() || 'Root' : 'Root',
    fullPath: sourcePath || '',
    filesCount: 0,
    isError: false,
    isDirectory: true,
    children: {}
  }

  const base = sourcePath ? normalizePath(sourcePath) : ''

  results.forEach((res) => {
    const isDirError = !!res.isDirectoryError
    const fullNormalized = normalizePath(res.originalPath)

    let rel = fullNormalized
    if (base && fullNormalized.startsWith(base)) {
      rel = fullNormalized.substring(base.length)
      if (rel.startsWith('/')) rel = rel.substring(1)
    }

    if (!rel) return

    const parts = rel.split('/')
    // If it's a dirError, path leads exactly to the error folder, else we strip filename
    const folderParts = isDirError ? parts : parts.slice(0, -1)

    let current = root
    let builtPath = base

    folderParts.forEach((part) => {
      builtPath = builtPath ? `${builtPath}/${part}` : part
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: builtPath.replace(/\//g, '\\'), // Revert to Windows path formatting natively
          filesCount: 0,
          isError: false,
          isDirectory: true,
          children: {}
        }
      }
      current = current.children[part]
    })

    if (isDirError) {
      current.isError = true
      current.errorMsg = res.error
    } else {
      current.filesCount += 1
    }
  })

  // compute recursive counts
  const computeCounts = (node: TreeNode): number => {
    let sum = node.filesCount
    Object.values(node.children).forEach((child) => {
      sum += computeCounts(child)
    })
    node.filesCount = sum
    return sum
  }
  computeCounts(root)

  return root
}

export const buildArchiveTree = (
  files: { name: string; path: string; isDirectory: boolean }[],
  rootName: string
): TreeNode => {
  const root: TreeNode = {
    name: rootName,
    fullPath: rootName,
    filesCount: 0,
    isError: false,
    isDirectory: true,
    children: {}
  }

  files.forEach((file) => {
    const parts = file.name.replace(/\\/g, '/').split('/')
    let current = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: isLast ? file.path : part, // Store full temp path for leaves
          filesCount: 0,
          isError: false,
          isDirectory: isLast ? file.isDirectory : true,
          children: {}
        }
      }
      current = current.children[part]
    })
  })

  return root
}
