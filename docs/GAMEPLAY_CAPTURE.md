# Cozy Gallery: automated four-video gameplay capture

This optional GitHub Actions workflow records real, deployed GitHub Pages
gameplay in four variants:

| Variant | Source capture | Final MP4 |
| --- | --- | --- |
| Mobile RU | 480×854 | 1080×1920 |
| Mobile EN | 480×854 | 1080×1920 |
| Desktop RU | 960×540 | 1920×1080 |
| Desktop EN | 960×540 | 1920×1080 |

All recordings use actual Playwright taps/clicks, the shipped deterministic
solution witness, two genuine levels and the real reward sequence. No synthetic
game frames, changes to the game/SDK, or added soundtrack.

## Localization QA

The recording uses a fresh, isolated browser context for each run.
A capture-only initialization script saves the requested UI locale using
`pairs-and-paths:ui-locale`, which is the game's existing preference key.
After startup we read the shipped `UiLocaleRuntime` module to verify that
the *actual running game's* active language matches the expected language.
The same locale is used for Chromium UI and `notranslate` injection so the
browser never overlays the built-in Google Translate UI.

## Output, video quality, audio

Each job records the full X11 desktop in fullscreen Chromium with Openbox,
FFmpeg `-draw_mouse 0`, real PulseAudio music and sound effects, and
no editing or inserted frames. Actual capture resolution is kept low for
software WebGL performance; offline Lanczos upscale produces the requested
pixel dimensions. Upscaling does **not** add real source image detail.

The browser viewport is compared with an X11 screenshot both overall and
for the top 90 pixels to detect native browser chrome. A report measures
the actual output FPS, source rAF pacing, completed levels, full-screen
geometry, and audible audio.

A matrix job creates each video separately. The `deliverables` job combines
the four *final* MP4 files and four JSON QA reports into one GitHub Actions
artifact named `cozy-gallery-four-gameplay-videos`. Individual job artifacts
also contain the smaller source captures and diagnostic screenshots.

If any variant fails, the combined artifact is not published. The individual
artifacts provide failure diagnostics. Visual playback review remains required
to catch mid-recording overlays and repeated software-rendered frames.

All artifacts have seven-day retention; the workflow is not auto-merged.
