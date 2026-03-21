import { create } from 'zustand'

interface PreferenceState {
  favorites: Set<string>
  searchQuery: string
  selectedCategory: string | null
  initialized: boolean
  toggleFavorite: (toolId: string) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string | null) => void
  initialize: () => Promise<void>
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  favorites: new Set(),
  searchQuery: '',
  selectedCategory: null,
  initialized: false,

  toggleFavorite: async (toolId) => {
    const newFavorites = new Set(get().favorites)
    if (newFavorites.has(toolId)) {
      newFavorites.delete(toolId)
    } else {
      newFavorites.add(toolId)
    }
    set({ favorites: newFavorites })

    // Save to persistence
    // @ts-ignore: electron api
    if (window.api?.setPreferences) {
      // @ts-ignore: electron api
      await window.api.setPreferences({ favorites: Array.from(newFavorites) })
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  initialize: async () => {
    if (get().initialized) return

    // @ts-ignore: electron api
    if (window.api?.getPreferences) {
      // @ts-ignore: electron api
      const prefs = await window.api.getPreferences()
      if (prefs && Array.isArray(prefs.favorites)) {
        set({ favorites: new Set(prefs.favorites as string[]) })
      }
    }
    set({ initialized: true })
  }
}))
