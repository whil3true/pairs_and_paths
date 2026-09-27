import assert from "node:assert/strict";
import test from "node:test";

import { Board, applyMove, findLegalMoves } from "../.test-dist/domain/index.js";
import { getHintMove } from "../.test-dist/game/Hint.js";
import { TOTAL_LEVELS, createLevelStage, getStageCount } from "../.test-dist/game/LevelSequence.js";

test("hint returns the deterministic first legal move on the current board", () => {
  const initial = createLevelStage(1, 0).board;
  const expected = findLegalMoves(initial)[0];
  assert.ok(expected);
  assert.deepEqual(getHintMove(initial), expected);
  assert.deepEqual(getHintMove(initial), getHintMove(initial));

  const current = applyMove(initial, expected);
  assert.deepEqual(getHintMove(current), findLegalMoves(current)[0] ?? null);
  assert.notDeepEqual(getHintMove(current), expected);
});

test("hint paths on a blocker campaign board never enter blocked cells", () => {
  const board = createLevelStage(80, getStageCount(80) - 1).board;
  const hint = getHintMove(board);
  assert.ok(hint);
  for (const point of hint.path.points) assert.equal(board.isBlocked(point), false);
});

test("hint returns null when there is no legal move", () => {
  assert.equal(getHintMove(Board.fromRows([[null, null], [null, null]])), null);
  assert.equal(getHintMove(Board.fromRows([[1, 2], [3, 4]])), null);
});

test("following current-board hints clears every campaign stage", () => {
  for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber += 1) {
    for (let stageIndex = 0; stageIndex < getStageCount(levelNumber); stageIndex += 1) {
      let board = createLevelStage(levelNumber, stageIndex).board;
      while (board.hasTiles()) {
        const hint = getHintMove(board);
        assert.ok(hint, `level ${levelNumber} stage ${stageIndex + 1} must have a hint`);
        assert.deepEqual(hint, findLegalMoves(board)[0]);
        board = applyMove(board, hint);
      }
    }
  }
});
