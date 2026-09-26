# Architecture

`src/domain` owns immutable `Board`, pathfinding, moves, solving, generation, and metrics without browser or Phaser dependencies. `findPath` performs a deterministic Dijkstra search over `(cell, direction)` states inside real board coordinates. Cost is `(turn count, path length, stable implementation-defined direction/insertion order)`. A small binary heap stores numeric state records and predecessor indices; the winning route is reconstructed once and compacted to a 2..N-corner polyline.

`generateLevel` constructs a seeded occupancy mask with the requested empty-cell count, then removes one legal non-adjacent geometric pair at a time. Reading that witness backwards is reverse construction: each pair is reinserted into the emptier board on which its recorded interior path existed. Each step builds one occupancy board rather than one board per candidate. Attempts are explicitly bounded and failure is reported. Unique IDs are assigned after geometry is complete. Validation checks structure, product adjacency, a legal initial move, and exact witness replay. The greedy unique-pair solver remains complete by removal monotonicity.

`src/game` owns Phaser projection and campaign selection. `LevelSequence` accepts only levels 1..100, maps each level through a deterministic progression-band table and combines that profile with a deterministic seed. Chapters remain organizational groups of ten and may contain several profiles. Every profile requests non-adjacent matching pairs. The seed is `Math.imul((levelNumber - 1) >>> 0, 0x9e3779b9) >>> 0`: Level 1 keeps seed 0, while the odd multiplier keeps the 100 base seeds distinct. This is stable content sequencing, not a cryptographic uniqueness claim.

`PlayScene` owns the current session level number, starting at 1. Next increments it before regeneration; Replay regenerates without changing it. Level 100 instead reports campaign completion and can restart the session at Level 1, never requesting Level 101. No level progress is persisted, so a browser refresh intentionally returns to Level 1. `BoardLayout` maps only real cells; route graphics consume arbitrary-length compact polylines. A blocked matching pair receives a brief red stroke before the second tile becomes selection. `src/platform` remains the existing small platform boundary. The project retains plain `tsc`, no bundler, and Phaser 4.2.1.


Task 5.1 revises only the progression data after human playtesting; it does not alter domain generation, solving, path rules, or introduce new mechanics. Later difficulty mechanics remain deferred.

## Static blocker foundation

`Board` stores tile occupancy (`Cell = TileId | null`) and an independent immutable blocked-coordinate mask. `isBlocked`, `isOccupied`, and `isEmpty` distinguish wall terrain, real tiles, and traversable emptiness. Revisions share the immutable mask; placing a tile on it is rejected. Pathfinding excludes blocked endpoints and transit cells. Solving and pair multiplicity inspect tiles only, and completion means no tiles, not no terrain. Optional generator `blockedCells` are validated, excluded from capacity and candidates, and supplied to every construction board without changing blocker-free random consumption. Validation checks the exact mask and its persistence through replay.

`LevelSequence` owns `CAMPAIGN_BLOCKERS`, a flat content table of level number, pattern family, and exact coordinates. `getLevelConfig` combines the unchanged progression band and derived seed with its optional table entry; there is no runtime terrain randomizer or manager. `PlayScene` draws non-interactive dark stone placeholders for fixed cells. Production art and mutable terrain mechanics remain deferred.

The headless blocker analyzer copies each solver state's exact tile rows into a blocker-free `Board` and compares matching-pair routes. This isolates terrain from tile placement and is diagnostic only: it neither changes nor wraps the production solver strategy.

## Sequential stage composition

`LevelSequence` owns a small `MULTI_STAGE_LEVELS` prelude table and appends `getLevelConfig(levelNumber)` automatically as the final stage. `createLevel` is unchanged and still creates that original board. The pure stage API is `getLevelStageConfigs`, `getStageCount`, `createLevelStage`, and `getStageClearOutcome`; no stage manager exists and the domain remains unaware of campaign composition.

Pre-stage seeds use a documented uint32 namespace: `imul(level, 0x85ebca6b) ^ imul(index + 1, 0xc2b2ae35) ^ 0x27d4eb2d`. Final stages retain the original `levelSeed`, configuration, board rows, witness, and blocker mask. `PlayScene` holds a zero-based stage index, replaces the one current board after 400 ms of input-locked feedback, and shows completion only for the final stage. Starting, replaying, advancing, and restarting a campaign level all reset the index to zero.
