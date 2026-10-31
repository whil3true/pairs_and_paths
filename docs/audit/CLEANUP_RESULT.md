# Cleanup results (2026-10-31)

Baseline: `c5e09f7a54f60fa6ee2822dd6d781afd3fcb570b`.
Documentation: [draft PR #129](https://github.com/whil3true/pairs_and_paths/pull/129),
head `4981b853cb252afff773f47988d8ab9ace4f1c99` (GitHub Actions CI success).
Cleanup is stacked on that documentation branch; merge documentation first and then retarget
cleanup to dev. Neither PR is automatically merged. Local HTTPS push lacked credentials; the
connected GitHub API published the exact reviewed file contents instead. No credential values
were read or copied.

## Applied scope

- Deleted D1–D6: 126 files / 1,665,004 bytes. Exact original paths, hashes, group evidence and
  decisions remain in [baseline inventory](baseline-inventory.csv) and [audit](../REPOSITORY_AUDIT.md).
- Removed old root/v2 symbols, both copies of the superseded 12-symbol pilot and its manifest,
  prototype SVGs, unused stat-chip export and populated-directory placeholders.
- Moved four labeled design/history documents into `docs/history/` with current-architecture links;
  updated the active stage-report link. The pilot's old bytes remain recoverable from Git.
- Replaced obsolete pilot-copy hash verification with all 30 active V5.4.1 runtime symbol hashes;
  updated the old HUD export test to its actual four loaded textures. Test count remains 227.
- Added `check:assets` to the build: actual dynamic catalogs and CSS font paths, 261 retained
  production/license hashes, identical source/dist copies, exact public/dist inventory and local
  module/HTML/CSS references. Any unexpected public export now fails the build instead of shipping.
- Kept the recursive public copy and existing unminified Phaser selection; no new runtime loader,
  bundler, dependency, abstraction or game behavior was introduced. All 76 `src/` files are
  byte-identical to baseline. Package lock and all existing CI/deployment workflows are unchanged.

## Before / after metrics

Metric definition: tracked logical file sizes, excluding `.git`, dependencies and generated output.
The final repository figure includes new documentation, inventory/hash evidence and validation tool.
Historical Git object storage does not shrink when files are deleted; history was not rewritten.

| Metric | Before | After |
| --- | ---: | ---: |
| Active tracked files | 522 | 405 |
| Active tracked bytes | 33,131,206 | 31,588,216 |
| `public` files | 347 | 264 |
| `public` bytes | 32,179,418 | 30,693,518 |
| `dist` files | 424 | 341 |
| `dist` uncompressed bytes | 41,260,747 | 39,774,847 |
| Comparable local DEFLATE ZIP bytes | 33,727,540 | 32,251,536 |
| All artwork full + thumbs bytes | 21,975,864 | 21,975,864 |

Distribution reduction: **1,485,900 bytes (3.60%)**, with every remaining distributed file
byte-identical to its baseline counterpart (no added release members). The repository's larger
logical reduction also includes source-only prototypes; added evidence offsets part of that saving.
ZIP measurements use the same Python zipfile DEFLATE method, sorted dist files, and environment.
These are local comparison archives, not separately uploaded release artifacts.

## Automated evidence

[Machine-readable validation results](validation-results.json) records command exits, durations,
simulation outcomes and metrics. The required checks were executed once on the unchanged baseline
and once on the single coherent cleanup batch:

| Required command | Before | After |
| --- | --- | --- |
| `npm run typecheck` | PASS | PASS |
| `npm test` | 227 PASS, 0 failures/skips | 227 PASS, 0 failures/skips |
| `npm run simulate -- --count 10000` | 10,000 PASS | 10,000 PASS, 0 failures |
| `npm run simulate:blockers` | 150 PASS | 150 PASS, 0 violations |
| `npm run build` | PASS | PASS, including check:assets |
| `npm run check:package-size` | PASS | PASS, 39,774,847 bytes |

Final static asset/reference gate: PASS, 261 hashes plus expanded paths/copies and 341-file release inventory.
Validator fault probes: PASS: corrupted deployed cup, missing JS module, unclassified public export and unexpected dist member were all rejected (expected nonzero exits); all temporary probes restored.
Local ZIP: PASS: root index, ASCII/no-whitespace names, CRC and uncompressed limit.
Documentation local links: PASS.

Baseline/final simulator results have zero generation, solver, replay, adjacency or blocker
violations. All 30 symbols, 200 WebPs, ten banners, two logos, four HUD textures, gear, eight audio
files, four fonts and two licenses retain their audited SHA-256; all 76 source files are unchanged.

## Extra diagnostics and limits

The optional `tsc --noEmit --noUnusedLocals --noUnusedParameters` diagnostic is **not clean** and
is not enabled in tsconfig/CI. It reports four existing findings, retained for a separate scope:

- `HtmlAudioOutput.ts`: write-only `musicPlayPending`.
- `CompactGameplayHud.ts`: unused `renderScale` constructor property.
- `UiPolicy.ts`: unused `BORDERS` import.
- `main.ts`: unused `MAX_LOGICAL_VIEWPORT_HEIGHT` import.

This is not a failure of the required typecheck. No compiler option was weakened or dependency
updated to hide errors. The narrow new asset validator is not a general JavaScript static analyzer;
new runtime asset families need an explicit catalog/check update.

**Not executed here:** fresh Android touch/codec/visual/audio QA, real Yandex draft ads/moderation,
physical-device pause/resume timing or a browser GUI smoke. Prior accepted Android behavior was
preserved through unchanged source and production bytes plus headless tests, not re-certified by
device execution. Require the TESTING.md device matrix before release. This maintenance does not
establish moderation approval. Existing six-SFX provenance and music evidence gates remain open;
see AUDIO_LICENSES.md. Display-policy helper/live-config discrepancy and dormant fields are
optional follow-ups, not changes silently included in cleanup.
