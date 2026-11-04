import React, { useState, useEffect, useRef } from 'react';
import type { TimeControlId } from '../../types/chess';
import { TIME_CONTROLS } from '../../types/chess';
import type { OnlinePresenceUser } from '../../lib/onlineService';
import { onlineService } from '../../lib/onlineService';
import { useToast } from '../../context/ToastContext';
import { TimeControlPicker } from '../Chess/TimeControlPicker';
import {
  ArrowLeft,
  Search,
  Bot,
  Users,
  Swords,
  Loader2,
  Plus,
  KeyRound
} from 'lucide-react';

interface OnlineLobbyScreenProps {
  currentUser: {
    uid: string;
    displayName: string;
    rating?: number;
    avatar?: string;
    isGuest?: boolean;
    publicId?: string;
  };
  onStartBotGame: () => void;
  onGoHome: () => void;
  onJoinRoom: (roomId: string, playerColor: 'w' | 'b') => void;
  onCreateRoomCode: (timeControlId: TimeControlId) => void;
  onJoinRoomCode: (code: string) => void;
  onOpenFriends: () => void;
  onChallengePlayer: (player: OnlinePresenceUser, timeControlId: TimeControlId) => void;
}

export const OnlineLobbyScreen: React.FC<OnlineLobbyScreenProps> = ({
  currentUser,
  onStartBotGame,
  onGoHome,
  onJoinRoom,
  onCreateRoomCode,
  onJoinRoomCode,
  onOpenFriends,
  onChallengePlayer
}) => {
  const { showToast } = useToast();
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlId>('10+0');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePresenceUser[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePresenceUser | null>(null);

  // Matchmaking state
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [queueKey, setQueueKey] = useState<string | null>(null);

  // Private room code input
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const searchTimeoutRef = useRef<number | null>(null);

  // Subscribe to real online players in RTDB
  useEffect(() => {
    const unsub = onlineService.subscribeToOnlinePlayers(currentUser.uid, (players) => {
      setOnlinePlayers(players);
    });
    return () => unsub();
  }, [currentUser.uid]);

  // Handle Matchmaking Search
  const handleStartSearching = async () => {
    setIsSearching(true);
    setSearchFailed(false);

    try {
      const { queueKey: key } = await onlineService.enterMatchmaking(
        currentUser,
        selectedTimeControl
      );
      setQueueKey(key);

      // Listen for a match
      const unsub = onlineService.listenToMatchmaking(key, (roomId) => {
        setIsSearching(false);
        unsub();
        onJoinRoom(roomId, 'w'); // server assigned color in room
      });

      // 4-second timeout if no match found
      searchTimeoutRef.current = window.setTimeout(() => {
        setIsSearching(false);
        setSearchFailed(true);
      }, 4000);
    } catch (e) {
      console.warn('Matchmaking start failed:', e);
      setIsSearching(false);
      setSearchFailed(true);
    }
  };

  const handleCancelSearch = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (queueKey) {
      onlineService.cancelMatchmaking(queueKey);
      setQueueKey(null);
    }
    setIsSearching(false);
    setSearchFailed(false);
  };

  const handleSendChallenge = (player: OnlinePresenceUser) => {
    onChallengePlayer(player, selectedTimeControl);
  };

  return (
    <div
      style={{
        maxWidth: '1040px',
        margin: '0 auto',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={onGoHome}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', padding: '0.45rem 0.9rem' }}
        >
          <ArrowLeft size={16} /> Home
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onOpenFriends}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={16} color="var(--accent-cyan)" /> Friends
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Matchmaking & Room Code / Right Live Player List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Matchmaking card & Private Room */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Quick Match Card */}
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                Find an opponent
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Search for an opponent with your preferred time control.
              </p>
            </div>

            <TimeControlPicker
              selectedId={selectedTimeControl}
              onSelect={setSelectedTimeControl}
              disabled={isSearching}
            />

            {/* Matchmaking status / Action */}
            {isSearching ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--accent-cyan)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <Loader2 size={32} className="animate-spin" color="var(--accent-cyan)" />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                  Searching for players...
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Looking for an opponent on {TIME_CONTROLS[selectedTimeControl].name}
                </div>
                <button
                  onClick={handleCancelSearch}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', marginTop: '0.4rem' }}
                >
                  Cancel Search
                </button>
              </div>
            ) : searchFailed ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fca5a5' }}>
                  No players are online right now.
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Nobody is currently in queue. You can practice against the bot, keep searching, or create a room code for a friend.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.4rem' }}>
                  <button
                    onClick={onStartBotGame}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem' }}
                  >
                    <Bot size={16} /> Play vs Bot
                  </button>

                  <button
                    onClick={handleStartSearching}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', fontSize: '0.88rem' }}
                  >
                    <Search size={16} /> Search Again
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartSearching}
                className="btn-primary"
                style={{
                  padding: '0.9rem',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(14, 165, 233, 0.4)'
                }}
              >
                <Search size={18} />
                <span>Find an Opponent</span>
              </button>
            )}
          </div>

          {/* Private Room Code Card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={18} color="var(--accent-cyan)" /> Play with a Friend (Private Room)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => onCreateRoomCode(selectedTimeControl)}
                className="btn-secondary"
                style={{ padding: '0.65rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Create Room Code
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Code (e.g. AB12CD)"
                  maxLength={8}
                  style={{ width: '100%', textTransform: 'uppercase', fontSize: '0.82rem', padding: '6px 8px' }}
                />
                <button
                  onClick={() => {
                    const code = roomCodeInput.trim();
                    if (code.length < 4) {
                      showToast({ type: 'warning', message: 'Room code must be at least 4 characters.' });
                      return;
                    }
                    onJoinRoomCode(code);
                  }}
                  disabled={!roomCodeInput.trim()}
                  className="btn-primary"
                  style={{ padding: '0 10px', fontSize: '0.82rem' }}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Genuine Online Players List */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '440px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="var(--accent-cyan)" /> Online Players ({onlinePlayers.length})
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real connected users</span>
          </div>

          {onlinePlayers.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto 0' }}>
              <Users size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} />
              <p>No other players connected right now.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Open a second browser session to test multiplayer!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {onlinePlayers.map((player) => (
                <div
                  key={player.uid}
                  onClick={() => setSelectedPlayer(player)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: selectedPlayer?.uid === player.uid ? 'var(--accent-cyan-glow)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedPlayer?.uid === player.uid ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {player.displayName ? player.displayName[0].toUpperCase() : 'A'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {player.displayName || 'Anonymous'}
                        </span>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {player.isGuest ? 'Guest' : `Rating: ${player.rating || 1200}`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendChallenge(player);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                  >
                    <Swords size={13} /> Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Compact Player Profile Preview Panel */}
          {selectedPlayer && (
            <div
              style={{
                marginTop: 'auto',
                padding: '1rem',
                borderRadius: '12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                animation: 'fadeIn 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>
                  PLAYER PREVIEW
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  ID: {selectedPlayer.publicId}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {selectedPlayer.displayName[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedPlayer.displayName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Rating: {selectedPlayer.rating || 1200}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Wins: <strong style={{ color: 'var(--accent-green)' }}>{selectedPlayer.wins || 0}</strong></span>
                <span>Losses: <strong style={{ color: 'var(--accent-red)' }}>{selectedPlayer.losses || 0}</strong></span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '2px 0' }}>
                "{selectedPlayer.about || 'Chess player on G+3'}"
              </p>

              <button
                onClick={() => handleSendChallenge(selectedPlayer)}
                className="btn-primary"
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
              >
                <Swords size={15} /> Invite to Match
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
