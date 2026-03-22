import { create } from 'zustand'

export interface SatProfile {
  name: string
  rfc: string
  taxRegime: string
  ciecPasswordEncrypted?: string
  efirmaPath?: string
  efirmaPasswordEncrypted?: string
}

interface TaxProfileState {
  profile: SatProfile | null
  isLoading: boolean
  error: string | null
  fetchProfile: () => Promise<void>
  saveProfile: (profile: SatProfile) => Promise<boolean>
}

export const useTaxProfileStore = create<TaxProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const data = await window.api.getSatProfile()
      if (data) {
        set({ profile: data as unknown as SatProfile, isLoading: false })
      } else {
        set({ profile: null, isLoading: false })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false })
    }
  },

  saveProfile: async (profile: SatProfile): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const success = await window.api.saveSatProfile(profile as unknown as Record<string, unknown>)
      if (success) {
        set({ profile, isLoading: false })
        return true
      } else {
        set({ error: 'Failed to save profile', isLoading: false })
        return false
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error', isLoading: false })
      return false
    }
  }
}))
