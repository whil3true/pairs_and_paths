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
  readonly avoidAdjacentMatchingPairs?: boolean;
}
export interface GeneratedLevel { readonly config: GenerationConfig; readonly board: Board; readonly witness: readonly LegalMove[]; readonly metrics: SolutionMetrics; }
export interface ValidationResult { readonly valid: boolean; readonly errors: readonly string[]; }
type Pair = readonly [GridPoint, GridPoint];

const validateConfig = ({ width, height, pairCount, seed }: GenerationConfig): void => {
  if (!Number.isInteger(width) || width < 1 || width > MAX_BOARD_WIDTH) throw new RangeError("width must be 1..6");
  if (!Number.isInteger(height) || height < 1 || height > MAX_BOARD_HEIGHT) throw new RangeError("height must be 1..8");
  if (!Number.isInteger(pairCount) || pairCount < 1 || pairCount * 2 > width * height) throw new RangeError("pairCount must be positive and fit the board");
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) throw new RangeError("seed must be a uint32");
};
const adjacent = (a: GridPoint, b: GridPoint): boolean => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
const boardFromPairs = (width: number, height: number, pairs: readonly Pair[]): Board => {
  const rows: Cell[][] = Array.from({ length: height }, () => Array<Cell>(width).fill(null));
  pairs.forEach(([a, b], index) => { rows[a.row]![a.col] = index + 1; rows[b.row]![b.col] = index + 1; });
  return Board.fromRows(rows);
};

/** Bounded reverse construction. The reverse of the successful addition order is a witness. */
const construct = (config: GenerationConfig, random: SeededRandom): Pair[] => {
  const points = Array.from({ length: config.width * config.height }, (_, index) =>
    ({ col: index % config.width, row: Math.floor(index / config.width) }));
  const attemptLimit = 256;
  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const pairs: Pair[] = [];
    const used = new Set<string>();
    while (pairs.length < config.pairCount) {
      const free = points.filter((point) => !used.has(`${point.col},${point.row}`));
      const candidates: Pair[] = [];
      for (let left = 0; left < free.length; left += 1) for (let right = left + 1; right < free.length; right += 1) {
        const pair: Pair = [free[left]!, free[right]!];
        if (!config.avoidAdjacentMatchingPairs || !adjacent(pair[0], pair[1])) candidates.push(pair);
      }
      let selected: Pair | undefined;
      for (const pair of random.shuffle(candidates)) {
        if (findPath(boardFromPairs(config.width, config.height, [...pairs, pair]), pair[0], pair[1]) === null) continue;
        if (pairs.length === config.pairCount - 2) {
          const remaining = free.filter((point) => point !== pair[0] && point !== pair[1]);
          let finalExists = false;
          for (let i = 0; i < remaining.length && !finalExists; i += 1) for (let j = i + 1; j < remaining.length; j += 1) {
            const last: Pair = [remaining[i]!, remaining[j]!];
            if (config.avoidAdjacentMatchingPairs && adjacent(last[0], last[1])) continue;
            finalExists = findPath(boardFromPairs(config.width, config.height, [...pairs, pair, last]), last[0], last[1]) !== null;
            if (finalExists) break;
          }
          if (!finalExists) continue;
        }
        selected = pair;
        break;
      }
      if (selected === undefined) break;
      pairs.push(selected);
      used.add(`${selected[0].col},${selected[0].row}`);
      used.add(`${selected[1].col},${selected[1].row}`);
    }
    if (pairs.length === config.pairCount) return pairs;
  }
  throw new Error(`Generation search exhausted its ${attemptLimit}-attempt budget`);
};

export const generateLevel = (config: GenerationConfig): GeneratedLevel => {
  validateConfig(config);
  const random = new SeededRandom(config.seed);
  const additions = construct(config, random);
  const ids = random.shuffle(Array.from({ length: config.pairCount }, (_, index) => index + 1));
  const rows: Cell[][] = Array.from({ length: config.height }, () => Array<Cell>(config.width).fill(null));
  additions.forEach(([a, b], index) => { rows[a.row]![a.col] = ids[index]!; rows[b.row]![b.col] = ids[index]!; });
  const board = Board.fromRows(rows);
  let state = board;
  const witness: LegalMove[] = [];
  for (let index = additions.length - 1; index >= 0; index -= 1) {
    const [start, end] = additions[index]!;
    const path = findPath(state, start, end);
    if (path === null) throw new Error("Internal generation error: reverse-construction witness blocked");
    const move = { tileId: ids[index]!, start, end, path };
    witness.push(move); state = applyMove(state, move);
  }
  return { config: { ...config }, board, witness, metrics: measureSolution(board, witness) };
};

export const validateGeneratedLevel = (level: GeneratedLevel): ValidationResult => {
  const errors: string[] = [], counts = new Map<number, number>(), positions = new Map<number, GridPoint[]>();
  level.board.toRows().forEach((row, rowIndex) => row.forEach((tile, col) => { if (tile !== null) {
    counts.set(tile, (counts.get(tile) ?? 0) + 1); positions.set(tile, [...(positions.get(tile) ?? []), { col, row: rowIndex }]);
  }}));
  if (level.board.width !== level.config.width || level.board.height !== level.config.height) errors.push("Board dimensions differ from config");
  if ([...counts.values()].reduce((a, b) => a + b, 0) !== level.config.pairCount * 2) errors.push("Occupied cell count differs from pairCount");
  if (counts.size !== level.config.pairCount) errors.push("Distinct tile count differs from pairCount");
  for (const [id, count] of counts) if (count !== 2) errors.push(`Tile ${id} occurs ${count} times`);
  if (level.witness.length !== level.config.pairCount) errors.push("Witness length differs from pairCount");
  if (level.config.avoidAdjacentMatchingPairs) for (const [id, pair] of positions) if (pair.length === 2 && adjacent(pair[0]!, pair[1]!)) errors.push(`Tile ${id} is orthogonally adjacent`);
  if (level.metrics.initialLegalMoveCount < 1) errors.push("Initial board has no legal move");
  let board = level.board;
  for (const move of level.witness) {
    const path = findPath(board, move.start, move.end);
    if (JSON.stringify(path) !== JSON.stringify(move.path)) { errors.push(`Witness move for tile ${move.tileId} has a stale path`); break; }
    try { board = applyMove(board, move); } catch { errors.push(`Witness move for tile ${move.tileId} is invalid`); break; }
  }
  if (board.toRows().flat().some((tile) => tile !== null)) errors.push("Witness does not empty board");
  return { valid: errors.length === 0, errors };
};
