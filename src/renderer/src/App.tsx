import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskSidebar } from './components/layout/TaskSidebar'
import { FileOrganizer } from './components/tools/FileOrganizer'
import { FolderMetadata } from './components/tools/FolderMetadata'
import { ThresholdMerger } from './components/tools/ThresholdMerger'
import { FileScraper } from './components/tools/FileScraper'
import { Header } from './components/layout/Header'
import { useHeaderStore } from './store/headerStore'

interface ToolCardProps {
  title: string
  description: string
  actionText: string
  onAction: () => void
  isDanger?: boolean
}

function ToolCard({
  title,
  description,
  actionText,
  onAction,
  isDanger
}: ToolCardProps): React.JSX.Element {
  return (
    <div className="brutalist-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button className={`brutalist-button ${isDanger ? 'danger' : 'primary'}`} onClick={onAction}>
        {actionText}
      </button>
    </div>
  )
}

function App(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark'
    }
    return 'light'
  })
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setActions = useHeaderStore((state) => state.setActions)

  const handleCloseTool = useCallback(() => {
    setActiveTool(null)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const listener = (e: MediaQueryListEvent): void => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback((): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const toggleLanguage = useCallback((): void => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }, [i18n])

  useEffect(() => {
    if (!activeTool) {
      setTitle(t('app_title'))
      setActions([
        { label: t('lang_toggle'), onClick: toggleLanguage },
        { label: t('theme_toggle'), onClick: toggleTheme }
      ])
    }
  }, [activeTool, t, setTitle, setActions, toggleLanguage, toggleTheme])

  return (
    <div className="brutalist-container">
      <Header />

      <main className="main-content">
        {activeTool ? (
          <div className="active-tool-view">
            {activeTool === 'FileOrganizer' && <FileOrganizer onBack={handleCloseTool} />}
            {activeTool === 'FolderMetadata' && <FolderMetadata onBack={handleCloseTool} />}
            {activeTool === 'ThresholdMerger' && <ThresholdMerger onBack={handleCloseTool} />}
            {activeTool === 'FileScraper' && <FileScraper onBack={handleCloseTool} />}
          </div>
        ) : (
          <div className="gallery-grid">
            <ToolCard
              title={t('tool_file_organizer_title')}
              description={t('tool_file_organizer_desc')}
              actionText={t('open_tool')}
              onAction={() => setActiveTool('FileOrganizer')}
            />
            <ToolCard
              title={t('tool_folder_metadata_title')}
              description={t('tool_folder_metadata_desc')}
              actionText={t('open_tool')}
              onAction={() => setActiveTool('FolderMetadata')}
            />
            <ToolCard
              title={t('tool_threshold_merger_title')}
              description={t('tool_threshold_merger_desc')}
              actionText={t('open_tool')}
              onAction={() => setActiveTool('ThresholdMerger')}
            />
          </div>
        )}
      </main>

      {/* Global Sidebar for persisting Tasks */}
      <TaskSidebar />
    </div>
  )
}

export default App
