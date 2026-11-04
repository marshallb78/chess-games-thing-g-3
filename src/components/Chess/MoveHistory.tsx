import React, { useEffect, useRef } from 'react';
import type { MoveRecord } from '../../types/chess';
import { ListOrdered } from 'lucide-react';

interface MoveHistoryProps {
  moves: MoveRecord[];
  currentMoveIndex: number;
  onSelectMove?: (index: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group moves into turns (white move + black move)
  const turns: { turnNumber: number; white?: MoveRecord; black?: MoveRecord }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    turns.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1]
    });
  }

  // Auto-scroll to latest move
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves.length]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ListOrdered size={16} />
          <span>Move History</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {moves.length} {moves.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem',
          fontSize: '0.88rem',
          fontFamily: 'monospace'
        }}
      >
        {turns.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.82rem'
            }}
          >
            Game has not started yet. Make a move on the board!
          </div>
        ) : (
          turns.map((turn, tIdx) => {
            const whiteMoveIdx = tIdx * 2;
            const blackMoveIdx = tIdx * 2 + 1;

            const isWhiteSelected = currentMoveIndex === whiteMoveIdx;
            const isBlackSelected = currentMoveIndex === blackMoveIdx;

            return (
              <div
                key={turn.turnNumber}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 1fr',
                  alignItems: 'center',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: tIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {turn.turnNumber}.
                </span>

                {turn.white && (
                  <button
                    onClick={() => onSelectMove && onSelectMove(whiteMoveIdx)}
                    style={{
                      textAlign: 'left',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isWhiteSelected ? 'var(--accent-cyan-glow)' : 'transparent',
                      color: isWhiteSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      fontWeight: isWhiteSelected ? 700 : 500,
                      cursor: onSelectMove ? 'pointer' : 'default'
                    }}
                  >
                    {turn.white.san}
                  </button>
                )}

                {turn.black ? (
                  <button
                    onClick={() => onSelectMove && onSelectMove(blackMoveIdx)}
                    style={{
                      textAlign: 'left',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isBlackSelected ? 'var(--accent-cyan-glow)' : 'transparent',
                      color: isBlackSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                      fontWeight: isBlackSelected ? 700 : 500,
                      cursor: onSelectMove ? 'pointer' : 'default'
                    }}
                  >
                    {turn.black.san}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
