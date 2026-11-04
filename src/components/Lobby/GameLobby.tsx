import React, { useState } from 'react';
import type { TimeControlId } from '../../types/chess';
import { TimeControlPicker } from '../Chess/TimeControlPicker';
import { FutureGamesGrid } from './FutureGamesGrid';
import { Users, Bot, Globe, Play, KeyRound, Plus } from 'lucide-react';

interface GameLobbyProps {
  onStartLocalGame: (timeControlId: TimeControlId, whiteName: string, blackName: string) => void;
  onStartVsComputer: (timeControlId: TimeControlId, playerColor: 'w' | 'b') => void;
  onCreateOnlineRoom: (timeControlId: TimeControlId) => void;
  onJoinOnlineRoom: (roomCode: string) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  onStartLocalGame,
  onStartVsComputer,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  isLoggedIn,
  onOpenAuth
}) => {
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlId>('10+0');
  const [activeTab, setActiveTab] = useState<'local' | 'computer' | 'online'>('local');

  // Local settings
  const [whitePlayerName, setWhitePlayerName] = useState('Player 1 (White)');
  const [blackPlayerName, setBlackPlayerName] = useState('Player 2 (Black)');

  // Computer settings
  const [botColor, setBotColor] = useState<'w' | 'b'>('w');

  // Online settings
  const [joinCodeInput, setJoinCodeInput] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #131c31 0%, #1a2542 100%)',
          border: '1px solid var(--border-subtle)',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '0.75rem'
            }}
          >
            <span>★</span> G+3 GAMES PLATFORM — CHESS ENGINE ONLINE
          </div>
          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              marginBottom: '0.5rem'
            }}
          >
            Play Real-Time Chess Anywhere
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5 }}>
            Play locally with Pass & Play, train against the computer, or create real-time private multiplayer rooms to challenge your classmates and friends.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setActiveTab('local')}
            className="btn-secondary"
            style={{
              background: activeTab === 'local' ? 'var(--accent-cyan-glow)' : 'transparent',
              borderColor: activeTab === 'local' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: activeTab === 'local' ? 'var(--accent-cyan)' : 'var(--text-primary)',
              fontWeight: activeTab === 'local' ? 700 : 500
            }}
          >
            <Users size={16} /> Pass & Play (Local 2P)
          </button>

          <button
            onClick={() => setActiveTab('computer')}
            className="btn-secondary"
            style={{
              background: activeTab === 'computer' ? 'var(--accent-cyan-glow)' : 'transparent',
              borderColor: activeTab === 'computer' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: activeTab === 'computer' ? 'var(--accent-cyan)' : 'var(--text-primary)',
              fontWeight: activeTab === 'computer' ? 700 : 500
            }}
          >
            <Bot size={16} /> Play vs Computer
          </button>

          <button
            onClick={() => setActiveTab('online')}
            className="btn-secondary"
            style={{
              background: activeTab === 'online' ? 'var(--accent-cyan-glow)' : 'transparent',
              borderColor: activeTab === 'online' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: activeTab === 'online' ? 'var(--accent-cyan)' : 'var(--text-primary)',
              fontWeight: activeTab === 'online' ? 700 : 500
            }}
          >
            <Globe size={16} /> Online Multiplayer
          </button>
        </div>

        {/* Mode-specific configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <TimeControlPicker
            selectedId={selectedTimeControl}
            onSelect={setSelectedTimeControl}
          />

          {/* Local Mode Settings */}
          {activeTab === 'local' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.4rem'
                    }}
                  >
                    White Player Name
                  </label>
                  <input
                    type="text"
                    value={whitePlayerName}
                    onChange={(e) => setWhitePlayerName(e.target.value)}
                    style={{ width: '100%' }}
                    placeholder="White Player"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.4rem'
                    }}
                  >
                    Black Player Name
                  </label>
                  <input
                    type="text"
                    value={blackPlayerName}
                    onChange={(e) => setBlackPlayerName(e.target.value)}
                    style={{ width: '100%' }}
                    placeholder="Black Player"
                  />
                </div>
              </div>

              <div>
                <button
                  onClick={() => onStartLocalGame(selectedTimeControl, whitePlayerName, blackPlayerName)}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
                >
                  <Play size={18} /> Start Local Game
                </button>
              </div>
            </div>
          )}

          {/* Computer Mode Settings */}
          {activeTab === 'computer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem'
                  }}
                >
                  Your Piece Color
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setBotColor('w')}
                    className="btn-secondary"
                    style={{
                      borderColor: botColor === 'w' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      background: botColor === 'w' ? 'var(--accent-cyan-glow)' : undefined
                    }}
                  >
                    Play as White
                  </button>
                  <button
                    onClick={() => setBotColor('b')}
                    className="btn-secondary"
                    style={{
                      borderColor: botColor === 'b' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      background: botColor === 'b' ? 'var(--accent-cyan-glow)' : undefined
                    }}
                  >
                    Play as Black
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={() => onStartVsComputer(selectedTimeControl, botColor)}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
                >
                  <Play size={18} /> Play Against Bot
                </button>
              </div>
            </div>
          )}

          {/* Online Multiplayer Mode Settings */}
          {activeTab === 'online' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!isLoggedIn ? (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    maxWidth: '480px'
                  }}
                >
                  <h4 style={{ color: 'var(--accent-cyan)' }}>Sign In Required for Online Play</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Sign in with your email and password to create or join private rooms and track your stats.
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Sign In or Create Account
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {/* Create Room Box */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Create Private Room</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Host a game with your selected time control and invite a friend using a 6-character room code.
                    </p>
                    <button
                      onClick={() => onCreateOnlineRoom(selectedTimeControl)}
                      className="btn-primary"
                      style={{ padding: '0.65rem 1rem', marginTop: 'auto' }}
                    >
                      <Plus size={16} /> Create Room Now
                    </button>
                  </div>

                  {/* Join Room Box */}
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Join With Code</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Enter the room code provided by your opponent to connect directly.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. AB12CD"
                        maxLength={8}
                        style={{ textTransform: 'uppercase', flex: 1, letterSpacing: '1px', fontWeight: 600 }}
                      />
                      <button
                        onClick={() => {
                          if (joinCodeInput.trim()) {
                            onJoinOnlineRoom(joinCodeInput.trim());
                          }
                        }}
                        disabled={!joinCodeInput.trim()}
                        className="btn-primary"
                        style={{ padding: '0.65rem 1rem' }}
                      >
                        <KeyRound size={16} /> Join
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Catalog of Future G+3 Games */}
      <FutureGamesGrid onSelectGame={() => setActiveTab('local')} />
    </div>
  );
};
