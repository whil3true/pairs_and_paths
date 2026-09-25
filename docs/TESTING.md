# Testing strategy

`npm test` compiles to a temporary directory and uses `node:test`. An independent test-only `(cell, direction)` Dijkstra oracle has no outside cells and no turn limit. Exhaustive boards compare existence, minimum turns, and minimum length; every returned production path is independently checked for bounds, occupancy, orthogonality, compactness, and deterministic repetition. Focused regressions cover 0, 1, 2, 3, and 5 turns, blocking, edge confinement, route ranking, and removal monotonicity.

Generator tests check exact pair multiplicity, deterministic regeneration, non-adjacent product pairs, witness replay, solver replay, metrics, and demo density. `npm run simulate -- --count 10000` validates deterministic 6×8/20-pair product levels. `npm run simulate -- --count 1 --density-count 1000` reports 18/20/22-pair generation outcomes, initial legal moves, forced starts, turns, 3+-turn rate, solution length, and adjacency violations.

Manual mobile QA checks arbitrary-turn route rendering, no route leaving the board, 40 tiles plus 8 empty cells, legal removal, and the 180 ms red blocked-pair feedback with second-tile selection.
