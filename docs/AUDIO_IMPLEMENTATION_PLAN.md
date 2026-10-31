> Historical design/implementation record. Some proposals and status statements are superseded.
> Current behavior: [ARCHITECTURE.md](ARCHITECTURE.md), [PLATFORM_INTEGRATION.md](PLATFORM_INTEGRATION.md), [TESTING.md](TESTING.md).

# Audio + Settings — implementation plan (2026-10-13)

Scope: Phaser 4.2.1 / TypeScript / Yandex Games; 480x800 authored portrait coordinates. Source: user-approved Google Sheet `sound-plan` and supplied `Sounds_confrim.zip`. **Do not reinterpret the sound-plan's rejected sounds as required.**

## Frozen product decisions

- Two independent controls: Music and Effects. 0% = mute. Autosave on every committed slider update, shared across scenes and restarts.
- **Pause**: show both sliders directly in the existing pause overlay; no Settings button, nested window, or additional navigation from Pause. Keep Resume, Restart, and Exit, and keep confirmation dialogs separate.
- Main Menu: provide a discoverable way to adjust the same settings without starting a level. Its UI must not displace the approved branding/layout. Decide precise presentation with a small visual review before implementation.
- No new sound just for Hint, artwork reveal, chapter switching or slider movement. Regular UI clicks cover these cases.
- Defaults for the first trial: music 40%, effects 65%; adjust after Android listening test.

## Asset manifest (supplied archive; not committed in foundation PR)

| Event / channel | Approved source filename | Duration (ffprobe) |
| --- | --- | ---: |
| UI activate | `click_003.ogg` | 0.010 s |
| First tile selected | `drop_003.ogg` | 0.191 s |
| Second tile selected | `drop_002.ogg` | 0.191 s |
| Successful pair | `drop_004.ogg` | 0.287 s |
| Unsuccessful pair | `bong_001.ogg` | 0.123 s |
| Completed level | `jingles_PIZZI10.ogg` | 0.797 s |
| Background music candidate A | `forget_me_not_in_f_major_looped.ogg` | 124.100 s |
| Background music candidate B | `porcelain_hours.mp3` | 157.362 s |

Six SFX files total ~43 KiB; the two music files together ~7.1 MiB. The 10 ms UI click should be auditioned on an Android speaker. A track named "looped" is not proof of an audible seamless transition: validate both loops by playback. Both music files are user selections; **the selection/rotation policy (one default or sequential alternation) is intentionally open**. Do not preload both tracks on the initial screen.

## Technical design

1. `AudioSettings.ts`: pure versioned 0..1 preferences, input validation, clamping and JSON parser/serializer.
2. `WebAudioSettingsStore.ts`: dedicated localStorage key, independent of campaign progress; blocked/private storage is nonfatal. One session-level settings controller will hold the latest values in memory even if persistence fails.
3. A single `AudioManager` owned by the game bootstrap, not by PlayScene. Music and effects buses independent, with per-channel gain and safe volume updates. Do not use scene-created `sound.stopAll()` on navigation.
4. `AudioAssetManifest` maps events to files and loads only required resources. Effects are small and may be loaded together; music must be lazy-loaded, one track at a time. Check final package size in CI when the binaries are added. Keep OGG for supplied SFX; use tested audio codec fallback only if target platforms require it.
5. Unlock audio after a user gesture and handle failed/rejected playback without crashing. On page `visibilitychange`, window focus loss, and (later) Yandex SDK advertising pauses, suspend appropriately. Restore only when unlocked, focused, non-ad-playing and allowed by settings. Avoid accidental double resume.
6. Sound event wiring: shared UI activation, tile select/tile mismatch/tile match, completed level. Do not double-play second-tile and success sound on the same match unless Android listening tests support it. Throttle frequently repeated UI/selection sounds. Play victory jingle at full level completion, not repeatedly for every short stage by default.
7. Implement slider pointer hit areas with minimum 48px touch target and Phaser-canvas coordinates. Slide gestures must capture/release safely, and not leak through to the board. Preserve reduced-motion, dimming, pause confirmation, and locale behavior.
8. RU/EN strings: "Музыка"/"Music" and "Эффекты"/"Effects", plus a discoverable Main Menu settings label if needed. Do not embed language-specific text in sound assets.

## Planned PR sequence

- **PR 1 — foundation**: pure audio settings model, resilient browser store, automated unit tests, this plan. No audio playback or visible settings controls yet.
- **PR 2 — sound engine**: manifest, manager and browser playback policy landed in PR #93. PR #94 wires game events and the startup lifecycle, and the user uploaded all eight binary assets to `public/assets/audio/`. Android listening tests remain necessary before release. Store provenance in `docs/AUDIO_LICENSES.md`.
- **PR 3 — UI controls**: two inline sliders in Pause and Main Menu access; persistent synchronized values, touch hit-testing, localization, scene transitions and Android verification.
- **PR 4 only if needed**: small mastering/compression or gapless-loop correction. Avoid cosmetic redesign.

## Required QA before audio release

- Node 22+ `typecheck`, `test`, `simulate`, `simulate:blockers`, `build`, `check:package-size`.
- Android WebGL: audio unlock, repeated fast tile taps, paused slider dragging, zero volume and restore, scene travel, application switch/tab visibility, device media volume, and advertising events when SDK is integrated.
- Test both locales. Settings must survive restart even if campaign progress is reset.
- Preserve exact category sounds in sheet and attribution/source evidence for every added file. No credit is required in-app for confirmed CC0 assets, but provenance still belongs in the repository.
