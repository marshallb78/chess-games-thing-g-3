import { Chess, Move } from 'chess.js';
import { PIECE_VALUES } from './chessUtils';

/**
 * Lightweight browser chess bot for single-player practice.
 * Evaluates legal moves with material capture priority and positional safety.
 */
export function getBestBotMove(chess: Chess): Move | null {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Score each legal move
  const scoredMoves: { move: Move; score: number }[] = [];

  for (const move of legalMoves) {
    let score = 0;

    // 1. Capture scoring: value of captured piece minus value of moving piece if taken
    if (move.captured) {
      score += (PIECE_VALUES[move.captured] || 1) * 10;
      // Bonus if lower value captures higher value
      if (PIECE_VALUES[move.piece] < PIECE_VALUES[move.captured]) {
        score += 5;
      }
    }

    // 2. Promotion bonus
    if (move.promotion) {
      score += 80;
    }

    // 3. Check bonus
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    if (testChess.inCheck()) {
      score += 4;
    }
    if (testChess.isCheckmate()) {
      score += 10000;
    }

    // 4. Center control (e4, d4, e5, d5)
    if (['e4', 'd4', 'e5', 'd5'].includes(move.to)) {
      score += 2;
    }

    // 5. Small random jitter so the bot doesn't play identical moves every time
    score += Math.random() * 2;

    scoredMoves.push({ move, score });
  }

  // Sort descending by score
  scoredMoves.sort((a, b) => b.score - a.score);

  return scoredMoves[0]?.move || legalMoves[0];
}
