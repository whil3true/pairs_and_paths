# Game-rule invariants

Future gameplay must obey these invariants:

- A move connects two identical tiles.
- The path is orthogonal and has at most two turns.
- A path may travel through a virtual border around the board.
- Removed tiles leave empty cells; there is no gravity or collapse.
- There is no hard timer.
- A board is at most 6×8.
- Every published level must be validated by the solver.

The pathfinder's logical outer border does **not** need to occupy a full tile's physical width in the UI. This distinction is important for portrait mobile layouts.

The board and pathfinder are intentionally not implemented in the bootstrap.
