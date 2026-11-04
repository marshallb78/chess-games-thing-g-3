import React, { useState } from 'react';
import type { UserProfile } from '../../types/user';
import { ref, update } from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';
import { X, ShieldCheck, Calendar, Clock, Trophy, Edit3, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onProfileUpdated?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated
}) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.displayName || '');
  const [aboutInput, setAboutInput] = useState(profile?.about || '');
  const [saving, setSaving] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanName = nameInput.trim() || profile.displayName;
      const cleanAbout = aboutInput.trim();
      await update(ref(rtdb, `profiles/${profile.uid}`), {
        displayName: cleanName,
        about: cleanAbout
      });
      // Also update presence if present
      await update(ref(rtdb, `presence/${profile.uid}`), {
        displayName: cleanName,
        about: cleanAbout
      }).catch(() => {});

      if (onProfileUpdated) onProfileUpdated();
      setIsEditing(false);
      showToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      showToast({ type: 'error', message: (err as Error).message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
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

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{profile.displayName}</h2>
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

              {!isEditing && (
                <button
                  onClick={() => {
                    setNameInput(profile.displayName);
                    setAboutInput(profile.about || '');
                    setIsEditing(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={13} /> Edit
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Joined {formatDate(profile.createdAt)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Active {formatDate(profile.lastActive)}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Bio Form */}
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                style={{ width: '100%', fontSize: '0.88rem' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>About / Bio</label>
              <textarea
                value={aboutInput}
                onChange={(e) => setAboutInput(e.target.value)}
                placeholder="Tell other players about your chess style..."
                maxLength={160}
                rows={2}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}>
                <Check size={14} /> Save
              </button>
            </div>
          </form>
        ) : (
          profile.about && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
              "{profile.about}"
            </p>
          )
        )}

        {/* Overall Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
            marginBottom: '1.25rem'
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
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {r.gamesPlayed} games
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
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
