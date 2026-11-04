import React from 'react';
import {
  Gamepad2,
  Sparkles,
  Bot,
  Users,
  Grid,
  Zap,
  Flame,
  Palette,
  CircleDot,
  Type
} from 'lucide-react';

interface FutureGame {
  id: string;
  title: string;
  description: string;
  players: string;
  category: string;
  isPlayable: boolean;
  icon: React.ReactNode;
}

export const FUTURE_GAMES: FutureGame[] = [
  {
    id: 'chess',
    title: 'Chess',
    description: 'The royal game of strategy, tactics, and mastery.',
    players: '1-2 Players',
    category: 'Board',
    isPlayable: true,
    icon: <Gamepad2 size={24} color="#38bdf8" />
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: 'Classic diagonal captures and king crowns.',
    players: '2 Players',
    category: 'Board',
    isPlayable: false,
    icon: <CircleDot size={24} color="#818cf8" />
  },
  {
    id: 'typing-grand-prix',
    title: 'Typing Grand Prix',
    description: 'High-speed multiplayer typing drag race.',
    players: '1-8 Players',
    category: 'Arcade',
    isPlayable: false,
    icon: <Type size={24} color="#f59e0b" />
  },
  {
    id: 'connect-four',
    title: 'Connect Four',
    description: 'Drop chips into the 7x6 grid to connect four in a row.',
    players: '2 Players',
    category: 'Strategy',
    isPlayable: false,
    icon: <Grid size={24} color="#ef4444" />
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Fast-paced classic 3x3 and Ultimate 9x9 grids.',
    players: '2 Players',
    category: 'Quick Play',
    isPlayable: false,
    icon: <Zap size={24} color="#10b981" />
  },
  {
    id: 'dots-and-boxes',
    title: 'Dots and Boxes',
    description: 'Draw lines, complete squares, and dominate the territory.',
    players: '2-4 Players',
    category: 'Grid',
    isPlayable: false,
    icon: <Grid size={24} color="#38bdf8" />
  },
  {
    id: 'hot-potato',
    title: 'Hot Potato',
    description: 'Ticking time-bomb showdown. Pass it before it detonates!',
    players: '2-8 Players',
    category: 'Party',
    isPlayable: false,
    icon: <Flame size={24} color="#f97316" />
  },
  {
    id: 'territory-wars',
    title: 'Territory Wars',
    description: 'Turn-based tactical map control and resource expansion.',
    players: '2-4 Players',
    category: 'Strategy',
    isPlayable: false,
    icon: <Users size={24} color="#a855f7" />
  },
  {
    id: 'draw-and-guess',
    title: 'Draw & Guess',
    description: 'Real-time collaborative drawing and fast word guessing.',
    players: '3-10 Players',
    category: 'Party',
    isPlayable: false,
    icon: <Palette size={24} color="#ec4899" />
  },
  {
    id: 'snake-arena',
    title: 'Snake Arena',
    description: 'Classic snake battle royale. Outmaneuver opponents!',
    players: '1-8 Players',
    category: 'Action',
    isPlayable: false,
    icon: <Bot size={24} color="#22c55e" />
  },
  {
    id: 'orb-eater',
    title: 'Orb Eater',
    description: 'Consume floating pellets, grow massive, and absorb rivals.',
    players: 'Multiplayer IO',
    category: 'Action',
    isPlayable: false,
    icon: <Sparkles size={24} color="#06b6d4" />
  },
  {
    id: 'paint-panic',
    title: 'Paint Panic',
    description: 'Cover the arena with your team color in timed chaos.',
    players: '2-6 Players',
    category: 'Action',
    isPlayable: false,
    icon: <Palette size={24} color="#eab308" />
  }
];

interface FutureGamesGridProps {
  onSelectGame: (gameId: string) => void;
}

export const FutureGamesGrid: React.FC<FutureGamesGridProps> = ({ onSelectGame }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            G+3 Gaming Catalog
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            12 planned real-time browser games designed for school and friends.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}
      >
        {FUTURE_GAMES.map((game) => (
          <div
            key={game.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.85rem',
              cursor: game.isPlayable ? 'pointer' : 'default',
              border: game.isPlayable
                ? '1px solid var(--accent-cyan)'
                : '1px solid var(--border-subtle)',
              boxShadow: game.isPlayable
                ? '0 6px 20px var(--accent-cyan-glow)'
                : undefined,
              transition: 'all 0.2s ease',
              opacity: game.isPlayable ? 1 : 0.8
            }}
            onClick={() => {
              if (game.isPlayable) {
                onSelectGame(game.id);
              }
            }}
            onMouseEnter={(e) => {
              if (game.isPlayable) {
                e.currentTarget.style.transform = 'translateY(-3px)';
              }
            }}
            onMouseLeave={(e) => {
              if (game.isPlayable) {
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.6rem'
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)'
                  }}
                >
                  {game.icon}
                </div>
                {game.isPlayable ? (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)'
                    }}
                  >
                    PLAYABLE NOW
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    COMING SOON
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {game.title}
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}
              >
                {game.description}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.6rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>{game.category}</span>
              <span>{game.players}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

