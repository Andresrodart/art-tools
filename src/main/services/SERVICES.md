# Main Services

This directory contains the core backend logic for file and folder management. The services are built with a focus on Separation of Concerns (SOC) and modularity.

## Folder Structure

```text
src/main/services/
├── utils/                 # Shared and auxiliary utilities
│   ├── fileWalker.ts      # Recursively walks directories with filtering and progress reporting
│   ├── folderUtils.ts     # Helpers for calculating folder stats and collecting directories
│   ├── organizeUtils.ts   # Date resolution and path building for file organization
│   ├── pathUtils.ts       # Unique file path generation
│   ├── taskReporter.ts    # Unified interface for progress reporting and cancellation
│   └── ...
├── __tests__/             # Unit tests for services and utilities
├── TaskManager.ts         # Central task state management (Zustand-like)
├── fileScraper.ts         # Service for finding and moving files by extension
├── folderMetadata.ts      # Service for appending size/element count to folder names
├── organizeFiles.ts       # Service for organizing photos/videos by Date (Year/Month/Day)
└── thresholdMerger.ts     # Service for merging small sibling folders
```

## Architecture Idea

The services follow a consistent pattern:

1.  **Task Orchestrator**: Each service (e.g., `fileScraperTask`) acts as an orchestrator. It initializes a `TaskReporter` to communicate with the `TaskManager`.
2.  **Modular Utilities**: Common logic like directory walking (`FileWalker`) and unique path generation (`pathUtils`) is extracted into the `utils/` folder to ensure consistency and testability.
3.  **Auxiliary Logic**: Complex, service-specific logic (like EXIF parsing in `organizeFiles`) is moved to auxiliary utility files (e.g., `organizeUtils.ts`) to keep the main orchestrator clean and readable.
4.  **Cancellation & Progress**: The `TaskReporter` provides a unified way to report progress and check for user cancellation across all services. It throttles progress updates to avoid IPC bottlenecks.
5.  **Dry Run Support**: All services support a `isDryRun` mode, allowing users to preview changes without modifying the filesystem.

## How it Works

When a task is triggered from the renderer:

1.  An IPC message is sent to the main process.
2.  The main process creates a task in `TaskManager` and calls the corresponding service task function.
3.  The service task uses `TaskReporter` to update its status to 'running' or 'dry-run'.
4.  The service performs its work (e.g., scanning, moving), periodically updating progress and checking for cancellation.
5.  Upon completion or error, the service updates the task status via `TaskReporter`.
6.  The `TaskManager` emits events that the main process listens to, which then forwards updates back to the renderer via IPC.
