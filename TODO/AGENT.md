# Agent Instructions for TODO Folder

## Context

The `TODO` folder is designed to contain files, subfolders, and source code of tools or features that we plan to introduce into the main application. It acts as a staging or drafting area for work-in-progress components, feature requests, and planned architectural updates.

## How to Deal with the TODO Folder

When AI assistants or agents are acting upon user requests involving new tools or features, please adhere to the following guidelines:

1. **Check for Existing Work**: Before scaffolding a completely new tool or component, check the `TODO` folder for any existing files or subfolders related to the request. The user might have already drafted or partially implemented the tool here.
2. **Read the Contents**: If you find files within the `TODO` folder related to your current task, read them carefully to understand any pre-existing logic, notes, or structures before beginning your implementation.
3. **Migrate to Main Source**: When fully implementing a tool that is currently staged in the `TODO` folder, carefully move the logic out of `TODO` and into the appropriate location within the `src/` directory (e.g., `src/renderer/src/components/`, `src/main/`, etc.), adhering to the project's established structure.
4. **Cleanup**: Once a tool or feature from the `TODO` folder has been successfully integrated into the main application and verified working, consult with the user on whether the corresponding artifact in the `TODO` folder should be removed to keep the directory clean.
