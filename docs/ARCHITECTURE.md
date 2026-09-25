# Architecture

## Boundaries

- `src/domain/` owns the framework-independent `Board` and Onet pathfinder. `Board`
  stores a copied, private row-major array of positive integer tile IDs or `null` and
  produces new boards for cell changes. The pathfinder reads but never changes it.
  Coordinates and returned polylines are plain data suitable for a future renderer
  or solver. This layer imports no Phaser, game, UI, platform, or browser APIs.
- `src/game/` owns Phaser scenes and rendering. The current scene is only an infrastructure smoke test.
- `src/platform/` defines the deliberately small platform boundary. `WebPlatform` currently provides identity and locale; persistence will be added only when real save requirements exist. A future Yandex implementation will live behind the same boundary.
- `src/ui/` is reserved for concrete UI when it exists; no placeholder abstraction is introduced now.

## Production artifact

`npm run build` compiles ES modules with `tsc`, copies public files, and copies Phaser's browser distribution from the installed package into `dist/vendor/`. All document paths are relative, so the same `dist/` works at a GitHub project-site subpath and at the root of a Yandex Games ZIP.

Dependencies stay minimal: Phaser is the only browser runtime dependency and TypeScript is the only development dependency. No bundler or development server is used.

CI validates pull requests and relevant pushes. The Pages workflow builds and deploys only the `dev` branch.

## Deterministic content core

- `SeededRandom` is the stable Mulberry32 algorithm implemented with defined
  32-bit bitwise and `Math.imul` operations. Seeds are integers in
  `0..4294967295`, including zero. `nextFloat()` divides the next uint32 by `2^32`,
  `nextInt()` uses that float, and `shuffle()` is a copied-array Fisher–Yates
  shuffle. The algorithm, constants, and consumption order are content/save
  compatibility: changing them intentionally changes generated levels.
- `findLegalMoves()` groups occupied cells by tile ID, tests matching coordinate
  pairs through the production `findPath()`, and returns tile-ID then row-major
  order. `applyMove()` revalidates endpoints/path availability and creates a new
  board with two empty cells.
- `solveBoard()` supports the v1 structure of exactly two cells per tile ID. It
  reports structurally unsupported input separately from a valid-but-unsolvable
  board and repeatedly takes the first ordered legal move. Removal monotonicity
  proves this greedy policy complete for any solvable unique-pair board.
- `generateLevel()` validates the public 1×1..6×8 configuration, creates a snake
  Hamiltonian path, divides it into adjacent disjoint pairs, and uses the seeded
  RNG to select pairs, removal order, and unique ID assignment. Every selected
  pair remains directly adjacent, so construction cannot fail or retry. It records
  each path against its actual intermediate board as a replayable witness.
- `validateGeneratedLevel()` verifies dimensions, occupied and distinct counts,
  exact multiplicity two, witness length, every current-state witness path, and an
  empty replay result. Generated results also expose objective solution metrics;
  no difficulty score is inferred.

Metrics count legal moves immediately before each solution step. Minimum, maximum,
and average use those samples, while `forcedMoveSteps` counts samples equal to one.
Path length is Manhattan segment length. Turn buckets use zero, one, or two bends;
an outer-border move has at least one vertex outside real-board coordinates.
