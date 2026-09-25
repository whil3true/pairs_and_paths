import { Board, type GridPoint, type TileId } from "./Board.js";
import { findPath, type ConnectionPath } from "./Pathfinder.js";

export interface LegalMove {
  readonly tileId: TileId;
  readonly start: GridPoint;
  readonly end: GridPoint;
  readonly path: ConnectionPath;
}

const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

const samePath = (left: ConnectionPath, right: ConnectionPath): boolean =>
  left.points.length === right.points.length && left.points.every((point, index) => {
    const other = right.points[index];
    return other !== undefined && samePoint(point, other);
  });

/** Ordered by tile ID, then row-major start/end coordinates. */
export const findLegalMoves = (board: Board): LegalMove[] => {
  const positions = new Map<TileId, GridPoint[]>();
  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const tileId = board.tileAt({ col, row });
      if (tileId !== null) {
        const points = positions.get(tileId) ?? [];
        points.push({ col, row });
        positions.set(tileId, points);
      }
    }
  }
  const moves: LegalMove[] = [];
  for (const tileId of [...positions.keys()].sort((a, b) => a - b)) {
    const points = positions.get(tileId)!;
    for (let startIndex = 0; startIndex < points.length; startIndex += 1) {
      for (let endIndex = startIndex + 1; endIndex < points.length; endIndex += 1) {
        const start = points[startIndex]!;
        const end = points[endIndex]!;
        const path = findPath(board, start, end);
        if (path !== null) moves.push({ tileId, start, end, path });
      }
    }
  }
  return moves;
};

/** Validates the move against the current board and returns a new board. */
export const applyMove = (board: Board, move: LegalMove): Board => {
  const currentPath = board.contains(move.start) && board.contains(move.end)
    ? findPath(board, move.start, move.end) : null;
  if (samePoint(move.start, move.end) || !board.contains(move.start) || !board.contains(move.end)
      || board.tileAt(move.start) !== move.tileId || board.tileAt(move.end) !== move.tileId
      || currentPath === null || !samePath(currentPath, move.path)) {
    throw new Error("Move is not legal on this board");
  }
  return board.withTile(move.start, null).withTile(move.end, null);
};
