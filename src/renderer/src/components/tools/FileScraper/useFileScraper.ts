import { useState, useEffect, useRef, useMemo } from 'react'
import { useTaskStore, Task } from '../../../store/taskStore'
import { PresetKey, PRESETS, FileScraperResult } from './types'
import { useAlertStore } from '../../../store/alertStore'

export function useFileScraper(tabId: string): {
  sourcePath: string | null
  destinationPath: string | null
  preset: PresetKey
  setPreset: React.Dispatch<React.SetStateAction<PresetKey>>
  customExtensions: string
  setCustomExtensions: React.Dispatch<React.SetStateAction<string>>
  isDryRun: boolean
  setIsDryRun: React.Dispatch<React.SetStateAction<boolean>>
  ignorePaths: string[]
  setIgnorePaths: React.Dispatch<React.SetStateAction<string[]>>
  logEntries: string[]
  logRef: React.RefObject<HTMLDivElement | null>
  taskData: Task | undefined
  handleSelectFolder: (isSource: boolean) => Promise<void>
  handleAddIgnorePath: () => Promise<void>
  handleRemoveIgnorePath: (pathToRemove: string) => void
  handleStartTask: () => Promise<void>
  handleOpenFolder: () => Promise<void>
  getActiveExtensions: () => string[]
  handleRemoveExtension: (extToRemove: string) => void
  pct: number
  isFinished: boolean | undefined
  results: FileScraperResult[]
  scrapedCount: number
  failCount: number
} {
  const [sourcePath, setSourcePath] = useState<string | null>(null)
  const [destinationPath, setDestinationPath] = useState<string | null>(null)
  const [preset, setPreset] = useState<PresetKey>('Images')
  const [customExtensions, setCustomExtensions] = useState<string>('')
  const [isDryRun, setIsDryRun] = useState<boolean>(true)
  const [ignorePaths, setIgnorePaths] = useState<string[]>([])

  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const { tasks, tabs, updateTab } = useTaskStore()
  const currentTab = tabs.find((t) => t.id === tabId)
  const taskData = currentTab?.taskId ? tasks[currentTab.taskId] : undefined

  // Sync log entries from global task store
  useEffect(() => {
    if (taskData?.progress?.message) {
      setLogEntries((prev) => {
        const last = prev[prev.length - 1]
        if (last !== taskData.progress.message) {
          return [...prev, taskData.progress.message!]
        }
        return prev
      })
    }
  }, [taskData?.progress?.message])

  // Auto-scroll log area
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logEntries])

  const handleSelectFolder = async (isSource: boolean): Promise<void> => {
    try {
      // @ts-ignore: electron api
      const folderPaths = window.api?.selectFolder
        ? await window.api.selectFolder()
        : await (window.api as { invoke?: (...args: unknown[]) => Promise<unknown> })?.invoke?.(
            'select-folder'
          )
      if (!folderPaths) throw new Error('Failed to select folder, API unavailable')
      if (folderPaths) {
        if (isSource) setSourcePath(folderPaths)
        else setDestinationPath(folderPaths)
      }
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error selecting folder: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
    }
  }

  const handleAddIgnorePath = async (): Promise<void> => {
    try {
      // @ts-ignore: electron api
      const folderPath = window.api?.selectFolder
        ? await window.api.selectFolder()
        : await (window.api as { invoke?: (...args: unknown[]) => Promise<unknown> })?.invoke?.(
            'select-folder'
          )
      if (!folderPath) throw new Error('Failed to select folder, API unavailable')
      if (folderPath && !ignorePaths.includes(folderPath)) {
        setIgnorePaths((prev) => [...prev, folderPath])
      }
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error selecting folder: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
    }
  }

  const handleRemoveIgnorePath = (pathToRemove: string): void => {
    setIgnorePaths((prev) => prev.filter((p) => p !== pathToRemove))
  }

  const handleStartTask = async (): Promise<void> => {
    if (!sourcePath || !destinationPath) {
      await useAlertStore
        .getState()
        .showAlert('Warning', 'Please select both a source and destination folder.', 'warning')
      return
    }

    let extensions: string[]
    if (preset === 'All') {
      extensions = ['*']
    } else if (preset === 'Custom') {
      extensions = customExtensions
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
      if (extensions.length === 0) {
        await useAlertStore
          .getState()
          .showAlert(
            'Warning',
            'Please enter at least one valid extension for Custom mode.',
            'warning'
          )
        return
      }
    } else {
      extensions = PRESETS[preset]
    }

    // Reset state for new run
    setLogEntries([])

    try {
      // @ts-ignore: electron api
      const id = window.api?.startFileScraperTask
        ? await window.api.startFileScraperTask(
            sourcePath,
            destinationPath,
            extensions,
            isDryRun,
            ignorePaths
          )
        : await (window.api as { invoke?: (...args: unknown[]) => Promise<unknown> })?.invoke?.(
            'task:start-file-scraper',
            sourcePath,
            destinationPath,
            extensions,
            isDryRun,
            ignorePaths
          )

      if (!id) throw new Error('Failed to start task, API unavailable')

      updateTab(tabId, { taskId: id, title: `Scrape: ${sourcePath.split(/[/\\]/).pop()}` })
    } catch (e: unknown) {
      await useAlertStore
        .getState()
        .showAlert(
          'Error',
          `Error starting file scraper: ${e instanceof Error ? e.message : String(e)}`,
          'error'
        )
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    if (destinationPath) {
      try {
        // @ts-ignore: electron api
        if (window.api?.openPath) {
          // @ts-ignore: electron api
          await window.api.openPath(destinationPath)
        }
      } catch (e: unknown) {
        console.error('Failed to open folder', e)
      }
    }
  }

  // ── Extensions Chips Logic ──
  const getActiveExtensions = (): string[] => {
    if (preset === 'All') return ['*']
    if (preset === 'Custom') {
      return customExtensions
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    }
    return PRESETS[preset]
  }

  const handleRemoveExtension = (extToRemove: string): void => {
    const currentList = getActiveExtensions()
    const newList = currentList.filter((ext) => ext !== extToRemove)
    setCustomExtensions(newList.join(', '))
    setPreset('Custom')
  }

  // ── Progress percentage ──
  const pct =
    taskData && taskData.progress.total > 0
      ? Math.floor((taskData.progress.current / taskData.progress.total) * 100)
      : 0

  const isFinished =
    taskData &&
    (taskData.status === 'completed' ||
      taskData.status === 'error' ||
      taskData.status === 'dry-run')

  // ── Result summary ──
  const results = useMemo(() => (taskData?.result as FileScraperResult[]) ?? [], [taskData?.result])
  const scrapedCount = results.filter((r) => r.success || taskData?.status === 'dry-run').length
  const failCount = results.filter((r) => !r.success && taskData?.status !== 'dry-run').length

  return {
    sourcePath,
    destinationPath,
    preset,
    setPreset,
    customExtensions,
    setCustomExtensions,
    isDryRun,
    setIsDryRun,
    ignorePaths,
    setIgnorePaths,
    logEntries,
    logRef,
    taskData,
    handleSelectFolder,
    handleAddIgnorePath,
    handleRemoveIgnorePath,
    handleStartTask,
    handleOpenFolder,
    getActiveExtensions,
    handleRemoveExtension,
    pct,
    isFinished,
    results,
    scrapedCount,
    failCount
  }
}
