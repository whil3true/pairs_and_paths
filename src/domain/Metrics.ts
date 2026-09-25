import { Board } from "./Board.js";
import { applyMove, findLegalMoves, type LegalMove } from "./Moves.js";

export interface SolutionMetrics {
  readonly pairCount: number;
  readonly initialLegalMoveCount: number;
  readonly minimumLegalMoveCount: number;
  readonly maximumLegalMoveCount: number;
  readonly averageLegalMoveCount: number;
  readonly forcedMoveSteps: number;
  readonly zeroTurnMoves: number;
  readonly oneTurnMoves: number;
  readonly twoTurnMoves: number;
  readonly outerBorderMoves: number;
  readonly totalSolutionPathLength: number;
  readonly averageSolutionPathLength: number;
}

const pathLength = (move: LegalMove): number => move.path.points.slice(1).reduce((total, point, index) => {
  const previous = move.path.points[index]!;
  return total + Math.abs(point.col - previous.col) + Math.abs(point.row - previous.row);
}, 0);

export const measureSolution = (initial: Board, solution: readonly LegalMove[]): SolutionMetrics => {
  let board = initial;
  const legalCounts: number[] = [];
  let zero = 0, one = 0, two = 0, outer = 0, totalLength = 0;
  for (const move of solution) {
    legalCounts.push(findLegalMoves(board).length);
    const turns = move.path.points.length - 2;
    if (turns === 0) zero += 1;
    else if (turns === 1) one += 1;
    else two += 1;
    if (move.path.points.some(({ col, row }) => col < 0 || row < 0 || col >= board.width || row >= board.height)) outer += 1;
    totalLength += pathLength(move);
    board = applyMove(board, move);
  }
  const sum = legalCounts.reduce((total, count) => total + count, 0);
  return {
    pairCount: solution.length,
    initialLegalMoveCount: legalCounts[0] ?? 0,
    minimumLegalMoveCount: legalCounts.length === 0 ? 0 : Math.min(...legalCounts),
    maximumLegalMoveCount: legalCounts.length === 0 ? 0 : Math.max(...legalCounts),
    averageLegalMoveCount: legalCounts.length === 0 ? 0 : sum / legalCounts.length,
    forcedMoveSteps: legalCounts.filter((count) => count === 1).length,
    zeroTurnMoves: zero, oneTurnMoves: one, twoTurnMoves: two,
    outerBorderMoves: outer,
    totalSolutionPathLength: totalLength,
    averageSolutionPathLength: solution.length === 0 ? 0 : totalLength / solution.length,
  };
};
