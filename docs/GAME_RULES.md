# Game-rule invariants

A move joins two distinct occupied cells with the same `TileId`. Movement is horizontal or vertical, stays strictly inside the real board, and every transit cell is empty. There is no virtual border and no turn limit. `findPath` ranks routes by minimum turns, then minimum step length, then a stable deterministic implementation-defined direction/insertion order, and returns a compact 2..N-vertex polyline.

Product-generated initial boards contain each ID exactly twice and never place its two cells orthogonally adjacent; diagonal adjacency is allowed. This is a generation constraint, not a generic `Board` or pathfinder rule. Initial empty cells are expected level geometry. Removed tiles leave empty cells and do not fall.

## Removal-monotonic solvability

Every cell of an existing legal interior path is empty except its endpoints. Removing other tiles only changes occupied cells to empty cells, so it cannot invalidate that path, regardless of its number of turns. On a solvable unique-pair board, remove any legal player pair from a known solution and replay the other moves: removal monotonicity preserves every path. Therefore every legal move preserves solvability under the static, removal-only unique-pair rules.
