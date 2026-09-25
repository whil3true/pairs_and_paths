import { Board, type GridPoint } from "./Board.js";

/** A compact, interior-only orthogonal polyline: start, zero or more corners, end. */
export interface ConnectionPath {
  readonly points: readonly GridPoint[];
}

interface State extends GridPoint {
  readonly direction: number;
  readonly turns: number;
  readonly length: number;
  readonly cells: readonly GridPoint[];
  readonly tieKey: string;
}

const DIRECTIONS = [
  { col: 0, row: -1 }, // up
  { col: -1, row: 0 }, // left
  { col: 1, row: 0 },  // right
  { col: 0, row: 1 },  // down
] as const;

const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

const compare = (left: State, right: State): number =>
  left.turns - right.turns || left.length - right.length || left.tieKey.localeCompare(right.tieKey);

const compact = (cells: readonly GridPoint[]): GridPoint[] => {
  const points: GridPoint[] = [];
  for (const point of cells) {
    while (points.length >= 2) {
      const before = points[points.length - 2]!;
      const previous = points[points.length - 1]!;
      if (!((before.col === previous.col && previous.col === point.col)
        || (before.row === previous.row && previous.row === point.row))) break;
      points.pop();
    }
    points.push(point);
  }
  return points;
};

/**
 * Finds the canonical interior route. Cost is minimum turns, then minimum step
 * length, then lexicographic row/column traversal. There is no turn limit.
 */
export const findPath = (board: Board, start: GridPoint, end: GridPoint): ConnectionPath | null => {
  if (!board.contains(start) || !board.contains(end) || samePoint(start, end)) return null;
  const tile = board.tileAt(start);
  if (tile === null || board.tileAt(end) !== tile) return null;

  const initial: State = { ...start, direction: -1, turns: 0, length: 0, cells: [start], tieKey: "" };
  const queue: State[] = [initial];
  const best = new Map<string, State>([[`${start.col},${start.row},-1`, initial]]);
  while (queue.length > 0) {
    queue.sort(compare);
    const state = queue.shift()!;
    const key = `${state.col},${state.row},${state.direction}`;
    if (best.get(key) !== state) continue;
    if (state.length > 0 && samePoint(state, end)) return { points: compact(state.cells) };

    DIRECTIONS.forEach((delta, direction) => {
      const next = { col: state.col + delta.col, row: state.row + delta.row };
      if (!board.contains(next) || (!samePoint(next, end) && board.isOccupied(next))) return;
      const turns = state.direction < 0 || state.direction === direction ? state.turns : state.turns + 1;
      const token = `${String(next.row).padStart(2, "0")},${String(next.col).padStart(2, "0")};`;
      const candidate: State = { ...next, direction, turns, length: state.length + 1,
        cells: [...state.cells, next], tieKey: state.tieKey + token };
      const nextKey = `${next.col},${next.row},${direction}`;
      const prior = best.get(nextKey);
      if (prior === undefined || compare(candidate, prior) < 0) {
        best.set(nextKey, candidate);
        queue.push(candidate);
      }
    });
  }
  return null;
};
