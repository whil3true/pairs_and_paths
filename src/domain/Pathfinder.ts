import { Board, type GridPoint } from "./Board.js";

export interface ConnectionPath {
  readonly points: readonly GridPoint[];
}

const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

const compact = (points: readonly GridPoint[]): GridPoint[] => {
  const result: GridPoint[] = [];
  for (const point of points) {
    if (result.length > 0 && samePoint(result[result.length - 1]!, point)) continue;
    while (result.length >= 2) {
      const before = result[result.length - 2]!;
      const previous = result[result.length - 1]!;
      const collinear = (before.col === previous.col && previous.col === point.col)
        || (before.row === previous.row && previous.row === point.row);
      if (!collinear) break;
      result.pop();
    }
    result.push(point);
  }
  return result;
};

const isClearSegment = (
  board: Board,
  from: GridPoint,
  to: GridPoint,
  start: GridPoint,
  end: GridPoint,
): boolean => {
  if (from.col !== to.col && from.row !== to.row) return false;
  const colStep = Math.sign(to.col - from.col);
  const rowStep = Math.sign(to.row - from.row);
  let col = from.col;
  let row = from.row;
  while (true) {
    const point = { col, row };
    if (board.contains(point) && !samePoint(point, start) && !samePoint(point, end) && board.isOccupied(point)) {
      return false;
    }
    if (col === to.col && row === to.row) return true;
    col += colStep;
    row += rowStep;
  }
};

const isLegal = (board: Board, points: readonly GridPoint[], start: GridPoint, end: GridPoint): boolean => {
  for (const point of points) {
    if (point.col < -1 || point.col > board.width || point.row < -1 || point.row > board.height) return false;
  }
  for (let index = 1; index < points.length; index += 1) {
    if (!isClearSegment(board, points[index - 1]!, points[index]!, start, end)) return false;
  }
  return true;
};

const lengthOf = (points: readonly GridPoint[]): number => {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.abs(points[index]!.col - points[index - 1]!.col)
      + Math.abs(points[index]!.row - points[index - 1]!.row);
  }
  return length;
};

const pathKey = (points: readonly GridPoint[]): string => points.map(({ col, row }) => `${row},${col}`).join(";");

/**
 * Finds the best legal Onet polyline, or null for an invalid/unconnectable pair.
 * Ranking is turns, Manhattan length, then a stable row/column vertex ordering.
 */
export const findPath = (board: Board, start: GridPoint, end: GridPoint): ConnectionPath | null => {
  if (!board.contains(start) || !board.contains(end) || samePoint(start, end)) return null;
  const startTile = board.tileAt(start);
  if (startTile === null || startTile !== board.tileAt(end)) return null;

  const candidates: GridPoint[][] = [
    [start, end],
    [start, { col: start.col, row: end.row }, end],
    [start, { col: end.col, row: start.row }, end],
  ];

  for (let row = -1; row <= board.height; row += 1) {
    candidates.push([start, { col: start.col, row }, { col: end.col, row }, end]);
  }
  for (let col = -1; col <= board.width; col += 1) {
    candidates.push([start, { col, row: start.row }, { col, row: end.row }, end]);
  }

  const unique = new Map<string, GridPoint[]>();
  for (const raw of candidates) {
    const points = compact(raw);
    if (points.length <= 4 && isLegal(board, points, start, end)) unique.set(pathKey(points), points);
  }

  const paths = [...unique.values()];
  paths.sort((left, right) =>
    (left.length - right.length)
    || (lengthOf(left) - lengthOf(right))
    || pathKey(left).localeCompare(pathKey(right)));
  return paths[0] === undefined ? null : { points: paths[0] };
};
