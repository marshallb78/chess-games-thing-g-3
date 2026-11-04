import React from 'react';
import { TIME_CONTROLS, type TimeControlId } from '../../types/chess';
import { Zap, Flame, Timer, Coffee } from 'lucide-react';

interface TimeControlPickerProps {
  selectedId: TimeControlId;
  onSelect: (id: TimeControlId) => void;
  disabled?: boolean;
}

export const TimeControlPicker: React.FC<TimeControlPickerProps> = ({
  selectedId,
  onSelect,
  disabled = false
}) => {
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

  const controls = Object.values(TIME_CONTROLS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Time Control
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.5rem'
        }}
      >
        {controls.map((tc) => {
          const isSelected = selectedId === tc.id;
          return (
            <button
              key={tc.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(tc.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.5rem 0.4rem',
                borderRadius: '8px',
                background: isSelected ? 'var(--accent-cyan-glow)' : 'var(--bg-surface)',
                border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                gap: '0.2rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {getCategoryIcon(tc.category)}
                <span>{tc.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                {tc.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
