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

Task 5.1 changes pacing only. It adds no mechanics; further difficulty mechanics and the planned player aids remain deliberately deferred.

## Static blockers

A static blocker is permanent wall terrain, never a tile: it cannot be selected, occupied, removed, or entered by a connection path. Levels 11–13 introduce one, two, and three blockers; curated blocker levels then alternate with normal breathing levels through the campaign. Geometry progresses from isolated cells and short walls to offset, staggered, channel, and asymmetric patterns. Removing a legal pair only increases traversable empty space while terrain stays fixed, so removal monotonicity remains valid and blockers do not introduce a normal deadlock or loss state. Exact pacing and route-effect diagnostics are recorded in `BLOCKER_PROGRESSION.md`.

## Multi-stage pilot

A campaign level may now contain sequential independent stages, while the campaign remains 100 levels. Clearing a non-final stage automatically replaces its fully cleared board after brief feedback; only clearing the final stage completes the campaign level. The pilot is deliberately limited to Levels 21, 24, and 30. Each stage has only its own remaining-pairs count, and single-stage levels do not display redundant stage progress.

Stages are not spatial stacks: only one ordinary board exists at a time, with no overlap, hidden tiles, or cross-stage dependency. Each pilot progresses from a smaller/lighter pre-stage to the unchanged existing campaign board. Wider distribution is deferred until the Levels 20–30 human playtest described in `STAGE_PILOT.md`.
