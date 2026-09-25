import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const countIndex = process.argv.indexOf("--count");
const count = countIndex < 0 ? 10_000 : Number(process.argv[countIndex + 1]);
if (!Number.isSafeInteger(count) || count < 1) {
  console.error("Usage: npm run simulate -- --count <positive integer>");
  process.exit(2);
}

const root = new URL("../", import.meta.url);
await rm(new URL("../.simulation-dist", import.meta.url), { force: true, recursive: true });
const compiler = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "-p", "tsconfig.simulation.json"], {
  cwd: root, shell: process.platform === "win32", stdio: "inherit",
});
if (compiler.status !== 0) process.exit(compiler.status ?? 1);

const { applyMove, findPath, generateLevel, solveBoard, validateGeneratedLevel } =
  await import("../.simulation-dist/domain/index.js");
const sizes = [[4, 2], [4, 4], [5, 6], [6, 6], [6, 8]];
const bySize = Object.fromEntries(sizes.map(([width, height]) => [`${width}x${height}`, 0]));
const totals = { legal: 0, forced: 0, zero: 0, one: 0, two: 0, outer: 0, paths: 0 };
let minLegal = Infinity, maxLegal = 0, failures = 0, generationFailures = 0, solverFailures = 0;
const started = performance.now();

const serialize = (level) => JSON.stringify({ board: level.board.toRows(), witness: level.witness });
const replay = (initial, moves) => {
  let board = initial;
  for (const move of moves) {
    if (JSON.stringify(findPath(board, move.start, move.end)) !== JSON.stringify(move.path)) throw new Error("invalid path");
    board = applyMove(board, move);
  }
  if (board.toRows().some((row) => row.some((tile) => tile !== null))) throw new Error("replay did not empty board");
};

for (let index = 0; index < count; index += 1) {
  const [width, height] = sizes[index % sizes.length];
  const config = { width, height, pairCount: Math.floor(width * height / 2), seed: index >>> 0 };
  bySize[`${width}x${height}`] += 1;
  try {
    const level = generateLevel(config);
    if (serialize(level) !== serialize(generateLevel(config))) throw new Error("nondeterministic regeneration");
    const validation = validateGeneratedLevel(level);
    if (!validation.valid) throw new Error(validation.errors.join("; "));
    replay(level.board, level.witness);
    const solved = solveBoard(level.board);
    if (solved.status !== "solved") { solverFailures += 1; throw new Error(`solver status ${solved.status}`); }
    replay(level.board, solved.moves);
    const metrics = level.metrics;
    minLegal = Math.min(minLegal, metrics.minimumLegalMoveCount);
    maxLegal = Math.max(maxLegal, metrics.maximumLegalMoveCount);
    totals.legal += metrics.averageLegalMoveCount;
    totals.forced += metrics.forcedMoveSteps;
    totals.zero += metrics.zeroTurnMoves;
    totals.one += metrics.oneTurnMoves;
    totals.two += metrics.twoTurnMoves;
    totals.outer += metrics.outerBorderMoves;
    totals.paths += metrics.pairCount;
  } catch (error) {
    failures += 1;
    if (!(error instanceof Error) || !error.message.startsWith("solver status")) generationFailures += 1;
    if (failures <= 5) console.error(`seed=${index} size=${width}x${height}:`, error);
  }
}

const elapsed = performance.now() - started;
console.log(JSON.stringify({
  levels: count, boardsBySize: bySize, failures, generationFailures, solverFailures,
  elapsedMs: Math.round(elapsed),
  metrics: {
    minimumLegalMoves: minLegal === Infinity ? 0 : minLegal, maximumLegalMoves: maxLegal,
    meanAverageLegalMoves: totals.legal / count, forcedMoveSteps: totals.forced,
    turns: { zero: totals.zero, one: totals.one, two: totals.two },
    outerBorderMoves: totals.outer, outerBorderRate: totals.paths === 0 ? 0 : totals.outer / totals.paths,
  },
}, null, 2));
if (failures > 0) process.exit(1);
