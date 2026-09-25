# Game-rule invariants

Future gameplay must obey these invariants:

- A move connects two identical tiles.
- The path is orthogonal and has at most two turns.
- A path may travel through a virtual border around the board.
- Removed tiles leave empty cells; there is no gravity or collapse.
- There is no hard timer.
- A board is at most 6×8.
- Every published level must be validated by the solver.
- In generated v1 levels, every tile ID occurs exactly twice. `Board` remains a
  generic container and does not impose that content rule.

`findPath(board, start, end)` accepts endpoints in real-board coordinates and returns
`null` for an invalid or unconnectable pair. A successful result contains `points`, a
2–4 vertex orthogonal polyline from `start` to `end` with collinear intermediate
points removed. The endpoints must be distinct occupied cells with the same positive
integer tile ID; all other occupied cells block the route.

Pathfinding uses exactly one logical empty cell around the board (`col` from `-1` to
`width`, `row` from `-1` to `height`). Returned vertices may use those padded
coordinates, but never coordinates beyond them. This logical outer border does
**not** need to occupy a full tile's physical width in the UI. This distinction is
important for portrait mobile layouts.

When several routes exist, the pathfinder minimizes turns first, total Manhattan
length second, and uses stable row/column vertex ordering as the final tie-break.

## Removal-monotonic solvability

Removing tiles cannot invalidate an existing path: every cell traversed by that
path was empty (apart from its endpoints), and removal only changes occupied cells
to empty cells. The padded outer border and the two-turn limit do not change.

For a solvable board where every ID occurs exactly twice, consider any legal player
move. If it is not the first move of a known solution, delete that pair's one move
from the known sequence. All earlier moves in the shortened sequence retain their
paths by removal monotonicity; after them, every later move also retains its path.
Thus the shortened sequence solves the remainder. Consequently **every legal move
preserves solvability** for solver-valid v1 pair boards. This conclusion depends on
unique pairs, static positions, and removal-only play; it does not apply unchanged
to duplicate IDs, gravity, tile insertion, or other board mutations.
