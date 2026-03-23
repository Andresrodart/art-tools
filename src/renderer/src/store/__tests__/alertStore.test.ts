import { useAlertStore } from '../alertStore'

describe('alertStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useAlertStore.setState({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      mode: 'alert',
      resolvePromise: null
    })
  })

  it('should initialize with default state', () => {
    const state = useAlertStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.title).toBe('')
    expect(state.message).toBe('')
    expect(state.type).toBe('info')
    expect(state.mode).toBe('alert')
    expect(state.resolvePromise).toBeNull()
  })

  it('showAlert should update state and return a promise', async () => {
    const promise = useAlertStore
      .getState()
      .showAlert('Test Title', 'Test Message', 'error', 'confirm')

    const state = useAlertStore.getState()
    expect(state.isOpen).toBe(true)
    expect(state.title).toBe('Test Title')
    expect(state.message).toBe('Test Message')
    expect(state.type).toBe('error')
    expect(state.mode).toBe('confirm')
    expect(typeof state.resolvePromise).toBe('function')

    // Clean up
    useAlertStore.getState().closeAlert(true)
    await promise
  })

  it('closeAlert should resolve the promise with true and reset state', async () => {
    const promise = useAlertStore.getState().showAlert('Title', 'Message')
    useAlertStore.getState().closeAlert(true)

    const result = await promise
    expect(result).toBe(true)

    const state = useAlertStore.getState()
    expect(state.isOpen).toBe(false)
  })

  it('closeAlert should resolve the promise with false and reset state', async () => {
    const promise = useAlertStore.getState().showAlert('Title', 'Message', 'warning', 'confirm')
    useAlertStore.getState().closeAlert(false)

    const result = await promise
    expect(result).toBe(false)

    const state = useAlertStore.getState()
    expect(state.isOpen).toBe(false)
  })
})
