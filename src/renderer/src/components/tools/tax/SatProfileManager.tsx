import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTaxProfileStore, SatProfile } from '../../../store/taxProfileStore'
import React from 'react'

export const SatProfileManager = (): React.JSX.Element => {
  const { t } = useTranslation()
  const { profile, fetchProfile, saveProfile, isLoading, error } = useTaxProfileStore()

  const [formData, setFormData] = useState<SatProfile>({
    name: '',
    rfc: '',
    taxRegime: '',
    ciecPasswordEncrypted: '',
    efirmaPath: '',
    efirmaPasswordEncrypted: ''
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(profile)
    }
  }, [profile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSaveStatus('idle')
    const success = await saveProfile(formData)
    setSaveStatus(success ? 'success' : 'error')

    // Clear success message after 3 seconds
    if (success) {
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const selectEfirmaPath = async (): Promise<void> => {
    const folderPath = await window.api.selectFolder()
    if (folderPath) {
      setFormData((prev) => ({ ...prev, efirmaPath: folderPath }))
    }
  }

  return (
    <div className="tool-view">
      <div className="tool-view-description">
        <h2>{t('tool_sat_profile_manager_title')}</h2>
        <p>{t('tool_sat_profile_manager_desc')}</p>
      </div>

      {error && (
        <div style={{ color: 'var(--bg-tertiary)', fontWeight: 'bold', marginBottom: '1rem' }}>
          ❌ {error}
        </div>
      )}
      {saveStatus === 'success' && (
        <div style={{ color: 'var(--bg-secondary)', fontWeight: 'bold', marginBottom: '1rem' }}>
          ✅ Profile saved securely!
        </div>
      )}

      <form onSubmit={handleSubmit} className="tool-view-section">
        <h3 className="tool-view-section-title">Profile Configuration</h3>
        <div className="tool-view-section-body">
          <div className="control-group">
            <label>Name / Razón Social</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="brutalist-input"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="control-group">
            <label>RFC</label>
            <input
              type="text"
              name="rfc"
              value={formData.rfc}
              onChange={handleChange}
              className="brutalist-input uppercase"
              placeholder="XXXX999999XXX"
              required
              maxLength={13}
            />
          </div>

          <div className="control-group">
            <label>Tax Regime / Régimen Fiscal</label>
            <select
              name="taxRegime"
              value={formData.taxRegime}
              onChange={handleChange}
              className="brutalist-input"
              required
            >
              <option value="">Select a Regime...</option>
              <option value="601">601 - General de Ley Personas Morales</option>
              <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
              <option value="606">606 - Arrendamiento</option>
              <option value="612">
                612 - Personas Físicas con Actividades Empresariales y Profesionales
              </option>
              <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
            </select>
          </div>

          <div className="control-group">
            <label>CIEC Password</label>
            <input
              type="password"
              name="ciecPasswordEncrypted"
              value={formData.ciecPasswordEncrypted}
              onChange={handleChange}
              className="brutalist-input"
              placeholder="Enter CIEC password (will be encrypted)"
            />
            <small className="help-text">
              This password is encrypted using OS-native secure storage before being saved to disk.
            </small>
          </div>

          <div className="control-group">
            <label>e.firma Directory</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="efirmaPath"
                value={formData.efirmaPath || ''}
                readOnly
                className="brutalist-input flex-grow"
                placeholder="Select directory containing .cer and .key files"
              />
              <button type="button" onClick={selectEfirmaPath} className="brutalist-button info">
                {t('browse')}
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>e.firma Password</label>
            <input
              type="password"
              name="efirmaPasswordEncrypted"
              value={formData.efirmaPasswordEncrypted}
              onChange={handleChange}
              className="brutalist-input"
              placeholder="Enter e.firma password (will be encrypted)"
            />
          </div>

          <div className="action-row">
            <button type="submit" disabled={isLoading} className="brutalist-button primary">
              {isLoading ? 'Saving...' : 'Save SAT Profile'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
