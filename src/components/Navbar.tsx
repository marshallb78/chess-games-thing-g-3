import React from 'react';
import { Gamepad2, LogIn, LogOut, Users } from 'lucide-react';

interface NavbarProps {
  currentUser: {
    uid: string;
    displayName: string | null;
    email?: string | null;
    isGuest?: boolean;
  } | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenFriends: () => void;
  onSignOut: () => void;
  onGoHome: () => void;
  friendRequestsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenFriends,
  onSignOut,
  onGoHome,
  friendRequestsCount = 0
}) => {
  return (
    <header
      style={{
        background: 'rgba(11, 17, 32, 0.85)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 1.25rem'
        }}
      >
        {/* Brand Logo & Name */}
        <div
          onClick={onGoHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Gamepad2 size={20} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
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
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
                marginLeft: '5px'
              }}
            >
              CHESS
            </span>
          </div>
        </div>

        {/* Right Navigation / User Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Friends button */}
              <button
                onClick={onOpenFriends}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  position: 'relative'
                }}
                title="Friends list and requests"
              >
                <Users size={15} color="var(--accent-cyan)" />
                <span className="hidden sm:inline">Friends</span>
                {friendRequestsCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'var(--accent-red)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {friendRequestsCount}
                  </span>
                )}
              </button>

              {/* Profile Pill */}
              <button
                onClick={onOpenProfile}
                className="btn-secondary"
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: currentUser.isGuest
                      ? 'linear-gradient(135deg, #64748b, #475569)'
                      : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem'
                  }}
                >
                  {(currentUser.displayName || 'P')[0].toUpperCase()}
                </div>
                <span>{currentUser.displayName || 'Player'}</span>
                {currentUser.isGuest && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.12)', padding: '1px 5px', borderRadius: '4px' }}>
                    Guest
                  </span>
                )}
              </button>

              {/* Sign Out */}
              <button
                onClick={onSignOut}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.55rem' }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onOpenAuth}
                className="btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                <LogIn size={15} /> Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
