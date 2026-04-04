import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useHeaderStore } from '../../../store/headerStore'
import { useTaskStore } from '../../../store/taskStore'
import { useAlertStore } from '../../../store/alertStore'
import { OrganizeResult } from './types'

interface ElectronWindow {
  api?: {
    selectFolder?: () => Promise<string | null>
    startOrganizeTask?: (
      folderPath: string,
      fileTypes: string[],
      isDryRun: boolean
    ) => Promise<string>
    openPath?: (targetFolder: string) => Promise<void>
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useFileOrganizer(tabId: string, onBack: () => void) {
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>(['*'])
  const [extensionInput, setExtensionInput] = useState<string>('')
  const [showExtDropdown, setShowExtDropdown] = useState<boolean>(false)
  const [isDryRun, setIsDryRun] = useState<boolean>(true)

  const [logEntries, setLogEntries] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)
  const { t } = useTranslation()

  const { tasks, tabs, updateTab } = useTaskStore()
  const currentTab = tabs.find((t) => t.id === tabId)
  const taskData = currentTab?.taskId ? tasks[currentTab.taskId] : undefined

  const addExtension = (ext: string): void => {
    let newExt = ext.trim().toLowerCase()
    if (!newExt.startsWith('.') && newExt !== '*') {
      newExt = `.${newExt}`
    }

    if (newExt === '*') {
      setSelectedExtensions(['*'])
    } else {
      setSelectedExtensions((prev) => {
        const filtered = prev.filter((e) => e !== '*')
        if (!filtered.includes(newExt)) {
          return [...filtered, newExt]
        }
        return prev
      })
    }
    setExtensionInput('')
    setShowExtDropdown(false)
  }

  const removeExtension = (ext: string): void => {
    setSelectedExtensions((prev) => {
      const newExts = prev.filter((e) => e !== ext)
      return newExts.length > 0 ? newExts : ['*']
    })
  }

  const handleExtensionButtonClick = (e: React.MouseEvent | React.KeyboardEvent): void => {
    e.preventDefault()
    if (extensionInput) {
      addExtension(extensionInput)
      return
    }
    setShowExtDropdown(!showExtDropdown)
  }

  useEffect(() => {
    setTitle(t('tool_file_organizer_title'))

    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; Back
      </button>
    )
    setActions([])

    return () => {
      reset()
    }
  }, [onBack, setTitle, setNavigation, setActions, reset, t])

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

  const handleSelectFolder = async (): Promise<void> => {
    try {
      if (!(window as unknown as ElectronWindow).api?.selectFolder)
        throw new Error('API not available')
      const folderPath = await (window as unknown as ElectronWindow).api!.selectFolder!()
      if (folderPath) {
        setTargetFolder(folderPath)
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

  const handleStartOrganize = async (): Promise<void> => {
    if (!targetFolder) {
      await useAlertStore
        .getState()
        .showAlert('Warning', 'Please select a folder first.', 'warning')
      return
    }

    // Reset state for new run
    setLogEntries([])

    try {
      const typesArray = selectedExtensions.length > 0 ? selectedExtensions : ['*']

      if (!(window as unknown as ElectronWindow).api?.startOrganizeTask)
        throw new Error('API not available')
      const id = await (window as unknown as ElectronWindow).api!.startOrganizeTask!(
        targetFolder,
        typesArray,
        isDryRun
      )

      updateTab(tabId, { taskId: id, title: `Org: ${targetFolder.split(/[/\\]/).pop()}` })
    } catch (e: unknown) {
      alert(`Error starting organize task: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const handleOpenFolder = async (): Promise<void> => {
    if (targetFolder) {
      try {
        if ((window as unknown as ElectronWindow).api?.openPath) {
          await (window as unknown as ElectronWindow).api!.openPath!(targetFolder)
        }
      } catch (e: unknown) {
        console.error('Failed to open folder', e)
      }
    }
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
  const results = (taskData?.result as OrganizeResult[]) ?? []
  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return {
    targetFolder,
    selectedExtensions,
    extensionInput,
    setExtensionInput,
    showExtDropdown,
    setShowExtDropdown,
    isDryRun,
    setIsDryRun,
    logEntries,
    logRef,
    taskData,
    addExtension,
    removeExtension,
    handleExtensionButtonClick,
    handleSelectFolder,
    handleStartOrganize,
    handleOpenFolder,
    pct,
    isFinished,
    results,
    successCount,
    failCount
  }
}
