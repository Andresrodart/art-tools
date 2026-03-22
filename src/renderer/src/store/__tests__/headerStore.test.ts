import { useHeaderStore } from '../headerStore'

describe('headerStore', () => {
  beforeEach(() => {
    // Reset store before each test to ensure a clean slate
    useHeaderStore.getState().reset()
  })

  it('should initialize with the correct default state', () => {
    const state = useHeaderStore.getState()
    expect(state.title).toBe('Tool Gallery')
    expect(state.navigation).toBeNull()
    expect(state.snippets).toBeNull()
    expect(state.actions).toEqual([])
  })

  it('should update the title using setTitle', () => {
    useHeaderStore.getState().setTitle('New Dashboard Title')
    expect(useHeaderStore.getState().title).toBe('New Dashboard Title')
  })

  it('should update navigation using setNavigation', () => {
    const mockNavigation = 'Mock Navigation Component' // strings are valid ReactNodes
    useHeaderStore.getState().setNavigation(mockNavigation)
    expect(useHeaderStore.getState().navigation).toBe(mockNavigation)
  })

  it('should update snippets using setSnippets', () => {
    const mockSnippets = 'Mock Snippets Component' // strings are valid ReactNodes
    useHeaderStore.getState().setSnippets(mockSnippets)
    expect(useHeaderStore.getState().snippets).toBe(mockSnippets)
  })

  it('should update actions using setActions', () => {
    const mockActions = [
      { label: 'Save', onClick: jest.fn(), variant: 'primary' as const },
      { label: 'Cancel', onClick: jest.fn() }
    ]
    useHeaderStore.getState().setActions(mockActions)
    expect(useHeaderStore.getState().actions).toEqual(mockActions)
  })

  it('should clear navigation, snippets, and actions when reset is called', () => {
    // Setup initial state
    const mockNavigation = 'Mock Navigation' // strings are valid ReactNodes
    const mockSnippets = 'Mock Snippets' // strings are valid ReactNodes
    const mockActions = [{ label: 'Action', onClick: jest.fn() }]

    useHeaderStore.getState().setTitle('Modified Title')
    useHeaderStore.getState().setNavigation(mockNavigation)
    useHeaderStore.getState().setSnippets(mockSnippets)
    useHeaderStore.getState().setActions(mockActions)

    // Verify state was modified
    expect(useHeaderStore.getState().title).toBe('Modified Title')
    expect(useHeaderStore.getState().navigation).toBe(mockNavigation)

    // Call reset
    useHeaderStore.getState().reset()

    // Verify state is back to initial
    const state = useHeaderStore.getState()
    expect(state.title).toBe('Tool Gallery')
    expect(state.navigation).toBeNull()
    expect(state.snippets).toBeNull()
    expect(state.actions).toEqual([])
  })
})
