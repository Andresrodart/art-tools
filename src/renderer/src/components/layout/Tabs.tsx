import React from 'react'
import { useTaskStore } from '../../store/taskStore'
import { useTranslation } from 'react-i18next'

export const Tabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, tasks } = useTaskStore()
  const { t } = useTranslation()

  const handleClose = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation()
    const task = tasks[id]
    const isRunning = task && (task.status === 'running' || task.status === 'pending')

    const message = isRunning
      ? t('confirm_close_active_task', { defaultValue: 'This task is still running. Closing this tab will cancel it. Are you sure?' })
      : t('confirm_close_task', { defaultValue: 'Are you sure you want to close this tab?' })

    if (window.confirm(message)) {
      if (isRunning && window.api?.cancelTask) {
        window.api.cancelTask(id).catch(console.error)
      }
      removeTab(id)
    }
  }

  return (
    <nav className="brutalist-tabs">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id
        const task = tasks[tab.id]
        const isError = task?.status === 'error'
        const isSuccess = task?.status === 'completed'

        return (
          <div
            key={tab.id}
            className={`brutalist-tab ${isActive ? 'active' : ''} ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.type === 'task' && (
              <button
                className="tab-close"
                onClick={(e) => handleClose(e, tab.id)}
                title={t('close_tab', { defaultValue: 'Close Tab' })}
              >
                &times;
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
