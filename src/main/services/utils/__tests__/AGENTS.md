# AGENTS.md for `utils/__tests__`

## Testing Directives for Agents

When generating, updating, or maintaining tests within this directory, you MUST adhere to the following directives:

1.  **Directory Mapping:** Tests for utility functions in `src/main/services/utils/` must be placed in `src/main/services/utils/__tests__/` and named `[filename].test.ts`. Do not put utility tests in the parent service `__tests__` directory.
2.  **Fixture-Based Exhaustiveness:** For functions that handle bounded domains (e.g., enums, indices, known status strings), use Jest's `test.each` with an array of objects representing all valid states. Ensure 100% coverage of valid mappings.
3.  **Fuzzing & Edge Cases:** All public utility functions must be fuzz-tested for invalid inputs (e.g., passing negative numbers, floats, or out-of-bounds indices to an integer-expecting function). The test must assert that the function throws a specific error message.
4.  **No Silent Failures:** Do not allow functions to return `undefined` for invalid input if the TypeScript type signature guarantees a specific return type. The function must explicitly throw, and the test must verify the throw.
5.  **Pure Function Preference:** Mocks (`jest.fn()`, `jest.mock()`) are STRICTLY FORBIDDEN for pure functions. Mocks should only be used when dealing with `fs`, network, or external process boundaries.
