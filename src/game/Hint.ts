import { findLegalMoves, type Board, type LegalMove } from "../domain/index.js";

/** Returns the first deterministic legal move on the current board. */
export const getHintMove = (board: Board): LegalMove | null => findLegalMoves(board)[0] ?? null;
