import assert from "node:assert/strict";
import test from "node:test";

import { BoardLayout } from "../.test-dist/game/BoardLayout.js";
import { applyMove, findLegalMoves, findPath, solveBoard, validateGeneratedLevel } from "../.test-dist/domain/index.js";
import {
  CAMPAIGN_BLOCKERS, CHAPTER_COUNT, LEVELS_PER_CHAPTER, PROGRESSION_BANDS, TOTAL_LEVELS,
  createLevel, getChapterNumber, getLevelConfig, hasNextLevel, levelSeed,
  MULTI_STAGE_LEVELS, createLevelStage, getLevelStageConfigs, getStageClearOutcome, getStageCount, preStageSeed,
} from "../.test-dist/game/LevelSequence.js";

const layout = (boardWidth, boardHeight) => new BoardLayout({
  sceneWidth: 480, sceneHeight: 800, boardWidth, boardHeight,
});

test("level 1 starts the calibrated campaign with a small deterministic board", () => {
  const first = createLevel(1), second = createLevel(1);
  assert.equal(levelSeed(1), 0x0000_0000);
  assert.deepEqual(getLevelConfig(1), { width: 4, height: 4, pairCount: 4, seed: 0, avoidAdjacentMatchingPairs: true });
  assert.deepEqual(getLevelConfig(1), getLevelConfig(1));
  assert.deepEqual(first.board.toRows(), second.board.toRows());
  assert.equal(first.board.toRows().flat().filter((tile) => tile !== null).length, 8);
  assert.equal(first.board.toRows().flat().filter((tile) => tile === null).length, 8);
  assert.ok(first.metrics.initialLegalMoveCount >= 2);
});

test("opening levels increase pair workload and satisfy exact-board invariants", () => {
  const expected = [
    { width: 4, height: 4, pairCount: 4, seed: levelSeed(1), avoidAdjacentMatchingPairs: true },
    { width: 4, height: 4, pairCount: 5, seed: levelSeed(2), avoidAdjacentMatchingPairs: true },
    { width: 4, height: 4, pairCount: 6, seed: levelSeed(3), avoidAdjacentMatchingPairs: true },
  ];
  assert.deepEqual([1, 2, 3].map(getLevelConfig), expected);

  for (const levelNumber of [1, 2, 3]) {
    const first = createLevel(levelNumber);
    const second = createLevel(levelNumber);
    assert.deepEqual(first.board.toRows(), second.board.toRows(), `level ${levelNumber} must replay deterministically`);
    assert.equal(validateGeneratedLevel(first).valid, true, `level ${levelNumber} must validate`);
    assert.ok(first.metrics.initialLegalMoveCount >= 2, `level ${levelNumber} must start with at least two moves`);
    for (const move of first.witness) {
      const distance = Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row);
      assert.notEqual(distance, 1, `level ${levelNumber} must not contain adjacent matching pairs`);
    }
    const solver = solveBoard(first.board);
    assert.equal(solver.status, "solved", `level ${levelNumber} must solve`);
    let replay = first.board;
    for (const move of solver.moves) replay = applyMove(replay, move);
    assert.ok(replay.toRows().flat().every((tile) => tile === null), `level ${levelNumber} replay must empty board`);
  }
});

test("campaign constants and chapter boundaries are stable", () => {
  assert.equal(TOTAL_LEVELS, 100);
  assert.equal(CHAPTER_COUNT, 10);
  assert.equal(LEVELS_PER_CHAPTER, 10);
  assert.deepEqual([1, 10, 11, 90, 91, 100].map(getChapterNumber), [1, 1, 2, 9, 10, 10]);
});

test("campaign blockers preserve the pilot and exact curated rhythm", () => {
  const expected = new Map([[11, [{ col: 2, row: 2 }]], [12, [{ col: 2, row: 1 }, { col: 2, row: 3 }]],
    [13, [{ col: 1, row: 1 }, { col: 2, row: 2 }, { col: 3, row: 2 }]]]);
  for (const [levelNumber, wanted] of expected) assert.deepEqual(getLevelConfig(levelNumber).blockedCells, wanted);
  assert.deepEqual(CAMPAIGN_BLOCKERS.map(({ levelNumber }) => levelNumber), [
    11, 12, 13, 16, 19, 22, 25, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56,
    58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100,
  ]);
  for (const levelNumber of [1, 10, 14, 15, 17, 20, 21, 31, 41, 61, 81, 99]) {
    assert.equal(getLevelConfig(levelNumber).blockedCells, undefined, `level ${levelNumber} must remain a breathing level`);
  }
});

test("campaign blocker data has unique in-range levels and valid coordinates and capacity", () => {
  assert.equal(new Set(CAMPAIGN_BLOCKERS.map(({ levelNumber }) => levelNumber)).size, CAMPAIGN_BLOCKERS.length);
  for (const { levelNumber, blockedCells } of CAMPAIGN_BLOCKERS) {
    assert.ok(levelNumber >= 1 && levelNumber <= TOTAL_LEVELS);
    const { width, height, pairCount } = getLevelConfig(levelNumber);
    assert.ok(2 * pairCount + blockedCells.length <= width * height, `level ${levelNumber} capacity`);
    const keys = new Set();
    for (const { col, row } of blockedCells) {
      assert.ok(col >= 0 && col < width && row >= 0 && row < height, `level ${levelNumber} blocker bounds`);
      keys.add(`${col},${row}`);
    }
    assert.equal(keys.size, blockedCells.length, `level ${levelNumber} blocker uniqueness`);
    assert.deepEqual(createLevel(levelNumber).board.blockedCells(), blockedCells);
  }
});

test("progression bands cover the campaign exactly once without gaps or overlaps", () => {
  assert.equal(PROGRESSION_BANDS[0].startLevel, 1);
  assert.equal(PROGRESSION_BANDS.at(-1).endLevel, TOTAL_LEVELS);
  const coverage = Array(TOTAL_LEVELS + 1).fill(0);
  for (const band of PROGRESSION_BANDS) {
    assert.ok(band.startLevel <= band.endLevel);
    for (let level = band.startLevel; level <= band.endLevel; level += 1) coverage[level] += 1;
  }
  assert.deepEqual(coverage.slice(1), Array(TOTAL_LEVELS).fill(1));
});

test("early progression transitions have frozen profiles", () => {
  const profile = (level) => {
    const { width, height, pairCount } = getLevelConfig(level);
    return { width, height, pairCount };
  };
  assert.deepEqual([3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 16, 17, 20, 21, 23, 24, 26, 27, 30, 31]
    .map((level) => [level, profile(level)]), [
    [3, { width: 4, height: 4, pairCount: 6 }], [4, { width: 4, height: 5, pairCount: 5 }],
    [5, { width: 4, height: 5, pairCount: 5 }], [6, { width: 4, height: 5, pairCount: 6 }],
    [7, { width: 4, height: 5, pairCount: 6 }], [8, { width: 5, height: 5, pairCount: 7 }],
    [10, { width: 5, height: 5, pairCount: 7 }], [11, { width: 5, height: 5, pairCount: 8 }],
    [13, { width: 5, height: 5, pairCount: 8 }], [14, { width: 5, height: 6, pairCount: 9 }],
    [16, { width: 5, height: 6, pairCount: 9 }], [17, { width: 5, height: 6, pairCount: 11 }],
    [20, { width: 5, height: 6, pairCount: 11 }], [21, { width: 5, height: 7, pairCount: 12 }],
    [23, { width: 5, height: 7, pairCount: 12 }], [24, { width: 6, height: 6, pairCount: 13 }],
    [26, { width: 6, height: 6, pairCount: 13 }], [27, { width: 6, height: 7, pairCount: 15 }],
    [30, { width: 6, height: 7, pairCount: 15 }], [31, { width: 6, height: 7, pairCount: 16 }],
  ]);
});

test("level numbers must be integers inside the finite campaign", () => {
  for (const invalid of [0, 101, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => getLevelConfig(invalid), RangeError);
    assert.throws(() => getChapterNumber(invalid), RangeError);
    assert.throws(() => hasNextLevel(invalid), RangeError);
  }
});

test("only levels 1 through 99 have a next level", () => {
  for (let level = 1; level < TOTAL_LEVELS; level += 1) assert.equal(hasNextLevel(level), true);
  assert.equal(hasNextLevel(100), false);
  assert.throws(() => createLevel(101), RangeError);
});

test("multi-stage pilot is limited to levels 21, 24, and 30", () => {
  assert.deepEqual(MULTI_STAGE_LEVELS.map(({ levelNumber }) => levelNumber), [21, 24, 30]);
  assert.equal(TOTAL_LEVELS, 100);
  assert.equal(getStageCount(21), 2);
  assert.equal(getStageCount(24), 2);
  assert.equal(getStageCount(30), 3);
  for (let level = 1; level <= TOTAL_LEVELS; level += 1) {
    if (![21, 24, 30].includes(level)) assert.equal(getStageCount(level), 1);
  }
});

test("pre-stage seeds and exact pilot configs are stable", () => {
  assert.deepEqual([preStageSeed(21, 0), preStageSeed(24, 0), preStageSeed(30, 0), preStageSeed(30, 1)],
    [422698975, 1803337488, 1422392722, 319819725]);
  const profiles = [21, 24, 30].map((level) => getLevelStageConfigs(level)
    .map(({ width, height, pairCount, seed, blockedCells }) =>
      ({ width, height, pairCount, seed, blockerCount: blockedCells?.length ?? 0 })));
  assert.deepEqual(profiles, [
    [{ width: 5, height: 5, pairCount: 8, seed: 422698975, blockerCount: 0 },
      { width: 5, height: 7, pairCount: 12, seed: levelSeed(21), blockerCount: 0 }],
    [{ width: 5, height: 6, pairCount: 10, seed: 1803337488, blockerCount: 0 },
      { width: 6, height: 6, pairCount: 13, seed: levelSeed(24), blockerCount: 0 }],
    [{ width: 4, height: 5, pairCount: 6, seed: 1422392722, blockerCount: 0 },
      { width: 5, height: 6, pairCount: 9, seed: 319819725, blockerCount: 0 },
      { width: 6, height: 7, pairCount: 15, seed: levelSeed(30), blockerCount: 3 }],
  ]);
  assert.equal(new Set(profiles.flat().map(({ seed }) => seed)).size, 7);
});

test("every campaign stage validates, solves, replays, preserves blockers, and avoids adjacent pairs", () => {
  for (let levelNumber = 1; levelNumber <= TOTAL_LEVELS; levelNumber += 1) {
    const configs = getLevelStageConfigs(levelNumber);
    assert.deepEqual(configs.at(-1), getLevelConfig(levelNumber));
    for (let stageIndex = 0; stageIndex < configs.length; stageIndex += 1) {
      const generated = createLevelStage(levelNumber, stageIndex);
      assert.deepEqual(generated.board.toRows(), createLevelStage(levelNumber, stageIndex).board.toRows());
      assert.equal(validateGeneratedLevel(generated).valid, true, `${levelNumber}:${stageIndex} validates`);
      const solved = solveBoard(generated.board);
      assert.equal(solved.status, "solved", `${levelNumber}:${stageIndex} solves`);
      let replay = generated.board;
      for (const move of solved.moves) replay = applyMove(replay, move);
      assert.equal(replay.hasTiles(), false);
      assert.deepEqual(replay.blockedCells(), generated.board.blockedCells());
      for (const move of generated.witness) {
        assert.notEqual(Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row), 1);
      }
    }
    const final = createLevelStage(levelNumber, configs.length - 1);
    const original = createLevel(levelNumber);
    assert.deepEqual(final.board.toRows(), original.board.toRows());
    assert.deepEqual(final.board.blockedCells(), original.board.blockedCells());
    assert.deepEqual(final.witness, original.witness);
  }
});

test("stage clear outcomes keep the level stable and reset actions target stage zero", () => {
  assert.deepEqual(getStageClearOutcome(30, 0), { kind: "next-stage", stageIndex: 1 });
  assert.deepEqual(getStageClearOutcome(30, 1), { kind: "next-stage", stageIndex: 2 });
  assert.deepEqual(getStageClearOutcome(30, 2), { kind: "level-complete" });
  assert.deepEqual(getStageClearOutcome(100, 0), { kind: "level-complete" });
  assert.equal(hasNextLevel(100), false);
  // Replay, Next Level, and campaign restart all call PlayScene.startLevel(), whose first action is stageIndex = 0.
  assert.deepEqual(createLevelStage(21, 0).config, getLevelStageConfigs(21)[0]);
});

test("first 100 sequence levels are distinct, valid, non-adjacent, and solvable", () => {
  const seeds = new Set();
  let previousSnapshot = null;
  for (let levelNumber = 1; levelNumber <= 100; levelNumber += 1) {
    const config = getLevelConfig(levelNumber);
    assert.deepEqual(config, getLevelConfig(levelNumber), `level ${levelNumber} config must be deterministic`);
    const level = createLevel(levelNumber);
    const snapshot = JSON.stringify({ rows: level.board.toRows(), blocked: level.board.blockedCells() });
    seeds.add(config.seed);
    assert.equal(validateGeneratedLevel(level).valid, true, `level ${levelNumber} must validate`);
    const solver = solveBoard(level.board);
    assert.equal(solver.status, "solved", `level ${levelNumber} must solve`);
    let replay = level.board;
    for (const move of solver.moves) {
      assert.deepEqual(findPath(replay, move.start, move.end), move.path);
      replay = applyMove(replay, move);
    }
    assert.ok(replay.toRows().flat().every((tile) => tile === null), `level ${levelNumber} solver replay must empty board`);
    assert.deepEqual(replay.blockedCells(), level.board.blockedCells(), `level ${levelNumber} blockers must survive replay`);
    for (const move of level.witness) {
      const distance = Math.abs(move.start.col - move.end.col) + Math.abs(move.start.row - move.end.row);
      assert.notEqual(distance, 1, `level ${levelNumber} must not start with adjacent pairs`);
    }
    if (previousSnapshot !== null) {
      assert.notEqual(snapshot, previousSnapshot, `level ${levelNumber} must differ from its predecessor`);
    }
    const repeated = createLevel(levelNumber).board;
    assert.equal(snapshot, JSON.stringify({ rows: repeated.toRows(), blocked: repeated.blockedCells() }), "replay must reproduce the board");
    if (levelNumber <= 5) assert.ok(level.metrics.initialLegalMoveCount >= 2, `level ${levelNumber} must start with at least two moves`);
    assert.ok(level.metrics.initialLegalMoveCount >= 1, `level ${levelNumber} must start with a move`);
    previousSnapshot = snapshot;
  }
  assert.equal(seeds.size, 100);
  assert.notEqual(getLevelConfig(42).seed, getLevelConfig(43).seed);
});

test("every legal move encountered in campaign blocker solver replay preserves solvability", () => {
  for (const { levelNumber } of CAMPAIGN_BLOCKERS) {
    let board = createLevel(levelNumber).board;
    const replay = solveBoard(board);
    assert.equal(replay.status, "solved");
    for (const chosen of replay.moves) {
      for (const move of findLegalMoves(board)) {
        assert.equal(solveBoard(applyMove(board, move)).status, "solved", `level ${levelNumber} legal move must remain solvable`);
      }
      board = applyMove(board, chosen);
    }
  }
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
