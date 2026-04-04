import React from 'react'
import { useTranslation } from 'react-i18next'
import { useTaxProfileStore } from '../../../store/taxProfileStore'
import { usePreferenceStore } from '../../../store/preferenceStore'
import { useTaskStore, TaskTab } from '../../../store/taskStore'

export const TaxProfileCheck: React.FC = () => {
  const { t } = useTranslation()
  const { profile, isLoading } = useTaxProfileStore()
  const { dismissedTaxProfileWarning, setDismissedTaxProfileWarning } = usePreferenceStore()
  const { addTab } = useTaskStore()

  if (isLoading || dismissedTaxProfileWarning || (profile && profile.taxRegime)) {
    return null
  }

  const handleGoToProfile = (): void => {
    const tab: TaskTab = {
      id: `tool-satprofilemanager-${Date.now()}`,
      title: t('tool_sat_profile_manager_title'),
      type: 'tool_task',
      toolName: 'SatProfileManager'
    }
    addTab(tab)
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        border: '4px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        boxShadow: '8px 8px 0px var(--border-color)',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <div>
          <h3 style={{ margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>
            Missing SAT Profile Info
          </h3>
          <p style={{ margin: '0.5rem 0 0 0', lineHeight: '1.4' }}>
            You haven&apos;t configured your Tax Regime yet. Some automated features might not work
            correctly without this information.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button className="brutalist-button primary" onClick={handleGoToProfile}>
          Go to Profile Manager
        </button>
        <button
          className="brutalist-button"
          onClick={() => setDismissedTaxProfileWarning(true)}
          style={{ border: '2px solid var(--border-color)' }}
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  )
}
