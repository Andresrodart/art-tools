import type { ReactNode } from 'react'
import React from 'react'

interface ToolViewProps {
  description: string
  inputSection?: ReactNode
  progressSection?: ReactNode
  outputSection?: ReactNode
}

export function ToolView({
  description,
  inputSection,
  progressSection,
  outputSection
}: ToolViewProps): React.JSX.Element {
  return (
    <div className="tool-view">
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
