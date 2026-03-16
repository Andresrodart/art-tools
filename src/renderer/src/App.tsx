import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ToolCardProps {
  title: string
  description: string
  actionText: string
  onAction: () => void
  isDanger?: boolean
}

function ToolCard({ title, description, actionText, onAction, isDanger }: ToolCardProps) {
  return (
    <div className="brutalist-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button 
        className={`brutalist-button ${isDanger ? 'danger' : 'primary'}`} 
        onClick={onAction}
      >
        {actionText}
      </button>
    </div>
  )
}

function App(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Basic system theme detection
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }

    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener)
    return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en'
    i18n.changeLanguage(newLang)
  }

  const handlePing = () => {
    window.electron.ipcRenderer.send('ping')
  }

  const handleFileTest = async () => {
    try {
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
      <header className="brutalist-header">
        <h1>{t('app_title')}</h1>
        <div className="controls-group">
          <button className="brutalist-button" onClick={toggleLanguage}>
            {t('lang_toggle')}
          </button>
          <button className="brutalist-button" onClick={toggleTheme}>
            {t('theme_toggle')}
          </button>
        </div>
      </header>

      <main className="gallery-grid">
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
      </main>
    </div>
  )
}

export default App
