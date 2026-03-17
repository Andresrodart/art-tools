import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TaskSidebar } from './components/layout/TaskSidebar'
import { FileOrganizer } from './components/tools/FileOrganizer'
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const setTitle = useHeaderStore((state) => state.setTitle)
  const setActions = useHeaderStore((state) => state.setActions)

  const handleCloseTool = useCallback(() => {
    setActiveTool(null)
  }, [])

  useEffect(() => {
    // Basic system theme detection
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }

    const listener = (e: MediaQueryListEvent): void => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener)
    return () =>
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const toggleLanguage = (): void => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  useEffect(() => {
    if (!activeTool) {
      setTitle(t('app_title'))
      setActions([
        { label: t('lang_toggle'), onClick: toggleLanguage },
        { label: t('theme_toggle'), onClick: toggleTheme }
      ])
    }
  }, [activeTool, t, i18n.language, theme])

  const handlePing = (): void => {
    // @ts-ignore
    if (window.electron?.ipcRenderer) {
      // @ts-ignore
      window.electron.ipcRenderer.send('ping')
    } else {
      alert('Electron API not available')
    }
  }

  const handleFileTest = async () => {
    try {
      // @ts-ignore
      if (!window.api?.writeFile || !window.api?.readFile) throw new Error('API not available')

      // @ts-ignore
      await window.api.writeFile('test.txt', 'Hello Neo-Brutalism!')
      // @ts-ignore
      const content = await window.api.readFile('test.txt')
      alert(`Read from disk: ${content}`)
    } catch (e: any) {
      alert(`File I/O Error: ${e.message}`)
    }
  }
  const handleCommandTest = async () => {
    try {
      // @ts-ignore
      if (!window.api?.execCommand) throw new Error('API not available')

      // @ts-ignore
      const result = await window.api.execCommand('echo "Hello from shell!"')
      if (result.success) {
        alert(`Command output: ${result.stdout}`)
      } else {
        alert(`Command error: ${result.error}`)
      }
    } catch (e: any) {
      alert(`Exec Error: ${e.message}`)
    }
  }

  return (
    <div className="brutalist-container">
      <Header />

      <main className="main-content">
        {activeTool ? (
          <div className="active-tool-view">
            {activeTool === 'FileOrganizer' && <FileOrganizer onBack={handleCloseTool} />}
          </div>
        ) : (
          <div className="gallery-grid">
            <ToolCard
              title="File Organizer"
              description="Sort messy directories into Year/Month/Day sub-folders instantly. Supports dry runs and specific file extensions."
              actionText="Open Tool"
              onAction={() => setActiveTool('FileOrganizer')}
            />
            <ToolCard
              title="File I/O Test"
              description="Test reading and writing simple files to disk securely."
              actionText={t('execute_btn')}
              onAction={handleFileTest}
            />
            <ToolCard
              title="Command Runner Test"
              description="Test running a shell command locally."
              actionText={t('execute_btn')}
              onAction={handleCommandTest}
            />
            <ToolCard
              title="IPC Ping Test"
              description="Send a simple ping message to the Main process."
              actionText={t('send_ipc')}
              onAction={handlePing}
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
