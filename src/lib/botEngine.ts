import { Chess, type Move, type PieceSymbol, type Color } from 'chess.js';
import { PIECE_VALUES } from './chessUtils.ts';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

// Piece-Square Tables (simplified for positional evaluation from white's perspective)
const PAWN_TABLE: Record<string, number> = {
  a2: 0, b2: 0, c2: 0, d2: 0, e2: 0, f2: 0, g2: 0, h2: 0,
  a3: 5, b3: 10, c3: 10, d3: -10, e3: -10, f3: 10, g3: 10, h3: 5,
  a4: 0, b4: 0, c4: 10, d4: 25, e4: 25, f4: 0, g4: 0, h4: 0,
  a5: 5, b5: 5, c5: 15, d5: 30, e5: 30, f5: 10, g5: 5, h5: 5,
  a6: 10, b6: 15, c6: 20, d6: 35, e6: 35, f6: 20, g6: 15, h6: 10,
  a7: 50, b7: 50, c7: 50, d7: 50, e7: 50, f7: 50, g7: 50, h7: 50,
};

const KNIGHT_TABLE: Record<string, number> = {
  a1: -50, b1: -40, c1: -30, d1: -30, e1: -30, f1: -30, g1: -40, h1: -50,
  a2: -40, b2: -20, c2: 0, d2: 5, e2: 5, f2: 0, g2: -20, h2: -40,
  a3: -30, b3: 5, c3: 15, d3: 20, e3: 20, f3: 15, g3: 5, h3: -30,
  a4: -30, b4: 0, c4: 15, d4: 25, e4: 25, f4: 15, g4: 0, h4: -30,
  a5: -30, b5: 5, c5: 15, d5: 25, e5: 25, f5: 15, g5: 5, h5: -30,
  a6: -30, b6: 0, c6: 15, d6: 20, e6: 20, f6: 15, g6: 0, h6: -30,
  a7: -40, b7: -20, c7: 0, d7: 5, e7: 5, f7: 0, g7: -20, h7: -40,
  a8: -50, b8: -40, c8: -30, d8: -30, e8: -30, f8: -30, g8: -40, h8: -50,
};

/**
 * Evaluate board state relative to a given color
 */
function evaluateBoard(chess: Chess, forColor: Color): number {
  if (chess.isCheckmate()) {
    return chess.turn() === forColor ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  let totalScore = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = (PIECE_VALUES[piece.type as PieceSymbol] || 1) * 100;
      let positionalBonus = 0;

      const file = String.fromCharCode(97 + c);
      const rank = 8 - r;
      const sq = `${file}${rank}`;

      if (piece.type === 'p') positionalBonus = PAWN_TABLE[sq] || 0;
      else if (piece.type === 'n') positionalBonus = KNIGHT_TABLE[sq] || 0;
      else if (piece.type === 'b') positionalBonus = 10; // general bishop mobility bonus

      const pieceTotal = baseVal + positionalBonus;

      if (piece.color === forColor) {
        totalScore += pieceTotal;
      } else {
        totalScore -= pieceTotal;
      }
    }
  }

  return totalScore;
}

/**
 * Minimax with Alpha-Beta pruning for depth >= 2
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  forColor: Color
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, forColor);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false, forColor);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true, forColor);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

/**
 * Get the best move for the bot based on selected difficulty
 */
export function getBestBotMove(
  chess: Chess,
  difficulty: BotDifficulty = 'medium'
): Move | null {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const botColor = chess.turn();

  // EASY MODE: 40% random move, 60% simple capture preference
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      const randomIdx = Math.floor(Math.random() * legalMoves.length);
      return legalMoves[randomIdx];
    }
    // Pick simple capture or random
    const captures = legalMoves.filter((m) => !!m.captured);
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // MEDIUM MODE: 1-ply search with piece values and positional bonuses
  if (difficulty === 'medium') {
    let bestMove: Move = legalMoves[0];
    let bestScore = -Infinity;

    for (const move of legalMoves) {
      chess.move(move);
      // Small penalty if move leaves king in check or easily taken
      let score = evaluateBoard(chess, botColor) + (Math.random() * 8 - 4);
      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // HARD MODE: 2-ply / 3-ply Minimax with Alpha-Beta Pruning
  const searchDepth = 2; // Fast, robust, responsive
  let bestMove: Move = legalMoves[0];
  let bestScore = -Infinity;

  // Prioritize captures and promotions in move ordering for alpha-beta efficiency
  legalMoves.sort((a, b) => {
    const aCap = a.captured ? (PIECE_VALUES[a.captured] || 1) : 0;
    const bCap = b.captured ? (PIECE_VALUES[b.captured] || 1) : 0;
    return bCap - aCap;
  });

  for (const move of legalMoves) {
    chess.move(move);
    const score = minimax(chess, searchDepth - 1, -Infinity, Infinity, false, botColor);
    chess.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
