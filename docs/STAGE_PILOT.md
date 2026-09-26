# Multi-stage pilot

Task 7 introduces sequential boards inside only Levels 21, 24, and 30. It does not distribute the mechanic across the campaign or create stacked/hidden tiles.

| Level | Stage | Dimensions | Pairs | Blockers | Seed |
|---:|---:|:---:|---:|---:|---:|
| 21 | 1 | 5×5 | 8 | 0 | 422698975 |
| 21 | 2 (final) | 5×7 | 12 | 0 | 1549107828 |
| 24 | 1 | 5×6 | 10 | 0 | 1803337488 |
| 24 | 2 (final) | 6×6 | 13 | 0 | 922480543 |
| 30 | 1 | 4×5 | 6 | 0 | 1422392722 |
| 30 | 2 | 5×6 | 9 | 0 | 319819725 |
| 30 | 3 (final) | 6×7 | 15 | 3 | 3964193269 |

Pair removals grow from 12 to 20 (1.67×) on Level 21, 13 to 23 (1.77×) on Level 24, and 15 to 30 (2.00×) on Level 30. Across the pilot the old 40-pair workload becomes 73 pairs. The first two levels isolate stage sequencing with blocker-free preludes and finals; Level 30 combines two blocker-free preludes with its unchanged staggered three-blocker final board.

The final config is never copied into pilot data. It is appended from `getLevelConfig`, preserving the playtested level seed, layout, blockers, and witness by construction. Prelude seeds occupy a separate deterministic uint32 namespace and are frozen by tests.

Known limitations are intentional: transitions use a simple 400 ms text cue; there is no persistence or level select; no boards coexist; and distribution beyond the three pilots is deferred until a human playtest of Levels 20–30 confirms clarity, pacing, small-to-large progression, and the Level 30 blocker combination.
