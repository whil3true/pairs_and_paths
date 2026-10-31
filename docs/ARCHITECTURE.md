# Architecture

Audited against `dev` commit `c5e09f7a54f60fa6ee2822dd6d781afd3fcb570b` (2026-10-31).
This describes the implementation; historical proposals are not runtime contracts.

## Boundaries and dependency map

| Owner / entry files | Responsibilities | Dependencies and consumers |
| --- | --- | --- |
| `src/main.ts` | Resolve debug route, initialize platform before Phaser, construct stores/audio/shared caches/controller, fonts, scenes and global guards | All outer boundaries; no game rules here |
| `src/domain/` | Immutable board, static terrain, deterministic pathfinding, legal moves, seeded generation, solver and metrics | No Phaser, DOM, SDK, audio or persistence; used by game and headless scripts |
| `src/game/LevelSequence.ts` | Campaign content, uint32 seeds, progression bands, explicit blocker/pre-stage tables | Domain; consumed by scenes, progress and diagnostic scripts |
| `src/progress/` | Version-1 parsing, monotonic completion, resume/unlock and final-stage save decision | `CampaignProgress` imports `TOTAL_LEVELS` from game content; this small existing reverse dependency is real |
| `src/platform/WebProgressStore.ts` | Exception-contained localStorage load/save/clear | Implements `ProgressStore`; no cloud save |
| `src/game/*Scene.ts` | Phaser presentation, navigation, scene-owned input/timers/listeners | Domain/content/progress, presentation policies, injected platform/audio/cache |
| `src/game/*Policy.ts`, `BoardLayout`, `VisualTokens`, `Display` | Pure geometry/state/style policies plus camera/text adapters | Scene projection; logical coordinate and render-density contracts |
| `TileSymbols`, `BoardRuntimeAtlas`, `TileVisual` | ID-to-asset mapping, shared baked CanvasTexture, one tile Container with card/symbol images and independent hint indicator | Same catalog for gameplay and symbol QA gallery; no domain artwork knowledge |
| `LevelArtwork`, `ArtworkGallery`, `ArtworkTextureCache`, banner/brand/HUD catalogs | Artwork eligibility and metadata, gallery slots, full-art LRU and fixed presentation assets | Progress-derived access; scene loaders; no generation changes |
| `Localization`, `UiLocaleRuntime`, `WebLocaleStore` | RU/EN strings and live UI rebuild, locale persistence/precedence | Main-menu settings and scenes; no page reload |
| `src/audio/` | Shared mixer/settings, output, unlock/retry, music sequencing, SFX, browser visibility and media-session behavior | `AudioRuntime` is the scene seam; HTML/Web Audio output; `WebAudioSettingsStore` |
| `src/platform/` SDK/lifecycle files | Async bootstrap, SDK adapter, ready/gameplay markers, shared interstitial eligibility, input guard and DOM covers | `PlatformService` boundary; details in `PLATFORM_INTEGRATION.md` |

`domain/index.ts` is a barrel, not a service. Plain `tsc` emits every source module; there is
no tree shaking. Some exports support tooling/testing rather than live gameplay. Do not infer
dead code from a lack of scene imports. There is no event bus, ECS or generic scene manager.

## Startup and navigation

`createPlatform` completes before audio/Phaser construction. Yandex listeners are attached early;
`isPaused` is consulted again when consumers appear. Locale precedence is debug override → stored
manual choice → SDK language (`ru`, otherwise `en`) → standalone default `ru`.
`loadProductionFonts` probes active Onest weights with a 4-second fallback.

`BootScene` routes to Main Menu, an isolated debug campaign session, or Symbol Gallery.
Main Menu opens `PlayScene`, `LevelSelectScene`, or `ArtworkGalleryScene`. Level Select has ten
chapter pages; only completed levels and the next level are selectable. Gallery opens
`ArtworkFullViewScene`, which returns to Gallery. Settings/Pause/confirmations, Reward and Complete
are scene-owned overlays/presentations, not additional Phaser scenes.

`PlayScene` owns one board at a time, stage promotion, move locks, feedback, artwork reveal,
completion, hints and Pause. Finishing a pre-stage advances without saving; final-stage completion
records progress before artwork presentation and Complete. Next changes the level, Replay keeps it,
Restart starts Stage 1, and terminal Level 100 never requests Level 101. Reward Continue exposes
Complete; the chosen navigation action is retained across an eligible interstitial.

## Domain and campaign invariants

See `GAME_RULES.md` for legal-move/solvability rules. Critical implementation details:

- Paths stay inside real cells, orthogonal and empty in transit, with no virtual border and no turn cap.
  Dijkstra state is `(cell, direction)`; tie-break is turns → steps → stable queue order, with directions
  up, left, right, down. The returned polyline is compact and may have more than two turns.
- `Board` separates immutable blocked terrain from tile occupancy. Removing pairs preserves the mask;
  no gravity, shuffle or mutable terrain exists. Each generated ID occurs exactly twice, with no
  orthogonally adjacent matching pair initially. This adjacency rule belongs to generation.
- Generator uses seeded bounded geometry removal (32 attempts), assigns unique pair IDs afterwards,
  and records/replays a legal witness. Changing random consumption, candidate/direction order or
  seed constants changes campaign content. Unique-pair static removal preserves solvability.
- There are 100 levels, 10 chapters, 19 multi-stage levels (14 two-stage, five three-stage), 124 boards.
  Final-stage configs always come from `getLevelConfig`; preludes are explicit, blocker-free content.
  Final boards are square 4×4..7×7; preludes can be rectangular. Domain maximum is 7×7.
- Final seed: `Math.imul((levelNumber - 1) >>> 0, 0x9e3779b9) >>> 0`.
  Pre-stage namespace uses the frozen constants and index expression in `LevelSequence.ts`;
  never replace it with an approximate formula. Tests freeze pilot seeds and final-board equivalence.

## Persistence and session state

| Key / schema | Owner | Compatibility contract |
| --- | --- | --- |
| `pairs-and-paths:campaign-progress`, `{version:1, completedThroughLevel:0..100}` | `WebProgressStore` / `CampaignProgress` | Malformed/unknown version → initial progress; final completion is monotonic |
| `pairs-and-paths:ui-locale`, `ru` or `en` | `WebLocaleStore` | Throwing storage remains usable; save reports failure |
| `pairs-and-paths:audio-settings`, version 1 normalized music/SFX volumes | `WebAudioSettingsStore` / `AudioSettings` | Validate/clamp values; default music .4, effects .65 |

Gallery unlocks are derived from completed levels, never stored separately. Mid-board progress,
selected tiles, current stage and hint markers are session state. Hint indicators are persistent
**within the current board**, not across browser reloads. Removing an unrelated pair retains them;
removing either marked tile or disposing the board clears them. Valid debug `level` jumps disable
campaign writes for the whole resulting session; debug progress fixtures intentionally mutate storage.

## Rendering, loading and memory

The authored world is 480×800, with fixed 64 px cell pitch and 56 px tiles (8 px gaps). Largest board
is 448×448. Phaser is actually configured with `Scale.EXPAND`, `NO_CENTER`, `expandParent:false`
and backing width/height `480/800 × renderScale`; main does not pass explicit max dimensions.
Camera zoom/centering keeps the authored composition centered. CSS uses a full-inset game root;
in landscape it centers a root of width `min(100dvw, 100dvh × .6)`, leaving page gutters.
`computePortraitFrame` models capped portrait width/1600 logical height for density calculations,
but that helper/cap is not a complete live ScaleManager constraint. `viewport-fit=cover` is present;
current CSS has no `env(safe-area-inset-*)` padding. Preserve actual behavior and verify tall/notched
devices rather than assuming old FIT/safe-area prose applies. Density is chosen once at startup,
clamped 1..2, desktop forced 2×;
`debug=1&renderScale=1` is the sole legacy override. Resizing does not rebuild the atlas/density.

`BoardRuntimeAtlas` is game-global with density/versioned keys; scene shutdown must not remove it.
Tile semantic states and pressed feedback are separate. Rewarded hints use an independent inset
gold outline in `TileVisual`, preserving ordinary selected/error states and cell gaps.
Board/frame geometry is procedural; full-square artwork is contained without crop/stretch underneath
final-stage tiles. No new raster frame or gameplay mask is needed.

All 100 artwork definitions generate zero-padded `pipeline/full/level-NNN.webp` (1024²) and
`pipeline/thumbs/level-NNN.webp` (256²) paths. Main Menu loads no artwork. Play requests current full
art only; Replay can reuse it. Gallery loads unlocked thumbnails in the active chapter only; Full
View validates unlock state and loads one full image. Full-art cache has a three-entry LRU target;
active leases are never evicted, so temporary overage is possible until release. Thumbnails use
Phaser caching. Loader completion/error/shutdown must detach listeners and release full-art leases.

`TileSymbols` is the complete ordered V5.4.1 catalog (30 PNGs) at historical `symbols/v3/`; the
maximum campaign ID is currently 22 but the whole approved catalog and QA gallery are retained.
The full mapping and historical Android SVG lesson live in `TILE_VISUALS.md`.
Eight manifest audio files, two logos, ten chapter banners, settings gear, font files/licenses and
four loaded HUD textures are runtime inputs. CSS URLs are dependencies even without TS imports.

## Build and operations

`scripts/build.mjs` cleans `dist`, invokes `tsc`, copies `public` recursively, then copies the first
available Phaser distribution (`dist/phaser.js`, fallback `dist/phaser.min.js`). This deliberately
preserves current vendor behavior; switching to minified Phaser is a separate change requiring QA.
`public/index.html` loads the vendor global before `js/main.js` as an ES module. No CDN is required
for game assets. SDK `/sdk.js` comes from the portal. CI/deployment commands are indexed in README;
release limits and device evidence belong to `TESTING.md`, cleanup evidence to `REPOSITORY_AUDIT.md`.
