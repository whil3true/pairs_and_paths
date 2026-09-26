import assert from "node:assert/strict";
import test from "node:test";

import {
  Board, SeededRandom, applyMove, findLegalMoves, findPath, generateLevel,
  solveBoard, validateGeneratedLevel,
} from "../.test-dist/domain/index.js";

const empty = (board) => board.toRows().every((row) => row.every((tile) => tile === null));
const snapshot = (level) => JSON.stringify({ rows: level.board.toRows(), witness: level.witness });

function replay(board, moves) {
  let state = board;
  for (const move of moves) {
    assert.deepEqual(findPath(state, move.start, move.end), move.path);
    state = applyMove(state, move);
  }
  return state;
}

// Test-only exhaustive backtracker. Unlike the production greedy solver, it
// explores every currently connectable unique pair and memoizes board snapshots.
function oracleSolvable(initial) {
  const failed = new Set();
  function visit(board) {
    const key = JSON.stringify(board.toRows());
    if (empty(board)) return true;
    if (failed.has(key)) return false;
    const positions = new Map();
    board.toRows().forEach((row, rowIndex) => row.forEach((tile, col) => {
      if (tile !== null) positions.set(tile, [...(positions.get(tile) ?? []), { col, row: rowIndex }]);
    }));
    for (const [tileId, points] of positions) {
      if (points.length !== 2) return false;
      const path = findPath(board, points[0], points[1]);
      if (path !== null && visit(applyMove(board, { tileId, start: points[0], end: points[1], path }))) return true;
    }
    failed.add(key);
    return false;
  }
  return visit(initial);
}

test("Mulberry32 has frozen outputs, supports zero, and validates its API", () => {
  const zero = new SeededRandom(0);
  assert.deepEqual(Array.from({ length: 5 }, () => zero.nextUint32()),
    [1144304738, 1416247, 958946056, 627933444, 2007157716]);
  const maximum = new SeededRandom(0xffff_ffff);
  assert.deepEqual(Array.from({ length: 5 }, () => maximum.nextUint32()),
    [3850105811, 813802916, 3073704848, 4054706436, 3630262831]);
  assert.throws(() => new SeededRandom(-1), RangeError);
  assert.throws(() => new SeededRandom(0x1_0000_0000), RangeError);
  assert.throws(() => new SeededRandom(1).nextInt(0), RangeError);
  const source = [1, 2, 3, 4];
  new SeededRandom(3).shuffle(source);
  assert.deepEqual(source, [1, 2, 3, 4]);
});

test("legal moves are stable, matching, and applyMove is pure and explicit", () => {
  const board = Board.fromRows([[2, 1, 1, 2], [null, 3, null, 3]]);
  const moves = findLegalMoves(board);
  assert.deepEqual(moves.map(({ tileId }) => tileId), [1, 3]);
  const changed = applyMove(board, moves[0]);
  assert.equal(board.tileAt({ col: 1, row: 0 }), 1);
  assert.equal(changed.tileAt({ col: 1, row: 0 }), null);
  assert.throws(() => applyMove(board, { ...moves[0], tileId: 99 }), /not legal/);
  assert.deepEqual(findLegalMoves(board), moves);
});

test("moves and solver preserve and ignore static blocker terrain", () => {
  const blockers = [{ col: 1, row: 0 }];
  const board = Board.fromRows([[1, null, 1], [null, null, null], [2, null, 2]], blockers);
  const moves = findLegalMoves(board);
  assert.deepEqual(moves.map(({ tileId }) => tileId), [1, 2]);
  const changed = applyMove(board, moves[0]);
  assert.deepEqual(changed.blockedCells(), blockers);
  const result = solveBoard(board);
  assert.equal(result.status, "solved");
  assert.equal(replay(board, result.moves).hasTiles(), false);
  assert.deepEqual(replay(board, result.moves).blockedCells(), blockers);
  const sealed = Board.fromRows([[1, null, 1]], [{ col: 1, row: 0 }]);
  assert.equal(solveBoard(sealed).status, "unsolvable");
});

test("solver distinguishes solved, unsolvable, and unsupported boards", () => {
  assert.deepEqual(solveBoard(Board.fromRows([[null]])).status, "solved");
  assert.equal(solveBoard(Board.fromRows([[1]])).status, "unsupported");
  const blocked = Board.fromRows([[1, 2], [2, 1]]);
  assert.equal(solveBoard(blocked).status, "unsolvable");
  const board = Board.fromRows([[1, 1], [2, 2]]);
  const result = solveBoard(board);
  assert.equal(result.status, "solved");
  assert.ok(empty(replay(board, result.moves)));
  assert.deepEqual(solveBoard(board), result);
});

test("generator rejects invalid dimensions, counts, and seeds", () => {
  for (const config of [
    { width: 0, height: 2, pairCount: 1, seed: 0 },
    { width: 7, height: 2, pairCount: 1, seed: 0 },
    { width: 2, height: 0, pairCount: 1, seed: 0 },
    { width: 2, height: 9, pairCount: 1, seed: 0 },
    { width: 2, height: 2, pairCount: 0, seed: 0 },
    { width: 2, height: 2, pairCount: 3, seed: 0 },
    { width: 2, height: 2, pairCount: 1, seed: -1 },
    { width: 2, height: 2, pairCount: 1, seed: 0x1_0000_0000 },
  ]) assert.throws(() => generateLevel(config), RangeError);
});

test("seeded reverse generation preserves pair, witness, solver, and product invariants", () => {
  const configs = [
    { width: 4, height: 4, pairCount: 5, seed: 1, avoidAdjacentMatchingPairs: true },
    { width: 6, height: 8, pairCount: 18, seed: 2, avoidAdjacentMatchingPairs: true },
    { width: 6, height: 8, pairCount: 20, seed: 3, avoidAdjacentMatchingPairs: true },
    { width: 4, height: 2, pairCount: 4, seed: 4 },
  ];
  for (const config of configs) {
    const level = generateLevel(config);
    assert.equal(validateGeneratedLevel(level).valid, true);
    assert.equal(snapshot(generateLevel(config)), snapshot(level));
    assert.ok(empty(replay(level.board, level.witness)));
    const solved = solveBoard(level.board);
    assert.equal(solved.status, "solved");
    assert.ok(empty(replay(level.board, solved.moves)));
    if (config.avoidAdjacentMatchingPairs) for (const move of level.witness) {
      assert.notEqual(Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row), 1);
    }
  }
});

test("blocker generation validates config, is deterministic, and preserves terrain", () => {
  const config = { width: 5, height: 5, pairCount: 8, seed: 41, avoidAdjacentMatchingPairs: true,
    blockedCells: [{ col: 2, row: 1 }, { col: 2, row: 2 }] };
  const level = generateLevel(config);
  assert.equal(validateGeneratedLevel(level).valid, true);
  assert.equal(snapshot(generateLevel(config)), snapshot(level));
  for (const blocker of config.blockedCells) assert.equal(level.board.tileAt(blocker), null);
  const cleared = replay(level.board, level.witness);
  assert.equal(cleared.hasTiles(), false);
  assert.deepEqual(cleared.blockedCells(), config.blockedCells);
  assert.throws(() => generateLevel({ width: 2, height: 2, pairCount: 1, seed: 0, blockedCells: [{ col: 2, row: 0 }] }), RangeError);
  assert.throws(() => generateLevel({ width: 2, height: 2, pairCount: 1, seed: 0, blockedCells: [{ col: 0, row: 0 }, { col: 0, row: 0 }] }), TypeError);
  assert.throws(() => generateLevel({ width: 2, height: 2, pairCount: 2, seed: 0, blockedCells: [{ col: 0, row: 0 }] }), RangeError);
});

test("small generated boards agree with independent exhaustive solver", () => {
  for (let seed = 0; seed < 200; seed += 1) {
    const level = generateLevel({ width: 4, height: 2, pairCount: 1 + seed % 4, seed });
    assert.equal(oracleSolvable(level.board), true);
    assert.equal(solveBoard(level.board).status, "solved");
  }
});

test("metrics describe unlimited-turn solutions", () => {
  const level = generateLevel({ width: 6, height: 8, pairCount: 20, seed: 7, avoidAdjacentMatchingPairs: true });
  assert.equal(Object.values(level.metrics.turnHistogram).reduce((a, b) => a + b, 0), 20);
  assert.equal(level.metrics.threePlusTurnRate, level.metrics.threePlusTurnMoves / 20);
  assert.ok(level.metrics.averageSolutionPathLength > 0);
});


test("exhaustive small pair boards confirm every legal choice preserves solvability", () => {
  let solvableBoards = 0;
  const cellCount = 6;
  // All 15 perfect matchings of a full 2x3 board, with canonical unique IDs.
  function match(remaining, pairs = []) {
    if (remaining.length === 0) {
      const cells = Array(cellCount).fill(null);
      pairs.forEach(([a, b], index) => { cells[a] = index + 1; cells[b] = index + 1; });
      const board = Board.fromRows([cells.slice(0, 3), cells.slice(3)]);
      if (!oracleSolvable(board)) return;
      solvableBoards += 1;
      for (const move of findLegalMoves(board)) assert.equal(oracleSolvable(applyMove(board, move)), true);
      return;
    }
    const first = remaining[0];
    for (let index = 1; index < remaining.length; index += 1) {
      match(remaining.slice(1, index).concat(remaining.slice(index + 1)), [...pairs, [first, remaining[index]]]);
    }
  }
  match([0, 1, 2, 3, 4, 5]);
  assert.ok(solvableBoards > 0);
});

test("static-blocker small boards preserve solvability after every legal first move", () => {
  let checked = 0;
  for (let blockerMask = 1; blockerMask < 1 << 6; blockerMask += 1) {
    const playable = Array.from({ length: 6 }, (_, index) => index).filter((index) => !(blockerMask & (1 << index)));
    if (playable.length < 4) continue;
    for (let seed = 0; seed < 8; seed += 1) {
      const blockedCells = Array.from({ length: 6 }, (_, index) => index).filter((index) => blockerMask & (1 << index))
        .map((index) => ({ col: index % 3, row: Math.floor(index / 3) }));
      let level;
      try { level = generateLevel({ width: 3, height: 2, pairCount: 2, seed, blockedCells }); } catch { continue; }
      assert.equal(oracleSolvable(level.board), true);
      for (const move of findLegalMoves(level.board)) assert.equal(oracleSolvable(applyMove(level.board, move)), true);
      checked += 1;
    }
  }
  assert.ok(checked > 0);
});

test("generated-level validator detects structural and stale-witness corruption", () => {
  const level = generateLevel({ width: 4, height: 2, pairCount: 3, seed: 42 });
  const badBoard = level.board.withTile(level.witness[0].start, 999);
  assert.equal(validateGeneratedLevel({ ...level, board: badBoard }).valid, false);
  const badMove = { ...level.witness[0], path: { points: [level.witness[0].start, { col: -1, row: -1 }, level.witness[0].end] } };
  assert.equal(validateGeneratedLevel({ ...level, witness: [badMove, ...level.witness.slice(1)] }).valid, false);
});
