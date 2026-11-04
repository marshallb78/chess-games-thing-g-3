import React, { useState } from 'react';
import type { TimeControlId, BotDifficulty } from '../../types/chess';
import { TIME_CONTROLS } from '../../types/chess';
import { ArrowLeft, Play, Bot, Zap, Flame, Timer, Coffee } from 'lucide-react';

interface BotSetupScreenProps {
  onStartGame: (
    timeControlId: TimeControlId,
    difficulty: BotDifficulty,
    playerColor: 'w' | 'b'
  ) => void;
  onBack: () => void;
}

export const BotSetupScreen: React.FC<BotSetupScreenProps> = ({
  onStartGame,
  onBack
}) => {
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [timeControl, setTimeControl] = useState<TimeControlId>('10+0');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  const controls = Object.values(TIME_CONTROLS);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bullet':
        return <Zap size={14} color="#f59e0b" />;
      case 'Blitz':
        return <Flame size={14} color="#ef4444" />;
      case 'Rapid':
        return <Timer size={14} color="#10b981" />;
      default:
        return <Coffee size={14} color="#38bdf8" />;
    }
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '1.5rem 1rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          padding: '0.45rem 0.9rem'
        }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1.5px solid rgba(139, 92, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              color: '#c084fc'
            }}
          >
            <Bot size={30} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>
            Play vs Bot
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Configure the engine difficulty, your piece color, and the clock.
          </p>
        </div>

        {/* 1. Select Difficulty */}
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            1. Select Difficulty
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { id: 'easy', label: 'Easy', desc: 'Casual play with occasional mistakes' },
              { id: 'medium', label: 'Medium', desc: 'Solid positional play and tactical captures' },
              { id: 'hard', label: 'Hard', desc: 'Deep minimax search & strict defense' },
            ].map((d) => {
              const isSelected = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficulty(d.id as BotDifficulty)}
                  style={{
                    padding: '1rem 0.75rem',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? '#c084fc' : 'var(--border-subtle)'}`,
                    boxShadow: isSelected ? '0 0 16px rgba(139, 92, 246, 0.3)' : 'none',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? '#c084fc' : 'var(--text-primary)' }}>
                    {d.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                    {d.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Choose Your Color */}
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            2. Choose Your Piece Color
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPlayerColor('w')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0.85rem',
                borderRadius: '12px',
                background: playerColor === 'w' ? 'var(--accent-cyan-glow)' : 'var(--bg-surface)',
                border: `1.5px solid ${playerColor === 'w' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: playerColor === 'w' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff', border: '1px solid #94a3b8' }} />
              <span>Play as White (First move)</span>
            </button>

            <button
              type="button"
              onClick={() => setPlayerColor('b')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0.85rem',
                borderRadius: '12px',
                background: playerColor === 'b' ? 'var(--accent-cyan-glow)' : 'var(--bg-surface)',
                border: `1.5px solid ${playerColor === 'b' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: playerColor === 'b' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0f172a', border: '1px solid #475569' }} />
              <span>Play as Black (Bot moves first)</span>
            </button>
          </div>
        </div>

        {/* 3. Choose Time Control */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              3. Choose Time Control
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Format: [Initial Minutes] + [Increment Seconds per move]
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.6rem'
            }}
          >
            {controls.map((tc) => {
              const isSelected = timeControl === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setTimeControl(tc.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.65rem 0.5rem',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--accent-cyan-glow)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.9rem',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getCategoryIcon(tc.category)}
                    <span>{tc.name}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {tc.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={() => onStartGame(timeControl, difficulty, playerColor)}
          className="btn-primary"
          style={{
            padding: '1rem',
            fontSize: '1.15rem',
            fontWeight: 800,
            borderRadius: '14px',
            marginTop: '0.5rem',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)'
          }}
        >
          <Play size={20} fill="#ffffff" />
          <span>Start Game vs Bot</span>
        </button>
      </div>
    </div>
  );
};
