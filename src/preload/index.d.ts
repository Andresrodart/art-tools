import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      readFile: (filePath: string) => Promise<string>
      writeFile: (filePath: string, content: string) => Promise<boolean>
      execCommand: (
        command: string
      ) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
    }
  }
}
