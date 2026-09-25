# Testing strategy

The project will grow four testing layers:

1. Unit tests for deterministic domain behavior.
2. Property and simulation tests for generators, solvers, and many board states.
3. Browser and manual mobile QA for rendering, input, layout, and lifecycle behavior.
4. Yandex Games Draft QA after SDK integration.

`npm test` compiles TypeScript into an ignored temporary directory and runs Node's
built-in test runner. Domain coverage includes:

- focused Board validation/immutability and pathfinding scenario tests for zero,
  one, and two turns, obstacles, invalid moves, and every outer-border side;
- an independent direction-state Dijkstra oracle and an independent returned-path
  validator;
- exhaustive blocker enumeration for 2×2, 2×3, 3×2, and 3×3 boards: 5,112 pair
  queries compared for existence and optimal `(turns, length)` cost;
- 5,000 deterministic seeded cases on boards from 2×2 through the 6×8 maximum,
  each checked against the oracle, validated when present, and repeated to verify
  deterministic output;
- the original platform locale and identity smoke tests.
