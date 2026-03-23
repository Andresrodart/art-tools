import React from 'react'
import { useTaskStore } from '../../store/taskStore'
import { useTranslation } from 'react-i18next'
import { useAlertStore } from '../../store/alertStore'

export const Tabs: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, tasks } = useTaskStore()
  const { t } = useTranslation()

  const handleClose = async (e: React.MouseEvent, id: string): Promise<void> => {
    e.stopPropagation()
    const tabToClose = tabs.find((t) => t.id === id)
    const taskIdToCancel = tabToClose?.taskId || id
    const task = tasks[taskIdToCancel]
    const isRunning = task && (task.status === 'running' || task.status === 'pending')

    const message = isRunning
      ? t('confirm_close_active_task', {
          defaultValue: 'This task is still running. Closing this tab will cancel it. Are you sure?'
        })
      : t('confirm_close_task', { defaultValue: 'Are you sure you want to close this tab?' })

    const confirmed = await useAlertStore
      .getState()
      .showAlert(t('common.confirm', 'Confirm'), message, 'warning', 'confirm')

    if (confirmed) {
      if (isRunning && window.api?.cancelTask) {
        window.api.cancelTask(taskIdToCancel).catch(console.error)
      }
      removeTab(id)
    }
  }

  return (
    <nav className="brutalist-tabs">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id
        const task = tab.taskId ? tasks[tab.taskId] : tasks[tab.id]
        const isError = task?.status === 'error'
        const isSuccess = task?.status === 'completed'

        return (
          <div
            key={tab.id}
            className={`brutalist-tab ${isActive ? 'active' : ''} ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            {tab.type !== 'home' && (
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
