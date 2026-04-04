import { renderHook, act } from '@testing-library/react'
import { useFileOrganizer } from '../useFileOrganizer'
import { useHeaderStore } from '../../../../store/headerStore'
import { useTaskStore } from '../../../../store/taskStore'
import { useAlertStore } from '../../../../store/alertStore'

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// Mock Electron API
const mockApi = {
  selectFolder: jest.fn(),
  startOrganizeTask: jest.fn(),
  openPath: jest.fn()
}

beforeAll(() => {
  ;(global.window as unknown as { api: typeof mockApi }).api = mockApi
})

describe('useFileOrganizer', () => {
  beforeEach(() => {
    // Reset stores
    useHeaderStore.setState({ title: '', navigation: null, actions: [] })
    useTaskStore.setState({
      tasks: {},
      tabs: [{ id: 'test-tab', title: 'Test', type: 'tool_task' }]
    })
    useAlertStore.setState({ isOpen: false, title: '', message: '' })

    // Clear mocks
    mockApi.selectFolder.mockReset()
    mockApi.startOrganizeTask.mockReset()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useFileOrganizer('test-tab', jest.fn()))

    expect(result.current.targetFolder).toBeNull()
    expect(result.current.selectedExtensions).toEqual(['*'])
    expect(result.current.isDryRun).toBe(true)
    expect(result.current.extensionInput).toBe('')
  })

  it('adds and formats custom extensions correctly', () => {
    const { result } = renderHook(() => useFileOrganizer('test-tab', jest.fn()))

    act(() => {
      result.current.addExtension('jpg')
    })
    // '*" should be replaced when a specific extension is added
    expect(result.current.selectedExtensions).toEqual(['.jpg'])

    act(() => {
      result.current.addExtension('.PNG')
    })
    expect(result.current.selectedExtensions).toEqual(['.jpg', '.png'])

    act(() => {
      result.current.addExtension('*')
    })
    // Adding '*' should reset and override specific extensions
    expect(result.current.selectedExtensions).toEqual(['*'])
  })

  it('removes extensions correctly and defaults to "*" when empty', () => {
    const { result } = renderHook(() => useFileOrganizer('test-tab', jest.fn()))

    act(() => {
      result.current.addExtension('jpg')
      result.current.addExtension('png')
    })

    act(() => {
      result.current.removeExtension('.png')
    })
    expect(result.current.selectedExtensions).toEqual(['.jpg'])

    act(() => {
      result.current.removeExtension('.jpg')
    })
    expect(result.current.selectedExtensions).toEqual(['*'])
  })

  it('handles folder selection correctly', async () => {
    mockApi.selectFolder.mockResolvedValue('C:\\Photos')
    const { result } = renderHook(() => useFileOrganizer('test-tab', jest.fn()))

    await act(async () => {
      await result.current.handleSelectFolder()
    })

    expect(result.current.targetFolder).toBe('C:\\Photos')
  })

  it('handles organize task start correctly', async () => {
    mockApi.selectFolder.mockResolvedValue('C:\\Photos')
    mockApi.startOrganizeTask.mockResolvedValue('task-123')

    const { result } = renderHook(() => useFileOrganizer('test-tab', jest.fn()))

    // Needs a target folder before starting
    await act(async () => {
      await result.current.handleSelectFolder()
    })

    await act(async () => {
      await result.current.handleStartOrganize()
    })

    expect(mockApi.startOrganizeTask).toHaveBeenCalledWith('C:\\Photos', ['*'], true, true, false)

    // Check if task store was updated with the new task ID
    const tabs = useTaskStore.getState().tabs
    const tab = tabs.find((t) => t.id === 'test-tab')
    expect(tab?.taskId).toBe('task-123')
  })
})
