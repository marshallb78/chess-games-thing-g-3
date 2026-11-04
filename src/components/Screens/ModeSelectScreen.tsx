import React from 'react';
import { ArrowLeft, Globe, Bot, Users, Sparkles } from 'lucide-react';

interface ModeSelectScreenProps {
  onSelectMode: (mode: 'online' | 'bot' | 'local') => void;
  onBack: () => void;
}

export const ModeSelectScreen: React.FC<ModeSelectScreenProps> = ({
  onSelectMode,
  onBack
}) => {
  return (
    <div
      style={{
        maxWidth: '960px',
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
          marginBottom: '2rem',
          fontSize: '0.9rem',
          padding: '0.5rem 1rem'
        }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: '0.4rem'
          }}
        >
          Select Game Mode
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Choose how you want to play chess today.
        </p>
      </div>

      {/* Exactly Three Attractive Game-Mode Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {/* Card 1: Online */}
        <div
          onClick={() => onSelectMode('online')}
          className="card"
          style={{
            cursor: 'pointer',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem',
            border: '1.5px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, #131c31 0%, #17233c 100%)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 36px var(--accent-cyan-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.3)'
            }}
          >
            <Globe size={40} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Online
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.4 }}>
              Play against people around the world.
            </p>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={13} />
            <span>Multiplayer & Friends</span>
          </div>
        </div>

        {/* Card 2: Play vs Bot */}
        <div
          onClick={() => onSelectMode('bot')}
          className="card"
          style={{
            cursor: 'pointer',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem',
            border: '1.5px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, #131c31 0%, #17233c 100%)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 36px var(--accent-cyan-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1.5px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 0 24px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Bot size={40} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Play vs Bot
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.4 }}>
              Challenge the computer.
            </p>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#c084fc',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            Easy, Medium & Hard Engine
          </div>
        </div>

        {/* Card 3: Local 2 Player */}
        <div
          onClick={() => onSelectMode('local')}
          className="card"
          style={{
            cursor: 'pointer',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem',
            border: '1.5px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, #131c31 0%, #17233c 100%)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            e.currentTarget.style.transform = 'translateY(-6px)';
            e.currentTarget.style.boxShadow = '0 16px 36px var(--accent-cyan-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(56, 189, 248, 0.1) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Users size={40} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Local 2 Player
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.4 }}>
              Play with someone beside you.
            </p>
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            Pass & Play on One Device
          </div>
        </div>
      </div>
    </div>
  );
};

