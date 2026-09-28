# Product specification

- Working titles: **Pairs & Paths: Connect the Tiles** (EN), **Пары и пути: Соедини плитки** (RU).
- Portrait-first Onet / Pair Connect puzzle for RU and EN audiences.
- Boards are at most 7×7; levels are short and guaranteed solvable.
- The first campaign contains 100 deterministic levels in 10 chapters of 10 levels.
- The playtest-revised, data-informed difficulty curve grows pair density from 4×4/4 pairs to 7×7/22 pairs. Final boards are 4×4 for Levels 1–7, 5×5 for 8–16, 6×6 for 17–26, and 7×7 for 27–100. Pair counts, authored blockers, and deterministic seeds are unchanged; chapters are organizational and do not imply one profile each. Solver-path measurements remain calibration proxies rather than claims about human difficulty.
- Hint is the only player aid planned for v1. Shuffle is not part of v1 because the guaranteed-solvable campaign does not require deadlock recovery; it may be reconsidered only if future human playtesting demonstrates a real need.
- The planned metagame consists of chapters and a collectible-artwork Gallery.
- There is no hard timer, lives, economy, story, or characters.

This is the agreed product nucleus, not a complete game design document.

## Collectible artwork Gallery pilot

Each campaign Level will eventually own one square illustration. On the Level's final Stage the
full square artwork fills the square final-stage board bounds; it is never cropped or stretched. It sits beneath
tiles, symbols, routes, and static blockers, so clearing tiles progressively reveals it. Small glimpses
through the intentional 64 px cell / 56 px tile gaps are part of the design. Multi-stage Levels
never show artwork on earlier Stages. Blockers may obscure it during play, but the post-clear
presentation shows the same full square image at a consistent size without gameplay objects.

Gameplay uses one global compact scale for every current board and stage: `CELL_PITCH = 64` and
`TILE_SIZE = 56`, preserving the intentional 8 logical px gap. The 7×7 maximum occupies 448×448
logical pixels inside the permanent 480×800 viewport without dynamic sizing. Campaign final boards
are always square; authored pre-stages may remain rectangular.

The current human-validation pilot covers only Levels 1, 30, and 80. All 100 Levels will receive
artwork only after that pilot is validated. On a pilot final clear, campaign progress is saved
**before** the non-timed “Image unlocked” presentation; Continue then opens the unchanged Complete
overlay. Replays present the reward again. A future Gallery groups items by chapter and offers
locked/unlocked overview and full view. Level N is unlocked exactly when
`completedThroughLevel >= N`; there is no separate collection, inventory, reward, or seen-state save.

Full-size artwork must not become startup payload: Main Menu downloads none, gameplay requests only
the current Level's image, a future Gallery overview uses lightweight thumbnails, and Gallery full
view loads only its selected image. Thumbnails are not part of this pilot. The pilot SVGs
are placeholders and their sizes are not a realistic estimate for 100 production illustrations.

## Hint player aid

During active play, the top-right Hint button highlights both tiles of the first move returned by
`findLegalMoves` for the current board, using a brief cyan outline. The deterministic hint is
informational: it does not draw the route, remove tiles, alter the generated stage or campaign
progress, or persist usage. Any manual selection is cleared first, and board input plus repeated
Hint presses are ignored during the 900 ms feedback. Prototype usage remains unlimited for QA and
gameplay validation, with no currency, cooldown, ads, or save-data field. A future release may
restrict usage; one possible model is a single rewarded Hint opportunity per campaign level, but
monetization and replay semantics are undecided. A board with remaining tiles but no legal move is an
invariant failure and only produces a warning; it is not shuffled, regenerated, or treated as a
loss. Hint is unavailable on the Complete overlay. Shuffle is not planned for v1.

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

Normal startup opens a portrait Main Menu showing completed levels, a Play/Continue/Play again action, and Levels. Continue always targets Stage 1 of the first uncompleted level; after all 100 levels it becomes Play again at Level 1 without clearing completion. Levels presents one ten-level chapter at a time in a 5×2 grid and defaults to the highest unlocked level's chapter. Completed levels and the single current frontier are selectable; later levels are locked. Replaying an older level advances sequentially and cannot reduce the monotonic save.

Active gameplay has a Pause control rather than a direct Menu exit. Its in-scene overlay offers Resume, Restart level, and Exit to menu. Restart and Exit each require confirmation; Cancel returns to the Pause menu rather than resuming. Resume preserves the exact board, stage, blockers, removed tiles, and selection. Confirmed Restart deterministically reloads the whole current campaign level from Stage 1 without changing campaign progress. Confirmed Exit discards the unfinished board and stage without persistence. Once the final stage is complete, Pause is unavailable and the Complete-overlay Menu continues to exit directly because completion has already been persisted.

The Pause menu may later add separate Music volume and Sound effects volume controls. Those values should survive browser/game restarts through settings persistence independent of campaign progress. Audio, controls, and settings storage are not implemented yet.
