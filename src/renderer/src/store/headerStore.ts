import { create } from 'zustand'
import { ReactNode } from 'react'

interface HeaderAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info'
}

interface HeaderState {
  title: string
  navigation: ReactNode | null
  snippets: ReactNode | null
  actions: HeaderAction[]
  setTitle: (title: string) => void
  setNavigation: (navigation: ReactNode | null) => void
  setSnippets: (snippets: ReactNode | null) => void
  setActions: (actions: HeaderAction[]) => void
  reset: () => void
}

const initialState = {
  title: 'Tool Gallery',
  navigation: null,
  snippets: null,
  actions: [],
}

export const useHeaderStore = create<HeaderState>((set) => ({
  ...initialState,
  setTitle: (title) => set({ title }),
  setNavigation: (navigation) => set({ navigation }),
  setSnippets: (snippets) => set({ snippets }),
  setActions: (actions) => set({ actions }),
  reset: () => set(initialState),
}))
