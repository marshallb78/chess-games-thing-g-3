import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import type { UserProfile } from '../../types/user';
import { Trophy, Medal, Zap, Flame, Timer, Shield } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [category, setCategory] = useState<'rapid' | 'blitz' | 'bullet'>('rapid');
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const profilesRef = ref(rtdb, 'profiles');
        const snapshot = await get(profilesRef);
        if (snapshot.exists()) {
          const data = snapshot.val() as Record<string, UserProfile>;
          const list = Object.values(data);
          // Sort by chosen rating descending
          list.sort((a, b) => (b.ratings[category]?.rating || 1200) - (a.ratings[category]?.rating || 1200));
          setPlayers(list);
        } else {
          setPlayers([]);
        }
      } catch (err) {
        console.warn('Leaderboard fetch fallback:', err);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={18} color="#facc15" />;
      case 2:
        return <Medal size={18} color="#94a3b8" />;
      case 3:
        return <Medal size={18} color="#d97706" />;
      default:
        return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{rank}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
              G+3 Global Chess Leaderboards
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Ratings update after every rated match. Provisional ratings are displayed until 5 matches are played.
            </p>
          </div>

          {/* Discipline selector */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCategory('rapid')}
              className="btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                background: category === 'rapid' ? 'var(--accent-cyan-glow)' : undefined,
                borderColor: category === 'rapid' ? 'var(--accent-cyan)' : undefined,
                color: category === 'rapid' ? 'var(--accent-cyan)' : undefined
              }}
            >
              <Timer size={15} /> Rapid
            </button>
            <button
              onClick={() => setCategory('blitz')}
              className="btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                background: category === 'blitz' ? 'var(--accent-cyan-glow)' : undefined,
                borderColor: category === 'blitz' ? 'var(--accent-cyan)' : undefined,
                color: category === 'blitz' ? 'var(--accent-cyan)' : undefined
              }}
            >
              <Flame size={15} /> Blitz
            </button>
            <button
              onClick={() => setCategory('bullet')}
              className="btn-secondary"
              style={{
                fontSize: '0.85rem',
                padding: '0.45rem 0.85rem',
                background: category === 'bullet' ? 'var(--accent-cyan-glow)' : undefined,
                borderColor: category === 'bullet' ? 'var(--accent-cyan)' : undefined,
                color: category === 'bullet' ? 'var(--accent-cyan)' : undefined
              }}
            >
              <Zap size={15} /> Bullet
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 100px 100px',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <span>Rank</span>
          <span>Player</span>
          <span style={{ textAlign: 'right' }}>Win / Loss</span>
          <span style={{ textAlign: 'right' }}>Rating</span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading leaderboard standings...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No rated players recorded in this category yet.</p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>
              Create an online room and play a match to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <div>
            {players.map((p, idx) => {
              const r = p.ratings[category];
              return (
                <div
                  key={p.uid}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 100px 100px',
                    alignItems: 'center',
                    padding: '0.85rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: idx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>{getRankBadge(idx + 1)}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {p.displayName[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.displayName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.publicId}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-green)' }}>{p.stats.wins}W</span> /{' '}
                    <span style={{ color: 'var(--accent-red)' }}>{p.stats.losses}L</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                      {r?.rating || 1200}
                    </div>
                    {r?.provisional && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-amber)' }}>Provisional</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fair Play Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <Shield size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Fair Play & Anti-Cheat Note:</strong> Ratings are currently computed client-side for this free-tier static prototype. For strict tournament verification, games can be anchored with server-side validation.
        </span>
      </div>
    </div>
  );
};
