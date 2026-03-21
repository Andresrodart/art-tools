import { create } from 'zustand'

export interface TaskProgress {
  current: number
  total: number
  message?: string
}

export interface Task {
  id: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'dry-run'
  progress: TaskProgress
  result?: unknown
  error?: string
  createdAt: number
  updatedAt: number
}

export interface TaskTab {
  id: string // 'home' or taskId
  title: string
  type: 'home' | 'task'
}

interface TaskStore {
  tasks: Record<string, Task>
  tabs: TaskTab[]
  activeTabId: string
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  addTab: (tab: TaskTab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  initialize: () => void
}

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
      window.api.getActiveTasks().then((activeTasks: Task[]) => {
        const tasksObj = activeTasks.reduce(
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
      window.api.onTaskProgress((_event, updatedTask: Task) => {
        get().updateTask(updatedTask)
      })
    }
  }
}))
