import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
const value = (flag, fallback) => { const i = process.argv.indexOf(flag); return i < 0 ? fallback : Number(process.argv[i + 1]); };
const count = value("--count", 10_000), densityCount = value("--density-count", 0);
if (!Number.isSafeInteger(count) || count < 1) process.exit(2);
const root = new URL("../", import.meta.url);
await rm(new URL("../.simulation-dist", import.meta.url), { recursive: true, force: true });
const compiler = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "-p", "tsconfig.simulation.json"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
if (compiler.status !== 0) process.exit(compiler.status ?? 1);
const { applyMove, generateLevel, solveBoard, validateGeneratedLevel } = await import("../.simulation-dist/domain/index.js");
const isEmpty = (board) => board.toRows().every((row) => row.every((tile) => tile === null));
const adjacentMatchingPairs = (board) => {
  const positions = new Map();
  board.toRows().forEach((row, rowIndex) => row.forEach((tile, col) => {
    if (tile !== null) positions.set(tile, [...(positions.get(tile) ?? []), { col, row: rowIndex }]);
  }));
  let count = 0;
  for (const pair of positions.values()) if (pair.length === 2
    && Math.abs(pair[0].col - pair[1].col) + Math.abs(pair[0].row - pair[1].row) === 1) count += 1;
  return count;
};
const replay = (initial, moves) => {
  let board = initial;
  for (const move of moves) board = applyMove(board, move);
  return board;
};
const run = (pairs, samples) => {
  const out = { pairs, samples, successes: 0, failures: 0, solverFailures: 0, solverReplayFailures: 0,
    initialTotal: 0, initialMin: Infinity, initialMax: 0, forcedStarts: 0, turnsTotal: 0,
    maxTurns: 0, threePlus: 0, paths: 0, length: 0, adjacentMatchingPairs: 0 };
  for (let seed = 0; seed < samples; seed += 1) try {
    const config = { width: 6, height: 8, pairCount: pairs, seed, avoidAdjacentMatchingPairs: true };
    const level = generateLevel(config), again = generateLevel(config);
    if (JSON.stringify(level.board.toRows()) !== JSON.stringify(again.board.toRows())) throw new Error("nondeterministic");
    const valid = validateGeneratedLevel(level); if (!valid.valid) throw new Error(valid.errors.join("; "));
    const adjacent = adjacentMatchingPairs(level.board);
    out.adjacentMatchingPairs += adjacent;
    if (adjacent !== 0) throw new Error("adjacent matching pair");
    if (!isEmpty(replay(level.board, level.witness))) throw new Error("witness replay did not empty board");
    const solved = solveBoard(level.board);
    if (solved.status !== "solved") { out.solverFailures += 1; throw new Error(`solver ${solved.status}`); }
    try {
      if (!isEmpty(replay(level.board, solved.moves))) throw new Error("solver replay did not empty board");
    } catch (error) {
      out.solverReplayFailures += 1;
      throw error;
    }
    out.successes++; const m = level.metrics; out.initialTotal += m.initialLegalMoveCount;
    out.initialMin = Math.min(out.initialMin, m.initialLegalMoveCount); out.initialMax = Math.max(out.initialMax, m.initialLegalMoveCount);
    out.forcedStarts += Number(m.initialLegalMoveCount === 1); out.turnsTotal += m.averageTurns * m.pairCount;
    out.maxTurns = Math.max(out.maxTurns, m.maxTurns); out.threePlus += m.threePlusTurnMoves; out.paths += m.pairCount; out.length += m.totalSolutionPathLength;
  } catch { out.failures++; }
  return { ...out, averageInitialLegalMoveCount: out.successes ? out.initialTotal / out.successes : 0,
    averageTurns: out.paths ? out.turnsTotal / out.paths : 0, threePlusTurnRate: out.paths ? out.threePlus / out.paths : 0,
    averageSolutionPathLength: out.paths ? out.length / out.paths : 0, initialMin: out.initialMin === Infinity ? 0 : out.initialMin };
};
const started = performance.now();
const report = densityCount > 0 ? [18,20,22].map((pairs) => run(pairs, densityCount)) : [run(20, count)];
console.log(JSON.stringify({ elapsedMs: Math.round(performance.now() - started), densities: report }, null, 2));
if (report.some((item) => item.failures > 0)) process.exit(1);
