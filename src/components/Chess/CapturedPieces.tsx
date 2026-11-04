import React from 'react';
import type { CapturedPiecesSummary } from '../../types/chess';
import type { Color } from 'chess.js';

interface CapturedPiecesProps {
  colorCaptured: Color; // which side's pieces were captured
  captured: CapturedPiecesSummary;
  scoreDifference: number;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  colorCaptured,
  captured,
  scoreDifference
}) => {
  const isWhitePieces = colorCaptured === 'w';
  const symbols = {
    p: isWhitePieces ? '♙' : '♟',
    n: isWhitePieces ? '♘' : '♞',
    b: isWhitePieces ? '♗' : '♝',
    r: isWhitePieces ? '♖' : '♜',
    q: isWhitePieces ? '♕' : '♛'
  };

  const hasAnyCaptured = Object.values(captured).some((c) => c > 0);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        minHeight: '24px',
        fontSize: '1rem',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: isWhitePieces ? '#f1f5f9' : '#94a3b8' }}>
        {(['q', 'r', 'b', 'n', 'p'] as (keyof CapturedPiecesSummary)[]).map((piece) => {
          const count = captured[piece];
          if (count === 0) return null;
          return (
            <span key={piece} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {Array.from({ length: count }).map((_, i) => (
                <span key={i} style={{ fontSize: '1.2rem', lineHeight: '1', marginLeft: i > 0 ? '-6px' : '0' }}>
                  {symbols[piece]}
                </span>
              ))}
            </span>
          );
        })}
      </div>

      {scoreDifference > 0 && hasAnyCaptured && (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            background: 'var(--bg-surface)',
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          +{scoreDifference}
        </span>
      )}
    </div>
  );
};
