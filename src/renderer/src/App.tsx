import { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileOrganizer } from './components/tools/FileOrganizer'
import { FolderMetadata } from './components/tools/FolderMetadata'
import { ThresholdMerger } from './components/tools/ThresholdMerger'
import { FileScraper } from './components/tools/FileScraper'
import { EmptyFolderCleaner } from './components/tools/EmptyFolderCleaner'
import { SatProfileManager } from './components/tools/tax/SatProfileManager'
import { FacturaOrganizer } from './components/tools/tax/FacturaOrganizer'
import { FrequentContactsManager } from './components/tools/tax/FrequentContactsManager'
import { TaxDashboard } from './components/tools/tax/TaxDashboard'
import { GPGViewer } from './components/tools/GPGViewer'
import { Header } from './components/layout/Header'
import { Tabs } from './components/layout/Tabs'
import { useHeaderStore } from './store/headerStore'
import { useTaskStore, TaskTab } from './store/taskStore'
import { usePreferenceStore } from './store/preferenceStore'
import { HomeView } from './components/layout/HomeView'
import { GlobalAlertModal } from './components/common/GlobalAlertModal'

function App(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setActions = useHeaderStore((state) => state.setActions)

  const { tabs, activeTabId, tasks, initialize: initTasks } = useTaskStore()
  const { initialize: initPrefs } = usePreferenceStore()

  useEffect(() => {
    initTasks()
    initPrefs()
  }, [initTasks, initPrefs])

  const handleCloseTool = useCallback(() => {
    useTaskStore.getState().setActiveTab('home')
  }, [])

  const toggleTheme = useCallback((): void => {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

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
    } else {
      // Actions are now mostly handled by the tools themselves or the header store within tools
    }
  }, [activeTabId, t, setTitle, setActions, toggleLanguage, toggleTheme])

  const renderTool = (tab: TaskTab): React.JSX.Element | null => {
    // Determine the component based on toolName or fall back to legacy task types if needed
    const tool = tab.toolName || ''

    // For legacy running tasks that don't have toolName but are type 'task'
    if (tab.type === 'task' && tasks[tab.id]) {
      const task = tasks[tab.id]
      switch (task.type) {
        case 'organize-files':
          return <FileOrganizer onBack={handleCloseTool} tabId={tab.id} />
        case 'folder-metadata':
          return <FolderMetadata onBack={handleCloseTool} tabId={tab.id} />
        case 'thresholdMerger':
          return <ThresholdMerger onBack={handleCloseTool} tabId={tab.id} />
        case 'fileScraper':
          return <FileScraper onBack={handleCloseTool} tabId={tab.id} />
        case 'findEmptyFolders':
        case 'deleteFolders':
          return <EmptyFolderCleaner onBack={handleCloseTool} tabId={tab.id} />
      }
    }

    switch (tool) {
      case 'FileOrganizer':
        return <FileOrganizer onBack={handleCloseTool} tabId={tab.id} />
      case 'FolderMetadata':
        return <FolderMetadata onBack={handleCloseTool} tabId={tab.id} />
      case 'ThresholdMerger':
        return <ThresholdMerger onBack={handleCloseTool} tabId={tab.id} />
      case 'FileScraper':
        return <FileScraper onBack={handleCloseTool} tabId={tab.id} />
      case 'EmptyFolderCleaner':
        return <EmptyFolderCleaner onBack={handleCloseTool} tabId={tab.id} />
      case 'SatProfileManager':
        return <SatProfileManager />
      case 'FacturaOrganizer':
        return <FacturaOrganizer />
      case 'FrequentContactsManager':
        return <FrequentContactsManager />
      case 'TaxDashboard':
        return <TaxDashboard />
      case 'GPGViewer':
        return <GPGViewer />
      default:
        return <div>Unknown tool: {tool}</div>
    }
  }

  return (
    <div className="brutalist-container">
      <Header />
      <Tabs />

      <main className="main-content">
        <div style={{ display: activeTabId === 'home' ? 'block' : 'none' }}>
          <HomeView />
        </div>

        {tabs.map((tab) => {
          if (tab.id === 'home') return null
          return (
            <div
              key={tab.id}
              style={{ display: activeTabId === tab.id ? 'block' : 'none', height: '100%' }}
            >
              {renderTool(tab)}
            </div>
          )
        })}
      </main>
      <GlobalAlertModal />
    </div>
  )
}

export default App
