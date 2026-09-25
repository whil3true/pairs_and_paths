import assert from "node:assert/strict";
import test from "node:test";

import { BoardLayout } from "../.test-dist/game/BoardLayout.js";
import { solveBoard, validateGeneratedLevel } from "../.test-dist/domain/index.js";
import { createLevel, getLevelConfig, levelSeed } from "../.test-dist/game/LevelSequence.js";

const layout = (boardWidth, boardHeight) => new BoardLayout({
  sceneWidth: 480, sceneHeight: 800, boardWidth, boardHeight,
});

test("level 1 preserves the deterministic prototype profile", () => {
  const first = createLevel(1), second = createLevel(1);
  assert.equal(levelSeed(1), 0x0000_0000);
  assert.deepEqual(getLevelConfig(1), { width: 6, height: 8, pairCount: 20, seed: 0, avoidAdjacentMatchingPairs: true });
  assert.deepEqual(getLevelConfig(1), getLevelConfig(1));
  assert.deepEqual(first.board.toRows(), second.board.toRows());
  assert.equal(first.board.toRows().flat().filter((tile) => tile !== null).length, 40);
  assert.equal(first.board.toRows().flat().filter((tile) => tile === null).length, 8);
  assert.ok(first.metrics.initialLegalMoveCount >= 2);
  assert.ok(first.metrics.maxTurns >= 3);
});

test("level numbers must be positive integers in the uint32 sequence", () => {
  for (const invalid of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 0x1_0000_0001, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => getLevelConfig(invalid), RangeError);
  }
});

test("first 100 sequence levels are distinct, valid, non-adjacent, and solvable", () => {
  const seeds = new Set();
  let previousSnapshot = null;
  for (let levelNumber = 1; levelNumber <= 100; levelNumber += 1) {
    const config = getLevelConfig(levelNumber);
    const level = createLevel(levelNumber);
    const snapshot = JSON.stringify(level.board.toRows());
    seeds.add(config.seed);
    assert.equal(validateGeneratedLevel(level).valid, true, `level ${levelNumber} must validate`);
    assert.equal(solveBoard(level.board).status, "solved", `level ${levelNumber} must solve`);
    for (const move of level.witness) {
      const distance = Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row);
      assert.notEqual(distance, 1, `level ${levelNumber} must not start with adjacent pairs`);
    }
    if (previousSnapshot !== null) {
      assert.notEqual(snapshot, previousSnapshot, `level ${levelNumber} must differ from its predecessor`);
    }
    assert.equal(snapshot, JSON.stringify(createLevel(levelNumber).board.toRows()), "replay must reproduce the board");
    previousSnapshot = snapshot;
  }
  assert.equal(seeds.size, 100);
  assert.notEqual(getLevelConfig(42).seed, getLevelConfig(43).seed);
});

test("real cell centers and the full board fit the portrait play area", () => {
  const full = layout(6, 8);
  assert.deepEqual(full.cellCenter({ col: 0, row: 0 }), { x: 60, y: 168 });
  assert.deepEqual(full.cellCenter({ col: 5, row: 7 }), { x: 420, y: 672 });
  assert.deepEqual(
    [full.boardLeft, full.boardTop, full.boardRight, full.boardBottom],
    [24, 132, 456, 708],
  );
  assert.equal(full.pitch, 72);
  assert.equal(full.tileSize, 64);
});

test("smaller boards remain centered in the same safe play area", () => {
  const square = layout(4, 4);
  const short = layout(4, 2);
  assert.deepEqual([square.boardLeft, square.boardRight, square.boardTop, square.boardBottom], [96, 384, 276, 564]);
  assert.deepEqual([short.boardLeft, short.boardRight, short.boardTop, short.boardBottom], [96, 384, 348, 492]);
  assert.equal((square.boardLeft + square.boardRight) / 2, 240);
  assert.equal((short.boardTop + short.boardBottom) / 2, 420);
});

test("layout rejects coordinates outside the real board", () => {
  const full = layout(6, 8);
  assert.throws(() => full.cellCenter({ col: -1, row: 0 }), RangeError);
  assert.throws(() => full.cellCenter({ col: 6, row: 0 }), RangeError);
});
