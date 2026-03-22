import React from 'react'
import { Task } from '../../../store/taskStore'

interface FileScraperProgressProps {
  taskData: Task | undefined
  pct: number
  logEntries: string[]
  logRef: React.RefObject<HTMLDivElement | null>
}

export function FileScraperProgress({
  taskData,
  pct,
  logEntries,
  logRef
}: FileScraperProgressProps): React.JSX.Element | null {
  if (!taskData) return null

  return (
    <>
      <div className="tool-progress-bar-container">
        <div className="tool-progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="tool-progress-stats">
        <span>
          {pct}% — Processed {taskData.progress.current} / {taskData.progress.total || '?'} matching
          files
        </span>
        <span style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{taskData.status}</span>
      </div>

      {logEntries.length > 0 && (
        <div className="tool-log-area" ref={logRef}>
          {logEntries.map((entry, i) => (
            <div key={i} className="log-entry">
              {entry}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
