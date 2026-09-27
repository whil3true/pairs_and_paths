# Testing strategy

## Developer campaign jump

For developer testing only, add `debug=1` and a campaign level to the game URL. This is not
player-facing progression or a level-select feature. Examples:

- `?debug=1&level=21`
- `?debug=1&level=35`
- `?debug=1&level=48&stage=2`
- `?debug=1&level=68`
- `?debug=1&level=82&stage=2`
- `?debug=1&level=94`
- `?debug=1&level=100`
- `?debug=1&level=100&stage=2`

The optional `stage` is one-based and defaults to Stage 1. Without `debug=1`, all `level` and
`stage` parameters are ignored. Replay always returns to Stage 1 of the current level; Next Level
also begins at Stage 1. Refreshing the browser re-applies the initial position from the URL.
The entire debug-jump session is persistence-disabled, so completing or advancing from the jumped
level cannot alter real progress. Rendering debug flags without `level=N` keep normal persistence.

Use `?debug=1&resetProgress=1` to clear web progress and start normal play at Level 1; without
`debug=1` the reset parameter is ignored. Reset is processed before scene selection, so adding
`&symbols=1` clears once and then opens the non-writing gallery.

`npm test` compiles to a temporary directory and uses `node:test`. The independent exhaustive path oracle is a brute-force simple-path DFS with no outside cells and no turn limit. Exhaustive boards compare existence, minimum turns, and minimum length; every returned production path is independently checked for bounds, occupancy, orthogonality, compactness, and deterministic repetition. Focused regressions cover 0, 1, 2, 3, and 5 turns, blocking, edge confinement, route ranking, and removal monotonicity.

Generator tests check exact pair multiplicity, deterministic regeneration, non-adjacent product pairs, witness replay, solver replay, metrics, and product density. Campaign tests freeze the 100/10/10 constants, chapter boundaries, progression-band coverage, and important early band transitions; reject out-of-range levels; check next-level boundaries; and check all 100 levels for validity, solver replay, non-adjacency, deterministic replay, distinct consecutive snapshots, at least two initial moves in Levels 1..5, and at least one initial move throughout. `npm run simulate -- --count 10000` retains the established deterministic 6×8/20-pair generator quality gate.

`npm run analyze:progression -- --samples 300` is the heavier manual calibration command. It compiles and invokes production generation, validation, solving, and solution measurement without Phaser or a browser. It prints candidate-profile failure counts and objective solver-path metrics plus exact ten-level chapter aggregates for the campaign. `npm run analyze:progression -- --campaign-only` skips the heavy candidate sweep and reports exact campaign validation, milestones, range/chapter aggregates, cumulative removals, and the longest forced-start run. See `PROGRESSION_REPORT.md` for the recorded calibration run.

After merge, manually confirm: Levels 1–10 visibly change profile several times, Level 1 starts with the smaller centered board, Level 10 is noticeably more substantial, and Levels 15/20/25/30 reflect accelerated progression; Next advances and different levels vary; Replay reproduces the current level; small boards remain centered; blocked-pair feedback still works; rendered routes remain inside the board; and the displayed level number remains correct. At Level 100, confirm “Campaign complete”, Replay, and Restart from Level 1, with no Level 101. Campaign-wide correctness does not require manually playing every level because tests and the solver cover all 100.


The Task 5.1 checks cover pacing data only. Core mechanics are unchanged, and tests for future difficulty mechanics are deliberately deferred.

## Blocker verification

Blocker coverage checks separate terrain representation, invalid coordinates and capacity, path exclusion and alternate canonical routes, move/mask persistence, solver success and genuine obstruction, deterministic generation, and an independent backtracking monotonicity sweep over small blocker masks. `npm run simulate:blockers` is a lightweight 150-board diagnostic over 5×5, 5×6, and 6×8 patterns. It reports generation, solver, and replay failures plus any path crossings or tiles placed on blockers; all failure counters must remain zero.

Campaign blocker tests freeze the introduction and selected level rhythm; validate content-table uniqueness, bounds, and capacity; and include terrain in all-100 validation, solve, replay, adjacency, and deterministic Replay checks. At every state of each blocker level's solver replay, every currently legal alternative is solved after application to guard removal monotonicity.

`npm run analyze:blockers` manually calibrates the exact campaign. At every state in the unchanged deterministic solver replay it compares every matching pair with a blocker-free twin containing exactly the same tile rows. The output keeps affected, unavailable, extra-turn, and extra-length metrics separate and summarizes frequency and strongest examples by each measure. Numeric relevance values guide curation and are intentionally not frozen as CI difficulty thresholds; see `BLOCKER_PROGRESSION.md`.

## Stage verification

Campaign tests freeze the exact distribution of 19 multi-stage levels, comprising 14 two-stage and five three-stage levels, while retaining exact seed/config regressions for the original Levels 21/24/30 pilot. Every campaign stage is generated twice, validated, solved, replayed to an empty board, checked for blocker-mask persistence, and checked for the non-adjacent matching-pair invariant. A separate final-stage regression preserves all 100 final stage configs and generated boards against `getLevelConfig`/`createLevel`. Pure clear outcomes cover non-final advancement, final completion, the single-stage Level 99, and both stages of terminal Level 100; PlayScene reset paths all enter through `startLevel`, which resets the index.

The pure presentation calculation is also checked: Stage 1/3 exposes two backing sheets, Stage 2/3 one, and final or single stages none. Phaser tween pixels are intentionally not unit-tested. Manual checks cover the visible stack before the first move, promotion during the short transition, cleanup on Replay/Next/restart, and disappearance when moving from Level 30 to single-stage Level 31. The rectangles are prototype affordance only; production visual design remains deferred.

## Tile visual verification

Pure tests freeze the catalog ordering and reusable accent metadata, require 30 unique asset keys, and cover every campaign `TileId` through the maximum of 22. Runtime asset tests require the public symbol directory to contain exactly the 30 catalog PNGs, validate the PNG signature, require 256×256 dimensions, 8-bit channels and RGBA color type, and verify that a correspondingly named SVG source master remains under `art/source/symbols`.

The developer gallery remains available at `?debug=1&symbols=1` and iterates the shared `TILE_SYMBOLS` catalog. After deployment, verify all 30 transparent PNG textures on Android, then compare `?debug=1&level=1` and `?debug=1&level=80`. Confirm there are no black squares, missing assets, opaque backgrounds, or unexpected pixelation. Artwork-quality issues in leaf, flame, mountain, gem, feather, shell, compass, clover, lantern, crystal, and planet are known prototype limitations and are deferred to final art direction.

### Responsive and HiDPI QA

Pure tests cover uniform portrait fitting for the permanent logical `480×800` game, tall portrait, wide landscape, and common tablet/desktop viewport shapes. They also cover production DPR clamping to `[1, 2]`, safe handling of non-finite values, and the developer-only legacy override. Only `?debug=1&renderScale=1` forces 1×; missing debug, `debug=0`, and unsupported scale values retain automatic behavior. The former `hidpi=1` activation gate is retired.

The gallery at `?debug=1&symbols=1` uses automatic production HiDPI and shows viewport CSS size, DPR, render scale, logical size, backing/client canvas sizes, and renderer. Compare it with `?debug=1&symbols=1&renderScale=1`, where diagnostics must report scale 1 and a `480×800` backing canvas. POCO X6 Pro QA observed DPR ≈ 2.994 and correctly used the capped scale 2 (`960×1600` backing canvas).

On a wide and a narrow desktop browser, confirm the portrait game stays centered without cropping or stretching, side gutters retain the shell background, and resizing never produces a horizontal gameplay layout. On portrait Android, compare `?debug=1&level=80` with `?debug=1&level=80&renderScale=1`. The normal production mode must be the sharper version. Compare curved/diagonal PNG edges, card borders, text, and route lines. Tap tiles across the board and verify selection, blocked-pair feedback, routes, stage transitions, Replay, and Next all target the same logical cells in both modes. Landscape rotation must still show a centered portrait frame; it does not trigger an orientation lock or alternate layout.

`npm run analyze:stages` prints exact per-stage dimensions, pairs, blockers, seeds, opening moves, solver/replay status, turn/path metrics, campaign workload, distribution and spacing, campaign stage count, and final-board preservation. It is a diagnostic report, not a synthetic difficulty score. Manual playtesting should sample early, mid, and late placements, including automatic transition clarity, two-stage pacing, occasional three-stage length, blocker-bearing finals, and terminal Level 100 completion.

## Persistent progress verification

Pure tests cover the v1 schema and derived values, monotonic completion, strict malformed-data fallback, storage CRUD and thrown-operation containment, startup/debug isolation, and final-stage-only persistence boundaries for Levels 21, 30, and 100. No jsdom or Phaser scene is required.

After deployment, reset with `?debug=1&resetProgress=1`, then use the normal URL and confirm Level 1. Complete Level 1 and refresh on its Complete overlay before pressing Next: normal play must open Level 2 Stage 1. Remove tiles from Level 2 and refresh before completion: Level 2 must restart with its fresh Stage 1 board. On a multi-stage level, verify intermediate clearance does not update the stored payload. With real progress through Level 1, complete `?debug=1&level=80`, then return to the normal URL and confirm it still opens Level 2. Finally, reset again and confirm normal play returns to Level 1.
