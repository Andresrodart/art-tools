import React, { useState } from 'react'
import { TreeNode } from './types'

export const FolderTree = ({
  node,
  ignorePaths,
  toggleIgnore,
  depth = 0,
  isParentIgnored = false
}: {
  node: TreeNode
  ignorePaths: string[]
  toggleIgnore: (path: string) => void
  depth?: number
  isParentIgnored?: boolean
}): React.JSX.Element | null => {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = Object.keys(node.children).length > 0

  if (node.filesCount === 0 && !node.isError && depth > 0 && !hasChildren) return null

  const isDirectlyIgnored = ignorePaths.includes(node.fullPath)
  const isEffectivelyIgnored = isDirectlyIgnored || isParentIgnored

  return (
    <div
      style={{
        paddingLeft: depth === 0 ? 0 : '16px',
        marginTop: '2px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isParentIgnored
            ? 'rgba(255, 255, 255, 0.05)'
            : node.isError
              ? 'rgba(255, 107, 107, 0.15)'
              : 'transparent',
          border:
            node.isError && !isParentIgnored
              ? '1px dashed rgba(255, 107, 107, 0.3)'
              : '1px solid transparent',
          padding: '4px 8px',
          borderRadius: '4px',
          width: '100%',
          boxSizing: 'border-box',
          opacity: isParentIgnored ? 0.4 : 1
        }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              width: '20px',
              fontSize: '0.8rem'
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: '20px' }}></span>
        )}

        <span
          style={{
            color: node.isError && !isParentIgnored ? '#ff8787' : 'inherit',
            fontWeight: node.isError && !isParentIgnored ? 'bold' : 'normal',
            textDecoration: isParentIgnored ? 'line-through' : 'none'
          }}
        >
          {node.isError ? '⚠️ ' : '📁 '}
          {node.name}
        </span>

        {!node.isError && (
          <span style={{ color: '#888', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            ({node.filesCount} files)
          </span>
        )}
        {node.isError && (
          <span style={{ color: '#ff8787', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            [{node.errorMsg}]
          </span>
        )}

        {/* Dotted Leader Line */}
        {depth > 0 && (
          <div
            style={{
              flexGrow: 1,
              borderBottom: '1px dotted #555',
              margin: '0 8px',
              position: 'relative',
              top: '-4px'
            }}
          />
        )}

        {depth > 0 &&
          (() => {
            if (isParentIgnored) {
              return (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#666',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    minWidth: '85px',
                    textAlign: 'center'
                  }}
                >
                  Skipped
                </span>
              )
            }

            return (
              <button
                onClick={() => toggleIgnore(node.fullPath)}
                title={isDirectlyIgnored ? 'Remove from Skip List' : 'Add to Skip List'}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.5)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
                style={{
                  background: isDirectlyIgnored ? '#495057' : 'var(--bg-tertiary, #e03131)',
                  border: isDirectlyIgnored ? '1px solid #777' : 'none',
                  borderRadius: '6px',
                  color: isDirectlyIgnored ? '#aaa' : 'white',
                  fontSize: '0.7rem',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  minWidth: '85px',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  opacity: isDirectlyIgnored ? 0.7 : 1
                }}
              >
                {isDirectlyIgnored ? '✔ Ignored' : '🚫 Ignore'}
              </button>
            )
          })()}
      </div>

      {expanded && hasChildren && (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {Object.values(node.children).map((child) => (
            <FolderTree
              key={child.fullPath}
              node={child}
              ignorePaths={ignorePaths}
              toggleIgnore={toggleIgnore}
              depth={depth + 1}
              isParentIgnored={isEffectivelyIgnored}
            />
          ))}
        </div>
      )}
    </div>
  )
}
