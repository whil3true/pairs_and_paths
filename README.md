# Pairs & Paths

Technical bootstrap for **Pairs & Paths: Connect the Tiles** / **Пары и пути: Соедини плитки**, a portrait-first HTML5 Onet puzzle intended for Yandex Games.

## Stack and status

- Phaser 4, TypeScript, HTML and CSS
- plain `tsc` compilation; no bundler or development server
- GitHub Actions CI and GitHub Pages deployment
- **Current state:** playable deterministic 100-level prototype campaign with static blockers,
  multi-stage levels, persistent web campaign progress, and a local symbol-first tile art prototype

Developer QA can jump directly into the campaign with `?debug=1&level=N` (and optional
one-based `&stage=N`). Tile symbols are current visual-difficulty prototype assets rather than
final production art.

Normal launches open the Main Menu. Continue enters Stage 1 of the first uncompleted level, while Levels offers chapter-paged access to completed and currently available levels. Developer QA can clear progress with `?debug=1&resetProgress=1` or set an exact fixture with `?debug=1&setProgress=N` (`N` from 0 through 100); reset wins when both are present. Campaign jumps remain isolated and never update saved progress.

## Commands

```sh
npm ci
npm run typecheck
npm test
npm run build
```

`npm run build` creates the self-contained static site in `dist/`. Open it through any static file host; production code does not require a server-side runtime.

The Pages preview is published from `dev` at `https://<owner>.github.io/pairs_and_paths/`.

## Documentation

- [Product scope](docs/PRODUCT_SPEC.md)
- [Game-rule invariants](docs/GAME_RULES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing strategy](docs/TESTING.md)
