# Campaign stage progression

## Playtest baseline and intent

The Task 7/7.1 pilot established that Levels 21 and 24 work well as two-stage levels, Level 30 is not too long as a three-stage level, the transition reads correctly, and the backing-sheet stack communicates remaining stages. It also established the more important restraint: multi-stage play is useful as variety, not as the campaign's default routine. The exact pilot content and deterministic seeds therefore remain unchanged; `STAGE_PILOT.md` retains the original implementation history.

Task 7.2 places 19 multi-stage levels across the 100-level campaign: **21, 24, 30, 35, 39, 43, 48, 54, 59, 63, 68, 73, 77, 80, 82, 87, 91, 94, 100**. There are 14 two-stage levels and five three-stage set pieces. The range counts are 0 / 5 / 4 / 5 / 5 for Levels 1–20 / 21–40 / 41–60 / 61–80 / 81–100.

This is an explicit content table, not a modulo schedule. Its gaps are **3, 6, 5, 4, 4, 5, 6, 5, 4, 5, 5, 4, 3, 2, 5, 4, 3, 6** levels. No multi-stage levels are adjacent. The longest single-stage run is the deliberate 20-level onboarding; after multi-stage begins, the longest run is five single-stage levels. Both odd and even placements are used, and eight selections have blocker finals while 11 have normal finals. In particular, normal-final odd placements are interleaved with blocker-final even placements rather than assigning stages to every odd level and blockers to every even level.

## Authored prelude content

Every row lists only preludes as `width×height / pairs / seed`; the unchanged campaign board is appended automatically as the final stage.

| Level | Prelude stage(s) |
|---:|:---|
| 21 | 5×5 / 8 / 422698975 |
| 24 | 5×6 / 10 / 1803337488 |
| 30 | 4×5 / 6 / 1422392722 → 5×6 / 9 / 319819725 |
| 35 | 5×6 / 9 / 2858084793 |
| 39 | 5×6 / 9 / 2207093589 |
| 43 | 5×6 / 9 / 2617031393 |
| 48 | 5×5 / 7 / 4183011592 → 5×7 / 10 / 3196339031 |
| 54 | 5×7 / 10 / 3671783306 |
| 59 | 6×6 / 11 / 942793649 |
| 63 | 5×7 / 10 / 274765133 |
| 68 | 5×5 / 7 / 2009563508 → 5×6 / 10 / 806384427 |
| 73 | 6×6 / 11 / 3579510171 |
| 77 | 5×7 / 12 / 2727192375 |
| 80 | 6×6 / 11 / 1019806824 |
| 82 | 5×6 / 8 / 14717790 → 6×6 / 12 / 1194811649 |
| 87 | 6×6 / 12 / 1715965765 |
| 91 | 5×7 / 11 / 2142679313 |
| 94 | 5×6 / 8 / 3388085842 → 6×7 / 13 / 2384847885 |
| 100 | 6×7 / 13 / 3044889812 |

Prelude pair counts strictly increase toward the final board, board area never decreases, and preludes remain blocker-free. The profiles vary between compact 5×5/5×6 openings and 5×7/6×6/6×7 mid-sized boards. New prelude boards all have at least two initial legal moves. Three-stage levels are separated by 12–20 campaign levels and use a light → medium → existing-final progression rather than repeating full-size boards.

## Workload and diagnostics

The final-only campaign contains **1,668 pair removals**. Preludes add 236, producing **1,904 pair removals**, or **1.1414868106×** the original workload. Total generated stages are **124**. The exact per-level workload and generation metrics are emitted by `npm run analyze:stages`; two-stage additions generally land around 1.50–1.59×, while new three-stage set pieces land around 1.85–1.95×. The higher 1.67×, 1.77×, and 2.00× pilot multipliers remain unchanged.

Representative deterministic diagnostics:

- Level 21 prelude (early): 5×5, 8 pairs, three initial moves, 1.375 average turns, 25% 3+ turn rate, 4.25 average path length.
- Level 59 prelude (mid): 6×6, 11 pairs, five initial moves, 1.0 average turns, 0% 3+ turn rate, 4.82 average path length.
- Level 94 preludes (late set piece): 5×6/8 pairs then 6×7/13 pairs, five then six initial moves, 1.125 then 1.077 average turns, 12.5% then 15.38% 3+ turn rate, and 3.875 then 4.308 average path length.

The analyzer verifies every stage as valid and solved, replays each solution to an empty tile board while preserving its blocker mask, and compares all 100 generated finals (config, rows, blockers, and witness) with `createLevel(levelNumber)`. Final-stage preservation is true.

## Candidate decisions

Rejected placements included 42/52/62/72/92 as a blanket pattern because it would reinforce the existing even-level blocker cadence; recurring five-level marks such as 40/45/50/55 were rejected because they read as a second schedule; and Levels 81/83 around the selected 82 were rejected to preserve breathing space. Level 100 was retained as a non-periodic campaign-end variation, while nearby 98 was rejected to avoid crowding two blocker-final multi-stage levels.

Profiles were evaluated with the authored stage seed rather than seed overrides. A 6×6/11 second prelude for Level 68 was rejected because its exact deterministic board had only one initial legal move; 5×6/10 has two and also gives a cleaner area progression. Full-size 6×8 preludes and pair counts close to the final were rejected throughout because they inflated duration and made stages visually repetitive. Reusing one 6×6 profile everywhere was rejected in favor of several compact and medium families.

## Known limitations

- Difficulty metrics describe deterministic generated boards but are not a synthetic difficulty score or a CI balance threshold.
- Some unchanged final campaign boards can still begin with one legal move; the two-move preference applies to new preludes only.
- Prelude blockers are intentionally unsupported in authored content, and the final blocker cadence itself is unchanged.
- Distribution and workload are calibrated analytically and preserve the pilot feedback, but the newly added late-game sequence still benefits from a focused human playtest.
