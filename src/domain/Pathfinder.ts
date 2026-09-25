import { Board, type GridPoint } from "./Board.js";

/** A compact, interior-only orthogonal polyline: start, zero or more corners, end. */
export interface ConnectionPath {
  readonly points: readonly GridPoint[];
}

interface QueueEntry {
  readonly state: number;
  readonly turns: number;
  readonly length: number;
  readonly order: number;
}

// Direction order is part of the stable route tie-break.
const DIRECTIONS = [
  { col: 0, row: -1 }, // up
  { col: -1, row: 0 }, // left
  { col: 1, row: 0 },  // right
  { col: 0, row: 1 },  // down
] as const;

const samePoint = (left: GridPoint, right: GridPoint): boolean =>
  left.col === right.col && left.row === right.row;

const before = (left: QueueEntry, right: QueueEntry): boolean =>
  left.turns < right.turns
  || (left.turns === right.turns && (left.length < right.length
    || (left.length === right.length && left.order < right.order)));

const push = (heap: QueueEntry[], entry: QueueEntry): void => {
  let index = heap.length;
  heap.push(entry);
  while (index > 0) {
    const parent = (index - 1) >> 1;
    if (!before(entry, heap[parent]!)) break;
    heap[index] = heap[parent]!;
    index = parent;
  }
  heap[index] = entry;
};

const pop = (heap: QueueEntry[]): QueueEntry => {
  const first = heap[0]!;
  const last = heap.pop()!;
  if (heap.length === 0) return first;
  let index = 0;
  while (true) {
    const left = index * 2 + 1;
    if (left >= heap.length) break;
    const right = left + 1;
    const child = right < heap.length && before(heap[right]!, heap[left]!) ? right : left;
    if (!before(heap[child]!, last)) break;
    heap[index] = heap[child]!;
    index = child;
  }
  heap[index] = last;
  return first;
};

const compact = (cells: readonly GridPoint[]): GridPoint[] => {
  const points: GridPoint[] = [];
  for (const point of cells) {
    while (points.length >= 2) {
      const beforePoint = points[points.length - 2]!;
      const previous = points[points.length - 1]!;
      if (!((beforePoint.col === previous.col && previous.col === point.col)
        || (beforePoint.row === previous.row && previous.row === point.row))) break;
      points.pop();
    }
    points.push(point);
  }
  return points;
};

/**
 * Finds the canonical interior route. Cost is minimum turns, then minimum step
 * length, then stable direction/queue order. There is no turn limit.
 */
export const findPath = (board: Board, start: GridPoint, end: GridPoint): ConnectionPath | null => {
  if (!board.contains(start) || !board.contains(end) || samePoint(start, end)) return null;
  const tile = board.tileAt(start);
  if (tile === null || board.tileAt(end) !== tile) return null;

  const stateCount = board.width * board.height * DIRECTIONS.length;
  const bestTurns = new Int16Array(stateCount).fill(0x7fff);
  const bestLengths = new Int16Array(stateCount).fill(0x7fff);
  const previous = new Int16Array(stateCount).fill(-1);
  const heap: QueueEntry[] = [];
  let order = 0;
  for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
    const delta = DIRECTIONS[direction]!;
    const col = start.col + delta.col, row = start.row + delta.row;
    const point = { col, row };
    if (!board.contains(point) || (!samePoint(point, end) && board.isOccupied(point))) continue;
    const state = (row * board.width + col) * 4 + direction;
    bestTurns[state] = 0;
    bestLengths[state] = 1;
    push(heap, { state, turns: 0, length: 1, order: order++ });
  }

  while (heap.length > 0) {
    const current = pop(heap);
    if (current.turns !== bestTurns[current.state] || current.length !== bestLengths[current.state]) continue;
    const cell = Math.floor(current.state / 4);
    const direction = current.state % 4;
    const col = cell % board.width, row = Math.floor(cell / board.width);
    if (col === end.col && row === end.row) {
      const cells: GridPoint[] = [];
      for (let state = current.state; state >= 0; state = previous[state]!) {
        const stateCell = Math.floor(state / 4);
        cells.push({ col: stateCell % board.width, row: Math.floor(stateCell / board.width) });
      }
      cells.push(start);
      cells.reverse();
      return { points: compact(cells) };
    }

    for (let nextDirection = 0; nextDirection < DIRECTIONS.length; nextDirection += 1) {
      const delta = DIRECTIONS[nextDirection]!;
      const next = { col: col + delta.col, row: row + delta.row };
      if (!board.contains(next) || (!samePoint(next, end) && board.isOccupied(next))) continue;
      const turns = current.turns + Number(direction !== nextDirection);
      const length = current.length + 1;
      const state = (next.row * board.width + next.col) * 4 + nextDirection;
      const knownTurns = bestTurns[state]!;
      const knownLength = bestLengths[state]!;
      if (turns > knownTurns || (turns === knownTurns && length >= knownLength)) continue;
      bestTurns[state] = turns;
      bestLengths[state] = length;
      previous[state] = current.state;
      push(heap, { state, turns, length, order: order++ });
    }
  }
  return null;
};
