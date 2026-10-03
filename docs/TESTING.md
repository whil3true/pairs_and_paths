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

Use `?debug=1&resetProgress=1` to clear web progress and open the fresh Main Menu; without
`debug=1` the reset parameter is ignored. Reset is processed before scene selection, so adding
`&symbols=1` clears once and then opens the non-writing gallery. For developer QA only, `?debug=1&setProgress=N` writes an exact 0..100 completion fixture before routing; invalid, fractional, empty, or non-debug values are ignored, and reset wins over setProgress. It may be combined with gallery or an isolated debug level jump.

`npm test` compiles to a temporary directory and uses `node:test`. The independent exhaustive path oracle is a brute-force simple-path DFS with no outside cells and no turn limit. Exhaustive boards compare existence, minimum turns, and minimum length; every returned production path is independently checked for bounds, occupancy, orthogonality, compactness, and deterministic repetition. Focused regressions cover 0, 1, 2, 3, and 5 turns, blocking, edge confinement, route ranking, and removal monotonicity.

Pure Hint tests verify first-legal-move selection and deterministic repetition, recomputation after
a move, blocker exclusion, and `null` for empty and artificial no-pair boards. A campaign sweep
repeatedly applies the current hint through every stage of all 100 levels and requires every
non-empty board to expose a move. Phaser pixels are intentionally not unit-tested. Manual QA uses
Levels 1, 30, and 80 to check cyan dual-tile feedback, selection clearing, current-board updates,
spam protection, blocker and stage isolation, cleanup on Menu/Replay/Next, and disabled Hint on
the Complete overlay. Hint does not auto-remove or show a route and remains unlimited; Shuffle is
not part of this test scope.

Phase 3 pure tests additionally freeze the compact gameplay HUD bounds, Russian pair grammar,
production button hit bounds/centre, route widths and 180/40/60 ms (280 ms total) phases,
precomputed route metrics, arbitrary-turn physical-length route interpolation,
900 ms Hint pulse policy, 180 ms removal policy, and blocker footprint/token ownership. Renderer
appearance remains manual QA: use Levels 27 and 30 for HUD rows, a bent legal route, and synchronized
Hint/removal feedback; use Levels 11 and 30 Stage 3 for opaque procedural blocker terrain.

For the Phase 3A Android corrective pass, open `?debug=1&level=27`. Tap the centre and the inside
right edge of both Пауза and Подсказка; each must respond. Tap immediately to the right of each visual
button; neither may respond, and neither button's visual position may have moved. On the same board,
remove legal pairs that exercise a short straight route, a one-turn route, a long route, and a route
with several turns. The line must progress smoothly at an apparently constant physical speed without
giant frame-to-frame jumps, show the complete route for the short hold, fade smoothly, and only then
run the unchanged tile scale/fade. Finally open `?debug=1&level=30&stage=3` and repeat a legal route
over the artwork and blockers.

For the Phase 3B Android corrective pass, open `?debug=1&level=27` and tap a tile immediately after
the board becomes interactive. Selected fill and border must appear together, with no brief wrong
inner colour. Deselect and reselect several tiles: the tactile scale may finish, but semantic colour
must never lag the border. Reload Level 27, complete the first legal pair soon after interaction is
enabled, then compare its route with the second and several later routes. Exercise a short straight,
one-turn, and longer/multi-turn route. Repeat at `?debug=1&level=30&stage=3` over artwork and blockers.
The initial 80 ms interval is non-visual scene settling and is not part of the unchanged 180/40/60 ms
route. Record this as real-device QA only when it is actually run on Android.

Generator tests check exact pair multiplicity, deterministic regeneration, non-adjacent product pairs, witness replay, solver replay, metrics, and product density. Campaign tests freeze the 100/10/10 constants, chapter boundaries, progression-band coverage, and important early band transitions; reject out-of-range levels; check next-level boundaries; and check all 100 levels for validity, solver replay, non-adjacency, deterministic replay, and distinct consecutive snapshots. Levels 1–4 have at least two initial legal moves; Level 5 has exactly one because its frozen seed and pair count now use the approved 4×4 final geometry; every campaign Level has at least one initial legal move. This Level 5 result is a known deterministic geometry-migration consequence, not a generator failure. `npm run simulate -- --count 10000` retains the deterministic 7×7/20-pair generator quality gate.

`npm run analyze:progression -- --samples 300` is the heavier manual calibration command. It compiles and invokes production generation, validation, solving, and solution measurement without Phaser or a browser. It prints candidate-profile failure counts and objective solver-path metrics plus exact ten-level chapter aggregates for the campaign. `npm run analyze:progression -- --campaign-only` skips the heavy candidate sweep and reports exact campaign validation, milestones, range/chapter aggregates, cumulative removals, and the longest forced-start run. See `PROGRESSION_REPORT.md` for the recorded calibration run.

After merge, manually confirm: Levels 1–10 visibly change profile several times, Level 1 starts with the smaller centered board, Level 10 is noticeably more substantial, and Levels 15/20/25/30 reflect accelerated progression; Next advances and different levels vary; Replay reproduces the current level; small boards remain centered; blocked-pair feedback still works; rendered routes remain inside the board; and the displayed level number remains correct. At Level 100, confirm “Campaign complete”, Replay, and Restart from Level 1, with no Level 101. Campaign-wide correctness does not require manually playing every level because tests and the solver cover all 100.


The Task 5.1 checks cover pacing data only. Core mechanics are unchanged, and tests for future difficulty mechanics are deliberately deferred.

## Blocker verification

Blocker coverage checks separate terrain representation, invalid coordinates and capacity, path exclusion and alternate canonical routes, move/mask persistence, solver success and genuine obstruction, deterministic generation, and an independent backtracking monotonicity sweep over small blocker masks. `npm run simulate:blockers` is a lightweight 150-board diagnostic over 5×5, 5×6, and dense 7×7 patterns. It reports generation, solver, and replay failures plus any path crossings or tiles placed on blockers; all failure counters must remain zero.

Campaign blocker tests freeze the introduction and selected level rhythm; validate content-table uniqueness, bounds, and capacity; and include terrain in all-100 validation, solve, replay, adjacency, and deterministic Replay checks. At every state of each blocker level's solver replay, every currently legal alternative is solved after application to guard removal monotonicity.

`npm run analyze:blockers` manually calibrates the exact campaign. At every state in the unchanged deterministic solver replay it compares every matching pair with a blocker-free twin containing exactly the same tile rows. The output keeps affected, unavailable, extra-turn, and extra-length metrics separate and summarizes frequency and strongest examples by each measure. Numeric relevance values guide curation and are intentionally not frozen as CI difficulty thresholds; see `BLOCKER_PROGRESSION.md`.

## Stage verification

Campaign tests freeze the exact distribution of 19 multi-stage levels, comprising 14 two-stage and five three-stage levels, while retaining exact seed/config regressions for the original Levels 21/24/30 pilot. Every campaign stage is generated twice, validated, solved, replayed to an empty board, checked for blocker-mask persistence, and checked for the non-adjacent matching-pair invariant. A separate final-stage regression preserves all 100 final stage configs and generated boards against `getLevelConfig`/`createLevel`. Pure clear outcomes cover non-final advancement, final completion, the single-stage Level 99, and both stages of terminal Level 100; PlayScene reset paths all enter through `startLevel`, which resets the index.

The pure presentation calculation is also checked: Stage 1/3 exposes two backing sheets at `(0,+7)` and `(0,+14)`, Stage 2/3 one at `(0,+7)`, and final or single stages none. Shade is frozen as 0% for the front, 16% at depth 1, and 28% at depth 2, with representative two- and three-stage cases proving it is recalculated from current depth. Phaser tween pixels are intentionally not unit-tested. Manual checks cover the centered, downward-only visible stack, progressive darkness, shade removal during promotion, cleanup on Replay/Next/restart, and disappearance when moving from Level 30 to single-stage Level 31.

## Board and tile visual verification

Pure tests freeze the board/frame bounds at every square campaign size, rectangular centering, fixed pitch/tile geometry, the production radii, and the no-art branch's 2 px outer contour. They derive the artwork aperture exactly 2 px inside every content edge, protect its constant 14 px radius across board sizes, and assert that the outer frame, artwork aperture, no-art opening, and edge tile all share a curve center 16 px from the content corner. They also protect constant curved/straight frame thickness: 8 px for no-art and 10 px for artwork including its 2 px overlap. The tests verify that the active frame and borderless backing sheets share `surface.elevated`, while `border.strong` shades depth rather than forming an artwork bezel or outer outline. Tile tests protect the quiet `1 px divider` default edge plus unchanged emphasized state borders, pressed timing, and selected fill/no-marker policy; sheet offsets and depth shade progression remain frozen. Catalog tests freeze all 30 deterministic `TileId` definitions, unique names and keys, the 12 production-pilot paths and 56 px prepared-canvas presentation, and 18 explicit legacy-placeholder paths and 38 px temporary presentation. Runtime tests read each referenced PNG to validate its signature and 256×256 8-bit RGBA header; production-pilot files additionally must match the approved SHA-256 values and staged source bytes. Tests never rewrite binary assets.

The developer gallery remains available at `?debug=1&symbols=1`, iterates the shared `TILE_SYMBOLS` catalog, and uses the same `TileVisual` treatment as gameplay. After deployment, verify all 30 transparent PNG textures on Android, then compare `?debug=1&level=1` and `?debug=1&level=80`. Confirm the board has no prototype cell grid, empty cells expose the warm interior or artwork, symbols are untinted, selection is teal, and there are no black squares, missing assets, opaque symbol backgrounds, or unexpected pixelation. The 18 legacy symbols are placeholders pending later production artwork.

### Responsive and HiDPI QA

Pure tests cover uniform portrait fitting for the permanent logical `480×800` game, tall portrait, wide landscape, and common tablet/desktop viewport shapes. They also cover production DPR clamping to `[1, 2]`, safe handling of non-finite values, and the developer-only legacy override. Only `?debug=1&renderScale=1` forces 1×; missing debug, `debug=0`, and unsupported scale values retain automatic behavior. The former `hidpi=1` activation gate is retired.

The gallery at `?debug=1&symbols=1` uses automatic production HiDPI and shows viewport CSS size, DPR, render scale, logical size, backing/client canvas sizes, and renderer. Compare it with `?debug=1&symbols=1&renderScale=1`, where diagnostics must report scale 1 and a `480×800` backing canvas. POCO X6 Pro QA observed DPR ≈ 2.994 and correctly used the capped scale 2 (`960×1600` backing canvas).

On a wide and a narrow desktop browser, confirm the portrait game stays centered without cropping or stretching, side gutters retain the shell background, and resizing never produces a horizontal gameplay layout. On portrait Android, compare `?debug=1&level=80` with `?debug=1&level=80&renderScale=1`. The normal production mode must be the sharper version. Compare curved/diagonal PNG edges, card borders, text, and route lines. Tap tiles across the board and verify selection, blocked-pair feedback, routes, stage transitions, Replay, and Next all target the same logical cells in both modes. Landscape rotation must still show a centered portrait frame; it does not trigger an orientation lock or alternate layout.

`npm run analyze:stages` prints exact per-stage dimensions, pairs, blockers, seeds, opening moves, solver/replay status, turn/path metrics, campaign workload, distribution and spacing, campaign stage count, and final-board preservation. It is a diagnostic report, not a synthetic difficulty score. Manual playtesting should sample early, mid, and late placements, including automatic transition clarity, two-stage pacing, occasional three-stage length, blocker-bearing finals, and terminal Level 100 completion.

## Persistent progress verification

Pure tests cover the v1 schema and derived values, monotonic completion, strict malformed-data fallback, storage CRUD and thrown-operation containment, startup/debug isolation, and final-stage-only persistence boundaries for Levels 21, 30, and 100. No jsdom or Phaser scene is required.

After deployment, reset with `?debug=1&resetProgress=1`, then use the normal URL and confirm Level 1. Complete Level 1 and refresh on its Complete overlay before pressing Next: normal play must open Level 2 Stage 1. Remove tiles from Level 2 and refresh before completion: Level 2 must restart with its fresh Stage 1 board. On a multi-stage level, verify intermediate clearance does not update the stored payload. With real progress through Level 1, complete `?debug=1&level=80`, then return to the normal URL and confirm it still opens Level 2. Finally, reset again and confirm normal play returns to Level 1.


## Square campaign geometry and collectible artwork QA

Automated campaign checks require all 100 final configs and every last stage config to be square,
with sides exactly 4, 5, 6, or 7. The fixed ranges are Levels 1–7 at 4×4, 8–16 at 5×5,
17–26 at 6×6, and 27–100 at 7×7. They also require at least two empty non-blocked final cells.
Pair counts, blocker content, seed functions, and the 19-level pre-stage table remain frozen.
Board-layout tests cover 256, 320, 384, and 448 px square footprints at the fixed 64 px pitch /
56 px tile scale. The 7×7 bounds are `[16, 196, 464, 644]`; no stage may zoom its tiles.

Manual targets:

- Level 1 (`?debug=1&level=1`): verify 4×4, normal gameplay, and square artwork filling the board.
- Level 5 (`?debug=1&level=5`): observe whether the forced opening still feels acceptable in human play despite having exactly one initial legal move; this is observation only, not a rebalance requirement.
- Level 16 (`?debug=1&level=16`): verify a centered 5×5 final and authored blockers.
- Level 21 (`?debug=1&level=21&stage=1`, then Stage 2): verify unchanged 5×5 pre-stage,
  6×6 final, and identical tile size.
- Level 30 (`?debug=1&level=30&stage=1`, `stage=2`, and `stage=3`): verify
  4×5 → 5×6 → 7×7, unchanged final blockers, no zoom, and artwork filling the final board.
- Level 80 (`?debug=1&level=80&stage=1`, then `stage=2`): verify 6×6 → 7×7,
  four final blockers, full-board artwork, and no viewport clipping.
- Level 94: check all stages at 5×6 → 6×7 → 7×7.
- Level 100: check both stages at 6×7 → 7×7 and verify the maximum board has no UI overlap.

For artwork Levels 1, 30, and 80, also confirm progressive reveal, no crop or stretch, the clean
400×400 “Image unlocked” presentation, and Continue opening the ordinary Complete overlay. The
reward remains final-stage-only. Pause/Resume must preserve partial reveal; Restart returns to
art-free Stage 1; debug sessions must not modify real progress. Level 2 must have no artwork request
or reward. Pure tests cover catalog presence/absence, eligibility, unlock derivation, and placement.
After build, run `npm run check:package-size`; its full/thumbnail split measures this pilot only. The
temporary WebP average must not be multiplied by 100 as a shipping forecast. That estimate waits for
the later art direction and representative production artwork.

## Navigation verification

Pure tests cover fresh/in-progress/completed primary actions, all three level states, selection eligibility, chapter ranges/defaults, strict `setProgress` parsing, reset precedence, and normal/gallery/debug-play startup routes. Manual QA should verify the 5×2 chapter grid and non-wrapping arrows, current frontier defaults, fresh progress after a confirmed pause-menu exit, and old-level replay without regression. Complete overlays retain Next/Restart and Replay and add a direct Menu exit. Debug jumps remain persistence-disabled.

### Phase 4 Main Menu / Level Select and locale QA

The locale override is developer-only, requires `debug=1`, is not saved, accepts `en`, and otherwise
falls back to the standalone Russian default. Check both locales at renderScale 1 and the device's
normal render scale; labels must remain on one line except the intentional two-line Russian brand.

- `?debug=1&resetProgress=1`: Russian Main Menu shows the localized brand/tagline, `Играть`,
  `Уровни`, `Галерея`, zero progress, and Chapter 1's deliberate identity card. Confirm its inset
  tint, left rail, bottom rail, and corner chip read as UI rather than artwork, debug rectangles, or
  broken layout.
- `?debug=1&setProgress=29`: it shows `Продолжить · Уровень 30`, `Открыто 29 из 100`, and Chapter 3.
- `?debug=1&setProgress=100`: it shows `Играть снова · Уровень 1`, the complete collection label,
  a full track, and does not clear completion.
- Repeat with `&locale=en`; at `?debug=1&setProgress=29&locale=en`, navigate to Chapter 5 and verify
  the compact `Chapter 5` label, separate `Gardens & Courtyards` title, and global progress have no
  clipping or near-edge red-zone effect. The title must not use the former combined 30 px header.
- At `?debug=1&locale=en`, inspect Chapter 1 and verify a visible 12 px gap from the banner bottom to
  the arrow row and another 12 px gap from the arrow row to the grid.
- At `?debug=1&setProgress=29`, inspect Russian Chapter 3 and verify the same clean three-line header
  hierarchy and spacing.
- Level Select defaults to Chapter 3 at progress 29: Levels 21..29 are completed and selectable,
  Level 30 is the selectable gold frontier, and later Levels are locked and inert. Verify the same
  geometry and state meaning in English.
- Navigate to Chapters 1 and 10 in both locales. The boundary arrow retains its 48×48 disabled box,
  is non-interactive, and navigation never wraps. Rapid input must not overlap transitions.
- In DevTools Network, entering and navigating both scenes must request zero `/full/`, `/thumbs/`,
  reward, or chapter artwork. Their banners are static Phaser Graphics only.

Headless tests protect dictionary shape and formatting, exact bilingual chapter names, all Phase 4
geometry, progress ratios, primary-action targets, navigation boundaries, semantic non-colour card
affordances, curated chapter metadata, and deterministic banner manifests. Browser pixel fit, actual
Manrope/fallback metrics, pointer interaction, transition feel, and network requests remain manual QA.

## Player artwork Gallery QA

Pure tests cover the three Gallery slot states for pilot Levels 1, 30, and 80, unavailable Level 2,
catalog-derived unlocked counts, and the highest-unlocked-artwork default chapter. Binary tests check
the `RIFF`/`WEBP` signatures, complete RIFF length and chunk boundaries, VP8 frame signature, and
expected dimensions for separate 1024×1024 full and 256×256 thumbnail fixtures. This catches
truncated or corrupted WebP files that may still retain valid `RIFF`/`WEBP` magic bytes. The overview
requests only unlocked thumbnails in the active chapter; locked entries, unavailable positions, and
unopened chapters request nothing. Full view requests only its validated selected full image. Cached
textures are reused and no Gallery action writes progress.

`setProgress` and `resetProgress` intentionally mutate the local campaign save. Run these fixtures,
then return to the normal URL unless stated otherwise:

- `?debug=1&resetProgress=1`: Main Menu shows Play, Levels, and Gallery. Gallery defaults to Chapter 1;
  Level 1 is Locked, Level 2 says Soon rather than Locked, and no thumbnail request occurs.
- `?debug=1&setProgress=1`: Gallery says `Unlocked 1 / 3`; only the Level 1 thumbnail may load and it
  appears in its square card. Opening it then loads the separate unstretched full image; Back returns
  to Chapter 1 and Menu returns to Main Menu.
- `?debug=1&setProgress=29`, then `?debug=1&setProgress=30`: Level 30 changes from locked to unlocked;
  progress 30 defaults to Chapter 3, reports `Unlocked 2 / 3`, and Full View Back retains Chapter 3.
- `?debug=1&setProgress=79`, then `?debug=1&setProgress=80`: Level 80 changes from locked to unlocked;
  progress 80 defaults to Chapter 8, reports `Unlocked 3 / 3`, and its full view returns to Chapter 8.
- `?debug=1&setProgress=100`: all three remain unlocked and the default stays Chapter 8 because Level 80
  is the highest catalog entry.
- `?debug=1&symbols=1`: verify the unchanged developer Tile Symbol Gallery opens, never the player
  artwork Gallery.

Also inspect the network panel: Main Menu must request zero artwork. Gallery may request only eligible
active-chapter `/thumbs/` files and never `/full/`; locked thumbnails must never be received. Opening
an uncached full view may request only that selected `/full/` asset. Failed artwork loads must show
`Artwork unavailable` while Back remains functional. Phaser layout, input, network behavior, and
device rendering remain manual QA rather than headless test coverage.

### Square Gallery slots

Use `?debug=1&setProgress=80`, then enter Gallery through the normal Main Menu. Chapter 8 shows the
Level 80 thumbnail; switching chapters must not refetch cached thumbnails and must not request artwork
for unavailable slots. Check several
chapters, not only Chapter 1. Verify every card is square, the 5×2 layout retains clear spacing, and
the Level number plus Unlocked, Locked, or Soon state remains readable without clipping. Chapter
arrows and Menu must be unchanged.

### First uncached artwork load

Use a fresh browser session or cache where practical, then open an unlocked artwork that is not
already cached. Verify `Loading artwork…` appears immediately, the network panel requests only the
selected artwork, and the resulting artwork is an uncropped, unstretched 400×400 square. Back must
return to the originating chapter. Open the same artwork again and verify it appears immediately
from Phaser's texture cache without an unnecessary loading state or network reload.

As a regression check, verify `?debug=1&symbols=1` still opens the developer Tile Symbol Gallery.

For gameplay WebP QA, use `?debug=1&level=1`, `?debug=1&level=30&stage=3`, and
`?debug=1&level=80&stage=2`. On Android and a browser, verify the real WebP appears beneath cleared
tiles, routes, and blockers; the square fills each final board without crop/stretch; and the 400×400
post-clear reward uses the same full image. Earlier stages remain artwork-free. This device rendering
and DevTools network inspection are manual because headless tests do not exercise Phaser pixels or
browser request logs. The fixtures are technical visuals only; full market/theme research and visual
redesign remain deferred.

For the Phase 2B.4 board treatment, verify `?debug=1&level=1` has one seamless warm aperture with clearly
rounded artwork corners; `?debug=1&level=24&stage=1` and `?debug=1&level=30&stage=1` have uniform lower
corners and depth from displacement plus 16/28% shade without repeated outlines; and `?debug=1&level=27`
has quiet but readable 1 px default tile edges while Selected, Hint, and Blocked remain prominent.

## Post-P1 Android runtime-atlas QA

On an Android device, inspect `?debug=1&level=27`, `?debug=1&level=30&stage=3`, and
`?debug=1&level=80&stage=2`. Verify default, pressed, Selected, Hint, blocked-pair, and removal
presentation; confirm symbols and rounded borders have no crop, blur, seams, or neighbouring-frame
bleed. Confirm artwork, frame, blockers, route geometry/timing, and stage transitions are unchanged.
Finally open `?debug=1&symbols=1` and inspect all 30 symbols: production art retains its 56 px
treatment and legacy art its 38 px treatment. Replay and stage transitions must reuse the same
runtime atlas rather than creating another texture.

## Pause flow verification

Phaser overlay pixels are intentionally not unit-tested. At `?debug=1&level=1`, select a tile, open Pause, and verify the selection remains visible while board and Hint input do nothing; Resume must restore interaction with the same board and selection. After removing pairs, check that both Restart level and Exit to menu show confirmation, and that each Cancel returns to Pause without resuming. Confirm Restart produces the original deterministic Level 1 Stage 1 board.

At `?debug=1&level=30&stage=2`, Resume must retain Stage 2 while confirmed Restart must return to fresh Stage 1. A confirmed Exit must enter Main Menu, and re-entry must start fresh at Stage 1. With `?debug=1&setProgress=20`, partially play Level 21 normally, confirm Exit, and verify Main Menu still reports 20/100 and Continue Level 21. A separate `?debug=1&level=80` Exit must leave real stored progress unchanged.

Press Pause during Hint's 900 ms feedback and during pair-removal, blocked-pair, and stage-transition locks; it must be ignored until each transient lock ends. While any pause or confirmation view is open, only its current controls may respond and Pause must not stack another overlay. Complete a level and verify Pause is hidden/disabled, Complete Menu exits directly without confirmation, and Replay/Next restore normal gameplay with Pause available. Also verify overlay objects and interactions do not survive Resume, Restart, Exit, shutdown, completion, Replay, or Next.
