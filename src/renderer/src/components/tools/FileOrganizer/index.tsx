import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToolView } from '../../layout/ToolView'
import { useFileOrganizer } from './useFileOrganizer'
import { FileOrganizerInput } from './FileOrganizerInput'
import { FileOrganizerOutput } from './FileOrganizerOutput'
import { TaskProgress } from '../../common/TaskProgress'

interface FileOrganizerProps {
  onBack: () => void
  tabId: string
}

export function FileOrganizer({ onBack, tabId }: FileOrganizerProps): React.JSX.Element {
  const { t } = useTranslation()
  const {
    targetFolder,
    selectedExtensions,
    extensionInput,
    setExtensionInput,
    showExtDropdown,
    setShowExtDropdown,
    isDryRun,
    setIsDryRun,
    skipYearFolders,
    setSkipYearFolders,
    cleanupEmptyFolders,
    setCleanupEmptyFolders,
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
    successCount,
    failCount
  } = useFileOrganizer(tabId, onBack)

  return (
    <ToolView
      description={t('desc_org')}
      inputSection={
        <FileOrganizerInput
          targetFolder={targetFolder}
          selectedExtensions={selectedExtensions}
          extensionInput={extensionInput}
          setExtensionInput={setExtensionInput}
          showExtDropdown={showExtDropdown}
          setShowExtDropdown={setShowExtDropdown}
          isDryRun={isDryRun}
          setIsDryRun={setIsDryRun}
          skipYearFolders={skipYearFolders}
          setSkipYearFolders={setSkipYearFolders}
          cleanupEmptyFolders={cleanupEmptyFolders}
          setCleanupEmptyFolders={setCleanupEmptyFolders}
          taskData={taskData}
          addExtension={addExtension}
          removeExtension={removeExtension}
          handleExtensionButtonClick={handleExtensionButtonClick}
          handleSelectFolder={handleSelectFolder}
          handleStartOrganize={handleStartOrganize}
        />
      }
      progressSection={
        <TaskProgress taskData={taskData} pct={pct} logEntries={logEntries} logRef={logRef} />
      }
      outputSection={
        <FileOrganizerOutput
          isFinished={isFinished}
          taskData={taskData}
          successCount={successCount}
          failCount={failCount}
          handleOpenFolder={handleOpenFolder}
        />
      }
    />
  )
}
