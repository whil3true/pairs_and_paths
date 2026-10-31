# Project conventions

These are observed project patterns and maintenance rules, not a request to add abstraction.

## Code and ownership

- Keep pure rules in `src/domain`; no Phaser/DOM/platform imports there. Campaign tables belong in
  `LevelSequence`, presentation policies in `src/game`, SDK adapters in `src/platform`, audio in `src/audio`.
  Preserve the existing progress-to-campaign constant dependency until a separately justified change.
- TypeScript is strict ES2022/NodeNext with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
  and `noEmitOnError`. Relative TS imports use emitted `.js` extensions. Phaser is a browser global
  from the vendor script; do not introduce a second bundled instance.
- Modules/types/classes use PascalCase; functions/fields camelCase; immutable shared constants
  UPPER_SNAKE_CASE. Asset filenames use existing lowercase hyphen/underscore conventions exactly.
  Prefer small pure policy functions when a real scene decision needs testing; do not add managers
  merely to split files. Preserve current scene constructor injection and explicit ownership.
- A scene must release its own listeners/timers/tweens/load callbacks and full-art leases on shutdown.
  Shared audio, platform, interstitial controller and game-global atlas outlive scene navigation.
  Guard stale async callbacks with existing scene/request-token ownership checks.
- Keep input transition locks, SDK pause, browser pause, manual modals and hint availability distinct.
  Follow `PLATFORM_INTEGRATION.md` before changing ad callbacks or lifecycle order.

## Content and assets

- `public/` is the deployed static root. Do not put pilots, source exports, contact sheets or design
  notes there. Build currently copies it recursively. Authoring material that is still useful belongs
  outside `public`; genuinely redundant exports can be recovered from Git history.
- V5.4.1 symbols use `public/assets/symbols/v3/`, 256² RGBA canvases displayed at 56 logical px.
  Path and texture-key `v3` is an active compatibility name. Never sort/reorder `TILE_SYMBOLS`.
- Campaign art is 100 paired full/thumb WebPs with three-digit IDs, 1024² / 256² respectively.
  Keep all chapter banners, approved UI, audio and attribution/license files. Dynamic path templates,
  CSS font URLs, preloader catalogs, tests and debug routes all count as references.
- Use `VisualTokens`, `BoardLayout` and scene policy constants; retain 480×800 authored geometry,
  render-scale policy and safe-area behavior. Do not fix presentation by changing domain coordinates.
- Never rename persistence keys to match the new product name. A schema/key change needs explicit
  migration and compatibility tests. Locale changes must remain RU/EN switches without page reload.
- Audio provenance uncertainty must remain explicit in `AUDIO_LICENSES.md`; do not substitute a
  plausible source for file-level evidence.

## Tests, docs and changes

Node `.test.mjs` files run against fresh `.test-dist` output; some scene wiring tests inspect source
text and are not browser execution. Simulators compile separately into `.simulation-dist`.
Run the six checks in `TESTING.md` after each coherent cleanup batch. Avoid concurrent simulation
commands: they share and delete `.simulation-dist`. `build` deletes `dist`; do not serve/measure it
while a build is in progress.

Keep documents scoped: README = entry/commands; ARCHITECTURE = owners/dependencies;
PLATFORM_INTEGRATION = SDK/ad/lifecycle; TESTING = verification; TILE_VISUALS = active mapping;
REPOSITORY_AUDIT = evidence/decisions/debt. Historical specs must be labeled and must not override
current source. Update affected links when moving documents.

Work on `feature/**` branches based on an explicitly recorded `dev` SHA. Use meaningful commits,
draft PRs, no force pushes to shared branches, no automatic merge and no direct `dev`/`main` changes.
Before deletion record exact paths, hashes/bytes where relevant, static and dynamic consumers,
test dependencies, and build inclusion. Ambiguous evidence means REVIEW and retention.

## Production asset snapshot

`docs/audit/production-assets.sha256.json` pins the retained approved content. Build invokes
`check:assets` after compilation/copy, expands the actual catalogs and CSS font paths, verifies
source/dist byte equality and hashes, resolves local module/HTML/CSS references and rejects
unclassified public files. It is a narrow validator, not a runtime loader or general reachability
analysis. For an intentionally approved asset replacement, update its hash in the same reviewed
commit; never refresh every hash just to make an unexpected difference pass. New runtime families
must be represented in the validator; development exports belong outside public.
