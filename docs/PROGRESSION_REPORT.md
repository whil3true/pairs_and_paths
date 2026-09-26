# Provisional progression calibration

## Method

Run recorded with `npm run analyze:progression -- --samples 300`. Each of the 33 profiles used seeds 0..299 (9,900 generated boards total). The headless tool calls the production generator, validator, deterministic solver, and `measureSolution(board, solver.moves)`; it does not use Phaser or the generator witness as its gameplay proxy. All profiles had **300/300 generation successes, 300/300 solver successes, and zero adjacent matching pairs**. The run took 33.482 seconds on the development container.

The compact table columns are: profile; area/occupied/empty cells; average initial legal moves and sampled range; percentage with exactly one initial move; average legal moves during deterministic solver play; forced-step ratio; average turns; maximum turns; 3+-turn route rate; and average path length.

| Profile | Cells O/E | Initial avg (range) | Initial=1 | Play moves | Forced | Turns | Max | 3+ rate | Length |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 4×4/4 | 16 8/8 | 2.60 (1–4) | 8.0% | 2.05 | .284 | .998 | 4 | .041 | 3.26 |
| 4×4/5 | 16 10/6 | 2.38 (1–5) | 15.0% | 2.07 | .273 | 1.047 | 5 | .050 | 3.25 |
| 4×4/6 | 16 12/4 | 1.95 (1–4) | 30.0% | 2.00 | .299 | 1.063 | 6 | .051 | 3.22 |
| 4×5/5 | 20 10/10 | 3.07 (1–5) | 3.3% | 2.41 | .218 | 1.071 | 5 | .051 | 3.61 |
| 4×5/6 | 20 12/8 | 2.80 (1–5) | 7.0% | 2.41 | .203 | 1.123 | 6 | .064 | 3.59 |
| 4×5/7 | 20 14/6 | 2.34 (1–5) | 18.3% | 2.31 | .217 | 1.190 | 7 | .082 | 3.68 |
| 4×5/8 | 20 16/4 | 1.99 (1–4) | 28.7% | 2.19 | .247 | 1.155 | 5 | .072 | 3.56 |
| 5×5/7 | 25 14/11 | 3.33 (1–6) | 6.3% | 2.87 | .165 | 1.173 | 6 | .078 | 3.90 |
| 5×5/8 | 25 16/9 | 2.97 (1–7) | 8.3% | 2.79 | .152 | 1.256 | 7 | .100 | 4.01 |
| 5×5/9 | 25 18/7 | 2.48 (1–5) | 12.3% | 2.66 | .158 | 1.252 | 6 | .091 | 3.98 |
| 5×5/10 | 25 20/5 | 2.34 (1–5) | 17.3% | 2.63 | .169 | 1.242 | 6 | .091 | 3.90 |
| 5×6/9 | 30 18/12 | 3.46 (1–7) | 3.7% | 3.24 | .123 | 1.336 | 6 | .122 | 4.38 |
| 5×6/10 | 30 20/10 | 3.05 (1–6) | 7.3% | 3.15 | .124 | 1.335 | 6 | .123 | 4.37 |
| 5×6/11 | 30 22/8 | 3.02 (1–6) | 6.3% | 3.16 | .115 | 1.338 | 7 | .127 | 4.25 |
| 5×6/12 | 30 24/6 | 2.57 (1–5) | 11.7% | 2.94 | .127 | 1.311 | 6 | .106 | 4.25 |
| 5×7/11 | 35 22/13 | 3.70 (1–7) | 3.7% | 3.62 | .101 | 1.376 | 7 | .134 | 4.63 |
| 5×7/12 | 35 24/11 | 3.42 (1–7) | 3.3% | 3.54 | .098 | 1.431 | 7 | .152 | 4.67 |
| 5×7/13 | 35 26/9 | 3.08 (1–7) | 6.0% | 3.40 | .100 | 1.424 | 7 | .149 | 4.64 |
| 5×7/14 | 35 28/7 | 2.76 (1–6) | 9.3% | 3.24 | .113 | 1.402 | 8 | .137 | 4.60 |
| 6×6/12 | 36 24/12 | 3.56 (1–7) | 1.7% | 3.66 | .092 | 1.417 | 8 | .141 | 4.72 |
| 6×6/13 | 36 26/10 | 3.24 (1–6) | 5.3% | 3.57 | .096 | 1.457 | 7 | .157 | 4.75 |
| 6×6/14 | 36 28/8 | 3.05 (1–6) | 8.7% | 3.46 | .098 | 1.427 | 7 | .146 | 4.60 |
| 6×6/15 | 36 30/6 | 2.72 (1–6) | 11.0% | 3.29 | .110 | 1.388 | 7 | .137 | 4.52 |
| 6×7/14 | 42 28/14 | 3.86 (1–8) | 2.0% | 4.16 | .080 | 1.534 | 9 | .172 | 5.06 |
| 6×7/15 | 42 30/12 | 3.81 (1–8) | 3.3% | 4.05 | .079 | 1.516 | 9 | .167 | 5.02 |
| 6×7/16 | 42 32/10 | 3.44 (1–7) | 3.7% | 3.90 | .081 | 1.502 | 7 | .166 | 5.01 |
| 6×7/17 | 42 34/8 | 3.23 (1–8) | 3.7% | 3.72 | .090 | 1.519 | 8 | .174 | 4.94 |
| 6×7/18 | 42 36/6 | 2.84 (1–6) | 6.3% | 3.53 | .096 | 1.493 | 8 | .164 | 4.89 |
| 6×8/18 | 48 36/12 | 3.80 (1–7) | 3.0% | 4.29 | .068 | 1.600 | 8 | .198 | 5.35 |
| 6×8/19 | 48 38/10 | 3.55 (1–8) | 2.7% | 4.21 | .069 | 1.611 | 8 | .198 | 5.38 |
| 6×8/20 | 48 40/8 | 3.23 (1–7) | 5.0% | 4.12 | .071 | 1.589 | 9 | .194 | 5.29 |
| 6×8/21 | 48 42/6 | 2.88 (1–6) | 8.3% | 3.82 | .082 | 1.617 | 10 | .196 | 5.32 |
| 6×8/22 | 48 44/4 | 2.43 (1–5) | 13.3% | 3.63 | .096 | 1.562 | 9 | .184 | 5.19 |

## Task 5 original selected curve (historical calibration)

| Chapter | Profile | Why selected |
|---:|---:|---|
| 1 | 4×4/4 | Smallest, half-empty introduction with short routes. |
| 2 | 4×5/5 | More space and choices while remaining half empty. |
| 3 | 5×5/7 | First wider board; route length rises without high density. |
| 4 | 5×6/9 | Longer geometry and 40% free cells. |
| 5 | 5×6/11 | Same dimensions teach increased density before another size change. |
| 6 | 5×7/12 | Adds vertical geometry while retaining 11 empty cells. |
| 7 | 6×6/13 | Introduces maximum width with moderate density. |
| 8 | 6×7/15 | Increases area, route length, and pair workload. |
| 9 | 6×8/18 | Introduces the full board with 12 empty cells. |
| 10 | 6×8/22 | Four empty cells make the finale the densest viable sampled profile. |

All omitted profiles also generated and solved successfully. They were rejected for this provisional curve, not declared invalid: denser small-board variants had substantially more one-move starts (up to 30%), intermediate variants added little distinction, and using every density would delay meaningful dimension growth. The selected stages keep area and pair count non-decreasing and deliberately alternate dimension growth with density growth.

No campaign seed overrides were needed. Direct derived seeds give Levels 1..20 at least two initial legal moves; Level 1 has two. Level 1 retains seed 0 but changes from the prototype 6×8/20 profile to 4×4/4.

## Task 5 original campaign aggregates (historical calibration)

These values cover the exact ten deterministic levels in each chapter and use solver moves, not generator witnesses.

| Ch. | Profile | Pairs | Initial avg (min) | Play moves | Forced | Turns | 3+ rate | Length |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 4×4/4 | 4 | 2.50 (2) | 2.02 | .250 | 1.025 | .025 | 3.13 |
| 2 | 4×5/5 | 5 | 3.40 (2) | 2.44 | .200 | .980 | .060 | 3.34 |
| 3 | 5×5/7 | 7 | 3.00 (1) | 2.84 | .186 | 1.114 | .071 | 3.91 |
| 4 | 5×6/9 | 9 | 3.90 (2) | 3.49 | .111 | 1.333 | .089 | 4.38 |
| 5 | 5×6/11 | 11 | 2.60 (1) | 2.97 | .136 | 1.355 | .127 | 4.37 |
| 6 | 5×7/12 | 12 | 3.90 (3) | 3.73 | .083 | 1.283 | .075 | 4.33 |
| 7 | 6×6/13 | 13 | 3.40 (2) | 3.46 | .108 | 1.377 | .115 | 4.42 |
| 8 | 6×7/15 | 15 | 3.60 (2) | 4.26 | .073 | 1.360 | .107 | 4.77 |
| 9 | 6×8/18 | 18 | 4.50 (2) | 4.94 | .056 | 1.428 | .139 | 4.89 |
| 10 | 6×8/22 | 22 | 2.70 (2) | 3.30 | .100 | 1.595 | .218 | 5.36 |

All 100 campaign boards validate, solve, replay to empty, contain zero orthogonally adjacent matching pairs, and differ from their immediate predecessor. Every board has at least one initial legal move by generation validation.

## Limitations

These are reproducible content diagnostics, not a model of human difficulty. The deterministic solver makes one fixed sequence of locally legal choices; a person may choose a different route, overlook a visible pair, plan ahead, or respond differently to board shape and tile art. More legal moves can mean either welcome clarity or distracting choice, while a higher forced-step ratio is not automatically harder. Aggregate results also hide level-to-level variation, and 300 sequential seeds are evidence rather than a proof about every possible seed. The curve therefore remains provisional pending playtesting and may later need curated seeds or profiles.

## Task 5.1 playtest pacing revision

Human playtesting superseded the provisional chapter-only curve: the first ten levels felt too easy and repetitive, ten consecutive levels on one profile felt too long, and the campaign still felt easy with quickly completed levels around Level 25. The measured 33-profile calibration above remains useful context, but chapters are now organizational boundaries rather than profile boundaries.

### Revised bands

| Levels | Profile | Empty cells |
|---:|---:|---:|
| 1–3 | 4×4/4 | 8 |
| 4–5 | 4×5/5 | 10 |
| 6–7 | 4×5/6 | 8 |
| 8–10 | 5×5/7 | 11 |
| 11–13 | 5×5/8 | 9 |
| 14–16 | 5×6/9 | 12 |
| 17–20 | 5×6/11 | 8 |
| 21–23 | 5×7/12 | 11 |
| 24–26 | 6×6/13 | 10 |
| 27–30 | 6×7/15 | 12 |
| 31–35 | 6×7/16 | 10 |
| 36–40 | 6×7/17 | 8 |
| 41–50 | 6×8/18 | 12 |
| 51–60 | 6×8/19 | 10 |
| 61–70 | 6×8/20 | 8 |
| 71–85 | 6×8/21 | 6 |
| 86–100 | 6×8/22 | 4 |

The ten-level plateaus were removed because they delayed both visual-search workload and pair-removal workload despite technically sound boards. Levels 1–30 now change profile nine times, every two to four levels, while preserving three onboarding levels. Once the full 6×8 geometry arrives, longer density bands refine workload without needless board-shape churn. Progression frequency therefore intentionally slows from fast early differentiation to slower late refinement.

### Old versus new milestones

| Level | Old profile | Old empty | New profile | New empty |
|---:|---:|---:|---:|---:|
| 1 | 4×4/4 | 8 | 4×4/4 | 8 |
| 5 | 4×4/4 | 8 | 4×5/5 | 10 |
| 10 | 4×4/4 | 8 | 5×5/7 | 11 |
| 15 | 4×5/5 | 10 | 5×6/9 | 12 |
| 20 | 4×5/5 | 10 | 5×6/11 | 8 |
| 25 | 5×5/7 | 11 | 6×6/13 | 10 |
| 30 | 5×5/7 | 11 | 6×7/15 | 12 |
| 40 | 5×6/9 | 12 | 6×7/17 | 8 |
| 50 | 5×6/11 | 8 | 6×8/18 | 12 |
| 75 | 6×7/15 | 12 | 6×8/21 | 6 |
| 100 | 6×8/22 | 4 | 6×8/22 | 4 |

Cumulative pair removals are **22 through Level 5**, **55 through Level 10**, **150 through Level 20**, **212 through Level 25**, and **285 through Level 30**.

### Exact revised campaign diagnostics

Run recorded with `npm run analyze:progression -- --campaign-only`. It analyzes only the 100 exact campaign seeds rather than repeating candidate-profile discovery. All **100/100** boards validated and solved, every solver replay emptied its board, consecutive boards differed, and there were zero adjacent matching pairs. No seed overrides were needed. Levels 1–5 and 6–10 each have a minimum of two initial legal moves. The longest campaign-wide run of levels with exactly one initial legal move is **1**, so Levels 1–30 cannot exceed the desired run limit of two.

| Levels | Area avg | Pairs avg | Empty avg | Initial avg | Turns | 3+ rate | Length |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–5 | 17.60 | 4.40 | 8.80 | 2.60 | 1.136 | .136 | 3.727 |
| 6–10 | 23.00 | 6.60 | 9.80 | 2.40 | 1.152 | .061 | 4.212 |
| 11–20 | 28.50 | 9.50 | 9.50 | 2.60 | 1.337 | .084 | 4.316 |
| 21–30 | 38.10 | 13.50 | 11.10 | 3.80 | 1.393 | .133 | 4.689 |
| 31–50 | 45.00 | 17.25 | 10.50 | 3.65 | 1.554 | .183 | 5.023 |
| 51–75 | 48.00 | 19.80 | 8.40 | 3.28 | 1.584 | .196 | 5.196 |
| 76–100 | 48.00 | 21.60 | 4.80 | 2.88 | 1.576 | .207 | 5.206 |

| Chapter | Area avg | Pairs avg | Empty avg | Initial avg (min) | Turns | 3+ rate | Length |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 20.30 | 5.50 | 9.30 | 2.50 (2) | 1.145 | .091 | 4.018 |
| 2 | 28.50 | 9.50 | 9.50 | 2.60 (1) | 1.337 | .084 | 4.316 |
| 3 | 38.10 | 13.50 | 11.10 | 3.80 (3) | 1.393 | .133 | 4.689 |
| 4 | 42.00 | 16.50 | 9.00 | 3.30 (2) | 1.533 | .182 | 4.909 |
| 5 | 48.00 | 18.00 | 12.00 | 4.00 (3) | 1.572 | .183 | 5.128 |
| 6 | 48.00 | 19.00 | 10.00 | 3.90 (2) | 1.611 | .200 | 5.347 |
| 7 | 48.00 | 20.00 | 8.00 | 2.90 (1) | 1.570 | .205 | 5.150 |
| 8 | 48.00 | 21.00 | 6.00 | 3.10 (1) | 1.500 | .176 | 4.795 |
| 9 | 48.00 | 21.50 | 5.00 | 2.80 (1) | 1.623 | .209 | 5.353 |
| 10 | 48.00 | 22.00 | 4.00 | 2.70 (2) | 1.595 | .218 | 5.359 |

This revision changes only deterministic profile selection. It adds no gameplay mechanics, and human difficulty remains a limitation of solver-derived diagnostics. Further difficulty mechanics are deliberately deferred.

## Task 5.2 — opening progression polish

A human playtest of the Task 5.1 campaign found the overall curve through Level 32 substantially improved, but Levels 1–3 repeated the same **4×4/4** profile. This targeted pass keeps Level 1 as the simplest onboarding board and changes only Levels 2 and 3:

| Level | Old profile | New profile | Empty | Initial legal moves | Avg turns | 3+ turn moves (rate) | Avg path length |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 4×4/4 | 4×4/4 | 8 | 2 | 0.750 | 0 (.000) | 2.250 |
| 2 | 4×4/4 | 4×4/5 | 6 | 2 | 1.600 | 0 (.000) | 4.200 |
| 3 | 4×4/4 | 4×4/6 | 4 | 2 | 0.500 | 0 (.000) | 2.500 |
| 4 | 4×5/5 | 4×5/5 | 10 | 3 | 1.200 | 0 (.000) | 3.600 |
| 5 | 4×5/5 | 4×5/5 | 10 | 2 | 1.400 | 2 (.400) | 5.000 |

These are exact production-solver diagnostics for the unchanged derived seeds (`0`, `2654435769`, `1013904242`, `3668340011`, and `2027808484`), produced by `npm run analyze:progression -- --campaign-only`. The preferred **4×4/6** Level 3 was retained because its exact board does not have the aggregate profile's concerning forced start: it has two initial legal moves, validates, solves, replays to empty, and has no adjacent matching pair. The **4×5/5** alternative also passed those checks, but was rejected because it would reduce pair workload from Level 2 to Level 3 and duplicate Level 4's profile. A **4×5/6** alternative passed as well, but adds unnecessary geometry churn before Level 4. No seed override or runtime retry was introduced; Levels 4–100 remain on their Task 5.1 profiles.
