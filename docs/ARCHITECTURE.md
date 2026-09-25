# Architecture

## Boundaries

- `src/domain/` owns the framework-independent `Board` and Onet pathfinder. `Board`
  stores a copied, private row-major array of positive integer tile IDs or `null` and
  produces new boards for cell changes. The pathfinder reads but never changes it.
  Coordinates and returned polylines are plain data suitable for a future renderer
  or solver. This layer imports no Phaser, game, UI, platform, or browser APIs.
- `src/game/` owns the playable Phaser `PlayScene`, prototype configuration, and
  rendering. The scene asks the domain generator for its board, uses the production
  pathfinder result for its route, and submits that same path to `applyMove`; it does
  not duplicate game rules. Phaser objects are a disposable projection of the
  immutable domain `Board`.
- `BoardLayout` is a small, pure TypeScript mapping owned by the game layer. It
  centers boards in the portrait play area, maps real cells at a 72-pixel pitch,
  and compresses the domain's padded outer coordinates into a 10-pixel visual
  gutter. This keeps route segments orthogonal without spending a tile-width on
  each virtual border.
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
- `generateLevel()` validates the public 1×1..6×8 configuration and separates
  occupancy geometry from tile identity. It gives occupied cells one dummy ID,
  seeded-shuffles their consideration order, finds the first pair accepted by the
  production pathfinder, removes it, and repeats. Unique IDs are assigned only
  after this geometric decomposition. The final witness recomputes the canonical
  path against each real intermediate board state.
- Peeling always terminates without retries. With multiple occupied columns, the
  top occupied cell of any two columns can connect via the empty outer top border
  in at most two turns. With one occupied column, two consecutive occupied cells
  connect directly. Thus every occupancy containing at least two cells has a
  removable pair, and each step strictly removes two cells.
- For an odd board area, seeded selection omits one cell before maximal
  decomposition. Sparse levels select a seeded subset of the maximal geometric
  pairs while preserving their relative removal order, then recompute paths on the
  sparser real board. Removal monotonicity preserves the construction witness.
- `validateGeneratedLevel()` verifies dimensions, occupied and distinct counts,
  exact multiplicity two, witness length, every current-state witness path, and an
  empty replay result. Generated results also expose objective solution metrics;
  no difficulty score is inferred.

Metrics count legal moves immediately before each solution step. Minimum, maximum,
and average use those samples, while `forcedMoveSteps` counts samples equal to one.
Path length is Manhattan segment length. Turn buckets use zero, one, or two bends;
an outer-border move has at least one vertex outside real-board coordinates.
The generator guarantees solvability and provides varied route geometry; metrics
expose that diversity, but final difficulty targets/scoring remain a separate
content-design task.

Dependencies point from `game` to `domain`, never from `domain` to Phaser, DOM,
platform, or renderer code. `PlayScene` also receives the existing
`PlatformService` at composition time in `main.ts`.
