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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase text-text-main">
          {t('tool_sat_profile_manager_title')}
        </h2>
      </div>

      <p className="text-text-main/80 border-l-4 border-bg-main-accent pl-4">
        {t('tool_sat_profile_manager_desc')}
      </p>

      {error && (
        <div className="p-4 border-2 border-red-500 bg-red-100/50 text-red-900 font-bold flex gap-2 items-center w-full">
          <span>❌</span> {error}
        </div>
      )}
      {saveStatus === 'success' && (
        <div className="p-4 border-2 border-green-500 bg-green-100/50 text-green-900 font-bold flex gap-2 items-center w-full">
          <span>✅</span> Profile saved securely!
        </div>
      )}

      <form onSubmit={handleSubmit} className="neo-brutal-box flex flex-col gap-4 bg-white">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">Name / Razón Social</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="neo-brutal-input w-full"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">RFC</label>
          <input
            type="text"
            name="rfc"
            value={formData.rfc}
            onChange={handleChange}
            className="neo-brutal-input w-full uppercase"
            placeholder="XXXX999999XXX"
            required
            maxLength={13}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">Tax Regime / Régimen Fiscal</label>
          <select
            name="taxRegime"
            value={formData.taxRegime}
            onChange={handleChange}
            className="neo-brutal-input w-full"
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

        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">CIEC Password</label>
          <input
            type="password"
            name="ciecPasswordEncrypted"
            value={formData.ciecPasswordEncrypted}
            onChange={handleChange}
            className="neo-brutal-input w-full"
            placeholder="Enter CIEC password (will be encrypted)"
          />
          <p className="text-xs text-text-main/60">
            This password is encrypted using OS-native secure storage before being saved to disk.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">e.firma Directory</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="efirmaPath"
              value={formData.efirmaPath}
              readOnly
              className="neo-brutal-input flex-1 bg-bg-main/20 cursor-not-allowed"
              placeholder="Select directory containing .cer and .key files"
            />
            <button
              type="button"
              onClick={selectEfirmaPath}
              className="neo-brutal-btn bg-bg-main-accent text-white whitespace-nowrap"
            >
              Browse
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-text-main">e.firma Password</label>
          <input
            type="password"
            name="efirmaPasswordEncrypted"
            value={formData.efirmaPasswordEncrypted}
            onChange={handleChange}
            className="neo-brutal-input w-full"
            placeholder="Enter e.firma password (will be encrypted)"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="neo-brutal-btn mt-4 w-full bg-text-main text-white hover:bg-black/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save SAT Profile'}
        </button>
      </form>
    </div>
  )
}
