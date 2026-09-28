# Campaign progression report

The campaign contains 100 deterministic Levels in 10 chapters. Task 12.2 changes final-board
geometry only: pair-count bands and `levelSeed` remain unchanged.

## Final-board bands

| Levels | Geometry | Pairs | Empty cells before blockers |
|---|---:|---:|---:|
| 1 | 4×4 | 4 | 8 |
| 2 | 4×4 | 5 | 6 |
| 3 | 4×4 | 6 | 4 |
| 4–5 | 4×4 | 5 | 6 |
| 6–7 | 4×4 | 6 | 4 |
| 8–10 | 5×5 | 7 | 11 |
| 11–13 | 5×5 | 8 | 9 |
| 14–16 | 5×5 | 9 | 7 |
| 17–20 | 6×6 | 11 | 14 |
| 21–23 | 6×6 | 12 | 12 |
| 24–26 | 6×6 | 13 | 10 |
| 27–30 | 7×7 | 15 | 19 |
| 31–35 | 7×7 | 16 | 17 |
| 36–40 | 7×7 | 17 | 15 |
| 41–50 | 7×7 | 18 | 13 |
| 51–60 | 7×7 | 19 | 11 |
| 61–70 | 7×7 | 20 | 9 |
| 71–85 | 7×7 | 21 | 7 |
| 86–100 | 7×7 | 22 | 5 |

Every final board is square. Authored blocker levels retain at least two empty non-blocked cells;
Level 100 is the minimum with exactly two. Multi-stage preludes remain unchanged and may be
rectangular. Run `npm run analyze:progression` for current generator/solver metrics rather than
copying historical pre-migration measurements.
