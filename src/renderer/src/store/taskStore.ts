import { create } from 'zustand'
import { Task, TaskTab } from '../types/task'

/**
 * State of the task management store.
 */
interface TaskStore {
  /** Record of all tasks keyed by their ID. */
  tasks: Record<string, Task>
  /** List of all tabs in the application. */
  tabs: TaskTab[]
  /** ID of the active tab. */
  activeTabId: string
  /** Adds a new task to the store. */
  addTask: (task: Task) => void
  /** Updates an existing task in the store. */
  updateTask: (task: Task) => void
  /** Adds a new tab and sets it as active. */
  addTab: (tab: TaskTab) => void
  /** Removes a tab and updates the active tab. */
  removeTab: (id: string) => void
  /** Sets a tab as active. */
  setActiveTab: (id: string) => void
  /** Initializes the store by loading tasks and setting up IPC listeners. */
  initialize: () => void
}

/**
 * Global store for managing application tasks and navigation tabs.
 */
export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  tabs: [{ id: 'home', title: 'Home', type: 'home' }],
  activeTabId: 'home',

  addTask: (task) => {
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task }
    }))
  },

  updateTask: (task) => {
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task }
    }))
  },

  addTab: (tab) => {
    set((state) => {
      const exists = state.tabs.find((t) => t.id === tab.id)
      if (exists) return { activeTabId: tab.id }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id
      }
    })
  },

  removeTab: (id) => {
    set((state) => {
      if (id === 'home') return state
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let nextActiveTab = state.activeTabId
      if (state.activeTabId === id) {
        nextActiveTab = newTabs[newTabs.length - 1].id
      }
      return {
        tabs: newTabs,
        activeTabId: nextActiveTab
      }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  initialize: () => {
    // @ts-ignore: electron api
    if (window.api?.getActiveTasks) {
      // @ts-ignore: electron api
      window.api.getActiveTasks().then((activeTasks: unknown[]) => {
        const tasksObj = (activeTasks as Task[]).reduce(
          (acc, task) => {
            acc[task.id] = task
            return acc
          },
          {} as Record<string, Task>
        )
        set({ tasks: tasksObj })
      })
    }

    // @ts-ignore: electron api
    if (window.api?.onTaskProgress) {
      // @ts-ignore: electron api
      window.api.onTaskProgress((_event: unknown, updatedTask: unknown) => {
        get().updateTask(updatedTask as Task)
      })
    }
  }
}))
