import { Chess, type Square, type Color, type PieceSymbol } from 'chess.js';
import type { CapturedPiecesSummary } from '../types/chess';

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};

export function getCapturedPieces(chess: Chess): {
  whiteCaptured: CapturedPiecesSummary;
  blackCaptured: CapturedPiecesSummary;
  whiteScore: number;
  blackScore: number;
} {
  const startingCounts: Record<PieceSymbol, number> = {
    p: 8,
    n: 2,
    b: 2,
    r: 2,
    q: 1,
    k: 1
  };

  const currentCounts: {
    w: Record<PieceSymbol, number>;
    b: Record<PieceSymbol, number>;
  } = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  };

  const board = chess.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        currentCounts[piece.color][piece.type] = (currentCounts[piece.color][piece.type] || 0) + 1;
      }
    }
  }

  const whiteCaptured: CapturedPiecesSummary = {
    p: Math.max(0, startingCounts.p - currentCounts.b.p),
    n: Math.max(0, startingCounts.n - currentCounts.b.n),
    b: Math.max(0, startingCounts.b - currentCounts.b.b),
    r: Math.max(0, startingCounts.r - currentCounts.b.r),
    q: Math.max(0, startingCounts.q - currentCounts.b.q)
  };

  const blackCaptured: CapturedPiecesSummary = {
    p: Math.max(0, startingCounts.p - currentCounts.w.p),
    n: Math.max(0, startingCounts.n - currentCounts.w.n),
    b: Math.max(0, startingCounts.b - currentCounts.w.b),
    r: Math.max(0, startingCounts.r - currentCounts.w.r),
    q: Math.max(0, startingCounts.q - currentCounts.w.q)
  };

  let whitePoints = 0;
  let blackPoints = 0;

  (Object.keys(whiteCaptured) as (keyof CapturedPiecesSummary)[]).forEach((p) => {
    whitePoints += whiteCaptured[p] * PIECE_VALUES[p];
  });
  (Object.keys(blackCaptured) as (keyof CapturedPiecesSummary)[]).forEach((p) => {
    blackPoints += blackCaptured[p] * PIECE_VALUES[p];
  });

  return {
    whiteCaptured,
    blackCaptured,
    whiteScore: whitePoints - blackPoints,
    blackScore: blackPoints - whitePoints
  };
}

export function findKingSquare(chess: Chess, color: Color): Square | null {
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k' && piece.color === color) {
        const file = String.fromCharCode(97 + c);
        const rank = 8 - r;
        return `${file}${rank}` as Square;
      }
    }
  }
  return null;
}
