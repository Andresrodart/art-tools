import React, { useState } from 'react'
import { ToolView } from '../../layout/ToolView'
import { useTaskStore } from '../../../store/taskStore'
import { TaxProfileCheck } from './TaxProfileCheck'

export const TaxScanner: React.FC = () => {
  const [baseFolder, setBaseFolder] = useState<string>('')
  const [geminiKey, setGeminiKey] = useState<string>('')
  const [spreadsheetId, setSpreadsheetId] = useState<string>('')

  // Track Google Auth Tokens
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [oauthTokens, setOauthTokens] = useState<any>(null)
  const [dirsExist, setDirsExist] = useState<boolean>(false)
  const [initMsg, setInitMsg] = useState<string>('')

  // Auth Flow
  const [isPromptingAuth, setIsPromptingAuth] = useState<boolean>(false)
  const [authCode, setAuthCode] = useState<string>('')

  const { tasks } = useTaskStore()

  const activeTask = Object.values(tasks).find(
    (t) => t.type === 'tax-scanner' && t.status !== 'completed' && t.status !== 'error'
  )
  const completedTask = Object.values(tasks).find(
    (t) => t.type === 'tax-scanner' && (t.status === 'completed' || t.status === 'error')
  )

  // Check if directories exist whenever baseFolder changes
  React.useEffect(() => {
    const checkDirs = async (): Promise<void> => {
      if (baseFolder) {
        // @ts-ignore IPC invoke
        const exists = await window.api.checkTaxDirectories(baseFolder)
        setDirsExist(exists)
      } else {
        setDirsExist(false)
      }
    }
    checkDirs()
  }, [baseFolder])

  const handleInitDirs = async (): Promise<void> => {
    if (!baseFolder) return
    // @ts-ignore IPC invoke
    const res = await window.api.initTaxDirectories(baseFolder)
    if (res.success) {
      setInitMsg('Directories created successfully.')
      setDirsExist(true)
      setTimeout(() => setInitMsg(''), 3000)
    } else {
      setInitMsg(`Error: ${res.error}`)
    }
  }

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      // @ts-ignore IPC invoke
      const url = await window.api.getGoogleAuthUrl()
      // Open URL in external browser
      window.open(url, '_blank')
      // Show the integrated code input field
      setIsPromptingAuth(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Login failed: ${err.message}`)
    }
  }

  const handleConfirmAuth = async (): Promise<void> => {
    if (!authCode) {
      alert('Please enter the auth code.')
      return
    }
    try {
      // @ts-ignore IPC invoke
      const tokens = await window.api.exchangeGoogleCode(authCode)
      setOauthTokens(tokens)
      setIsPromptingAuth(false)
      setAuthCode('')
      alert('Successfully authenticated with Google Sheets!')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Authentication failed: ${err.message}`)
    }
  }

  const handleCreateSheet = async (): Promise<void> => {
    try {
      // @ts-ignore IPC invoke
      const sid = await window.api.createSpreadsheet(oauthTokens)
      if (sid) {
        setSpreadsheetId(sid)
        alert('New Spreadsheet created!')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`)
    }
  }

  const handleOpenSheet = async (): Promise<void> => {
    if (!spreadsheetId) return
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    // @ts-ignore IPC invoke
    await window.api.invoke('open-path', url)
  }

  const handleScan = async (): Promise<void> => {
    if (!baseFolder || !spreadsheetId || !oauthTokens) {
      alert('Base folder, Spreadsheet ID, and Google Authentication are required.')
      return
    }

    // @ts-ignore IPC invoke
    await window.api.scanAndSyncTax(baseFolder, geminiKey, spreadsheetId, oauthTokens)
  }

  return (
    <>
      <TaxProfileCheck />
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
                    // @ts-ignore IPC invoke
                    const path = await window.api.selectFolder()
                    if (path) setBaseFolder(path)
                  }}
                  disabled={!!activeTask}
                >
                  Browse
                </button>
              </div>

              {baseFolder && !dirsExist && (
                <div className="action-row" style={{ marginTop: '0.5rem' }}>
                  <button
                    className="brutalist-button"
                    onClick={handleInitDirs}
                    disabled={!!activeTask}
                  >
                    Init Directories
                  </button>
                  {initMsg && <span style={{ marginLeft: '1rem' }}>{initMsg}</span>}
                </div>
              )}
              {baseFolder && dirsExist && (
                <div style={{ marginTop: '0.5rem', color: 'green', fontSize: '0.9rem' }}>
                  ✓ Tax directories found.
                </div>
              )}
            </div>

            <div className="control-group" style={{ marginTop: '2rem' }}>
              <label>Google Authentication (Required for Sheets Integration):</label>
              <div>
                {oauthTokens ? (
                  <span
                    style={{
                      color: 'green',
                      fontWeight: 'bold',
                      display: 'block',
                      marginBottom: '1rem'
                    }}
                  >
                    ✓ Authenticated with Google
                  </span>
                ) : (
                  <>
                    {!isPromptingAuth ? (
                      <button
                        className="brutalist-button primary"
                        onClick={handleGoogleLogin}
                        disabled={!!activeTask}
                      >
                        Login to Google
                      </button>
                    ) : (
                      <div
                        className="brutalist-card"
                        style={{ padding: '1rem', border: '2px solid black' }}
                      >
                        <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>
                          Paste the authentication code from the browser window:
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            className="brutalist-input flex-grow"
                            placeholder="Paste code here..."
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                          />
                          <button className="brutalist-button primary" onClick={handleConfirmAuth}>
                            Confirm Code
                          </button>
                          <button
                            className="brutalist-button"
                            onClick={() => {
                              setIsPromptingAuth(false)
                              setAuthCode('')
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {oauthTokens && (
              <div
                className="brutalist-card"
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  border: '2px solid black',
                  boxShadow: '4px 4px 0px black'
                }}
              >
                <div className="control-group">
                  <label>Google Spreadsheet ID:</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="brutalist-input flex-grow"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      placeholder="e.g. 1BxiMVs0XRYFgwnTEn..."
                      disabled={!!activeTask}
                    />
                    <button
                      className="brutalist-button"
                      onClick={handleCreateSheet}
                      disabled={!!activeTask}
                      title="Create a new spreadsheet"
                    >
                      Create
                    </button>
                    {spreadsheetId && (
                      <button
                        className="brutalist-button info"
                        onClick={handleOpenSheet}
                        disabled={!!activeTask}
                        title="Open in Browser"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
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
              </div>
            )}

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
    </>
  )
}
