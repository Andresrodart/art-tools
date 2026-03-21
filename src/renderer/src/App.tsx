import { useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Header } from './components/layout/Header'
import { Tabs } from './components/layout/Tabs'
import { ToolGalleryControls } from './components/layout/ToolGalleryControls'
import { useHeaderStore } from './store/headerStore'
import { useTaskStore } from './store/taskStore'
import { usePreferenceStore } from './store/preferenceStore'
import { TOOLS } from './config/tools'
import { ToolCardProps } from './types/tool'
import { TaskTab } from './types/task'

/**
 * Component for rendering a tool card in the gallery.
 */
function ToolCard({
  title,
  description,
  actionText,
  onAction,
  isDanger,
  isFavorite,
  onToggleFavorite
}: ToolCardProps): React.JSX.Element {
  return (
    <div className="brutalist-card" style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: 0,
          zIndex: 2,
          color: isFavorite ? 'var(--accent-danger, #ff5f5f)' : 'var(--text-secondary, #ccc)'
        }}
        title="Toggle Favorite"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className={`brutalist-button ${isDanger ? 'danger' : 'primary'}`} onClick={onAction}>
        {actionText}
      </button>
    </div>
  )
}

/**
 * Main application component.
 */
function App(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setActions = useHeaderStore((state) => state.setActions)

  const { activeTabId, tasks, addTab, initialize: initializeTasks } = useTaskStore()
  const {
    favorites,
    searchQuery,
    selectedCategory,
    toggleFavorite,
    initialize: initializePrefs
  } = usePreferenceStore()

  useEffect(() => {
    initializeTasks()
    initializePrefs()
  }, [initializeTasks, initializePrefs])

  /**
   * Navigates back to the home gallery.
   */
  const handleCloseTool = useCallback(() => {
    useTaskStore.getState().setActiveTab('home')
  }, [])

  /**
   * Opens a tool by adding its setup tab.
   * @param toolId - ID of the tool to open.
   * @param title - Display title for the tool tab.
   */
  const openTool = (toolId: string, title: string): void => {
    const tab: TaskTab = {
      id: `setup-${toolId.toLowerCase()}`,
      title: title,
      type: 'task'
    }
    addTab(tab)
  }

  /**
   * Toggles the application's visual theme.
   */
  const toggleTheme = useCallback((): void => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  /**
   * Toggles the application's language.
   */
  const toggleLanguage = useCallback((): void => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }, [i18n])

  useEffect(() => {
    if (activeTabId === 'home') {
      setTitle(t('app_title'))
      setActions([
        { label: t('lang_toggle'), onClick: toggleLanguage },
        { label: t('theme_toggle'), onClick: toggleTheme }
      ])
    }
  }, [activeTabId, t, setTitle, setActions, toggleLanguage, toggleTheme])

  /**
   * Filters the tool registry based on search query and selected category.
   */
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        t(tool.titleKey).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(tool.descriptionKey).toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === null ||
        (selectedCategory === 'favorites'
          ? favorites.has(tool.id)
          : (tool.categories as string[]).includes(selectedCategory))

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, favorites, t])

  /**
   * Renders the content corresponding to the active tab.
   */
  const renderActiveContent = (): React.JSX.Element => {
    if (activeTabId === 'home') {
      return (
        <>
          <ToolGalleryControls />
          <div className="gallery-grid">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={t(tool.titleKey)}
                description={t(tool.descriptionKey)}
                actionText={t('open_tool')}
                onAction={() => openTool(tool.id, t(tool.titleKey))}
                isFavorite={favorites.has(tool.id)}
                onToggleFavorite={() => toggleFavorite(tool.id)}
              />
            ))}
          </div>
        </>
      )
    }

    // Check if it's a setup tab
    if (activeTabId.startsWith('setup-')) {
      const toolId = activeTabId.replace('setup-', '')
      const tool = TOOLS.find((t) => t.id === toolId)
      if (tool) {
        const ToolComponent = tool.component
        return <ToolComponent onBack={handleCloseTool} />
      }
    }

    // Otherwise it must be a running/completed task tab
    const task = tasks[activeTabId]
    if (task) {
      const tool = TOOLS.find((t) => t.taskTypes.includes(task.type))
      if (tool) {
        const ToolComponent = tool.component
        return <ToolComponent onBack={handleCloseTool} />
      }
    }

    return <div>Tab not found: {activeTabId}</div>
  }

  return (
    <div className="brutalist-container">
      <Header />
      <Tabs />

      <main className="main-content">{renderActiveContent()}</main>
    </div>
  )
}

export default App
