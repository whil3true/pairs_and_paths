# Product specification

- Working titles: **Pairs & Paths: Connect the Tiles** (EN), **Пары и пути: Соедини плитки** (RU).
- Portrait-first Onet / Pair Connect puzzle for RU and EN audiences.
- Boards are at most 6×8; levels are short and guaranteed solvable.
- The first campaign contains 100 deterministic levels in 10 chapters of 10 levels.
- The playtest-revised, data-informed difficulty curve grows board area and pair density from 4×4/4 pairs to 6×8/22 pairs. Profiles change frequently in the early campaign and more slowly later; chapters are organizational and do not imply one profile each. Solver-path measurements remain calibration proxies rather than claims about human difficulty.
- Hint and Shuffle are the planned player aids.
- The planned metagame consists of chapters and a cabinet.
- There is no hard timer, lives, economy, story, or characters.

This is the agreed product nucleus, not a complete game design document.

Tile recognition is symbol-first: simple silhouettes carry identity and a small reused accent palette is secondary. Numeric IDs are not visible during normal play. The current 30 prototype symbols keep local SVG masters under `art/source/symbols` and ship as 256×256 transparent PNG runtime textures under `public/assets/symbols`; final themed art may replace them without changing `TileId` or campaign content.

Task 5.1 changes pacing only. It adds no mechanics; further difficulty mechanics and the planned player aids remain deliberately deferred.

## Static blockers

A static blocker is permanent wall terrain, never a tile: it cannot be selected, occupied, removed, or entered by a connection path. Levels 11–13 introduce one, two, and three blockers; curated blocker levels then alternate with normal breathing levels through the campaign. Geometry progresses from isolated cells and short walls to offset, staggered, channel, and asymmetric patterns. Removing a legal pair only increases traversable empty space while terrain stays fixed, so removal monotonicity remains valid and blockers do not introduce a normal deadlock or loss state. Exact pacing and route-effect diagnostics are recorded in `BLOCKER_PROGRESSION.md`.

## Multi-stage campaign progression

A campaign level may contain sequential independent stages, while the campaign remains 100 levels. Clearing a non-final stage automatically replaces its fully cleared board after brief feedback; only clearing the final stage completes the campaign level. The pilot began on Levels 21, 24, and 30; after human playtesting, multi-stage levels were distributed sparsely across the campaign. `STAGE_PROGRESSION.md` is authoritative for the exact current distribution. Each stage has only its own remaining-pairs count, and single-stage levels do not display redundant stage progress.

Stages are not spatial stacks: only one ordinary board exists at a time, with no overlap, hidden tiles, or cross-stage dependency. Each multi-stage level progresses from smaller/lighter blocker-free preludes to the unchanged existing campaign board. The completed pilot and its original Levels 20–30 playtest scope are recorded in `STAGE_PILOT.md`.

## Campaign progress

The web build persists only the highest fully completed campaign level. Clearing a final stage writes progress before the Complete overlay is shown; clearing an intermediate stage does not. An unfinished level therefore resumes from its deterministic Stage 1 board after a refresh. Board contents, removed tiles, selection, routes, blockers, animations, and stage position are intentionally not saved. Completing Level 100 remains recorded even when “Restart from Level 1” is used; a later normal launch also starts the completed campaign at Level 1.

## Player campaign navigation

Normal startup opens a portrait Main Menu showing completed levels, a Play/Continue/Play again action, and Levels. Continue always targets Stage 1 of the first uncompleted level; after all 100 levels it becomes Play again at Level 1 without clearing completion. Levels presents one ten-level chapter at a time in a 5×2 grid and defaults to the highest unlocked level's chapter. Completed levels and the single current frontier are selectable; later levels are locked. Replaying an older level advances sequentially and cannot reduce the monotonic save. Leaving gameplay through Menu intentionally discards the unfinished board and stage state.
