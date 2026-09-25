import assert from "node:assert/strict";
import test from "node:test";

import { Board, findPath } from "../.test-dist/domain/index.js";

const point = (col, row) => ({ col, row });
const same = (a, b) => a.col === b.col && a.row === b.row;
const pathCost = (path) => ({
  turns: path.points.length - 2,
  length: path.points.slice(1).reduce((sum, current, index) => {
    const previous = path.points[index];
    return sum + Math.abs(current.col - previous.col) + Math.abs(current.row - previous.row);
  }, 0),
});

function validatePath(board, start, end, path) {
  assert.ok(path.points.length >= 2);
  assert.deepEqual(path.points[0], start);
  assert.deepEqual(path.points.at(-1), end);

  for (const vertex of path.points) {
    assert.ok(vertex.col >= 0 && vertex.col < board.width);
    assert.ok(vertex.row >= 0 && vertex.row < board.height);
  }

  for (let index = 1; index < path.points.length; index += 1) {
    const from = path.points[index - 1];
    const to = path.points[index];
    assert.ok((from.col === to.col) !== (from.row === to.row), "segments must be non-zero and orthogonal");
    if (index >= 2) {
      const before = path.points[index - 2];
      assert.ok(!((before.col === from.col && from.col === to.col)
        || (before.row === from.row && from.row === to.row)), "collinear vertices must be removed");
    }

    const dc = Math.sign(to.col - from.col);
    const dr = Math.sign(to.row - from.row);
    let cursor = { col: from.col, row: from.row };
    while (!same(cursor, to)) {
      cursor = { col: cursor.col + dc, row: cursor.row + dr };
      if (board.contains(cursor) && !same(cursor, start) && !same(cursor, end)) {
        assert.equal(board.isEmpty(cursor), true, `path collided at ${cursor.col},${cursor.row}`);
      }
    }
  }
}

// Independent direction-state Dijkstra search. It explores individual real-board cells,
// unlike production's bounded polyline enumeration.
function oracle(board, start, end) {
  if (!board.contains(start) || !board.contains(end) || same(start, end)) return null;
  const tile = board.tileAt(start);
  if (tile === null || board.tileAt(end) !== tile) return null;

  const directions = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  const queue = [{ ...start, direction: -1, turns: 0, length: 0 }];
  const best = new Map();
  while (queue.length > 0) {
    queue.sort((a, b) => a.turns - b.turns || a.length - b.length);
    const state = queue.shift();
    const stateKey = `${state.col},${state.row},${state.direction}`;
    const known = best.get(stateKey);
    if (known && (known.turns < state.turns || (known.turns === state.turns && known.length <= state.length))) continue;
    best.set(stateKey, state);
    if (state.length > 0 && state.col === end.col && state.row === end.row) {
      return { turns: state.turns, length: state.length };
    }

    directions.forEach(([dc, dr], direction) => {
      const col = state.col + dc;
      const row = state.row + dr;
      const turns = state.direction < 0 || state.direction === direction ? state.turns : state.turns + 1;
      if (col < 0 || col >= board.width || row < 0 || row >= board.height) return;
      const next = { col, row };
      if (board.contains(next) && !same(next, end) && board.isOccupied(next)) return;
      queue.push({ col, row, direction, turns, length: state.length + 1 });
    });
  }
  return null;
}

function assertMatchesOracle(board, start, end) {
  const expected = oracle(board, start, end);
  const actual = findPath(board, start, end);
  assert.equal(actual !== null, expected !== null);
  if (actual !== null) {
    validatePath(board, start, end, actual);
    assert.deepEqual(pathCost(actual), expected);
    assert.deepEqual(findPath(board, start, end), actual, "result must be deterministic");
  }
}

test("Board validates data, exposes cells, and creates immutable revisions", () => {
  const board = Board.fromRows([[1, null], [2, 2]]);
  assert.equal(board.width, 2);
  assert.equal(board.height, 2);
  assert.equal(board.tileAt(point(0, 0)), 1);
  assert.equal(board.isEmpty(point(1, 0)), true);
  assert.equal(board.isOccupied(point(0, 1)), true);
  const removed = board.withTile(point(0, 1), null);
  assert.equal(removed.isEmpty(point(0, 1)), true);
  assert.equal(board.tileAt(point(0, 1)), 2);

  assert.throws(() => Board.fromRows([]), RangeError);
  assert.throws(() => Board.fromRows([[1], [1, null]]), TypeError);
  assert.throws(() => Board.fromRows([[0]]), TypeError);
  assert.throws(() => Board.fromRows([[1, 1, 1, 1, 1, 1, 1]]), RangeError);
  assert.throws(() => Board.fromRows(Array.from({ length: 9 }, () => [1])), RangeError);
  assert.throws(() => board.tileAt(point(-1, 0)), RangeError);
});

test("invalid pair queries return null", () => {
  const board = Board.fromRows([[1, null, 2]]);
  assert.equal(findPath(board, point(0, 0), point(0, 0)), null);
  assert.equal(findPath(board, point(-1, 0), point(0, 0)), null);
  assert.equal(findPath(board, point(0, 0), point(1, 0)), null);
  assert.equal(findPath(board, point(0, 0), point(2, 0)), null);
});

test("zero-turn paths connect adjacent, row, and column pairs but never cross blockers", () => {
  const adjacent = Board.fromRows([[1, 1]]);
  assert.deepEqual(pathCost(findPath(adjacent, point(0, 0), point(1, 0))), { turns: 0, length: 1 });
  const row = Board.fromRows([[1, null, null, 1]]);
  assert.deepEqual(pathCost(findPath(row, point(0, 0), point(3, 0))), { turns: 0, length: 3 });
  const column = Board.fromRows([[1], [null], [1]]);
  assert.deepEqual(pathCost(findPath(column, point(0, 0), point(0, 2))), { turns: 0, length: 2 });
  const blocked = Board.fromRows([[1, 2, 1]]);
  assert.equal(findPath(blocked, point(0, 0), point(2, 0)), null);
});

test("one-turn paths evaluate both L corners and blocked corners", () => {
  const open = Board.fromRows([[1, null], [null, 1]]);
  assert.deepEqual(pathCost(findPath(open, point(0, 0), point(1, 1))), { turns: 1, length: 2 });
  const firstBlocked = Board.fromRows([[1, 2], [null, 1]]);
  const path = findPath(firstBlocked, point(0, 0), point(1, 1));
  assert.deepEqual(path.points, [point(0, 0), point(0, 1), point(1, 1)]);
  const bothBlocked = Board.fromRows([[1, null, 2], [2, null, 1]]);
  assert.deepEqual(pathCost(findPath(bothBlocked, point(0, 0), point(2, 1))), { turns: 2, length: 3 });
});

test("two-turn paths work in both orientations and choose the shortest legal route", () => {
  const horizontalMiddle = Board.fromRows([[1, 2, 1], [null, null, null]]);
  assert.deepEqual(pathCost(findPath(horizontalMiddle, point(0, 0), point(2, 0))), { turns: 2, length: 4 });
  const verticalMiddle = Board.fromRows([[1, null], [2, null], [1, null]]);
  assert.deepEqual(pathCost(findPath(verticalMiddle, point(0, 0), point(0, 2))), { turns: 2, length: 4 });
  assertMatchesOracle(horizontalMiddle, point(0, 0), point(2, 0));
  assertMatchesOracle(verticalMiddle, point(0, 0), point(0, 2));
});

test("open zig-zag corridors support three and arbitrarily many turns", () => {
  const three = Board.fromRows([[1,null,2,null,2,2],[null,null,2,null,null,2],[2,null,null,null,null,null],[2,null,2,2,null,null],[null,2,2,2,null,null],[null,null,null,2,null,1]]);
  assert.deepEqual(pathCost(findPath(three, point(0, 0), point(5, 5))), { turns: 3, length: 10 });
  const five = Board.fromRows([[1,2,2,null,null,null],[null,null,null,null,2,null],[2,2,null,null,null,2],[null,2,null,2,null,2],[null,2,2,null,null,2],[2,2,2,2,null,1]]);
  assert.equal(pathCost(findPath(five, point(0, 0), point(5, 5))).turns, 5);
});

test("routes never use the old virtual outer border", () => {
  const board = Board.fromRows([[1, 2, 1], [2, 2, 2]]);
  assert.equal(findPath(board, point(0, 0), point(2, 0)), null);
  const edge = Board.fromRows([[1, 2, 1], [null, null, null]]);
  const path = findPath(edge, point(0, 0), point(2, 0));
  validatePath(edge, point(0, 0), point(2, 0), path);
  assert.ok(path.points.every((p) => edge.contains(p)));
});

test("removing an obstacle opens a route without mutating the original board", () => {
  const blocked = Board.fromRows([[2, 2, 2], [1, 2, 1], [2, 2, 2]]);
  assert.equal(findPath(blocked, point(0, 1), point(2, 1)), null);
  const opened = blocked.withTile(point(1, 1), null);
  assert.deepEqual(pathCost(findPath(opened, point(0, 1), point(2, 1))), { turns: 0, length: 2 });
  assert.equal(blocked.tileAt(point(1, 1)), 2);
});

test("exhaustive 2x2, 2x3, 3x2, and 3x3 boards match the independent oracle (5,112 cases)", () => {
  let cases = 0;
  for (const [width, height] of [[2, 2], [2, 3], [3, 2], [3, 3]]) {
    const cellCount = width * height;
    for (let startIndex = 0; startIndex < cellCount; startIndex += 1) {
      for (let endIndex = startIndex + 1; endIndex < cellCount; endIndex += 1) {
        for (let mask = 0; mask < 2 ** (cellCount - 2); mask += 1) {
          let bit = 0;
          const rows = Array.from({ length: height }, (_, row) => Array.from({ length: width }, (_, col) => {
            const index = row * width + col;
            if (index === startIndex || index === endIndex) return 1;
            return (mask & (1 << bit++)) === 0 ? null : 2;
          }));
          const board = Board.fromRows(rows);
          assertMatchesOracle(board, point(startIndex % width, Math.floor(startIndex / width)), point(endIndex % width, Math.floor(endIndex / width)));
          cases += 1;
        }
      }
    }
  }
  assert.equal(cases, 5_112);
});

test("5,000 deterministic random boards through 6x8 match oracle, validate, and repeat", () => {
  let state = 0x5eed1234;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  for (let iteration = 0; iteration < 5_000; iteration += 1) {
    const width = 2 + Math.floor(random() * 5);
    const height = 2 + Math.floor(random() * 7);
    const rows = Array.from({ length: height }, () => Array.from({ length: width }, () => random() < 0.48 ? 2 : null));
    const start = point(Math.floor(random() * width), Math.floor(random() * height));
    let end = point(Math.floor(random() * width), Math.floor(random() * height));
    if (same(start, end)) end = point((end.col + 1) % width, end.row);
    rows[start.row][start.col] = 1;
    rows[end.row][end.col] = 1;
    assertMatchesOracle(Board.fromRows(rows), start, end);
  }
});
