import React from 'react';
import type { Color } from 'chess.js';
import type { GameEndReason } from '../../types/chess';
import { Trophy, RotateCcw, Home, XCircle, Handshake, Clock, AlertTriangle } from 'lucide-react';

interface GameOverModalProps {
  winner: Color | 'draw' | null;
  reason: GameEndReason | null;
  whitePlayerName: string;
  blackPlayerName: string;
  onRematch: () => void;
  onLobby: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  whitePlayerName,
  blackPlayerName,
  onRematch,
  onLobby,
  onClose
}) => {
  const getReasonText = () => {
    switch (reason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'timeout':
        return 'on Time';
      case 'resignation':
        return 'by Resignation';
      case 'stalemate':
        return 'by Stalemate';
      case 'insufficient_material':
        return 'due to Insufficient Material';
      case 'threefold_repetition':
        return 'by Threefold Repetition';
      case 'fifty_moves':
        return 'by 50-Move Rule';
      case 'draw_agreement':
        return 'by Mutual Agreement';
      default:
        return 'Game Concluded';
    }
  };

  const isDraw = winner === 'draw' || reason === 'stalemate' || reason === 'insufficient_material' || reason === 'threefold_repetition' || reason === 'fifty_moves' || reason === 'draw_agreement';

  const winnerName = winner === 'w' ? whitePlayerName : winner === 'b' ? blackPlayerName : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            color: 'var(--text-muted)'
          }}
          title="Close modal"
        >
          ✕
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          {isDraw ? (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Handshake size={34} />
            </div>
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)',
              border: '2px solid rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15'
            }}>
              <Trophy size={34} />
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          {isDraw ? 'Draw' : `${winnerName} Won!`}
        </h2>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.75rem'
        }}>
          {reason === 'timeout' && <Clock size={16} />}
          {reason === 'checkmate' && <AlertTriangle size={16} />}
          {reason === 'resignation' && <XCircle size={16} />}
          {getReasonText()}
        </p>

        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          fontSize: '0.9rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>White</div>
            <div style={{ fontWeight: 600 }}>{whitePlayerName}</div>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', alignSelf: 'center' }}>
            {winner === 'w' ? '1 - 0' : winner === 'b' ? '0 - 1' : '½ - ½'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Black</div>
            <div style={{ fontWeight: 600 }}>{blackPlayerName}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="btn-primary" 
            onClick={onRematch}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <RotateCcw size={18} /> Rematch / Play Again
          </button>
          <button 
            className="btn-secondary" 
            onClick={onLobby}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            <Home size={18} /> Back to Game Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
