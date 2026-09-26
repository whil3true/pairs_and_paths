import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const dist = new URL("../.analysis-dist/", import.meta.url);
await rm(dist, { force: true, recursive: true });
const compile = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "--outDir", ".analysis-dist"], {
  cwd: root, shell: process.platform === "win32", stdio: "inherit",
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

const { Board, applyMove, findLegalMoves, findPath, solveBoard, validateGeneratedLevel } =
  await import("../.analysis-dist/domain/index.js");
const { CAMPAIGN_BLOCKERS, createLevel, getLevelConfig } = await import("../.analysis-dist/game/LevelSequence.js");

const routeCost = (path) => ({
  turns: Math.max(0, path.points.length - 2),
  length: path.points.slice(1).reduce((sum, point, index) =>
    sum + Math.abs(point.col - path.points[index].col) + Math.abs(point.row - path.points[index].row), 0),
});

const compareState = (board) => {
  const twin = Board.fromRows(board.toRows());
  const locations = new Map();
  board.toRows().forEach((row, rowIndex) => row.forEach((tile, col) => {
    if (tile !== null) locations.set(tile, [...(locations.get(tile) ?? []), { col, row: rowIndex }]);
  }));
  const result = { matchingPairCount: locations.size, pairsAffectedByBlockers: 0,
    pairsUnavailableBecauseOfBlockers: 0, totalExtraTurnsDueToBlockers: 0, totalExtraPathLengthDueToBlockers: 0 };
  for (const points of locations.values()) {
    const [start, end] = points;
    const blockedRoute = findPath(board, start, end), freeRoute = findPath(twin, start, end);
    if (freeRoute === null) continue;
    if (blockedRoute === null) {
      result.pairsAffectedByBlockers += 1;
      result.pairsUnavailableBecauseOfBlockers += 1;
      continue;
    }
    const blockedCost = routeCost(blockedRoute), freeCost = routeCost(freeRoute);
    const extraTurns = blockedCost.turns - freeCost.turns;
    const extraLength = blockedCost.length - freeCost.length;
    if (extraTurns > 0 || extraLength > 0) result.pairsAffectedByBlockers += 1;
    result.totalExtraTurnsDueToBlockers += extraTurns;
    result.totalExtraPathLengthDueToBlockers += extraLength;
  }
  return result;
};

const reports = [];
for (const pattern of CAMPAIGN_BLOCKERS) {
  let level;
  try { level = createLevel(pattern.levelNumber); }
  catch (error) { throw new Error(`Level ${pattern.levelNumber} generation failed`, { cause: error }); }
  const solver = solveBoard(level.board);
  const initial = compareState(level.board);
  const totals = { affected: 0, unavailable: 0, turns: 0, length: 0 };
  let replay = level.board;
  if (solver.status === "solved") for (const move of solver.moves) {
    const state = compareState(replay);
    totals.affected += state.pairsAffectedByBlockers;
    totals.unavailable += state.pairsUnavailableBecauseOfBlockers;
    totals.turns += state.totalExtraTurnsDueToBlockers;
    totals.length += state.totalExtraPathLengthDueToBlockers;
    replay = applyMove(replay, move);
  }
  const config = getLevelConfig(pattern.levelNumber);
  reports.push({ level: pattern.levelNumber, dimensions: `${config.width}x${config.height}`, pairCount: config.pairCount,
    blockerCount: pattern.blockedCells.length, coordinates: pattern.blockedCells, family: pattern.family,
    initialLegalMoves: findLegalMoves(level.board).length, initialAffectedPairs: initial.pairsAffectedByBlockers,
    totalAffectedPairStates: totals.affected, totalUnavailablePairStates: totals.unavailable,
    totalExtraTurns: totals.turns, totalExtraPathLength: totals.length,
    solverResult: solver.status, replayResult: replay.toRows().flat().every((tile) => tile === null)
      && JSON.stringify(replay.blockedCells()) === JSON.stringify(level.board.blockedCells()) ? "cleared-mask-preserved" : "failed",
    validation: validateGeneratedLevel(level).valid ? "valid" : "invalid" });
}

const ranges = [[1, 10], [11, 20], [21, 40], [41, 60], [61, 80], [81, 100]];
const hasMeasuredRelevance = (report) => report.totalAffectedPairStates > 0
  || report.totalUnavailablePairStates > 0
  || report.totalExtraTurns !== 0
  || report.totalExtraPathLength !== 0;
console.log(JSON.stringify({ levels: reports, summary: {
  blockerLevelCount: reports.length,
  frequencyByRange: Object.fromEntries(ranges.map(([start, end]) => {
    const count = reports.filter(({ level }) => level >= start && level <= end).length;
    return [`${start}-${end}`, { count, levels: end - start + 1, percent: count * 100 / (end - start + 1) }];
  })),
  averageBlockersPerBlockerLevel: reports.reduce((sum, report) => sum + report.blockerCount, 0) / reports.length,
  zeroMeasuredRelevance: reports.filter((report) => !hasMeasuredRelevance(report)).map((report) => report.level),
  strongestByAffectedStates: [...reports].sort((a, b) => b.totalAffectedPairStates - a.totalAffectedPairStates).slice(0, 5)
    .map(({ level, totalAffectedPairStates }) => ({ level, totalAffectedPairStates })),
  strongestByUnavailableStates: [...reports].sort((a, b) => b.totalUnavailablePairStates - a.totalUnavailablePairStates).slice(0, 5)
    .map(({ level, totalUnavailablePairStates }) => ({ level, totalUnavailablePairStates })),
  strongestByExtraTurns: [...reports].sort((a, b) => b.totalExtraTurns - a.totalExtraTurns).slice(0, 5)
    .map(({ level, totalExtraTurns }) => ({ level, totalExtraTurns })),
  strongestByExtraPathLength: [...reports].sort((a, b) => b.totalExtraPathLength - a.totalExtraPathLength).slice(0, 5)
    .map(({ level, totalExtraPathLength }) => ({ level, totalExtraPathLength })),
}}, null, 2));

if (reports.some((report) => report.validation !== "valid" || report.solverResult !== "solved" || report.replayResult !== "cleared-mask-preserved")) process.exit(1);
