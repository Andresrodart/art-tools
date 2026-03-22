import { create } from 'zustand'

export interface PreferenceState {
  searchQuery: string
  activeCategory: string
  favorites: string[] // List of tool IDs
  isInitialized: boolean

  setSearchQuery: (query: string) => void
  setActiveCategory: (category: string) => void
  toggleFavorite: (toolId: string) => void
  initialize: () => Promise<void>
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  searchQuery: '',
  activeCategory: 'All',
  favorites: [],
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
      // @ts-ignore
      const currentPrefs = await window.api.getPreferences()
      // @ts-ignore
      await window.api.setPreferences({ ...currentPrefs, favorites: newFavorites })
    } catch (err) {
      console.error('Failed to save favorites preference', err)
    }
  },

  initialize: async (): Promise<void> => {
    if (get().isInitialized) return

    try {
      // @ts-ignore
      const prefs = await window.api.getPreferences()
      if (prefs && Array.isArray(prefs.favorites)) {
        set({ favorites: prefs.favorites })
      }
    } catch (err) {
      console.error('Failed to load preferences', err)
    } finally {
      set({ isInitialized: true })
    }
  }
}))
