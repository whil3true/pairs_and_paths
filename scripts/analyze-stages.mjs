import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const dist = new URL("../.analysis-dist/", import.meta.url);
await rm(dist, { force: true, recursive: true });
const compile = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "--outDir", ".analysis-dist"], {
  cwd: root, shell: process.platform === "win32", stdio: "inherit",
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

const { applyMove, solveBoard, validateGeneratedLevel } = await import("../.analysis-dist/domain/index.js");
const {
  MULTI_STAGE_LEVELS, TOTAL_LEVELS, createLevel, createLevelStage, getLevelConfig,
  getLevelStageConfigs, getStageCount,
} = await import("../.analysis-dist/game/LevelSequence.js");

const snapshot = (generated) => JSON.stringify({
  rows: generated.board.toRows(), blockedCells: generated.board.blockedCells(), witness: generated.witness,
});
const clear = (board, moves) => moves.reduce((state, move) => applyMove(state, move), board);
const reports = MULTI_STAGE_LEVELS.map(({ levelNumber }) => {
  const configs = getLevelStageConfigs(levelNumber);
  const stages = configs.map((config, stageIndex) => {
    const generated = createLevelStage(levelNumber, stageIndex);
    const solver = solveBoard(generated.board);
    const replay = solver.status === "solved" ? clear(generated.board, solver.moves) : generated.board;
    return {
      stage: stageIndex + 1, dimensions: `${config.width}x${config.height}`, pairCount: config.pairCount,
      blockerCount: config.blockedCells?.length ?? 0, seed: config.seed,
      initialLegalMoves: generated.metrics.initialLegalMoveCount, solverStatus: solver.status,
      replayStatus: !replay.hasTiles() && JSON.stringify(replay.blockedCells()) === JSON.stringify(generated.board.blockedCells())
        ? "cleared-mask-preserved" : "failed",
      validation: validateGeneratedLevel(generated).valid ? "valid" : "invalid",
      averageTurns: generated.metrics.averageTurns,
      threePlusTurnRate: generated.metrics.threePlusTurnRate,
      averagePathLength: generated.metrics.averageSolutionPathLength,
    };
  });
  const oldPairWorkload = getLevelConfig(levelNumber).pairCount;
  const totalPairRemovals = configs.reduce((sum, config) => sum + config.pairCount, 0);
  return { level: levelNumber, stageCount: stages.length, stages, oldPairWorkload, totalPairRemovals,
    workloadMultiplier: totalPairRemovals / oldPairWorkload };
});

const multiStageLevels = reports.map(({ level }) => level);
const spacings = multiStageLevels.slice(1).map((level, index) => level - multiStageLevels[index]);
const rangeCounts = [
  { range: "1-20", start: 1, end: 20 },
  { range: "21-40", start: 21, end: 40 },
  { range: "41-60", start: 41, end: 60 },
  { range: "61-80", start: 61, end: 80 },
  { range: "81-100", start: 81, end: 100 },
].map(({ range, start, end }) => ({
  range, count: multiStageLevels.filter((level) => level >= start && level <= end).length,
}));
const singleStageRuns = [
  multiStageLevels[0] - 1,
  ...spacings.map((spacing) => spacing - 1),
  TOTAL_LEVELS - multiStageLevels.at(-1),
];
const finalOnlyCampaignPairWorkload = Array.from({ length: TOTAL_LEVELS }, (_, index) =>
  getLevelConfig(index + 1).pairCount).reduce((sum, count) => sum + count, 0);
const preludePairWorkload = reports.reduce((sum, report) =>
  sum + report.totalPairRemovals - report.oldPairWorkload, 0);
const actualCampaignPairWorkload = finalOnlyCampaignPairWorkload + preludePairWorkload;
const totalGeneratedStages = Array.from({ length: TOTAL_LEVELS }, (_, index) => getStageCount(index + 1))
  .reduce((sum, count) => sum + count, 0);
const finalStagePreserved = Array.from({ length: TOTAL_LEVELS }, (_, index) => index + 1).every((levelNumber) => {
  const final = createLevelStage(levelNumber, getStageCount(levelNumber) - 1);
  return JSON.stringify(getLevelStageConfigs(levelNumber).at(-1)) === JSON.stringify(getLevelConfig(levelNumber))
    && snapshot(final) === snapshot(createLevel(levelNumber));
});
console.log(JSON.stringify({ levels: reports, summary: {
  multiStageLevels,
  stageCountByLevel: reports.map(({ level, stageCount }) => ({ level, stageCount })),
  multiStageLevelCount: MULTI_STAGE_LEVELS.length,
  twoStageCount: reports.filter(({ stageCount }) => stageCount === 2).length,
  threeStageCount: reports.filter(({ stageCount }) => stageCount === 3).length,
  rangeCounts,
  blockerFinalMultiStageCount: reports.filter(({ stages }) => stages.at(-1).blockerCount > 0).length,
  normalFinalMultiStageCount: reports.filter(({ stages }) => stages.at(-1).blockerCount === 0).length,
  spacings,
  longestSingleStageRun: Math.max(...singleStageRuns),
  adjacentMultiStageLevels: spacings.flatMap((spacing, index) => spacing === 1
    ? [[multiStageLevels[index], multiStageLevels[index + 1]]] : []),
  finalOnlyCampaignPairWorkload,
  actualCampaignPairWorkload,
  overallCampaignWorkloadMultiplier: actualCampaignPairWorkload / finalOnlyCampaignPairWorkload,
  totalGeneratedStages,
  finalStagePreserved,
}}, null, 2));

if (!finalStagePreserved || reports.some((report) => report.stages.some((stage) =>
  stage.validation !== "valid" || stage.solverStatus !== "solved" || stage.replayStatus !== "cleared-mask-preserved"))) process.exit(1);
