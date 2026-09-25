# Testing strategy

The project will grow four testing layers:

1. Unit tests for deterministic domain behavior.
2. Property and simulation tests for generators, solvers, and many board states.
3. Browser and manual mobile QA for rendering, input, layout, and lifecycle behavior.
4. Yandex Games Draft QA after SDK integration.

Task 0 includes only Node's built-in test runner smoke tests for locale normalization and the web platform identity. `npm test` compiles the TypeScript under test into an ignored temporary directory and runs those tests. Gameplay tests begin only when gameplay exists.
