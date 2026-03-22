import { useHeaderStore } from '../headerStore'

describe('headerStore', () => {
  const initialState = {
    title: 'Tool Gallery',
    navigation: null,
    snippets: null,
    actions: []
  }

  beforeEach(() => {
    // Reset the store before each test
    useHeaderStore.getState().reset()
  })

  it('should initialize with the correct default state', () => {
    const state = useHeaderStore.getState()
    expect(state.title).toBe(initialState.title)
    expect(state.navigation).toBe(initialState.navigation)
    expect(state.snippets).toBe(initialState.snippets)
    expect(state.actions).toEqual(initialState.actions)
  })

  it('should update the title when setTitle is called', () => {
    const newTitle = 'New Test Title'
    useHeaderStore.getState().setTitle(newTitle)
    expect(useHeaderStore.getState().title).toBe(newTitle)
  })

  it('should update the navigation when setNavigation is called', () => {
    const dummyNavigation = 'Dummy Navigation'
    useHeaderStore.getState().setNavigation(dummyNavigation)
    expect(useHeaderStore.getState().navigation).toBe(dummyNavigation)

    useHeaderStore.getState().setNavigation(null)
    expect(useHeaderStore.getState().navigation).toBeNull()
  })

  it('should update the snippets when setSnippets is called', () => {
    const dummySnippets = 'Dummy Snippets'
    useHeaderStore.getState().setSnippets(dummySnippets)
    expect(useHeaderStore.getState().snippets).toBe(dummySnippets)

    useHeaderStore.getState().setSnippets(null)
    expect(useHeaderStore.getState().snippets).toBeNull()
  })

  it('should update the actions when setActions is called', () => {
    const newActions: {
      label: string
      onClick: () => void
      variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info'
    }[] = [
      { label: 'Action 1', onClick: jest.fn(), variant: 'primary' },
      { label: 'Action 2', onClick: jest.fn(), variant: 'danger' }
    ]
    useHeaderStore.getState().setActions(newActions)
    expect(useHeaderStore.getState().actions).toEqual(newActions)
  })

  it('should reset the state to initial when reset is called', () => {
    // Modify the state first
    useHeaderStore.getState().setTitle('Modified Title')
    useHeaderStore.getState().setNavigation('Modified Navigation')
    useHeaderStore.getState().setSnippets('Modified Snippets')
    useHeaderStore.getState().setActions([{ label: 'Action', onClick: jest.fn() }])

    // Call reset
    useHeaderStore.getState().reset()

    // Verify state is back to initial
    const state = useHeaderStore.getState()
    expect(state.title).toBe(initialState.title)
    expect(state.navigation).toBe(initialState.navigation)
    expect(state.snippets).toBe(initialState.snippets)
    expect(state.actions).toEqual(initialState.actions)
  })
})
