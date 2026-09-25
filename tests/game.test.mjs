import assert from "node:assert/strict";
import test from "node:test";

import { BoardLayout } from "../.test-dist/game/BoardLayout.js";
import { createDemoLevel, DEV_DEMO_CONFIG, DEV_DEMO_SEED } from "../.test-dist/game/DemoLevel.js";

const layout = (boardWidth, boardHeight) => new BoardLayout({
  sceneWidth: 480, sceneHeight: 800, boardWidth, boardHeight,
});

test("demo is deterministic, sparse, non-adjacent, and solvable", () => {
  const first = createDemoLevel(), second = createDemoLevel();
  assert.equal(DEV_DEMO_SEED, 0x0000_0000);
  assert.deepEqual(DEV_DEMO_CONFIG, { width: 6, height: 8, pairCount: 20, seed: DEV_DEMO_SEED, avoidAdjacentMatchingPairs: true });
  assert.deepEqual(first.board.toRows(), second.board.toRows());
  assert.equal(first.board.toRows().flat().filter((tile) => tile !== null).length, 40);
  assert.equal(first.board.toRows().flat().filter((tile) => tile === null).length, 8);
  assert.ok(first.metrics.initialLegalMoveCount >= 2);
  assert.ok(first.metrics.maxTurns >= 3);
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
