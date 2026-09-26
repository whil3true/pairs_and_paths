import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url);
await rm(new URL("../.simulation-dist", import.meta.url), { recursive: true, force: true });
const compiler = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsc", "-p", "tsconfig.simulation.json"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
if (compiler.status !== 0) process.exit(compiler.status ?? 1);
const { applyMove, generateLevel, solveBoard, validateGeneratedLevel } = await import("../.simulation-dist/domain/index.js");
const patterns = [
  { width: 5, height: 5, pairCount: 8, blockedCells: [{ col: 2, row: 2 }] },
  { width: 5, height: 6, pairCount: 9, blockedCells: [{ col: 2, row: 2 }, { col: 2, row: 3 }] },
  { width: 6, height: 8, pairCount: 18, blockedCells: [{ col: 1, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 5 }, { col: 2, row: 6 }] },
];
const report = { generationSuccesses: 0, generationFailures: 0, solverSuccesses: 0, solverFailures: 0, replayFailures: 0, pathsCrossingBlockers: 0, tilesOnBlockers: 0 };
const blockerCrossings = (board, path) => {
  let crossings = 0;
  for (let index = 1; index < path.points.length; index += 1) {
    const from = path.points[index - 1], to = path.points[index];
    if ((from.col === to.col) === (from.row === to.row)) throw new Error("path segment is not orthogonal");
    const dc = Math.sign(to.col - from.col), dr = Math.sign(to.row - from.row);
    let current = { ...from };
    while (true) {
      if (board.isBlocked(current)) crossings += 1;
      if (current.col === to.col && current.row === to.row) break;
      current = { col: current.col + dc, row: current.row + dr };
    }
  }
  return crossings;
};
for (const pattern of patterns) for (let seed = 0; seed < 50; seed += 1) try {
  const level = generateLevel({ ...pattern, seed, avoidAdjacentMatchingPairs: true });
  report.generationSuccesses += 1;
  if (!validateGeneratedLevel(level).valid) throw new Error("validation failed");
  for (const point of level.board.blockedCells()) if (level.board.tileAt(point) !== null) report.tilesOnBlockers += 1;
  const solved = solveBoard(level.board);
  if (solved.status !== "solved") { report.solverFailures += 1; continue; }
  report.solverSuccesses += 1;
  let board = level.board;
  try {
    for (const move of solved.moves) {
      report.pathsCrossingBlockers += blockerCrossings(board, move.path);
      board = applyMove(board, move);
    }
    if (board.hasTiles()) throw new Error("tiles remain");
  } catch { report.replayFailures += 1; }
} catch { report.generationFailures += 1; }
console.log(JSON.stringify(report, null, 2));
if (report.generationFailures || report.solverFailures || report.replayFailures || report.pathsCrossingBlockers || report.tilesOnBlockers) process.exit(1);
