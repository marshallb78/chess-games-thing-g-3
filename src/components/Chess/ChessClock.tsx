import React from 'react';
import { Clock } from 'lucide-react';

interface ChessClockProps {
  timeRemainingSeconds: number;
  isActive: boolean;
  playerName: string;
  isWhite: boolean;
  rating?: number;
  isUntimed?: boolean;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeRemainingSeconds,
  isActive,
  playerName,
  isWhite,
  rating,
  isUntimed = false
}) => {
  const formatTime = (totalSeconds: number): string => {
    if (isUntimed) return 'Casual';
    if (totalSeconds <= 0) return '00:00';

    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (totalSeconds < 10) {
      const tenths = Math.floor((totalSeconds % 1) * 10);
      return `${secs}.${tenths}s`;
    }

    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');
    return `${paddedMins}:${paddedSecs}`;
  };

  const isLowTime = !isUntimed && timeRemainingSeconds <= 20 && timeRemainingSeconds > 0;
  const isCriticalTime = !isUntimed && timeRemainingSeconds <= 10 && timeRemainingSeconds > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1rem',
        background: isActive ? 'var(--bg-card)' : 'var(--bg-surface)',
        border: `1.5px solid ${
          isActive
            ? isCriticalTime
              ? 'var(--accent-red)'
              : 'var(--accent-cyan)'
            : 'var(--border-subtle)'
        }`,
        borderRadius: '12px',
        boxShadow: isActive
          ? isCriticalTime
            ? '0 0 16px rgba(239, 68, 68, 0.4)'
            : '0 0 14px var(--accent-cyan-glow)'
          : 'none',
        transition: 'all 0.2s ease',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '4px',
            background: isWhite ? '#ffffff' : '#1e293b',
            border: '1.5px solid #64748b',
            boxShadow: isWhite ? '0 0 4px rgba(255,255,255,0.4)' : 'none'
          }}
          title={isWhite ? 'White' : 'Black'}
        />
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{playerName}</span>
          {rating !== undefined && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
              ({rating})
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontFamily: 'monospace',
          fontSize: '1.3rem',
          fontWeight: 700,
          color: isCriticalTime
            ? 'var(--accent-red)'
            : isLowTime
            ? 'var(--accent-amber)'
            : isActive
            ? 'var(--text-primary)'
            : 'var(--text-secondary)'
        }}
      >
        <Clock size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
        <span>{formatTime(timeRemainingSeconds)}</span>
      </div>
    </div>
  );
};

