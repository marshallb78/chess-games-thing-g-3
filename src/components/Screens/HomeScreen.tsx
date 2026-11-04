import React from 'react';
import { ChessIllustration } from '../ChessIllustration';
import { Play, LogIn, User } from 'lucide-react';

interface HomeScreenProps {
  onPlay: () => void;
  onOpenAuth: () => void;
  currentUser: {
    uid: string;
    displayName: string | null;
  } | null;
  onOpenProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPlay,
  onOpenAuth,
  currentUser,
  onOpenProfile
}) => {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '1.5rem 1rem',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '1rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            margin: 0
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            G+3
          </span>{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(56, 189, 248, 0.4)'
            }}
          >
            CHESS
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.4rem', letterSpacing: '0.5px' }}>
          Real-time chess for modern players
        </p>
      </div>

      {/* Dominant Chess Illustration Visual */}
      <div style={{ margin: '1rem 0 2rem 0', width: '100%', maxWidth: '380px' }}>
        <ChessIllustration size={360} />
      </div>

      {/* Prominent Play Button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '320px' }}>
        <button
          onClick={onPlay}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1rem 2rem',
            fontSize: '1.35rem',
            fontWeight: 800,
            borderRadius: '16px',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            boxShadow: '0 8px 30px rgba(14, 165, 233, 0.45)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(14, 165, 233, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(14, 165, 233, 0.45)';
          }}
        >
          <Play size={24} fill="#ffffff" />
          <span>Play</span>
        </button>

        {/* Subtle Sign In option underneath */}
        {currentUser ? (
          <button
            onClick={onOpenProfile}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <User size={15} />
            <span>Signed in as <strong>{currentUser.displayName || 'Player'}</strong></span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogIn size={15} />
            <span>Sign In to save ratings & friends</span>
          </button>
        )}
      </div>
    </div>
  );
};
