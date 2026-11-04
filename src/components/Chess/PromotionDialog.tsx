import React from 'react';
import type { Color, PieceSymbol } from 'chess.js';

interface PromotionDialogProps {
  color: Color;
  onSelectPiece: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  color,
  onSelectPiece,
  onCancel
}) => {
  const pieces: { type: PieceSymbol; label: string; symbol: string }[] = [
    { type: 'q', label: 'Queen', symbol: color === 'w' ? '♕' : '♛' },
    { type: 'r', label: 'Rook', symbol: color === 'w' ? '♖' : '♜' },
    { type: 'b', label: 'Bishop', symbol: color === 'w' ? '♗' : '♝' },
    { type: 'n', label: 'Knight', symbol: color === 'w' ? '♘' : '♞' },
  ];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '360px', textAlign: 'center' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
          Pawn Promotion
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Choose a piece to promote your pawn:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelectPiece(p.type)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.75rem 0.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 14px var(--accent-cyan-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '2.5rem', lineHeight: '1.1' }}>{p.symbol}</span>
              <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                {p.label}
              </span>
            </button>
          ))}
        </div>

        <button 
          onClick={onCancel}
          className="btn-secondary"
          style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
        >
          Cancel Move
        </button>
      </div>
    </div>
  );
};
