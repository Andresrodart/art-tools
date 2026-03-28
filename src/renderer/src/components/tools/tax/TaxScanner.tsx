import React, { useState } from 'react'
import { ToolView } from '../../layout/ToolView'
import { useTaskStore } from '../../../store/taskStore'

export const TaxScanner: React.FC = () => {
  const [baseFolder, setBaseFolder] = useState<string>('')
  const [geminiKey, setGeminiKey] = useState<string>('')
  const [spreadsheetId, setSpreadsheetId] = useState<string>('')

  // Track Google Auth Tokens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [oauthTokens, setOauthTokens] = useState<any>(null)

  const [initMsg, setInitMsg] = useState<string>('')

  const { tasks } = useTaskStore()

  const activeTask = Object.values(tasks).find(
    (t) => t.type === 'tax-scanner' && t.status !== 'completed' && t.status !== 'error'
  )
  const completedTask = Object.values(tasks).find(
    (t) => t.type === 'tax-scanner' && (t.status === 'completed' || t.status === 'error')
  )

  const handleInitDirs = async (): Promise<void> => {
    if (!baseFolder) return
    // @ts-ignore IPC invoke fallback
    const res = await window.api.invoke('tax:init-directories', baseFolder)
    if (res.success) {
      setInitMsg('Directories created successfully.')
      setTimeout(() => setInitMsg(''), 3000)
    } else {
      setInitMsg(`Error: ${res.error}`)
    }
  }

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      // @ts-ignore IPC invoke fallback
      const url = await window.api.invoke('tax:get-google-auth-url')
      // Open URL in external browser
      window.open(url, '_blank')

      // We would realistically use a deep link or poll for completion,
      // but to keep it simple and stateless for this utility, we'll prompt the user for the code.
      const code = prompt('Please enter the code from Google:')
      if (code) {
        // @ts-ignore IPC invoke fallback
        const tokens = await window.api.invoke('tax:exchange-google-code', code)
        setOauthTokens(tokens)
        alert('Successfully authenticated with Google Sheets!')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Login failed: ${err.message}`)
    }
  }

  const handleScan = async (): Promise<void> => {
    if (!baseFolder || !spreadsheetId || !oauthTokens) {
      alert('Base folder, Spreadsheet ID, and Google Authentication are required.')
      return
    }

    // We don't really have a delete action for tasks, just clear from local tracking
    // but the store holds them until session ends.

    // @ts-ignore IPC invoke fallback
    await window.api.invoke(
      'tax:scan-and-update',
      baseFolder,
      geminiKey,
      spreadsheetId,
      oauthTokens
    )
  }

  return (
    <ToolView
      description="Scans Mexico/Poland directories for tax files and generates a comprehensive Google Sheet tracking your income and taxes."
      inputSection={
        <>
          <div className="control-group">
            <label>Base Directory (contains Mexico_Tax and Poland_Tax folders):</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                readOnly
                value={baseFolder || 'No folder selected'}
                className="brutalist-input flex-grow"
              />
              <button
                className="brutalist-button info"
                onClick={async () => {
                  // @ts-ignore Fallback for IPC interface missing electron definition
                  const path = await window.api.invoke('select-folder')
                  if (path) setBaseFolder(path)
                }}
                disabled={!!activeTask}
              >
                Browse
              </button>
            </div>
            <div className="action-row" style={{ marginTop: '0.5rem' }}>
              <button
                className="brutalist-button"
                onClick={handleInitDirs}
                disabled={!baseFolder || !!activeTask}
              >
                Init Directories
              </button>
              {initMsg && <span style={{ marginLeft: '1rem' }}>{initMsg}</span>}
            </div>
          </div>

          <div className="control-group" style={{ marginTop: '2rem' }}>
            <label>Google Spreadsheet ID:</label>
            <input
              type="text"
              className="brutalist-input"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRYFgwnTEn..."
              disabled={!!activeTask}
            />
          </div>

          <div className="control-group">
            <label>Google Authentication:</label>
            <div>
              {oauthTokens ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Authenticated</span>
              ) : (
                <button
                  className="brutalist-button"
                  onClick={handleGoogleLogin}
                  disabled={!!activeTask}
                >
                  Login to Google
                </button>
              )}
            </div>
          </div>

          <div className="control-group">
            <label>Gemini API Key (Optional fallback for complex PDFs):</label>
            <input
              type="password"
              className="brutalist-input"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              disabled={!!activeTask}
            />
          </div>

          <div className="action-row" style={{ marginTop: '2rem' }}>
            <button
              className="brutalist-button primary"
              onClick={handleScan}
              disabled={!baseFolder || !spreadsheetId || !oauthTokens || !!activeTask}
            >
              {activeTask ? 'Scanning...' : 'Scan & Sync to Sheets'}
            </button>
          </div>
        </>
      }
      progressSection={
        activeTask && (
          <div style={{ padding: '1rem', border: '2px solid black' }}>
            <strong>Status:</strong> {activeTask.status} <br />
            {activeTask.error && (
              <span>
                <strong>Error:</strong> {activeTask.error} <br />
              </span>
            )}
          </div>
        )
      }
      outputSection={
        completedTask && (
          <div
            style={{
              padding: '1rem',
              border: '2px solid black',
              backgroundColor: completedTask.status === 'error' ? '#ffebee' : '#e8f5e9'
            }}
          >
            <strong>Result:</strong> {completedTask.status} <br />
            {completedTask.error && (
              <span>
                <strong>Error:</strong> {completedTask.error} <br />
              </span>
            )}
          </div>
        )
      }
    />
  )
}
