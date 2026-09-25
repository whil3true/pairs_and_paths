import assert from "node:assert/strict";
import test from "node:test";

import { BoardLayout } from "../.test-dist/game/BoardLayout.js";
import { createDemoLevel, DEV_DEMO_CONFIG, DEV_DEMO_SEED } from "../.test-dist/game/DemoLevel.js";

const layout = (boardWidth, boardHeight) => new BoardLayout({
  sceneWidth: 480, sceneHeight: 800, boardWidth, boardHeight,
});

test("demo level is full, deterministic, and retains non-trivial route geometry", () => {
  const first = createDemoLevel();
  const second = createDemoLevel();
  assert.equal(DEV_DEMO_SEED, 0x5041_4952);
  assert.deepEqual(DEV_DEMO_CONFIG, { width: 6, height: 8, pairCount: 24, seed: DEV_DEMO_SEED });
  assert.deepEqual(first.board.toRows(), second.board.toRows());
  assert.equal(first.board.toRows().flat().filter((tile) => tile !== null).length, 48);
  assert.ok(first.metrics.oneTurnMoves > 0);
  assert.ok(first.metrics.twoTurnMoves > 0);
  assert.ok(first.metrics.outerBorderMoves > 0);
  assert.ok(first.metrics.initialLegalMoveCount < DEV_DEMO_CONFIG.pairCount);
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

test("padded coordinates use a small gutter rather than a full cell pitch", () => {
  const full = layout(6, 8);
  assert.deepEqual(full.gridPointToWorld({ col: -1, row: 0 }), { x: 14, y: 168 });
  assert.deepEqual(full.gridPointToWorld({ col: 6, row: 0 }), { x: 466, y: 168 });
  assert.deepEqual(full.gridPointToWorld({ col: 0, row: -1 }), { x: 60, y: 122 });
  assert.deepEqual(full.gridPointToWorld({ col: 0, row: 8 }), { x: 60, y: 718 });
  assert.equal(full.outerGutter, 10);
  assert.ok(full.outerGutter < full.pitch);
});

test("route mapping preserves orthogonal segments and stays inside safe scene bounds", () => {
  for (const dimensions of [[6, 8], [4, 4], [4, 2]]) {
    const current = layout(...dimensions);
    const route = [
      { col: 0, row: 0 }, { col: -1, row: 0 },
      { col: -1, row: dimensions[1] - 1 }, { col: dimensions[0] - 1, row: dimensions[1] - 1 },
    ].map((point) => current.gridPointToWorld(point));
    route.forEach(({ x, y }) => {
      assert.ok(x >= 0 && x <= 480);
      assert.ok(y >= 100 && y <= 740);
    });
    for (let index = 1; index < route.length; index += 1) {
      const previous = route[index - 1];
      const next = route[index];
      assert.ok(previous.x === next.x || previous.y === next.y);
    }
  }
});
