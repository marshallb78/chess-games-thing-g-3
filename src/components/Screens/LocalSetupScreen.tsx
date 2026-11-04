import React, { useState } from 'react';
import type { TimeControlId } from '../../types/chess';
import { TIME_CONTROLS } from '../../types/chess';
import { ArrowLeft, Play, Users, Zap, Flame, Timer, Coffee } from 'lucide-react';

interface LocalSetupScreenProps {
  onStartGame: (
    timeControlId: TimeControlId,
    whiteName: string,
    blackName: string
  ) => void;
  onBack: () => void;
}

export const LocalSetupScreen: React.FC<LocalSetupScreenProps> = ({
  onStartGame,
  onBack
}) => {
  const [timeControl, setTimeControl] = useState<TimeControlId>('10+0');
  const [whiteName, setWhiteName] = useState('Player 1 (White)');
  const [blackName, setBlackName] = useState('Player 2 (Black)');

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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto',
              color: '#34d399'
            }}
          >
            <Users size={30} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>
            Local 2 Player (Pass & Play)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Play with a friend on this device. No second account required.
          </p>
        </div>

        {/* 1. Player Names (Optional) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            1. Player Names (Optional)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                White Player
              </label>
              <input
                type="text"
                value={whiteName}
                onChange={(e) => setWhiteName(e.target.value)}
                style={{ width: '100%' }}
                placeholder="White Player"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Black Player
              </label>
              <input
                type="text"
                value={blackName}
                onChange={(e) => setBlackName(e.target.value)}
                style={{ width: '100%' }}
                placeholder="Black Player"
              />
            </div>
          </div>
        </div>

        {/* 2. Choose Time Control */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              2. Choose Time Control
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Choose Untimed for casual play with no clock
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
          onClick={() => onStartGame(timeControl, whiteName, blackName)}
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
          <span>Start Local Game</span>
        </button>
      </div>
    </div>
  );
};
