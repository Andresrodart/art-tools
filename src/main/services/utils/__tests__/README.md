# Testing Conventions for Utilities

This document outlines the testing conventions and methodologies we use for testing utility and service functions. Following these conventions ensures our test suite remains reliable, readable, and robust.

## Core Testing Principles

1.  **Arrange-Act-Assert (AAA):** Tests should be structured clearly into three distinct phases.
    *   **Arrange:** Set up the test data, mocks, and conditions.
    *   **Act:** Execute the function or method being tested.
    *   **Assert:** Verify the outcome matches expectations.

2.  **Fixture-Based Testing for Exhaustiveness:**
    *   When a pure function maps a set of known inputs to outputs (e.g., month indices to labels), we use `test.each` with an array of fixture objects.
    *   This ensures all valid permutations are tested without duplicating boilerplate code, providing exhaustive coverage.

3.  **Fuzz Testing and Edge Cases:**
    *   Input validation is critical. We use fuzz testing arrays to pass a variety of invalid inputs to our functions.
    *   For numerical inputs, we test out-of-bounds numbers, negative numbers, floats, `NaN`, `Infinity`, and `-Infinity`.
    *   We assert that these edge cases throw descriptive, specific `Error` messages rather than returning undefined or failing silently.

4.  **Strict Isolation:**
    *   Tests for pure functions require zero mocks.
    *   Tests involving the file system or external APIs must use strict mocks or isolated sandbox environments to prevent side effects and flakiness.
    *   Tests mirror the structure of the source directory (e.g., tests for `src/main/services/utils/organizeUtils.ts` live in `src/main/services/utils/__tests__/organizeUtils.test.ts`).

## Example (Fixture & Fuzz Testing)

```typescript
describe('MyUtility', () => {
  // Fixture for valid inputs
  const validInputs = [
    { input: 0, expected: 'A' },
    { input: 1, expected: 'B' },
  ]
  test.each(validInputs)('returns "$expected" for input $input', ({ input, expected }) => {
    expect(myUtility(input)).toBe(expected)
  })

  // Fuzz testing for edge cases
  const invalidInputs = [-1, 2.5, NaN]
  test.each(invalidInputs)('throws an error for invalid input %d', (invalid) => {
    expect(() => myUtility(invalid)).toThrow(/Invalid input/)
  })
})
```
