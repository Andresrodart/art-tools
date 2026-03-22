import { useHeaderStore } from '../headerStore'

describe('headerStore', () => {
  beforeEach(() => {
    // Reset store before each test to ensure a clean slate
/**
 * @jest-environment jsdom
 */

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
    // Simple dummy ReactNode for testing
    const dummyNavigation = 'Dummy Navigation'
    useHeaderStore.getState().setNavigation(dummyNavigation)
    expect(useHeaderStore.getState().navigation).toBe(dummyNavigation)

    useHeaderStore.getState().setNavigation(null)
    expect(useHeaderStore.getState().navigation).toBeNull()
  })

  it('should update the snippets when setSnippets is called', () => {
    // Simple dummy ReactNode for testing
    const dummySnippets = 'Dummy Snippets'
    useHeaderStore.getState().setSnippets(dummySnippets)
    expect(useHeaderStore.getState().snippets).toBe(dummySnippets)

    useHeaderStore.getState().setSnippets(null)
    expect(useHeaderStore.getState().snippets).toBeNull()
  })

  it('should update the actions when setActions is called', () => {
    // Specify correct type to satisfy linter rule @typescript-eslint/no-explicit-any
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
    // Verify it's back to initial state
    const state = useHeaderStore.getState()
    expect(state.title).toBe(initialState.title)
    expect(state.navigation).toBe(initialState.navigation)
    expect(state.snippets).toBe(initialState.snippets)
    expect(state.actions).toEqual(initialState.actions)
  })
})
