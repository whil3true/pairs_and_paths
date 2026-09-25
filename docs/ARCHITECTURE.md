# Architecture

## Boundaries

- `src/domain/` will own framework-independent board, pathfinding, generation, and solver logic. Phaser must not enter this layer.
- `src/game/` owns Phaser scenes and rendering. The current scene is only an infrastructure smoke test.
- `src/platform/` defines the deliberately small platform boundary. `WebPlatform` currently provides identity and locale; persistence will be added only when real save requirements exist. A future Yandex implementation will live behind the same boundary.
- `src/ui/` is reserved for concrete UI when it exists; no placeholder abstraction is introduced now.

## Production artifact

`npm run build` compiles ES modules with `tsc`, copies public files, and copies Phaser's browser distribution from the installed package into `dist/vendor/`. All document paths are relative, so the same `dist/` works at a GitHub project-site subpath and at the root of a Yandex Games ZIP.

Dependencies stay minimal: Phaser is the only browser runtime dependency and TypeScript is the only development dependency. No bundler or development server is used.

CI validates pull requests and relevant pushes. The Pages workflow builds and deploys only the `dev` branch.
