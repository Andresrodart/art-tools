import React from 'react'
import { useHeaderStore } from '../../store/headerStore'

export const Header: React.FC = () => {
  const { title, navigation, snippets, actions } = useHeaderStore()

  return (
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
  )
}
