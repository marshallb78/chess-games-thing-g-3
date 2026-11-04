import React from 'react';
import { Gamepad2, LogIn, LogOut, Award } from 'lucide-react';

interface NavbarProps {
  currentUser: {
    uid: string;
    displayName: string | null;
    email: string | null;
  } | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
  currentView: 'lobby' | 'chess' | 'leaderboard';
  onChangeView: (view: 'lobby' | 'chess' | 'leaderboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onSignOut,
  currentView,
  onChangeView
}) => {
  return (
    <header
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem'
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => onChangeView('lobby')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Gamepad2 size={22} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(to right, #38bdf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              G+3
            </span>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
                marginLeft: '4px'
              }}
            >
              GAMES
            </span>
          </div>
        </div>

        {/* Center navigation links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => onChangeView('lobby')}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              background: currentView === 'lobby' ? 'var(--bg-card)' : 'transparent',
              borderColor: currentView === 'lobby' ? 'var(--accent-cyan)' : 'transparent'
            }}
          >
            Lobby
          </button>
          <button
            onClick={() => onChangeView('chess')}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              background: currentView === 'chess' ? 'var(--bg-card)' : 'transparent',
              borderColor: currentView === 'chess' ? 'var(--accent-cyan)' : 'transparent'
            }}
          >
            Chess
          </button>
          <button
            onClick={() => onChangeView('leaderboard')}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.85rem',
              background: currentView === 'leaderboard' ? 'var(--bg-card)' : 'transparent',
              borderColor: currentView === 'leaderboard' ? 'var(--accent-cyan)' : 'transparent'
            }}
          >
            <Award size={15} /> Leaderboard
          </button>
        </nav>

        {/* Right Auth / Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onOpenProfile}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    color: '#070a12',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}
                >
                  {(currentUser.displayName || 'P')[0].toUpperCase()}
                </div>
                <span>{currentUser.displayName || 'Player'}</span>
              </button>

              <button
                onClick={onSignOut}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.6rem' }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
