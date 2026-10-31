# Yandex Games integration and lifecycle

Source of truth: `createPlatform`, `YandexSdkTypes`, `YandexPlatform`, `InterstitialController`,
`SdkInputGuard`, `GameReady`, `NavigationCover`, `GameplayStatePolicy` and `PlayScene`.
This document records the local implementation and regression history, not a fresh SDK-policy audit.

## Initialization and lifecycle authorities

`main.ts` awaits platform creation before constructing Phaser/audio. Only localhost, loopback and
GitHub Pages are standalone; other hosts require `/sdk.js` → `YaGames.init()`. Load and init
watchdogs are 7 s / 12 s. Failure reaches the bilingual Retry UI; production must not silently
fall back to free web hints. SDK listeners are registered before game construction and expose
current `isPaused` to late subscribers. `LoadingAPI.ready()` is sent once after an interactive
Main Menu/Play screen is rendered, not merely after script download.

`GameplayAPI.start/stop` is idempotent and controlled by `isGameplayActive`: active scene, ready UI,
`gameplay` presentation, and no SDK/browser/manual/modal/ad-pending pause. Loading, Reward, Complete,
menu and confirmations are inactive. Initial gameplay marking must occur after the state becomes
running; marking before that caused the inactive gamepad regression fixed in #120.

| Authority | Controls | Release condition |
| --- | --- | --- |
| SDK `game_api_pause/resume` | Play input saved/restored, scene clock/tweens, shared audio ad flag; other scenes via `SdkInputGuard` | Real SDK resume; never forge it on ad close |
| Browser hidden/pagehide | Play clock/tweens, input lock, static Pause UI; audio independently observes visibility/focus | Foreground **and explicit Continue** for gameplay |
| Manual Pause/confirmation | Modal interaction and inactive gameplay marker | Existing Resume/Cancel/confirmation flow |
| Ad completion callback | Finish chosen navigation or rewarded result | Terminal SDK ad callback / bounded watchdog |

Play's freeze condition is `browserPauseRequired || sdkPaused`. Clearing one reason cannot clear
the other. `SdkInputGuard` excludes Play, snapshots original input enablement for other scenes,
and synchronizes newly active scenes on post-render. Browser gameplay lifecycle intentionally
ignores ordinary window blur; browser audio lifecycle additionally tracks focus and gesture unlock.
Do not merge these two policies into one boolean.

## Interstitials and navigation

One `InterstitialController` instance is shared by Play and Gallery. First eligibility is 90 s after
controller construction; a successful show resets that cooldown at completion. Failed/no-fill
attempts have a 15 s retry backoff. Concurrent attempts are suppressed. No timer launches ads.

| Explicit player action | Interstitial eligibility |
| --- | --- |
| Complete → Next / Replay / Menu (including campaign restart) | Shared controller |
| Pause → confirmed Restart / Exit | Shared controller |
| Artwork Gallery → Main Menu | Same shared controller |
| Reward Continue, stage promotion, Pause Resume, Cancel, Full View → Gallery | No request |

The API envelope is exactly:

```ts
sdk.adv.showFullscreenAdv({ callbacks: { onOpen, onClose, onError } });
```

The old direct-callback form failed to deliver close in the real draft, causing a 15 s apparent
input freeze/navigation delay (#122–#125; the decisive envelope correction is #125). Current
`onClose(true/false)` and `onError` complete the ad promise immediately and exactly once. A 15 s
no-callback watchdog changes to 120 s after `onOpen`; exceptions also settle false. Absent SDK
advertising settles false. Navigation continues on all outcomes. **Do not await `game_api_resume`
inside that promise**: this previously trapped an already chosen action after visible close.
Resume and close may arrive in either order; they have different responsibilities.

The selected action is captured before the request and executes once after completion, provided
the owning scene is still active. Do not return to Complete and demand another tap. Input/timers
can legitimately remain SDK-frozen in the destination until a genuine resume.

`NavigationCover` is a DOM cover inside `#game`, not a Phaser overlay. Show it only on real
`onOpen`, never on button tap, cooldown or no-fill. Keep it across close and navigation so the old
screen does not flash. The destination releases it after UI/board construction and `POST_RENDER`.
Arm the 10 s cover failsafe only after navigation is committed; starting it during a long ad causes
a flash (#126). Cover ownership is separate from SDK input locks; hiding it must not force resume.

## Rewarded hints

Only Yandex requests voluntary video after localized Watch/Cancel confirmation; web QA grants a
free hint. Eligibility requires idle live gameplay, an existing legal move, no modal/transition/
complete/pause/pending request and no unresolved active hint. The provider call also uses nested
`callbacks`. Only `onRewarded` sets the grant flag. Close/error/120 s watchdog settles the accumulated
flag; close or error without reward never grants a hint. A late callback after settlement is ignored.

Play's request token and active-scene checks discard stale results after board/scene changes.
If SDK or browser pause still applies, success/failure is deferred. Foreground browser Pause owns
the screen: backgrounding dismisses a Hint confirmation/unavailable dialog, and deferred results
are flushed only after Pause is fully dismissed and all freeze reasons clear (#128). Never stack
a returned Hint modal above the browser Pause.

`getHintMove` computes the first deterministic legal move on the current board; it does not use a
stale generator witness. Its two gold inset indicators remain until either marked tile is removed
or the board is disposed. Removing an unrelated pair must preserve markers and active eligibility
lock (#127–#128). Markers do not freeze normal tile interaction; selected/error/tap states remain
independent. There is no durable hint inventory and no saved hint state.

## Audio and failure diagnosis

Audio has one scene-independent manager. SDK pause/resume sets the ad flag; browser visibility,
focus, pagehide/pageshow and same-tap pointerdown/up retry control its other gates. Preserve gesture
capture before Phaser handlers, low-latency SFX path, music position/loop behavior and media-session
release. Settings persist independently of progress.

Use `[Cozy SDK]` logs to distinguish bootstrap, cooldown, request, real open, close,
`interstitial_navigation_unblocked`, SDK pause/resume, reward granted and watchdogs. A 15 s delay
suggests callback delivery/envelope failure; a committed destination awaiting resume is a lifecycle
issue; a stale visible overlay is cover/scene ownership; stalled next-art loading is not proof of an
audio or ad bug. Capture callback order and scene state before changing code. Automated coverage
and required real-draft/Android scenarios are in `TESTING.md`.
