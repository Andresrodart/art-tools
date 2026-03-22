import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../../layout/ToolView'
import { useHeaderStore } from '../../../store/headerStore'
import { useFileScraper } from './useFileScraper'
import { FileScraperInput } from './FileScraperInput'
import { TaskProgress } from '../../common/TaskProgress'
import { FileScraperOutput } from './FileScraperOutput'

interface FileScraperProps {
  onBack: () => void
  tabId: string
}

export function FileScraper({ onBack, tabId }: FileScraperProps): React.JSX.Element {
  const { t } = useTranslation()
  const setTitle = useHeaderStore((state) => state.setTitle)
  const setNavigation = useHeaderStore((state) => state.setNavigation)
  const setActions = useHeaderStore((state) => state.setActions)
  const reset = useHeaderStore((state) => state.reset)

  const {
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
  } = useFileScraper(tabId)

  useEffect(() => {
    setTitle(t('tool_file_scraper_title'))
    setNavigation(
      <button className="brutalist-button small" onClick={onBack}>
        &larr; {t('back')}
      </button>
    )
    setActions([])

    return () => {
      reset()
    }
  }, [onBack, setTitle, setNavigation, setActions, reset, t])

  const isTaskRunning = taskData?.status === 'running' || taskData?.status === 'pending'

  return (
    <ToolView
      description={t('desc_file_scraper')}
      inputSection={
        <FileScraperInput
          sourcePath={sourcePath}
          destinationPath={destinationPath}
          ignorePaths={ignorePaths}
          preset={preset}
          customExtensions={customExtensions}
          isDryRun={isDryRun}
          isTaskRunning={isTaskRunning}
          handleSelectFolder={handleSelectFolder}
          handleAddIgnorePath={handleAddIgnorePath}
          handleRemoveIgnorePath={handleRemoveIgnorePath}
          setPreset={setPreset}
          getActiveExtensions={getActiveExtensions}
          handleRemoveExtension={handleRemoveExtension}
          setCustomExtensions={setCustomExtensions}
          setIsDryRun={setIsDryRun}
          handleStartTask={handleStartTask}
        />
      }
      progressSection={
        taskData ? (
          <TaskProgress taskData={taskData} pct={pct} logEntries={logEntries} logRef={logRef} />
        ) : null
      }
      outputSection={
        isFinished ? (
          <FileScraperOutput
            isFinished={isFinished}
            taskData={taskData}
            sourcePath={sourcePath}
            scrapedCount={scrapedCount}
            failCount={failCount}
            results={results}
            ignorePaths={ignorePaths}
            setIgnorePaths={setIgnorePaths}
            handleOpenFolder={handleOpenFolder}
          />
        ) : null
      }
    />
  )
}
