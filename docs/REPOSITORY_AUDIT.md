# Repository audit and cleanup record

## Baseline and scope

Audited 2026-10-31 from latest fetched `dev`:
`c5e09f7a54f60fa6ee2822dd6d781afd3fcb570b` — Fix rewarded hint persistence and pause modal stacking (#128).
No AGENTS.md was present in the checkout. Work is split into feature-branch draft PRs; no shared
branch changes or history rewrites. PR A records architecture/evidence; PR B applies one coherent
asset/history cleanup batch and verifies the unchanged game. PR A targets `dev`; PR B is stacked on PR A's feature branch, both descending from this
recorded baseline. The cleanup PR diff therefore excludes the documentation rewrite. After merging
PR A, retarget PR B to `dev` (merge updated dev into it if necessary; do not rewrite history).

Environment: Node v24.22.1, npm 11.9.0, Linux; project/CI minimum is Node 22. `npm ci` installed the
lockfile's two direct packages successfully. The environment prints an npm `http-proxy` deprecation
warning; it did not fail any check. No runtime/dependency upgrade is part of this maintenance.

[Baseline inventory](audit/baseline-inventory.csv) records every one of **522 tracked files** with
byte size, SHA-256, proposed decision and role/evidence group. Total tracked payload:
**33,131,206 bytes**. This is the active checkout's logical file sum, excluding `.git`, installed
packages and generated output; it is not a promised reduction of GitHub's historical Git size.
[Source dependencies](audit/source-dependencies.csv) records relative imports/re-exports, including
type-only edges; runtime scene routes/loaders and CSS dependencies are explained in ARCHITECTURE.

## Baseline verification

| Check | Baseline result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS: 227 tests, zero failed/skipped |
| `npm run simulate -- --count 10000` | PASS: 10,000 successes; zero generation/solver/replay/adjacency failures; 200,000 paths |
| `npm run simulate:blockers` | PASS: 150 generated/solved; zero replay failures, blocked transit or blocked tiles |
| `npm run build` | PASS |
| `npm run check:package-size` | PASS: 41,260,747 bytes, 424 distribution files |
| Local ZIP of dist contents | 33,727,540 bytes, DEFLATE; same method used for after comparison |

Baseline artwork full+thumb total is **21,975,864 bytes** (200 WebPs). The unminified Phaser vendor
is included as selected by the existing build. Do not compare these figures with old prototype or
store-asset ZIP estimates. ZIP compressed sizes can vary by tool/version and are not portal limits.

## Deletion evidence and inventory

These decisions use the baseline checkout, source loaders, all tests, build scripts, TS configs,
HTML/CSS and workflows. Inventory decisions in PR A were proposals; PR B applies the D1–D6 removals and historical
relocations after preserving this record. Exact members/hashes/bytes are in the CSV; no name-based age heuristic.

| Group | Decision / exact scope | Count / bytes | Static + dynamic evidence | Test/build dependency and disposition |
| --- | --- | --- | --- | --- |
| D1 | DELETE root `public/assets/symbols/*.png` only, not subdirectories | 30 / 210,180 | `TileSymbols` exclusively constructs `assets/symbols/v3/${name}.png`; atlas and debug gallery both consume that catalog. No fallback/root wildcard or CSS/HTML reference | Current catalog tests explicitly reject legacy runtime paths. Recursive public copy ships these unused files today; removing them removes them from dist |
| D2 | DELETE `public/assets/symbols/v2/` | 31 / 1,088,541 | Same finite catalog expansion, preloader/atlas/gallery analysis; no v2 path, directory enumeration or runtime selector | No tests consume v2. Includes its empty .gitkeep. Currently copied into dist |
| D3 | DELETE `art/production-pilot/` and `public/assets/production-pilot/` | 25 / 334,357 | 12 old source PNGs are byte-identical to 12 pilot runtime PNGs; all 12 differ from active v3 versions. Pilot CSV describes superseded artwork, not current masters. No runtime loader points here | One historical hash test reads both copies. Replace that obsolete fixture test with current production-symbol hash protection, preserving current order/header/preloader tests. Only the public half ships today. CSV retains old hashes; Git retains originals |
| D4 | DELETE `art/source/symbols/*.svg` | 30 / 10,487 | SVGs belong to the root prototype catalog, not v3; no rasterization/export step exists in any script, package task or workflow. Runtime uses PNG-only catalog | No test opens these sources; build uses `src` and `public` only. Preserve Android SVG/tint failure lesson in TILE_VISUALS, not obsolete drawings |
| D5 | DELETE `public/assets/ui/compact-hud-v1/ui-stat-chip-base.png` | 1 / 21,434 | `COMPACT_HUD_ASSETS` contains exactly four other paths; `CompactGameplayHud` loads Object.values of that catalog. All stat/stage chips now use stage-pill NineSlice. Existing test asserts no `COMPACT_HUD_ASSETS.statChip` | One export-dimension test still lists five assets. Update it to four loaded production textures; keep all layout/NineSlice/input tests. Currently copied to dist |
| D6 | DELETE remaining `.gitkeep` under populated public asset directories | 9 / 5 | Placeholders have no runtime references and do not preserve any otherwise empty required directory | Copied by public recursion; no test requires them. v2 .gitkeep counted in D2, not twice |

Combined proposed deletion: **126 files / 1,665,004 bytes**, including **83 public files /
1,485,900 bytes**. No source-code or dependency removal is justified by this batch.

## Keep, relocate and review decisions

| Decision | Scope | Evidence / reason |
| --- | --- | --- |
| KEEP | All 30 `symbols/v3/*.png`, including entries above campaign max ID 22 | Active catalog, preloader, atlas and QA gallery; V5.4.1 is the approved content despite historical path |
| KEEP | All 100 full + 100 thumbnail WebPs | `LevelArtwork` constructs IDs 001..100; Play/Gallery/Full View load them dynamically, not literal per-file imports |
| KEEP | Ten banners, two logos, gear, four loaded HUD PNGs | Explicit catalogs/direct scene references and runtime loaders |
| KEEP | Eight audio files, audio README/provenance, font files and both OFL licenses | Audio manifest and HTML/Web Audio playback, CSS URL dependencies, attribution; no unused audio proven |
| KEEP | `DebugStart`, `SymbolGalleryScene`, startup/ready routing and renderScale override | Deliberately gated, tested QA tools; same production symbols, isolated campaign save semantics. Removing them changes developer behavior with little benefit |
| KEEP | All nine existing scripts, Phaser/TypeScript dependencies and lockfile | Scripts are npm tasks or task dependencies/diagnostics; Phaser runtime/global types and TypeScript compiler both required. No redundant third-party dependency exists |
| KEEP | GAME_RULES, progression/blocker/stage reports, AUDIO_LICENSES | Current invariants, calibrated content rationale and unresolved provenance evidence |
| RELOCATE | PRODUCT_SPEC, VISUAL_SPEC_V1, AUDIO_IMPLEMENTATION_PLAN, STAGE_PILOT → `docs/history/` | Valuable design/history but obsolete implementation/status claims. PR A labels them; PR B moves with relative links corrected |
| REVIEW / KEEP | `PlayScene` hintTimer/hintTween fields and cleanup branches | Appear dormant after persistent hints; source-level cleanup could interact with lifecycle and regression wiring. No functional refactor in this batch |
| REVIEW / KEEP | Exported helpers, diagnostic solver/metrics in emitted JS | Plain tsc emits all source; barrel exports/tool/test users complicate reachability. Requires a separately measured runtime dependency analysis |
| REVIEW / KEEP | Browser HTML title/aria still uses Pairs & Paths | Cosmetic naming debt; persistence keys and package ID remain deliberate compatibility/internal names. No unsolicited UI change |
| REVIEW / KEEP | Display policy helper versus live config | `computePortraitFrame` models caps; main does not configure max dimensions, and current CSS lacks safe-area inset padding. Existing display tests describe parts of policy, not a device proof. Record/QA separately without changing accepted rendering |
| REVIEW / KEEP | Literata font family/files | CSS declarations, VisualTokens and license/header tests are real references. Lack of current startup probes is insufficient removal evidence |

[Production asset hashes](audit/production-assets.sha256.json) freeze the **261 retained binary/license
files**, paths relative to public. This protects exact corrected cup, every artwork, UI, audio and
license byte across cleanup. It is an audit snapshot, not generated runtime state.

## Historical fixes retained as engineering knowledge

- PNG migration avoided SVG rasterization/tint black squares on Android; do not restore SVG runtime
  loading merely because SVG sources look smaller. Corrected cup was updated by `aa734d0`.
- #119–#120 established SDK gameplay lifecycle and correct initial running-state marker.
- #121–#125 established startup input safety, shared 90 s eligibility, exact nested callback envelope,
  and separation of ad navigation completion from SDK resume. Intermediate attempts that waited
  for resume are not the final design. See PLATFORM_INTEGRATION for the accepted rules.
- #126 moved the cover to real ad open and destination post-render, avoiding both tap-time blanking
  and flashes of the old screen. Do not arm its failsafe while an ad is still playing.
- #127–#128 introduced rewarded hints, independent inset indicators, retention after unrelated
  removals, stale-reward cancellation and browser-Pause precedence over Hint dialogs.
- Full-art LRU and loader cleanup avoid accumulating roughly 4 MiB decoded RGBA per full artwork;
  retaining 100 compressed WebPs on disk does not justify loading all 100 full textures at startup.

## Technical debt and release gates

### Release gates / unresolved evidence

1. `AUDIO_LICENSES.md` still marks exact origin/license of six SFX as unverified. Confirm source
   archives and retain evidence before public distribution. This audit preserves that uncertainty;
   it does not re-audit external license terms or claim ownership clearance.
2. Retain the generation/export evidence requested there for user-produced Porcelain Hours and the
   source/license snapshot for Forget Me Not. Existing assertions are provenance records, not new
   independent legal verification.
3. Fresh real Android/Yandex draft smoke after cleanup and full CI are release gates. Prior Android
   acceptance is the preservation baseline, not newly executed evidence. Device/portal tests cannot
   be replaced by source assertions. No new gameplay blocker was found by baseline automated checks.

### Optional improvements (separate scope)

- Consider minified Phaser after measured Android/SDK QA; preserve vendor selection in this task.
- Consider explicit dev/release route packaging only if the QA fixtures remain accessible and tested.
- Reduce dormant hint feedback fields or split PlayScene only around a demonstrated maintenance need;
  no generic manager hierarchy is warranted.
- A dependency-aware asset catalog check is preferable to repeatedly searching for literal paths;
  cleanup PR adds a narrow validation tool, not a new runtime loader.
- Keep the two packaging workflows aligned with CI; they currently perform a subset of full gates.
- Internal package/storage identifiers need not match the store title. Browser metadata can be fixed
  in a separate presentation change.

## Future reusable HTML5/Yandex starter

Extract after this maintenance is accepted, into a new repository. Start with pinned toolchain,
static build/CI/size/ZIP gates, `PlatformService` + Web/Yandex adapters, early SDK bootstrap,
ready/gameplay state policy, separate pause authorities, shared interstitial policy and DOM cover,
validated storage adapters, locale/gesture-safe audio and their regression tests. Make game-specific
cooldown/ad boundaries explicit in the new game's policy rather than copying them as portal law.

Replace store keys and migrate only if importing existing saves intentionally. Remove Cozy Gallery
content, artwork, chapter/campaign rules and brand from the starter. Keep the puzzle domain as an
optional example, not a universal game framework. Copy source provenance only with assets whose
reuse rights are established. A tiny sample scene should demonstrate startup, Pause, ad outcomes,
locale/audio and navigation before adding a second game's mechanics.

## Final cleanup validation

Applied in PR B: see [cleanup results](audit/CLEANUP_RESULT.md) for exact final metrics, all
command outcomes and verification limitations. PR A itself changes documentation only.
