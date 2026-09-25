# Architecture

`src/domain` owns immutable `Board`, pathfinding, moves, solving, generation, and metrics without browser or Phaser dependencies. `findPath` performs a deterministic lexicographic Dijkstra search over `(cell, direction)` states inside real board coordinates. Cost is `(turn count, path length, traversal key)`; predecessor cell sequences are compacted to corners for the returned 2..N polyline.

`generateLevel` uses bounded reverse construction: starting empty, it adds a seeded pair only when that pair has a current interior path. Reversing addition order is a removal witness. Product generation rejects orthogonally adjacent endpoints. Attempts are explicitly bounded and failure is reported. Validation checks structure, product adjacency, a legal initial move, and exact witness replay. The greedy unique-pair solver remains complete by removal monotonicity.

`src/game` owns Phaser projection and the fixed demo profile. `BoardLayout` maps only real cells; route graphics consume arbitrary-length compact polylines. A blocked matching pair receives a brief red stroke before the second tile becomes selection. `src/platform` remains the existing small platform boundary. The project retains plain `tsc`, no bundler, and Phaser 4.2.1.
