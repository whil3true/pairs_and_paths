# Pairs & Paths

Technical bootstrap for **Pairs & Paths: Connect the Tiles** / **Пары и пути: Соедини плитки**, a portrait-first HTML5 Onet puzzle intended for Yandex Games.

## Stack and status

- Phaser 4, TypeScript, HTML and CSS
- plain `tsc` compilation; no bundler or development server
- GitHub Actions CI and GitHub Pages deployment
- **Current state:** infrastructure smoke test only; gameplay is not implemented

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
