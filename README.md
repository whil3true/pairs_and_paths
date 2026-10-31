# Pair Connect: Cozy Gallery

«Соедини пары: Уютная галерея» is a portrait HTML5 pair-connection puzzle for Yandex Games.
The active development branch is `dev`; `main` is not the current release source.

The game contains a deterministic 100-level campaign in ten chapters (124 boards including
pre-stages), static blockers, 100 collectible artworks, RU/EN language switching, local
progress and audio preferences, interstitial navigation and voluntary rewarded hints.
Approved V5.4.1 symbols intentionally live at `public/assets/symbols/v3/`.
Recent Android gameplay/ad fixes are the preservation baseline, not an invitation to redesign.
Release readiness still requires the provenance and real-device gates in [the audit](docs/REPOSITORY_AUDIT.md).

## Setup

Use Node.js 22 or later and npm. Phaser is pinned to **4.2.1**, TypeScript to **5.9.2**.

```sh
npm ci
npm run typecheck
npm test
npm run simulate -- --count 10000
npm run simulate:blockers
npm run build
npm run check:package-size
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Serve through HTTP; ES modules do not support `file://` startup.
There is no bundler, development server, backend or cloud-save implementation.
`tsc` emits native ES modules, `public/` supplies static files and the build copies Phaser
into `dist/vendor/phaser.js`. `/sdk.js` is provided by Yandex hosting, never packaged locally.
Only localhost/loopback and GitHub Pages hosts use the standalone web adapter with free QA hints.
Other hosts require Yandex SDK initialization and show retry UI if it fails.

## Commands and deployment

| Command | Purpose |
| --- | --- |
| `npm run clean` | Remove `dist/`, `.test-dist/` and `.simulation-dist/` |
| `npm run typecheck` | Strict TypeScript validation |
| `npm test` | Compile `.test-dist/`, run Node test suite |
| `npm run simulate -- --count 10000` | Seeded generation, validation, solve/replay simulation |
| `npm run simulate:blockers` | 150 blocker fixtures across three masks |
| `npm run analyze:progression` / `analyze:blockers` / `analyze:stages` | Campaign diagnostics; retain for content tuning |
| `npm run build` | Recreate deployable `dist/` |
| `npm run check:package-size` | Report distribution/artwork bytes; warn >80 MB, fail >100 MB (decimal) |

CI runs all six validation commands on pull requests. Pushes to `dev` deploy GitHub Pages
and create a Yandex draft ZIP artifact (root `index.html`, no outer project directory).
Feature branch PRs do not deploy or submit a game for moderation. Do not commit `dist/`,
`node_modules/`, `.test-dist/` or `.simulation-dist/`.

## Documentation

- [Architecture and dependency map](docs/ARCHITECTURE.md)
- [Project conventions](docs/PROJECT_CONVENTIONS.md)
- [Platform, advertising and lifecycle](docs/PLATFORM_INTEGRATION.md)
- [Tests and release/device QA](docs/TESTING.md)
- [Game-rule invariants](docs/GAME_RULES.md)
- [Current tile visuals](docs/TILE_VISUALS.md)
- [Repository audit, cleanup evidence and technical debt](docs/REPOSITORY_AUDIT.md)
- [Audio provenance and unresolved verification](docs/AUDIO_LICENSES.md)
- Content rationale: [progression](docs/PROGRESSION_REPORT.md), [blockers](docs/BLOCKER_PROGRESSION.md), [stages](docs/STAGE_PROGRESSION.md)
