import { Board, MAX_BOARD_HEIGHT, MAX_BOARD_WIDTH, type Cell, type GridPoint } from "./Board.js";
import { measureSolution, type SolutionMetrics } from "./Metrics.js";
import { applyMove, type LegalMove } from "./Moves.js";
import { findPath } from "./Pathfinder.js";
import { SeededRandom } from "./SeededRandom.js";

export interface GenerationConfig {
  readonly width: number;
  readonly height: number;
  readonly pairCount: number;
  readonly seed: number;
}

export interface GeneratedLevel {
  readonly config: GenerationConfig;
  readonly board: Board;
  readonly witness: readonly LegalMove[];
  readonly metrics: SolutionMetrics;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const validateConfig = ({ width, height, pairCount, seed }: GenerationConfig): void => {
  if (!Number.isInteger(width) || width < 1 || width > MAX_BOARD_WIDTH) throw new RangeError("width must be 1..6");
  if (!Number.isInteger(height) || height < 1 || height > MAX_BOARD_HEIGHT) throw new RangeError("height must be 1..8");
  if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount * 2 > width * height) {
    throw new RangeError("pairCount must be positive and fit the board");
  }
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError("seed must be a uint32");
};

const samePath = (left: LegalMove["path"], right: LegalMove["path"]): boolean =>
  left.points.length === right.points.length && left.points.every((point, index) => {
    const other = right.points[index];
    return other !== undefined && point.col === other.col && point.row === other.row;
  });

/**
 * Builds a seeded subset of disjoint adjacent edges from a snake Hamiltonian path.
 * Every recorded pair is therefore independently removable; no retry is needed.
 */
export const generateLevel = (config: GenerationConfig): GeneratedLevel => {
  validateConfig(config);
  const random = new SeededRandom(config.seed);
  const snake: GridPoint[] = [];
  for (let row = 0; row < config.height; row += 1) {
    for (let step = 0; step < config.width; step += 1) {
      const col = row % 2 === 0 ? step : config.width - 1 - step;
      snake.push({ col, row });
    }
  }
  const allPairs = Array.from({ length: Math.floor(snake.length / 2) }, (_, index) =>
    [snake[index * 2]!, snake[index * 2 + 1]!] as const);
  const selected = random.shuffle(allPairs).slice(0, config.pairCount);
  const removalOrder = random.shuffle(selected);
  const tileIds = random.shuffle(Array.from({ length: config.pairCount }, (_, index) => index + 1));
  const rows: Cell[][] = Array.from({ length: config.height }, () => Array<Cell>(config.width).fill(null));
  removalOrder.forEach(([start, end], index) => {
    const tileId = tileIds[index]!;
    rows[start.row]![start.col] = tileId;
    rows[end.row]![end.col] = tileId;
  });
  const board = Board.fromRows(rows);
  let state = board;
  const witness: LegalMove[] = [];
  removalOrder.forEach(([start, end], index) => {
    const tileId = tileIds[index]!;
    const path = findPath(state, start, end);
    if (path === null) throw new Error("Internal generation error: constructed adjacent pair is blocked");
    const move = { tileId, start, end, path };
    witness.push(move);
    state = applyMove(state, move);
  });
  return { config: { ...config }, board, witness, metrics: measureSolution(board, witness) };
};

export const validateGeneratedLevel = (level: GeneratedLevel): ValidationResult => {
  const errors: string[] = [];
  const counts = new Map<number, number>();
  let occupied = 0;
  for (const row of level.board.toRows()) for (const tile of row) if (tile !== null) {
    occupied += 1;
    counts.set(tile, (counts.get(tile) ?? 0) + 1);
  }
  if (level.board.width !== level.config.width || level.board.height !== level.config.height) errors.push("Board dimensions differ from config");
  if (occupied % 2 !== 0) errors.push("Occupied cell count is odd");
  if (occupied !== level.config.pairCount * 2) errors.push("Occupied cell count differs from pairCount");
  if (counts.size !== level.config.pairCount) errors.push("Distinct tile count differs from pairCount");
  for (const [tileId, count] of counts) if (count !== 2) errors.push(`Tile ${tileId} occurs ${count} times`);
  if (level.witness.length !== level.config.pairCount) errors.push("Witness length differs from pairCount");

  let board = level.board;
  for (const move of level.witness) {
    const currentPath = findPath(board, move.start, move.end);
    if (currentPath === null || !samePath(currentPath, move.path)) {
      errors.push(`Witness move for tile ${move.tileId} has an invalid or stale path`);
      break;
    }
    try { board = applyMove(board, move); } catch { errors.push(`Witness move for tile ${move.tileId} is invalid`); break; }
  }
  if (board.toRows().some((row) => row.some((tile) => tile !== null))) errors.push("Witness does not empty board");
  return { valid: errors.length === 0, errors };
};
