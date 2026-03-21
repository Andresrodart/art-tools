import { create } from 'zustand'
import { HeaderState } from '../types/header'

/** Initial state for the header store. */
const initialState = {
  title: 'Tool Gallery',
  navigation: null,
  snippets: null,
  actions: []
}

/**
 * Global store for managing the application's header configuration.
 */
export const useHeaderStore = create<HeaderState>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setNavigation: (navigation) => set({ navigation }),
  setSnippets: (snippets) => set({ snippets }),
  setActions: (actions) => set({ actions }),
  reset: () => set(initialState)
}))
