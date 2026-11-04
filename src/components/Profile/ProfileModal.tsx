import React from 'react';
import type { UserProfile } from '../../types/user';
import { X, ShieldCheck, Calendar, Clock, Trophy } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!isOpen || !profile) return null;

  const totalGames = profile.stats.gamesPlayed;
  const winRate = totalGames > 0 ? Math.round((profile.stats.wins / totalGames) * 100) : 0;

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '520px' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            color: 'var(--text-muted)'
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
            }}
          >
            {profile.displayName[0].toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{profile.displayName}</h2>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {profile.publicId}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Joined {formatDate(profile.createdAt)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Active {formatDate(profile.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 0.5rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalGames}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Played</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 0.5rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>{profile.stats.wins}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Won</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 0.5rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)' }}>{profile.stats.losses}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lost</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 0.5rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{winRate}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Win Rate</div>
          </div>
        </div>

        {/* Ratings Breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Trophy size={16} color="var(--accent-cyan)" /> Chess Ratings & Disciplines
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {(['bullet', 'blitz', 'rapid', 'casual'] as const).map((cat) => {
              const r = profile.ratings[cat];
              const title = cat.charAt(0).toUpperCase() + cat.slice(1);
              return (
                <div
                  key={cat}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {r.gamesPlayed} games
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {r.rating}
                    </div>
                    {r.provisional && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '1px 4px', borderRadius: '4px' }}>
                        Provisional
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Note */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.8rem',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <ShieldCheck size={16} color="var(--accent-green)" />
          <span>Email address is private and never shown to other players.</span>
        </div>
      </div>
    </div>
  );
};
