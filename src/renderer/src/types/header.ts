import { ReactNode } from 'react'

/**
 * Interface representing an action displayed in the header.
 */
export interface HeaderAction {
  /** Label for the action button. */
  label: string
  /** Callback triggered when the action is clicked. */
  onClick: () => void
  /** Visual variant of the action button. */
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info'
}

/**
 * State representing the configuration of the application's header.
 */
export interface HeaderState {
  /** The current title of the application. */
  title: string
  /** Optional React element for navigation (e.g., 'Back' button). */
  navigation: ReactNode | null
  /** Optional snippets or icons in the header. */
  snippets: ReactNode | null
  /** List of actions (buttons) to display in the header. */
  actions: HeaderAction[]
  /** Updates the header's title. */
  setTitle: (title: string) => void
  /** Updates the navigation element. */
  setNavigation: (navigation: ReactNode | null) => void
  /** Updates the snippets element. */
  setSnippets: (snippets: ReactNode | null) => void
  /** Updates the list of header actions. */
  setActions: (actions: HeaderAction[]) => void
  /** Resets the header state to its initial configuration. */
  reset: () => void
}
