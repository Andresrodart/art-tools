import { useTaskStore, Task, TaskTab } from '../taskStore'
import { act } from 'react'

// Reset Zustand state manually between tests
const resetStore = () => {
  useTaskStore.setState({
    tasks: {},
    tabs: [{ id: 'home', title: 'Home', type: 'home' }],
    activeTabId: 'home'
  })
}

describe('taskStore', () => {
  beforeEach(() => {
    resetStore()
  })

  it('should initialize with a home tab', () => {
    const { tabs, activeTabId } = useTaskStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).toBe('home')
    expect(activeTabId).toBe('home')
  })

  it('should add a task and a tab', () => {
    const task: Task = {
      id: 'task-1',
      type: 'test-task',
      status: 'pending',
      progress: { current: 0, total: 100 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const tab: TaskTab = { id: 'task-1', title: 'Test Task', type: 'task' }

    act(() => {
      useTaskStore.getState().addTask(task)
      useTaskStore.getState().addTab(tab)
    })

    const state = useTaskStore.getState()
    expect(state.tasks['task-1']).toEqual(task)
    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe('task-1')
  })

  it('should update an existing task', () => {
    const task: Task = {
      id: 'task-1',
      type: 'test-task',
      status: 'pending',
      progress: { current: 0, total: 100 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    act(() => {
      useTaskStore.getState().addTask(task)
    })

    const updatedTask: Task = { ...task, status: 'running', progress: { current: 50, total: 100 } }

    act(() => {
      useTaskStore.getState().updateTask(updatedTask)
    })

    expect(useTaskStore.getState().tasks['task-1'].status).toBe('running')
    expect(useTaskStore.getState().tasks['task-1'].progress.current).toBe(50)
  })

  it('should remove a tab and switch to previous one', () => {
    const tab1: TaskTab = { id: 'task-1', title: 'Task 1', type: 'task' }
    const tab2: TaskTab = { id: 'task-2', title: 'Task 2', type: 'task' }

    act(() => {
      useTaskStore.getState().addTab(tab1)
      useTaskStore.getState().addTab(tab2)
    })

    expect(useTaskStore.getState().activeTabId).toBe('task-2')

    act(() => {
      useTaskStore.getState().removeTab('task-2')
    })

    const state = useTaskStore.getState()
    expect(state.tabs).toHaveLength(2) // home and task-1
    expect(state.tabs.find(t => t.id === 'task-2')).toBeUndefined()
    expect(state.activeTabId).toBe('task-1')
  })

  it('should not remove the home tab', () => {
    act(() => {
      useTaskStore.getState().removeTab('home')
    })
    expect(useTaskStore.getState().tabs).toHaveLength(1)
    expect(useTaskStore.getState().tabs[0].id).toBe('home')
  })
})
