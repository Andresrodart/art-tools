import { create } from 'zustand'

export type AlertType = 'info' | 'success' | 'warning' | 'error'
export type AlertMode = 'alert' | 'confirm'

interface AlertState {
  isOpen: boolean
  title: string
  message: string
  type: AlertType
  mode: AlertMode
  resolvePromise: ((value: boolean) => void) | null
}

interface AlertActions {
  showAlert: (
    title: string,
    message: string,
    type?: AlertType,
    mode?: AlertMode
  ) => Promise<boolean>
  closeAlert: (result: boolean) => void
}

type AlertStore = AlertState & AlertActions

const initialState: AlertState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  mode: 'alert',
  resolvePromise: null
}

export const useAlertStore = create<AlertStore>((set) => ({
  ...initialState,
  showAlert: (
    title: string,
    message: string,
    type: AlertType = 'info',
    mode: AlertMode = 'alert'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        type,
        mode,
        resolvePromise: resolve
      })
    })
  },
  closeAlert: (result: boolean): void => {
    set((state) => {
      if (state.resolvePromise) {
        state.resolvePromise(result)
      }
      return {
        ...initialState,
        isOpen: false // Ensure it's closed
      }
    })
  }
}))
