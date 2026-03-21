/**
 * @jest-environment jsdom
 */
import { usePreferenceStore } from '../preferenceStore'
import { act } from 'react'

// Mock the window.api
const mockSetPreferences = jest.fn()
const mockGetPreferences = jest.fn()

// @ts-ignore
window.api = {
  setPreferences: mockSetPreferences,
  getPreferences: mockGetPreferences
}

describe('preferenceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePreferenceStore.setState({
      favorites: new Set(),
      searchQuery: '',
      selectedCategory: null,
      initialized: false
    })
  })

  test('should initialize with favorites from API', async () => {
    mockGetPreferences.mockResolvedValue({ favorites: ['tool-1', 'tool-2'] })

    await act(async () => {
      await usePreferenceStore.getState().initialize()
    })

    expect(usePreferenceStore.getState().favorites.has('tool-1')).toBe(true)
    expect(usePreferenceStore.getState().favorites.has('tool-2')).toBe(true)
    expect(usePreferenceStore.getState().initialized).toBe(true)
  })

  test('should toggle favorite and call API', async () => {
    mockSetPreferences.mockResolvedValue(true)

    await act(async () => {
      await usePreferenceStore.getState().toggleFavorite('tool-1')
    })

    expect(usePreferenceStore.getState().favorites.has('tool-1')).toBe(true)
    expect(mockSetPreferences).toHaveBeenCalledWith({ favorites: ['tool-1'] })

    await act(async () => {
      await usePreferenceStore.getState().toggleFavorite('tool-1')
    })

    expect(usePreferenceStore.getState().favorites.has('tool-1')).toBe(false)
    expect(mockSetPreferences).toHaveBeenCalledWith({ favorites: [] })
  })

  test('should update search query', () => {
    act(() => {
      usePreferenceStore.getState().setSearchQuery('test query')
    })

    expect(usePreferenceStore.getState().searchQuery).toBe('test query')
  })

  test('should update selected category', () => {
    act(() => {
      usePreferenceStore.getState().setSelectedCategory('media')
    })

    expect(usePreferenceStore.getState().selectedCategory).toBe('media')
  })
})
