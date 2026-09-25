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

Task 2 adds frozen Mulberry32 output vectors (including seeds zero and uint32 max),
legal-move ordering and immutable application checks, solver status/replay cases,
invalid generator configurations, sparse and full generation through 6×8, seed
repeatability/variation, exact-pair validation, and witness plus solver replay.
Two test-only validation layers supplement production behavior:

- an exhaustive recursive backtracking oracle checks 200 small generated boards;
- all 15 perfect matchings of a full 2×3 board are enumerated; for every solvable
  board the oracle verifies that every initially legal choice leaves a solvable
  remainder. This independently exercises the player-choice theorem in
  `GAME_RULES.md` rather than merely asserting the greedy solver result.
- all occupancy masks through 3×3 verify the geometric peeling lemma, and a
  deterministic 200-seed batch requires valid zero-, one-, two-turn, outer-border,
  non-adjacent, and initially unavailable-pair examples from full and sparse boards.

`npm run simulate -- --count N` compiles only `src/domain/` and runs a headless,
deterministic mix of full 4×2, 4×4, 5×6, 6×6, and 6×8 boards. It checks regeneration,
pair structure, witness validation/replay, solver status/replay, path currency, and
empty final boards, then prints size counts, failure categories, elapsed time,
legal-move metric ranges/averages, turn distribution, and outer-border use. Any
correctness failure exits non-zero. CI uses 10,000 levels; the same CLI accepts the
100,000-level release-quality target without a flaky elapsed-time assertion.
