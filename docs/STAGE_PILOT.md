# Multi-stage pilot

> **Historical note:** The Task 7 pilot was completed and then expanded in Task 7.2. The current campaign distribution is documented in `STAGE_PROGRESSION.md`.

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

The pilot now uses a prototype sheet-stack affordance. The active grid sits on a front sheet, with up to two offset backing sheets visible from the start of a stage; their count communicates how many stages remain. Clearing a non-final stage lifts and fades the front layer while the nearest backing moves forward, then the newly generated board fades into the front position. This remains presentation only: future tiles and exact future board dimensions are not rendered.

Known limitations are intentional: the sheets are simple Phaser rectangles rather than production art; final visual design, persistence, level select, and distribution beyond the three pilots remain deferred.
