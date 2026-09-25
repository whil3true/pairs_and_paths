import { Board } from "./Board.js";
import { applyMove, findLegalMoves, type LegalMove } from "./Moves.js";

export interface SolutionMetrics {
  readonly pairCount: number;
  readonly initialLegalMoveCount: number;
  readonly minimumLegalMoveCount: number;
  readonly maximumLegalMoveCount: number;
  readonly averageLegalMoveCount: number;
  readonly forcedMoveSteps: number;
  readonly totalSolutionPathLength: number;
  readonly averageSolutionPathLength: number;
  readonly averageTurns: number;
  readonly maxTurns: number;
  readonly turnHistogram: Readonly<Record<string, number>>;
  readonly threePlusTurnMoves: number;
  readonly threePlusTurnRate: number;
}

export const pathLength = (move: LegalMove): number => move.path.points.slice(1).reduce((total, point, index) => {
  const previous = move.path.points[index]!;
  return total + Math.abs(point.col - previous.col) + Math.abs(point.row - previous.row);
}, 0);

export const measureSolution = (initial: Board, solution: readonly LegalMove[]): SolutionMetrics => {
  let board = initial;
  const legalCounts: number[] = [];
  const histogram: Record<string, number> = {};
  let totalLength = 0, totalTurns = 0, maxTurns = 0, threePlus = 0;
  for (const move of solution) {
    legalCounts.push(findLegalMoves(board).length);
    const turns = move.path.points.length - 2;
    histogram[String(turns)] = (histogram[String(turns)] ?? 0) + 1;
    totalTurns += turns;
    maxTurns = Math.max(maxTurns, turns);
    if (turns >= 3) threePlus += 1;
    totalLength += pathLength(move);
    board = applyMove(board, move);
  }
  const count = solution.length;
  return {
    pairCount: count,
    initialLegalMoveCount: legalCounts[0] ?? 0,
    minimumLegalMoveCount: count === 0 ? 0 : Math.min(...legalCounts),
    maximumLegalMoveCount: count === 0 ? 0 : Math.max(...legalCounts),
    averageLegalMoveCount: count === 0 ? 0 : legalCounts.reduce((a, b) => a + b, 0) / count,
    forcedMoveSteps: legalCounts.filter((value) => value === 1).length,
    totalSolutionPathLength: totalLength,
    averageSolutionPathLength: count === 0 ? 0 : totalLength / count,
    averageTurns: count === 0 ? 0 : totalTurns / count,
    maxTurns,
    turnHistogram: histogram,
    threePlusTurnMoves: threePlus,
    threePlusTurnRate: count === 0 ? 0 : threePlus / count,
  };
};
