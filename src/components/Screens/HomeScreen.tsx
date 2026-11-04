import React, { useEffect, useState } from 'react';
import { ChessIllustration } from '../ChessIllustration';
import { Play, LogIn, User, Radio } from 'lucide-react';
import { onlineService } from '../../lib/onlineService';

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
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isFirstVisit] = useState<boolean>(() => {
    return !sessionStorage.getItem('g3_intro_played');
  });

  useEffect(() => {
    // Record that the intro has been shown for this browser session
    if (isFirstVisit) {
      sessionStorage.setItem('g3_intro_played', 'true');
    }

    // Subscribe to real-time online presence count
    const unsub = onlineService.subscribeToOnlineCount((count, connected) => {
      setOnlineCount(count);
      setIsConnected(connected);
    });

    return () => unsub();
  }, [isFirstVisit]);

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '1.5rem 1rem',
        position: 'relative'
      }}
    >
      {/* Title */}
      <div
        style={{
          marginBottom: '0.75rem',
          animation: isFirstVisit
            ? 'startupTitleAppear 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s backwards'
            : 'fadeIn 0.2s ease-out'
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2.75rem, 6.5vw, 4.25rem)',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            lineHeight: 1.05,
            margin: 0
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 55%, #38bdf8 100%)',
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
              textShadow: '0 0 35px rgba(56, 189, 248, 0.4)'
            }}
          >
            CHESS
          </span>
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            marginTop: '0.35rem',
            letterSpacing: '0.5px',
            fontWeight: 500
          }}
        >
          Real-time chess for modern players
        </p>
      </div>

      {/* Dominant Hero Chess Illustration Visual */}
      <div
        style={{
          margin: '0.75rem 0 1.75rem 0',
          width: '100%',
          maxWidth: '420px',
          animation: isFirstVisit
            ? 'startupPieceAppear 0.85s cubic-bezier(0.16, 1, 0.3, 1) backwards'
            : 'fadeIn 0.2s ease-out'
        }}
      >
        <ChessIllustration size={400} />
      </div>

      {/* Prominent Play Button */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          width: '100%',
          maxWidth: '320px',
          animation: isFirstVisit
            ? 'startupButtonAppear 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.35s backwards'
            : 'fadeIn 0.2s ease-out'
        }}
      >
        <button
          onClick={onPlay}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1.05rem 2rem',
            fontSize: '1.35rem',
            fontWeight: 800,
            borderRadius: '16px',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.45)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 38px rgba(14, 165, 233, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(14, 165, 233, 0.45)';
          }}
          aria-label="Start playing chess"
        >
          <Play size={24} fill="#ffffff" />
          <span>Play</span>
        </button>

        {/* Real Live Online Player Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            animation: isFirstVisit ? 'fadeIn 0.6s ease-out 0.55s backwards' : 'fadeIn 0.2s ease-out'
          }}
          title="Live player presence from Firebase"
        >
          {onlineCount === null ? (
            <>
              <Radio size={13} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
              <span>Checking players...</span>
            </>
          ) : !isConnected && onlineCount === 0 ? (
            <>
              <span style={{ color: '#94a3b8' }}>○</span>
              <span>Offline</span>
            </>
          ) : (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981'
                }}
              />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {onlineCount} {onlineCount === 1 ? 'player' : 'players'} online
              </span>
            </>
          )}
        </div>

        {/* Subtle Sign In option underneath */}
        <div
          style={{
            marginTop: '0.2rem',
            animation: isFirstVisit ? 'fadeIn 0.6s ease-out 0.65s backwards' : 'fadeIn 0.2s ease-out'
          }}
        >
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
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
              <span>
                Signed in as <strong>{currentUser.displayName || 'Player'}</strong>
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
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
    </div>
  );
};
