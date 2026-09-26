# Blocker progression calibration

## Playtest input and methodology

Task 6 playtesting found static terrain readable, uncluttered, natural to route around, and worth continuing after the pilot. It also showed that a non-empty mask alone does not make terrain meaningful. Task 6.1 therefore preserves the existing size, pair-count, seed progression, core rules, and solver while curating explicit terrain against each exact generated board.

`npm run analyze:blockers` copies `board.toRows()` into a blocker-free twin at every state of the deterministic solver replay and compares the canonical route for every remaining matching pair. A pair is affected when terrain makes it unavailable, adds turns, or adds path length. Affected pair-states, unavailable pair-states, extra turns, and extra length remain separate; there is no magic difficulty score. Repeated states deliberately measure sustained influence.

This replay is not a model of all player orders or human difficulty. The monotonicity test separately solves every legal alternative encountered along the replay. Other legal sequences may expose different terrain effects.

## Rhythm and families

Final blocker levels: **11, 12, 13, 16, 19, 22, 25, 28, 30, then every even level from 32 through 100** (44 total). Frequencies: 1–10 **0/10 (0%)**; 11–20 **5/10 (50%)**; 21–40 **9/20 (45%)**; 41–60 **10/20 (50%)**; 61–80 **10/20 (50%)**; 81–100 **10/20 (50%)**. In the requested broad bands, Levels 14–30 are 6/17 (35.3%), Levels 31–60 are 15/30 (50%), and Levels 61–100 are 20/40 (50%). Every odd level after 31 is a normal breathing level.

Families progress from single, separated, short-wall, and elbow patterns into offset walls, staggered layouts, partial channels, and asymmetric short walls. Counts are capacity-aware: 1–3 early and mostly 3–4 mid/late. The 6×8/22-pair profile has only four non-tile cells, so late selection favors geometry over blocker count. Average count is **3.23**.

## Exact selected patterns and relevance

Coordinates are `(col,row)`. Metric columns are initial affected pairs; replay totals for affected and unavailable pair-states; extra turns; and extra path length.

| Level | Family | Count | Coordinates | Initial | Affected | Unavailable | +Turns | +Length |
|---:|---|---:|---|---:|---:|---:|---:|---:|
| 11 | single | 1 | (2,2) | 1 | 7 | 5 | 2 | 0 |
| 12 | separated | 2 | (2,1) (2,3) | 1 | 2 | 0 | 2 | 0 |
| 13 | elbow | 3 | (1,1) (2,2) (3,2) | 1 | 9 | 6 | 6 | 12 |
| 16 | short-wall | 2 | (2,2) (2,3) | 1 | 8 | 1 | 4 | 16 |
| 19 | elbow | 3 | (1,2) (2,2) (2,3) | 0 | 10 | 4 | 6 | 8 |
| 22 | separated | 2 | (1,2) (3,4) | 1 | 25 | 12 | 27 | 26 |
| 25 | short-wall | 3 | (2,2) (3,2) (4,2) | 1 | 23 | 19 | 5 | 12 |
| 28 | offset-wall | 3 | (2,1) (2,2) (3,4) | 0 | 10 | 4 | 6 | 22 |
| 30 | staggered | 3 | (1,2) (3,3) (4,5) | 0 | 23 | 6 | 16 | 14 |
| 32 | short-wall | 3 | (2,2) (2,3) (2,4) | 0 | 13 | 5 | 12 | 42 |
| 34 | offset-wall | 3 | (1,2) (2,2) (4,4) | 1 | 42 | 27 | 20 | 40 |
| 36 | elbow | 4 | (2,2) (3,2) (3,3) (3,4) | 1 | 24 | 17 | 15 | 32 |
| 38 | staggered | 3 | (1,1) (2,3) (4,5) | 1 | 21 | 11 | 25 | 30 |
| 40 | channel | 4 | (2,1) (2,2) (3,4) (3,5) | 3 | 37 | 29 | 3 | 16 |
| 42 | short-wall | 4 | (1,3) (2,3) (3,3) (4,3) | 2 | 27 | 27 | 0 | 0 |
| 44 | offset-wall | 3 | (2,1) (2,2) (3,5) | 1 | 30 | 14 | 31 | 20 |
| 46 | staggered | 3 | (1,2) (3,3) (4,5) | 1 | 34 | 19 | 26 | 8 |
| 48 | elbow | 4 | (2,2) (3,2) (3,3) (3,4) | 0 | 24 | 20 | 6 | 16 |
| 50 | channel | 4 | (1,2) (1,3) (4,4) (4,5) | 0 | 19 | 7 | 14 | 10 |
| 52 | offset-wall | 3 | (1,2) (2,2) (4,5) | 1 | 20 | 9 | 16 | 26 |
| 54 | staggered | 3 | (1,1) (2,3) (4,6) | 1 | 33 | 18 | 35 | 34 |
| 56 | short-wall | 4 | (2,2) (2,3) (2,4) (2,5) | 1 | 33 | 6 | 32 | 114 |
| 58 | asymmetric-walls | 4 | (1,2) (2,2) (4,4) (4,5) | 2 | 28 | 17 | 11 | 34 |
| 60 | channel | 4 | (1,2) (1,3) (4,4) (4,5) | 1 | 42 | 33 | 8 | 18 |
| 62 | offset-wall | 3 | (1,2) (2,2) (4,5) | 0 | 21 | 2 | 31 | 54 |
| 64 | staggered | 3 | (1,1) (2,3) (4,6) | 2 | 28 | 15 | 24 | 22 |
| 66 | channel | 4 | (1,2) (1,3) (4,4) (4,5) | 2 | 53 | 40 | 14 | 26 |
| 68 | asymmetric-walls | 4 | (1,2) (2,2) (2,3) (4,5) | 0 | 12 | 7 | 5 | 10 |
| 70 | channel | 4 | (1,1) (1,2) (4,5) (4,6) | 2 | 50 | 43 | 14 | 28 |
| 72 | staggered | 3 | (1,2) (3,3) (4,5) | 0 | 16 | 11 | 6 | 4 |
| 74 | asymmetric-walls | 4 | (1,2) (2,2) (4,4) (4,5) | 1 | 32 | 15 | 20 | 24 |
| 76 | channel | 4 | (1,1) (1,2) (4,5) (4,6) | 2 | 27 | 17 | 14 | 16 |
| 78 | offset-wall | 3 | (1,3) (2,3) (4,5) | 1 | 23 | 11 | 15 | 62 |
| 80 | asymmetric-walls | 4 | (1,2) (2,2) (3,5) (4,5) | 1 | 51 | 28 | 43 | 60 |
| 82 | staggered | 3 | (1,1) (2,3) (4,6) | 0 | 33 | 17 | 19 | 14 |
| 84 | channel | 4 | (1,2) (1,3) (4,4) (4,5) | 1 | 45 | 13 | 32 | 40 |
| 86 | offset-wall | 3 | (1,2) (2,2) (4,5) | 2 | 42 | 27 | 23 | 26 |
| 88 | offset-wall | 3 | (1,2) (2,2) (4,5) | 1 | 17 | 3 | 18 | 30 |
| 90 | staggered | 3 | (1,1) (2,3) (4,6) | 0 | 20 | 14 | 3 | 10 |
| 92 | offset-wall | 3 | (1,2) (1,3) (4,5) | 0 | 12 | 2 | 12 | 28 |
| 94 | offset-wall | 3 | (1,3) (2,3) (4,5) | 1 | 30 | 17 | 19 | 28 |
| 96 | offset-wall | 3 | (1,2) (2,2) (4,5) | 0 | 14 | 6 | 7 | 32 |
| 98 | staggered | 3 | (1,1) (2,3) (4,6) | 1 | 17 | 6 | 13 | 18 |
| 100 | offset-wall | 3 | (1,2) (1,3) (4,5) | 2 | 35 | 21 | 14 | 28 |

No selected level has zero measured replay relevance. Levels **19, 28, 30, 32, 48, 50, 62, 68, 72, 82, 90, 92, and 96** have zero initial affected pairs but measurable later effects, demonstrating why initial-only screening is insufficient.

Representative early/mid/late diagnostics are Level 16 (8 affected, 1 unavailable, +4 turns, +16 length), Level 40 (37, 29, +3, +16), and Level 80 (51, 28, +43, +60). Strong effects differ by measure: Level 66 has 53 affected pair-states; Level 70 has 43 unavailable pair-states; Level 80 adds 43 turns; Level 56 adds 114 path steps. None is labeled a single “hardest” level.

## Rejections, seeds, and limitations

No successfully generated candidate in the final calibration pass was rejected as wholly decorative: full replay found later relevance even for initial-zero layouts. Four-blocker channel/asymmetric candidates at Levels 88, 92, 96, and 100 were rejected when the unchanged bounded generator exhausted its construction budget on these dense exact boards; three-blocker offset variants were selected instead. This is a capacity/generation rejection, not evidence that count equals difficulty. **No seed overrides were made.**

Metrics cover the production solver's one deterministic removal sequence and canonical minimum-turn/minimum-length routes. They are content diagnostics, not permanent thresholds. Human playtesting remains necessary. No random placement, sealed room, maze, loss condition, or multi-stage behavior was introduced.
