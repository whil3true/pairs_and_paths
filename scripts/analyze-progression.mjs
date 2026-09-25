import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : Number(process.argv[index + 1]);
};
const sampleSize = argument("--samples", 300);
if (!Number.isSafeInteger(sampleSize) || sampleSize < 1) process.exit(2);

const root = new URL("../", import.meta.url);
await rm(new URL("../.analysis-dist", import.meta.url), { force: true, recursive: true });
const compiler = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", [
  "tsc", "--outDir", ".analysis-dist",
], { cwd: root, shell: process.platform === "win32", stdio: "inherit" });
if (compiler.status !== 0) process.exit(compiler.status ?? 1);

const { generateLevel, measureSolution, solveBoard, validateGeneratedLevel } =
  await import("../.analysis-dist/domain/index.js");
const { CHAPTER_COUNT, LEVELS_PER_CHAPTER, createLevel, getChapterNumber } =
  await import("../.analysis-dist/game/LevelSequence.js");

const ranges = [
  [4, 4, 4, 6], [4, 5, 5, 8], [5, 5, 7, 10], [5, 6, 9, 12],
  [5, 7, 11, 14], [6, 6, 12, 15], [6, 7, 14, 18], [6, 8, 18, 22],
];
const profiles = ranges.flatMap(([width, height, first, last]) =>
  Array.from({ length: last - first + 1 }, (_, offset) => ({ width, height, pairCount: first + offset })));

const adjacentPairCount = (board) => {
  const positions = new Map();
  board.toRows().forEach((row, rowIndex) => row.forEach((tile, col) => {
    if (tile !== null) positions.set(tile, [...(positions.get(tile) ?? []), { col, row: rowIndex }]);
  }));
  return [...positions.values()].filter(([a, b]) =>
    Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1).length;
};

const analyze = (profile) => {
  const total = (field) => samples.reduce((sum, sample) => sum + sample[field], 0);
  const samples = [];
  let generationFailures = 0, solverFailures = 0, adjacentMatchingPairs = 0;
  for (let seed = 0; seed < sampleSize; seed += 1) {
    try {
      const level = generateLevel({ ...profile, seed, avoidAdjacentMatchingPairs: true });
      const validation = validateGeneratedLevel(level);
      if (!validation.valid) throw new Error(validation.errors.join("; "));
      adjacentMatchingPairs += adjacentPairCount(level.board);
      const solved = solveBoard(level.board);
      if (solved.status !== "solved") { solverFailures += 1; continue; }
      samples.push(measureSolution(level.board, solved.moves));
    } catch { generationFailures += 1; }
  }
  const solved = samples.length;
  const paths = solved * profile.pairCount;
  return {
    profile: `${profile.width}x${profile.height}/${profile.pairCount}`,
    sampleSize,
    boardArea: profile.width * profile.height,
    occupiedCells: profile.pairCount * 2,
    emptyCells: profile.width * profile.height - profile.pairCount * 2,
    generationSuccesses: sampleSize - generationFailures,
    generationFailures,
    solverSuccesses: solved,
    solverFailures,
    adjacentMatchingPairs,
    averageInitialLegalMoveCount: solved ? total("initialLegalMoveCount") / solved : 0,
    initialLegalMoveCountMin: solved ? Math.min(...samples.map((item) => item.initialLegalMoveCount)) : 0,
    initialLegalMoveCountMax: solved ? Math.max(...samples.map((item) => item.initialLegalMoveCount)) : 0,
    initialOneMovePercent: solved ? samples.filter((item) => item.initialLegalMoveCount === 1).length / solved * 100 : 0,
    averageLegalMoveCountDuringSolverPlay: solved ? total("averageLegalMoveCount") / solved : 0,
    forcedMoveSteps: total("forcedMoveSteps"),
    forcedMoveRatio: paths ? total("forcedMoveSteps") / paths : 0,
    averagePathTurns: paths ? total("averageTurns") / solved : 0,
    maxTurns: solved ? Math.max(...samples.map((item) => item.maxTurns)) : 0,
    threePlusTurnRouteRate: paths ? total("threePlusTurnMoves") / paths : 0,
    averagePathLength: paths ? total("totalSolutionPathLength") / paths : 0,
  };
};

const started = performance.now();
const candidates = profiles.map(analyze);
const campaignLevels = Array.from({ length: CHAPTER_COUNT * LEVELS_PER_CHAPTER }, (_, index) => {
  const levelNumber = index + 1;
  const level = createLevel(levelNumber);
  const solver = solveBoard(level.board);
  if (solver.status !== "solved") throw new Error(`Campaign level ${levelNumber} did not solve`);
  return { levelNumber, level, metrics: measureSolution(level.board, solver.moves) };
});
const campaign = Array.from({ length: CHAPTER_COUNT }, (_, index) => {
  const levels = campaignLevels.filter(({ levelNumber }) => getChapterNumber(levelNumber) === index + 1);
  const sum = (read) => levels.reduce((total, item) => total + read(item), 0);
  const pairPaths = sum(({ metrics }) => metrics.pairCount);
  return {
    chapter: index + 1,
    profile: `${levels[0].level.config.width}x${levels[0].level.config.height}/${levels[0].level.config.pairCount}`,
    averagePairCount: sum(({ metrics }) => metrics.pairCount) / levels.length,
    averageInitialLegalMoves: sum(({ metrics }) => metrics.initialLegalMoveCount) / levels.length,
    minimumInitialLegalMoves: Math.min(...levels.map(({ metrics }) => metrics.initialLegalMoveCount)),
    averageLegalMovesDuringSolverPlay: sum(({ metrics }) => metrics.averageLegalMoveCount) / levels.length,
    forcedStepRatio: sum(({ metrics }) => metrics.forcedMoveSteps) / pairPaths,
    averageTurns: sum(({ metrics }) => metrics.averageTurns * metrics.pairCount) / pairPaths,
    threePlusTurnRate: sum(({ metrics }) => metrics.threePlusTurnMoves) / pairPaths,
    averagePathLength: sum(({ metrics }) => metrics.totalSolutionPathLength) / pairPaths,
  };
});
console.log(JSON.stringify({ sampleSize, elapsedMs: Math.round(performance.now() - started), candidates, campaign }, null, 2));
if (candidates.some((candidate) => candidate.generationFailures || candidate.solverFailures || candidate.adjacentMatchingPairs)) process.exit(1);
