# Custom Date Folder Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the photo organization folder structure to a more descriptive pattern: `Year/Month Name/FullDayOfWeek MonthName DayOrdinal/` (e.g., `2026/January/Monday January 30th/`).

**Architecture:** Update the central path construction utility `buildDateBasedDestination` and its corresponding tests. Ensure the day ordinal (st, nd, rd, th) is correctly calculated.

**Tech Stack:** TypeScript, Node.js `path` module, `Intl.DateTimeFormat`.

---

### Task 1: Update Date Formatting Utils

**Files:**
- Modify: `src/main/services/utils/organizeUtils.ts`
- Test: `src/main/services/utils/__tests__/organizeUtils.test.ts`

- [ ] **Step 1: Write a helper for day ordinals**

Add `getDayOrdinal` to `src/main/services/utils/organizeUtils.ts`.

```typescript
/**
 * Returns the ordinal suffix for a given day (e.g., 'st', 'nd', 'rd', 'th').
 * @param day The day of the month (1-31).
 */
export function getDayOrdinal(day: number): string {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
```

- [ ] **Step 2: Update `buildDateBasedDestination`**

Update the function in `src/main/services/utils/organizeUtils.ts` to use the new pattern.

```typescript
export function buildDateBasedDestination(
  rootDirectoryPath: string,
  filename: string,
  sourceDate: Date
): { destinationDirectory: string; destinationFilePath: string } {
  const yearString = sourceDate.getFullYear().toString()
  const monthLabel = getMonthLabelFromIndex(sourceDate.getMonth())
  const dayOfMonth = sourceDate.getDate()
  const dayOrdinal = getDayOrdinal(dayOfMonth)
  
  // Get full day of week (e.g., "Monday")
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(sourceDate)

  // Target: Year/Month Name/FullDayOfWeek MonthName DayOrdinal
  // Example: 2026/January/Monday January 30th
  const dayFolderName = `${dayOfWeek} ${monthLabel} ${dayOfMonth}${dayOrdinal}`

  const destinationDirectory = path.join(
    rootDirectoryPath,
    yearString,
    monthLabel,
    dayFolderName
  )
  const destinationFilePath = path.join(destinationDirectory, filename)

  return { destinationDirectory, destinationFilePath }
}
```

- [ ] **Step 3: Update unit tests**

Modify `src/main/services/utils/__tests__/organizeUtils.test.ts` to verify the new format.

```typescript
    test('correctly constructs the new descriptive folder structure', () => {
      const sourceDate = new Date('2026-01-30T12:00:00') // Friday
      const { destinationDirectory } = buildDateBasedDestination(
        '/root',
        'photo.jpg',
        sourceDate
      )
      expect(destinationDirectory).toBe(path.join('/root', '2026', 'January', 'Friday January 30th'))
    })
```

- [ ] **Step 4: Run unit tests**

Run: `npm test src/main/services/utils/__tests__/organizeUtils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/services/utils/organizeUtils.ts src/main/services/utils/__tests__/organizeUtils.test.ts
git commit -m "feat: update folder structure to descriptive pattern"
```

### Task 2: Update Integration Tests

**Files:**
- Modify: `src/main/services/__tests__/organizeFilesTask.test.ts`

- [ ] **Step 1: Identify required changes in integration tests**

The integration test checks the depth of the created folders and the year pattern.

- [ ] **Step 2: Update `src/main/services/__tests__/organizeFilesTask.test.ts`**

Adjust the test to expect 3 levels of nesting (`Year/Month/DayFolder`) and verify the content of the third level.

- [ ] **Step 3: Run integration tests**

Run: `npm test src/main/services/__tests__/organizeFilesTask.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/main/services/__tests__/organizeFilesTask.test.ts
git commit -m "test: update integration tests for new folder structure"
```
