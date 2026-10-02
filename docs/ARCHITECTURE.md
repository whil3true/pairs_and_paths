# Architecture

`src/domain` owns immutable `Board`, pathfinding, moves, solving, generation, and metrics without browser or Phaser dependencies. `findPath` performs a deterministic Dijkstra search over `(cell, direction)` states inside real board coordinates. Cost is `(turn count, path length, stable implementation-defined direction/insertion order)`. A small binary heap stores numeric state records and predecessor indices; the winning route is reconstructed once and compacted to a 2..N-corner polyline.

`generateLevel` constructs a seeded occupancy mask with the requested empty-cell count, then removes one legal non-adjacent geometric pair at a time. Reading that witness backwards is reverse construction: each pair is reinserted into the emptier board on which its recorded interior path existed. Each step builds one occupancy board rather than one board per candidate. Attempts are explicitly bounded and failure is reported. Unique IDs are assigned after geometry is complete. Validation checks structure, product adjacency, a legal initial move, and exact witness replay. The greedy unique-pair solver remains complete by removal monotonicity.

`src/game` owns Phaser projection and campaign selection. `LevelSequence` accepts only levels 1..100, maps each level through a deterministic progression-band table and combines that profile with a deterministic seed. Chapters remain organizational groups of ten and may contain several profiles. Every profile requests non-adjacent matching pairs. The seed is `Math.imul((levelNumber - 1) >>> 0, 0x9e3779b9) >>> 0`: Level 1 keeps seed 0, while the odd multiplier keeps the 100 base seeds distinct. This is stable content sequencing, not a cryptographic uniqueness claim.

`VisualTokens` is the immutable production palette, typography, spacing, shape, shadow, and motion source for redesign work. Each colour carries both its canonical CSS HEX and derived Phaser integer so renderers cannot maintain independent palettes. `UiPolicy` resolves pure button states and sized-Container hit geometry; `UiPrimitives` projects that policy into small Phaser text, button, icon-button, card, and modal helpers. Phaser normalizes input coordinates by a Container's centered display origin, so the shared button primitive uses the resulting `0..width × 0..height` local rectangle for both initial and re-enabled input. Its explicit focus seam does not introduce global keyboard navigation. Existing scenes remain on their current presentation until their scoped redesign phases; only the global page and Phaser fallback backgrounds use the production foundation in Phase 1.

`PlayScene` owns the current session level number. Next increments it before regeneration; Replay regenerates without changing it. Level 100 instead reports campaign completion and can restart the session at Level 1, never requesting Level 101. `BoardLayout` maps only real cells; route graphics consume arbitrary-length compact polylines. A blocked matching pair receives a brief red stroke before the second tile becomes selection. `src/platform` remains the existing small platform boundary. The project retains plain `tsc`, no bundler, and Phaser 4.2.1.

`PlayScene` also owns the compact gameplay HUD and the lifecycle of route, Hint, blocked-pair, and
pair-removal feedback. `GameplayHudPolicy` contains only fixed HUD geometry and Russian pair-count
formatting; `GameplayFeedbackPolicy` contains presentation timing/style constants and physical-length
partial-polyline math whose segment and cumulative lengths are computed once per animated move.
`PlayScene` samples those metrics during each linear draw frame. It also owns stage lifecycle and
input locking: an ordinary initial stage has an 80 ms non-visual presentation settle, while an
animated stage promotion unlocks through its existing transition completion without another settle.
The settle is presentation-only and introduces no manager or service. `BlockerVisual` is a procedural presentation of the existing immutable terrain
mask. None of these presentation owners changes blocker, path, move, campaign, or Hint-selection semantics.

`BoardLayout` also owns the single campaign-wide presentation scale: a 64 logical px cell pitch and
56 logical px tile, leaving an 8 px gap. Every existing board and every stage uses these constants;
dimensions never trigger per-level zoom. The domain maximum is 7×7, which occupies 448×448 in the
480 px logical viewport. Campaign final boards are square (4×4, 5×5, 6×6, or 7×7); authored
pre-stages may remain rectangular.

`getHintMove(board)` is a pure game-layer policy seam that returns `findLegalMoves(board)[0]` or
`null`; it neither caches a generator witness nor duplicates pathfinding. `PlayScene` projects that
current-stage move as two gold double-ring tile outlines for 900 ms, with synchronized restrained
pulses unless the browser requests reduced motion. A separate `hintActive` guard blocks tile
and repeated Hint input without changing transition locking. Board-visual disposal cancels the
timer before stage replacement, Replay, Next, restart, or shutdown, and completion hides and
disables the Hint control. Hint has no persistence or economy; Shuffle is not part of v1.

`src/progress` owns the versioned `{ version: 1, completedThroughLevel: 0..100 }` schema, strict untrusted-data parsing, monotonic completion, and derived resume/unlock/completion rules. `ProgressStore` is the narrow `load`/`save`/`clear` boundary. `WebProgressStore` currently backs it with the single `localStorage` key `pairs-and-paths:campaign-progress`; every storage operation is contained so unavailable or throwing browser storage degrades to a non-persistent session. Malformed and unknown-version payloads fall back to initial progress; explicit migrations can be added later. A Yandex or cloud implementation can replace this backend without changing campaign rules or adding persistence to `PlatformService`.

Startup resolves normal play to Stage 1 of the first uncompleted level (or Level 1 after recorded campaign completion). A valid developer campaign jump bypasses stored position and disables writes for the entire resulting session. Other debug features retain normal persistence. The gated `?debug=1&resetProgress=1` clear runs before scene choice, so combining it with `symbols=1` clears once and then opens the gallery; the gallery itself never writes progress.

`TileSymbols` is the presentation-only, deterministic mapping from domain `TileId` to 30 ordered PNG runtime definitions. Twelve approved pilot definitions load from `public/assets/production-pilot/symbols/*.png` and explicitly present their prepared canvases at 56 px; the other definitions remain explicit legacy placeholders in `public/assets/symbols/*.png` with a temporary 38 px treatment. After those sources load, `BoardRuntimeAtlas` creates one game-global, immutable `CanvasTexture` containing all five card states and all 30 symbol presentations. Its versioned key includes the compatible integer physical layout, so scenes at the same render density reuse it; scene shutdown does not remove it from the game-owned `TextureManager`. Source textures remain cached and are used only to bake the atlas.

`TileVisual` consumes that atlas and is exactly one root `Container` with two `Image` children—card and symbol—using different named frames from the same underlying texture. It owns selected/Hint/error frame synchronization and root-level tactile, Hint, and removal animation, but no live per-tile `Graphics`; the Hint inner ring is part of its immutable card frame. Semantic tile state takes precedence over its transient pressed surface, while tactile scale remains independent; the stable interactive cell zone remains owned by `PlayScene`.

`BoardVisualPolicy` derives content, eight-pixel frame, and two-pixel-inset artwork-aperture bounds and corner tangents plus depth-based sheet shade values from `BoardLayout` without Phaser. The 24 px outer frame, 16 px no-art opening, 14 px artwork aperture, and 12 px corner tile radii are concentric at 16 px from the content corner. `PlayScene` places the unchanged square artwork above a matching warm backing, then uses one procedural Graphics overlay to paint the warm 2 px overlap strips and the areas outside the four 14 px quarter-circles, without an outer outline. Artwork mode uses neither RenderTexture erase nor a mask. The approved no-art RenderTexture path still erases the complete content bounds at the original 16 px radius, preserving tile clearance and its existing structural stroke policy. No raster frame is used. Gameplay visuals remain above that overlay. Buried multi-stage sheets use the shared `surface.elevated` base without outlines; displacement and overlays alone communicate 0/16/28% physical depth. Logical cell geometry and route coordinates remain owned by `BoardLayout`.

`LevelArtwork` is similarly campaign/presentation metadata; the domain, generator, solver, moves,
and pathfinder remain unaware of it. Its pilot catalog maps Levels 1/30/80 to separate opaque full
and thumbnail texture keys and WebP paths. Full fixtures are 1024×1024 and thumbnails are 256×256.
`PlayScene` requests only the current Level's full texture (initial preload or dynamic load before Next), reuses cached textures
for Replay, and never bulk-prefetches. A missing/failed texture simply preserves ordinary gameplay
and the Complete overlay. Main Menu loads no artwork.

The pure `computeContainedSquarePlacement` derives the largest centered square inside the active
final-stage `BoardLayout` bounds. `PlayScene` displays the full square source at that uniform size,
without cropping or stretching it. Because every final board is square, artwork fills those bounds.
Artwork is a separately referenced image beneath cell, tile, route, and blocker visuals, with reduced
cell-backing opacity only on an eligible final Stage. Final-stage completion retains the strict order:
derive completion, save when persistence is enabled, then show the clean full-square artwork
presentation, then the existing Complete flow. Debug jumps remain non-persistent. Pure `ArtworkGallery`
policy derives each slot as unavailable, locked, or unlocked, its catalog-derived count, and the
default chapter solely from `LEVEL_ARTWORK` and `completedThroughLevel`, without changing
`CampaignProgressV1` or adding Gallery persistence.

`npm run check:package-size` recursively reports total `dist`, artwork totals split between full and
thumbnail files, and largest artwork/package files after a build. It warns above 80,000,000 bytes and
fails above 100,000,000. `ArtworkGalleryScene` requests only missing thumbnails for unlocked catalog
entries in the active chapter. It never requests full images, locked thumbnails, unavailable slots,
or entries in unopened chapters; chapter revisits reuse Phaser's texture cache. `ArtworkFullViewScene`
validates current progress and requests only the selected full asset. Main Menu requests no artwork.
The WebPs are temporary engineering fixtures, not a theme or art-direction commitment, and the old
runtime SVG placeholders were removed. Their varied compression validates architecture and measurement:
do not extrapolate the pilot average across 100 artworks. Shipping estimates wait for later market/theme
research, redesign, and representative production-quality artwork.


Task 5.1 revises only the progression data after human playtesting; it does not alter domain generation, solving, path rules, or introduce new mechanics. Later difficulty mechanics remain deferred.

## Static blocker foundation

`Board` stores tile occupancy (`Cell = TileId | null`) and an independent immutable blocked-coordinate mask. `isBlocked`, `isOccupied`, and `isEmpty` distinguish wall terrain, real tiles, and traversable emptiness. Revisions share the immutable mask; placing a tile on it is rejected. Pathfinding excludes blocked endpoints and transit cells. Solving and pair multiplicity inspect tiles only, and completion means no tiles, not no terrain. Optional generator `blockedCells` are validated, excluded from capacity and candidates, and supplied to every construction board without changing blocker-free random consumption. Validation checks the exact mask and its persistence through replay.

`LevelSequence` owns `CAMPAIGN_BLOCKERS`, a flat content table of level number, pattern family, and exact coordinates. `getLevelConfig` combines the unchanged progression band and derived seed with its optional table entry; there is no runtime terrain randomizer or manager. `PlayScene` draws non-interactive dark stone placeholders for fixed cells. Production art and mutable terrain mechanics remain deferred.

The headless blocker analyzer copies each solver state's exact tile rows into a blocker-free `Board` and compares matching-pair routes. This isolates terrain from tile placement and is diagnostic only: it neither changes nor wraps the production solver strategy.

## Portrait display and production render density

The permanent gameplay coordinate system is portrait `480×800`. `BoardLayout`, UI positions, routes, and hit zones remain in that logical world on phones, tablets, and desktop browsers. The HTML body owns the full `100vw × 100dvh` prototype background, while `#game` is inset by CSS safe-area environment values and Phaser `Scale.FIT` uniformly contains and centers its portrait canvas. Thus a wide desktop shows background gutters rather than a desktop board variant; unusually tall phones may show top/bottom background. Browser chrome can still change the reported dynamic viewport as it opens or closes, but no gameplay is intentionally placed under the reported safe-area insets.

Phaser 4.2.1 has no supported global `GameConfig.resolution` field. Production therefore configures the backing game/canvas as `480 × renderScale` by `800 × renderScale`, then uses the supported main-camera zoom and a compensating centered scroll. This keeps the permanent visible world at logical `480×800`; Phaser's camera/input transforms keep pointer world coordinates aligned for both WebGL and Canvas renderers. Phaser Text objects use `setResolution(renderScale)` above 1×. `Scale.FIT`, `CENTER_BOTH`, the safe-area shell, and full-viewport background ownership are unchanged, so desktop gameplay remains portrait-centered with background gutters.

`renderScale` follows finite device pixel ratio clamped to `[1, 2]` by default. The approximate render-pixel costs are 1× at scale 1, 2.25× at 1.5, and 4× at 2; the maximum backing canvas is therefore `960×1600`. POCO X6 Pro QA observed DPR ≈ 2.994 and correctly selected scale 2. The developer-only `?debug=1&renderScale=1` override forces the legacy `480×800` backing canvas for comparison and regression; other explicit scale values are ignored, and the former `hidpi=1` activation gate is retired. There is no device detection, user-agent check, FPS adaptation, or orientation lock.

## Sequential stage composition

`LevelSequence` owns the explicit authored campaign `MULTI_STAGE_LEVELS` prelude table and appends `getLevelConfig(levelNumber)` automatically as the final stage. `createLevel` is unchanged and still creates that original board. The pure stage API is `getLevelStageConfigs`, `getStageCount`, `createLevelStage`, and `getStageClearOutcome`; no stage manager exists and the domain remains unaware of campaign composition.

Pre-stage seeds use a documented uint32 namespace: `imul(level, 0x85ebca6b) ^ imul(index + 1, 0xc2b2ae35) ^ 0x27d4eb2d`. Pre-stage configs and seeds remain authored content, while final-stage dimensions come from the square campaign progression and retain the original `levelSeed`, pair count, and blocker mask. `PlayScene` holds a zero-based stage index and owns two disposable presentation containers: a stage-sheet stack and the current board visuals. The stack uses the current `BoardLayout` bounds with 8 px padding and a vertical-only 7 px per-layer offset (zero horizontal offset); at most two non-interactive backing sheets communicate remaining stages. A neutral-dark overlay shades current depth 1 at 16% and depth 2 at 28%, while the active front remains unshaded. On a non-final clear, input stays locked while the front sheet and current grid lift/fade for 220 ms, the nearest backing advances and its overlay fades to zero, and the newly generated stage settles in for 140 ms with shade recalculated from its current depth. Different stage dimensions rebuild the metaphor from the new current layout rather than exposing future geometry. Starting, replaying, advancing, and restarting destroy both containers and reset or reload the appropriate stack; completion still appears only after the final stage. On that final-stage boundary, `PlayScene` records and saves the level immediately before showing completion. Intermediate stages, Next, Replay, and Restart do not write or clear progress.

## Player navigation scenes

`BootScene` applies the pure startup route through ordinary Phaser scene transitions. Normal startup enters `MainMenuScene`; gated level jumps and the developer-only `SymbolGalleryScene` bypass it. `MainMenuScene`, `LevelSelectScene`, and player-facing `ArtworkGalleryScene` load `ProgressStore` on entry so completed gameplay is immediately reflected. Pure `CampaignNavigation` functions own menu actions, level states, and chapter ranges; pure `ArtworkGallery` functions own collection policy. `ArtworkFullViewScene` receives only a Level and return chapter and returns to that chapter. `PlayScene` is registered once with stable platform/store/render dependencies and receives level, stage, and persistence mode through Phaser start data. Menu and Gallery navigation do not write progress. All player scenes retain the logical `480×800` camera and HiDPI text helpers; no router or navigation manager exists. The existing `?debug=1&symbols=1` route remains exclusively the tile-symbol contact sheet and is separate from the player Gallery.

## Gameplay pause ownership

Pause is presentation state owned directly by `PlayScene`, not a separate `PauseScene`, generic modal manager, or gameplay-state framework. The overlay and its restart/exit confirmation views guard board, Hint, and Pause input while leaving the current board, stage, removed tiles, blockers, and selection intact. Resume only destroys the overlay. Confirmed Restart uses the normal deterministic level reload, resetting the current level to Stage 1; confirmed Exit starts `MainMenuScene` without writing unfinished state. The final-stage Complete overlay disables Pause and keeps its direct Menu action, because campaign completion has already been persisted.

Future user-driven pause and resume boundaries may call platform `GameplayAPI.stop()` and `GameplayAPI.start()` respectively. Platform-driven and advertisement-driven lifecycle handling are separate future concerns; no SDK hook exists yet. Future Music and SFX volumes likewise belong to a separate persistent settings concern, never the `CampaignProgress` schema.
