import React, { useState, useRef, useEffect } from 'react'
import { useHeaderStore } from '../../store/headerStore'
import { useTaskStore } from '../../store/taskStore'
import { ToolSearch } from '../common/ToolSearch'

export const Header: React.FC = () => {
  const { title, navigation, snippets, actions } = useHeaderStore()
  const { activeTabId } = useTaskStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchVisible, setIsSearchVisible] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="brutalist-header">
        <div className="header-left">
          {navigation && <div className="header-nav">{navigation}</div>}
          <h1 className="header-title">{title}</h1>
        </div>

        <div className="header-right">
          {snippets && <div className="header-snippets">{snippets}</div>}
          <div className="controls-group" ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="brutalist-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              ☰
            </button>
            {isMenuOpen && (
              <div
                className="brutalist-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  backgroundColor: 'var(--panel-bg)',
                  border: '4px solid #000',
                  boxShadow: '6px 6px 0px 0px #000',
                  padding: '1.5rem',
                  zIndex: 1000,
                  minWidth: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className={`brutalist-button ${action.variant || ''}`}
                      onClick={() => {
                        action.onClick()
                      }}
                      style={{ flex: 1 }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                {activeTabId === 'home' && (
                  <button
                    className="brutalist-button"
                    onClick={() => setIsSearchVisible(!isSearchVisible)}
                    style={{ width: '100%' }}
                  >
                    {isSearchVisible ? 'Hide Search' : 'Search Tools'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {activeTabId === 'home' && isSearchVisible && (
        <div
          style={{
            padding: '0 1.5rem 1.5rem 1.5rem',
            backgroundColor: 'var(--header-bg)',
            width: '100%'
          }}
        >
          <ToolSearch />
        </div>
      )}
    </div>
  )
}
