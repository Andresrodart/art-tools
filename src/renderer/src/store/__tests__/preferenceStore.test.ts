import { usePreferenceStore } from '../preferenceStore'

// Mock the window.api
beforeAll(() => {
  Object.defineProperty(window, 'api', {
    value: {
      getPreferences: jest.fn().mockResolvedValue({ favorites: ['Tool1'] }),
      setPreferences: jest.fn().mockResolvedValue(true)
    },
    writable: true
  })
})

describe('preferenceStore', () => {
  beforeEach(() => {
    usePreferenceStore.setState({
      searchQuery: '',
      activeCategory: 'All',
      favorites: [],
      isInitialized: false
    })
    jest.clearAllMocks()
  })

  it('initializes and sets favorites from getPreferences', async () => {
    await usePreferenceStore.getState().initialize()
    expect(usePreferenceStore.getState().isInitialized).toBe(true)
    expect(usePreferenceStore.getState().favorites).toEqual(['Tool1'])
  })

  it('updates searchQuery', () => {
    usePreferenceStore.getState().setSearchQuery('test')
    expect(usePreferenceStore.getState().searchQuery).toBe('test')
  })

  it('updates activeCategory', () => {
    usePreferenceStore.getState().setActiveCategory('Tax')
    expect(usePreferenceStore.getState().activeCategory).toBe('Tax')
  })

  it('toggles a favorite on and off, saving preferences', async () => {
    // Add
    await usePreferenceStore.getState().toggleFavorite('Tool2')
    expect(usePreferenceStore.getState().favorites).toEqual(['Tool2'])
    // @ts-ignore: window.api type mock missing
    expect(window.api.setPreferences).toHaveBeenCalledWith({ favorites: ['Tool2'] })

    // Remove
    await usePreferenceStore.getState().toggleFavorite('Tool2')
    expect(usePreferenceStore.getState().favorites).toEqual([])
    // @ts-ignore: window.api type mock missing
    expect(window.api.setPreferences).toHaveBeenCalledWith({ favorites: [] })
  })
})
