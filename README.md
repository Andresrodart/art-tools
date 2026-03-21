# Art Tools

An Electron application with React, TypeScript, and Vite.

## Current State & Architecture

- **Main Process**: Uses dedicated services (e.g., file scraping, folder metadata extraction, file organization) to encapsulate business logic.
- **Task Management**: A robust `TaskManager` singleton handles background task lifecycles (pending, running, completed, error, dry-run), ensuring the UI remains responsive.
- **Renderer**: React-based UI with brutalist styling. Uses Zustand for lightweight state management.
- **Communication**: Inter-Process Communication (IPC) bridges the main and renderer processes for initiating and tracking task progress.

## TODO / Future Improvements

### Structure & Architecture

- **Centralize IPC Channels**: Move IPC channel strings to a shared constants file to prevent typos and improve discoverability.
- **Modularize Main Process**: Refactor `src/main/index.ts` by extracting IPC handlers into separate controller files or registering them via services to avoid a "God object" anti-pattern.
- **Standardize Tool File Organization**: Consolidate the placement of tool logic and UI. Currently, some tool logic is in `src/tools` while UI components are in `src/renderer/src/components/tools`.

### Maintainability & Error Handling

- **Enhance TaskManager**: Improve error handling to capture, serialize, and pass complex error objects more effectively from the main process to the renderer.

### Testing

- **Expand Unit Tests**: Increase test coverage for services in `src/main/services/__tests__`.
- **E2E Testing**: Add Playwright or Cypress for end-to-end testing of the Electron flows.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
