import { create } from 'zustand'

export interface PreferenceState {
  searchQuery: string
  activeCategory: string
  favorites: string[] // List of tool IDs
  dismissedTaxProfileWarning: boolean
  isInitialized: boolean

  setSearchQuery: (query: string) => void
  setActiveCategory: (category: string) => void
  toggleFavorite: (toolId: string) => void
  setDismissedTaxProfileWarning: (dismissed: boolean) => void
  initialize: () => Promise<void>
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  searchQuery: '',
  activeCategory: 'All',
  favorites: [],
  dismissedTaxProfileWarning: false,
  isInitialized: false,

  setSearchQuery: (query: string): void => {
    set({ searchQuery: query })
  },

  setActiveCategory: (category: string): void => {
    set({ activeCategory: category })
  },

  toggleFavorite: async (toolId: string): Promise<void> => {
    const { favorites } = get()
    let newFavorites: string[]

    if (favorites.includes(toolId)) {
      newFavorites = favorites.filter((id) => id !== toolId)
    } else {
      newFavorites = [...favorites, toolId]
    }

    // Update state immediately for responsive UI
    set({ favorites: newFavorites })

    // Persist to main process
    try {
      // @ts-ignore: window.api type not fully defined
      const currentPrefs = await window.api.getPreferences()
      // @ts-ignore: window.api type not fully defined
      await window.api.setPreferences({ ...currentPrefs, favorites: newFavorites })
    } catch (err) {
      console.error('Failed to save favorites preference', err)
    }
  },
  setDismissedTaxProfileWarning: async (dismissed: boolean): Promise<void> => {
    set({ dismissedTaxProfileWarning: dismissed })
    try {
      // @ts-ignore: window.api type not fully defined
      const currentPrefs = await window.api.getPreferences()
      // @ts-ignore: window.api type not fully defined
      await window.api.setPreferences({ ...currentPrefs, dismissedTaxProfileWarning: dismissed })
    } catch (err) {
      console.error('Failed to save dismissedTaxProfileWarning preference', err)
    }
  },

  initialize: async (): Promise<void> => {
    if (get().isInitialized) return

    try {
      // @ts-ignore: window.api type not fully defined
      const prefs = await window.api.getPreferences()
      if (prefs && Array.isArray(prefs.favorites)) {
        set({ favorites: prefs.favorites })
      }
      if (prefs && typeof prefs.dismissedTaxProfileWarning === 'boolean') {
        set({ dismissedTaxProfileWarning: prefs.dismissedTaxProfileWarning })
      }
    } catch (err) {
      console.error('Failed to load preferences', err)
    } finally {
      set({ isInitialized: true })
    }
  }
}))
