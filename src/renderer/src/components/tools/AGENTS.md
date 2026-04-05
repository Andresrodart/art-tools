# React Tool Components Refactoring Guide

## Code Health Standard: Extracted Tool Components

As tool components in `src/renderer/src/components/tools/` grow in complexity, they should be refactored to improve maintainability and readability by following these guidelines:

1. **Subfolder Organization:**
   - Move large, monolithic tool components (e.g., `ToolName.tsx`) into their own dedicated subfolder: `src/renderer/src/components/tools/ToolName/`.
   - The main entry point for the tool should be renamed to `index.tsx` within that folder.

2. **Custom Hooks for State & Logic:**
   - Extract complex state management, side effects (like `useEffect`), and handler functions into a custom hook (e.g., `useToolName.ts`).
   - The custom hook should return exactly the state variables, derived values, and handler functions needed by the UI components.
   - This keeps the UI components purely focused on presentation.

3. **Subcomponent Extraction:**
   - Break down large, inline JSX blocks (such as `inputSection`, `progressSection`, `outputSection`) into separate, focused subcomponents (e.g., `ToolNameInput.tsx`, `ToolNameProgress.tsx`, `ToolNameOutput.tsx`).
   - Pass the necessary state and handler functions to these subcomponents as props.

4. **Shared Types:**
   - Create a `types.ts` file within the tool's folder for any shared interfaces, types, or configuration constants used across the hook and subcomponents.

By following this pattern, you ensure that tool components remain easy to read, test, and maintain as new features are added.
