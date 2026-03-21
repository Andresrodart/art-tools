import { useHeaderStore } from '../headerStore'

/**
 * Resets the header store to its initial state before each test.
 * @returns {void}
 */
const resetStore = (): void => {
  useHeaderStore.getState().reset()
}

describe('headerStore', () => {
  beforeEach((): void => {
    resetStore()
  })

  /**
   * Tests if the store initializes with the correct default values.
   */
  it('should initialize with default values', (): void => {
    const { title, navigation, snippets, actions } = useHeaderStore.getState()
    expect(title).toBe('Tool Gallery')
    expect(navigation).toBeNull()
    expect(snippets).toBeNull()
    expect(actions).toEqual([])
  })

  /**
   * Tests if setTitle correctly updates the title in the store.
   */
  it('should update title', (): void => {
    useHeaderStore.getState().setTitle('New Title')
    expect(useHeaderStore.getState().title).toBe('New Title')
  })

  /**
   * Tests if setNavigation correctly updates the navigation element in the store.
   */
  it('should update navigation', (): void => {
    const navigation = 'Nav Content'
    useHeaderStore.getState().setNavigation(navigation)
    expect(useHeaderStore.getState().navigation).toBe(navigation)
  })

  /**
   * Tests if setSnippets correctly updates the snippets element in the store.
   */
  it('should update snippets', (): void => {
    const snippets = 'Snippet Content'
    useHeaderStore.getState().setSnippets(snippets)
    expect(useHeaderStore.getState().snippets).toBe(snippets)
  })

  /**
   * Tests if setActions correctly updates the action buttons in the store.
   */
  it('should update actions', (): void => {
    const actions = [{ label: 'Click Me', onClick: jest.fn() }]
    useHeaderStore.getState().setActions(actions)
    expect(useHeaderStore.getState().actions).toEqual(actions)
  })

  /**
   * Tests if the reset action correctly returns the store to its initial state.
   */
  it('should reset store to initial state', (): void => {
    useHeaderStore.getState().setTitle('Modified Title')
    useHeaderStore.getState().setNavigation('Modified Nav')
    useHeaderStore.getState().setSnippets('Modified Snippets')
    useHeaderStore.getState().setActions([{ label: 'Action', onClick: (): void => {} }])

    useHeaderStore.getState().reset()

    const state = useHeaderStore.getState()
    expect(state.title).toBe('Tool Gallery')
    expect(state.navigation).toBeNull()
    expect(state.snippets).toBeNull()
    expect(state.actions).toEqual([])
  })
})
