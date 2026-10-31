# Testing and release QA

## Required automated gate

Use Node 22+, `npm ci`, then run these sequentially after each coherent cleanup batch:

```sh
npm run typecheck
npm test
npm run simulate -- --count 10000
npm run simulate:blockers
npm run build
npm run check:package-size
```

`npm test` compiles fresh `.test-dist` then runs Node tests. It covers domain/path rules, campaign
and stage snapshots, saves/navigation, visual geometry/catalogs, audio behavior/wiring, localization,
SDK bootstrap/input/gameplay state, interstitial callback timing/cover and rewarded hint regressions.
Some scene tests assert source wiring; they are not a real Phaser, Android or SDK execution.
`simulate` samples 10,000 seeded generation/validation/solve/replay cases; it is not random GUI QA.
`simulate:blockers` runs 150 fixtures and checks no blocked occupancy/transit and complete replay.
Simulators share `.simulation-dist` and must not run concurrently.

The audit records exact baseline/final results and limitations in `REPOSITORY_AUDIT.md`.
A passing build is not moderation approval or proof of Android playback/SDK callback delivery.

## Production startup and release safety

Production startup always opens Main Menu. Query parameters such as `debug=1`,
`setProgress`, `resetProgress`, `level`, `symbols`, `locale`, and `renderScale` do
not enable developer bypasses. They cannot change saved campaign progress or
expose a diagnostic gallery. A saved language choice takes precedence over
the platform language, and the desktop 2× density remains the same.

Debug fixtures were deliberately removed from production source in the
release-hardening change. Use isolated unit tests and a private development
environment for synthetic progress fixtures; never mutate actual player saves.

## Campaign, navigation and persistence

- Fresh normal launch → Menu → Level 1 Stage 1. Continue uses first uncompleted level; replay of a
  completed level never reduces progress. Corrupt/unknown-version/throwing storage remains playable.
- Test Levels 1, 21, 24, 30, 80, 99 and 100; every pre-stage promotes without saving, final saves
  before Reward/Complete. Restart/Replay reset Stage 1; Next advances once; terminal campaign restart
  requests Level 1, never 101. Unlock counts and Gallery agree with saved progress after reload.
- Paths may exceed two turns; no outside-border route, falling tiles or shuffle. Verify blockers,
  arbitrary-length route animation, bad-pair feedback and transition input locks.
- Pause preserves board/selection. Resume keeps stage; Restart/Exit require confirmation; Cancel
  returns to Pause. Modal controls never activate background tiles. No overlay survives scene exit.
- Menu → Levels chapter pages → playable level; Menu → Gallery → unlocked Full View → Gallery → Menu.
  Full View rejects locked art. First uncached artwork load, Replay cache reuse and loading failures
  must not hang navigation or leak loader listeners. Full-art LRU releases inactive entries.

## Rendering, locale and audio

Test real Android touch (including the accepted POCO environment) and desktop, tall/wide resize,
browser chrome changes, safe areas, render densities 1/2 and reduced motion. Authored board/UI stays
480×800; 56 px tiles/64 px pitch remain aligned with hit zones. Inspect every catalog symbol via
contact sheet, all ten chapter banners, all 100 artwork full/thumb pairs, clipped board corners,
Reward and Gallery. No placeholder/missing texture, crop/stretch, black square or old-art fallback.

Switch RU/EN in settings without reload, traverse scenes and restart; manual choice wins over SDK
language. On fresh Yandex storage, RU portal → RU, other languages → EN. Check text overflow and
font availability in both alphabets. Keep every font license.

Audio: first tap starts/unlocks correctly, UI/tile SFX has no new delay, both tracks transition/loop,
Music/Effects sliders in Settings and Pause persist independently, zero volume stays silent.
Background/foreground and ads pause/resume appropriately with retained music behavior and no stale
Android notification/media-session ownership. Compare Next with cooldown active and real ad shown;
separate texture-load stalls from audio or SDK behavior before changing code.

## Real Yandex draft regression matrix

Run RU/EN and record device, SHA, callback order, result and console timestamps.

| Scenario | Required observation |
| --- | --- |
| Startup automatic ad / delayed SDK startup | Non-Play input guarded; first interactive render sends ready once; gameplay marker starts only when running |
| Before 90 s, then after 90 s | No early interstitial; only explicit eligible navigation requests one; no blank cover on tap/cooldown |
| Complete Next/Replay/Menu | Reward remains until choice; close commits that destination once without another tap |
| Confirmed Pause Restart/Exit, Gallery Menu | Same shared cooldown; Cancel/Resume/Full View Back never request ad |
| Resume before close; close before delayed resume | Navigation promise settles at close; SDK input freeze lasts until actual resume; no synthetic resume |
| `onClose(false)`, error/throw, missing callback | Navigation continues once; no reward assumption; watchdog logs identify fallback |
| Rapid double tap | One pending request/action; no duplicate transition |
| Long real ad | Cover begins only at open; no old screen flash after close; destination releases after render |
| SDK pause + browser background in both orders | Releasing one cannot unfreeze the other; browser Continue remains required |
| Gameplay/Pause/Reward/Complete/Menu/loading | SDK gameplay marker active only for playable running board |

SDK and navigation implementation/timeout values are centralized in `PLATFORM_INTEGRATION.md`.
The 15 s callback-envelope failure was observed on the portal despite earlier automated success;
real draft evidence remains necessary after any adapter change.

## Rewarded hints and browser Pause

- Idle Hint opens clear voluntary Watch/Cancel. Cancel grants nothing and restores play. Yandex
  grants only after `onRewarded`; early close/no-fill/error without reward shows unavailable.
  Web free hints are QA behavior, not production fallback.
- One pending request only. Active hint suppresses further videos but keeps normal tile input.
  Both inset gold indicators remain after unrelated pair removal and selection changes. Removing
  either marked tile clears the markers; stage/reset/replay/exit clears old state. No outside-tile
  ring overlaps a neighbor; teal selection/red error/pressed feedback remain independent.
- Background with confirmation or unavailable dialog: dialog is dismissed, browser Pause owns the
  screen. During video, test result before/after SDK resume and foreground; defer result until
  explicit Continue and Pause dismissal. No Hint dialog over Pause and no extra video.
- Invalidate scene/stage while request is pending; late reward cannot alter a replacement board.
  Hint indicators are board-local and are not expected to survive reload.

## Distribution verification

`check:package-size` reports uncompressed decimal bytes (warning >80,000,000; failure >100,000,000).
For upload, ZIP **contents of dist**, with one root `index.html`, ASCII/no-whitespace member names,
no `dist/` prefix, no corruption and ≤100,000,000 uncompressed bytes. The Yandex workflow checks
these properties. Compare static imports, HTML/CSS references and expanded catalog paths with
actual files; do not use direct-import absence alone as deletion evidence.

GitHub Actions CI is broader than the Pages/Yandex packaging jobs: packaging alone does not run
the 10k/blocker simulations. Require full CI and explicit device gates before release. Never claim
fresh Android/Yandex testing when only local automated checks have run.

`build` also runs `check:assets`; `npm run check:assets` can repeat that gate after a build. It
expands all 100 full/thumb paths, all 30 symbol paths, banner/brand/HUD/audio catalogs and CSS
fonts; verifies 261 production/license hashes and identical source/dist copies; resolves local
JS/HTML/CSS dependencies and rejects unexplained public/dist files. Deliberate snapshot changes
require explicit approved-content review, not a blanket regeneration.
