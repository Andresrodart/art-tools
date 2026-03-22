import React from 'react'
import { useHeaderStore } from '../../store/headerStore'
import { useTaskStore } from '../../store/taskStore'
import { ToolSearch } from '../common/ToolSearch'

export const Header: React.FC = () => {
  const { title, navigation, snippets, actions } = useHeaderStore()
  const { activeTabId } = useTaskStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="brutalist-header">
        <div className="header-left">
          {navigation && <div className="header-nav">{navigation}</div>}
          <h1 className="header-title">{title}</h1>
        </div>

        <div className="header-right">
          {snippets && <div className="header-snippets">{snippets}</div>}
          <div className="controls-group">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`brutalist-button ${action.variant || ''}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {activeTabId === 'home' && (
        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', backgroundColor: 'var(--header-bg)' }}>
          <ToolSearch />
        </div>
      )}
    </div>
  )
}
