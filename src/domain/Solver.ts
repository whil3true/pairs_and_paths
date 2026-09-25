import { Board, type TileId } from "./Board.js";
import { applyMove, findLegalMoves, type LegalMove } from "./Moves.js";

export type SolveResult =
  | { readonly status: "solved"; readonly moves: readonly LegalMove[] }
  | { readonly status: "unsolvable"; readonly moves: readonly LegalMove[] }
  | { readonly status: "unsupported"; readonly reason: string };

/** Deterministic greedy solver for boards containing exactly two of every tile ID. */
export const solveBoard = (initial: Board): SolveResult => {
  const counts = new Map<TileId, number>();
  for (const row of initial.toRows()) for (const tile of row) {
    if (tile !== null) counts.set(tile, (counts.get(tile) ?? 0) + 1);
  }
  for (const [tileId, count] of counts) {
    if (count !== 2) return { status: "unsupported", reason: `Tile ${tileId} occurs ${count} times, expected 2` };
  }

  let board = initial;
  const moves: LegalMove[] = [];
  while (counts.size > moves.length) {
    const move = findLegalMoves(board)[0];
    if (move === undefined) return { status: "unsolvable", moves };
    moves.push(move);
    board = applyMove(board, move);
  }
  return { status: "solved", moves };
};
