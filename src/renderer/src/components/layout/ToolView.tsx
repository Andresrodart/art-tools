import type { ReactNode } from 'react'
import React from 'react'

interface ToolViewProps {
  toolName: string
  description: string
  onBack: () => void
  inputSection?: ReactNode
  progressSection?: ReactNode
  outputSection?: ReactNode
}

export function ToolView({
  toolName,
  description,
  onBack,
  inputSection,
  progressSection,
  outputSection
}: ToolViewProps): React.JSX.Element {
  return (
    <div className="tool-view">
      {/* ── Title Bar ── */}
      <div className="tool-view-header">
        <button className="brutalist-button small" onClick={onBack}>
          &larr; Back
        </button>
        <h2 className="tool-view-title">{toolName}</h2>
      </div>

      {/* ── Description ── */}
      <div className="tool-view-description">
        <p>{description}</p>
      </div>

      {/* ── Input ── */}
      {inputSection && (
        <div className="tool-view-section">
          <h3 className="tool-view-section-title">Input</h3>
          <div className="tool-view-section-body">{inputSection}</div>
        </div>
      )}

      {/* ── Progress ── */}
      {progressSection && (
        <div className="tool-view-section">
          <h3 className="tool-view-section-title">Progress</h3>
          <div className="tool-view-section-body">{progressSection}</div>
        </div>
      )}

      {/* ── Output ── */}
      {outputSection && (
        <div className="tool-view-section">
          <h3 className="tool-view-section-title">Output</h3>
          <div className="tool-view-section-body">{outputSection}</div>
        </div>
      )}
    </div>
  )
}
