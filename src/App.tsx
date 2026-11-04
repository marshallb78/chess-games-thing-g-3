import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { GameLobby } from './components/Lobby/GameLobby';
import { ChessGame } from './components/Chess/ChessGame';
import { OnlineRoomView } from './components/Chess/OnlineRoomView';
import { LeaderboardView } from './components/Leaderboard/LeaderboardView';
import { AuthModal } from './components/Auth/AuthModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { roomService } from './lib/roomService';
import type { TimeControlId } from './types/chess';

function MainApp() {
  const { currentUser, userProfile, signOut } = useAuth();

  const [currentView, setCurrentView] = useState<'lobby' | 'local_chess' | 'online_room' | 'leaderboard'>('lobby');

  // Local game state
  const [localTimeControl, setLocalTimeControl] = useState<TimeControlId>('10+0');
  const [localWhiteName, setLocalWhiteName] = useState('White Player');
  const [localBlackName, setLocalBlackName] = useState('Black Player');

  // Online room state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activePlayerColor, setActivePlayerColor] = useState<'w' | 'b'>('w');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Check URL query parameters for invite link e.g. ?room=XYZ123
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && userProfile) {
      handleJoinOnlineRoom(roomParam);
    }
  }, [userProfile]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Local Pass & Play start
  const handleStartLocalGame = (tc: TimeControlId, whiteName: string, blackName: string) => {
    setLocalTimeControl(tc);
    setLocalWhiteName(whiteName || 'White Player');
    setLocalBlackName(blackName || 'Black Player');
    setCurrentView('local_chess');
  };

  // Play vs Computer bot start
  const handleStartVsComputer = (tc: TimeControlId, playerColor: 'w' | 'b') => {
    setLocalTimeControl(tc);
    if (playerColor === 'w') {
      setLocalWhiteName(userProfile?.displayName || 'Player (White)');
      setLocalBlackName('Computer Bot (Black)');
    } else {
      setLocalWhiteName('Computer Bot (White)');
      setLocalBlackName(userProfile?.displayName || 'Player (Black)');
    }
    setCurrentView('local_chess');
  };

  // Create online multiplayer room
  const handleCreateOnlineRoom = async (tc: TimeControlId) => {
    if (!userProfile) {
      setAuthInitialMode('signin');
      setAuthModalOpen(true);
      return;
    }

    try {
      const { roomId } = await roomService.createRoom(userProfile, tc);
      setActiveRoomId(roomId);
      setActivePlayerColor('w');
      setCurrentView('online_room');
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || 'Failed to create room. Please try again.');
    }
  };

  // Join online room
  const handleJoinOnlineRoom = async (roomCode: string) => {
    if (!userProfile) {
      setAuthInitialMode('signin');
      setAuthModalOpen(true);
      return;
    }

    try {
      const { roomId, playerColor } = await roomService.joinRoomByCode(userProfile, roomCode);
      setActiveRoomId(roomId);
      setActivePlayerColor(playerColor);
      setCurrentView('online_room');
    } catch (err: unknown) {
      const error = err as Error;
      showNotification(error.message || 'Failed to join room.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onSignOut={signOut}
        currentView={currentView === 'online_room' ? 'chess' : currentView === 'local_chess' ? 'chess' : currentView}
        onChangeView={(view) => {
          if (view === 'chess') setCurrentView('local_chess');
          else setCurrentView(view);
        }}
      />

      {/* Floating Notification Banner */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-cyan)',
            boxShadow: '0 8px 24px var(--accent-cyan-glow)',
            color: 'var(--text-primary)',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            zIndex: 1000,
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {notification}
        </div>
      )}

      <main className="container" style={{ flex: 1, padding: '1.5rem 1rem' }}>
        {currentView === 'lobby' && (
          <GameLobby
            onStartLocalGame={handleStartLocalGame}
            onStartVsComputer={handleStartVsComputer}
            onCreateOnlineRoom={handleCreateOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            isLoggedIn={!!currentUser}
            onOpenAuth={() => {
              setAuthInitialMode('signin');
              setAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'local_chess' && (
          <ChessGame
            timeControlId={localTimeControl}
            whiteName={localWhiteName}
            blackName={localBlackName}
            onReturnToLobby={() => setCurrentView('lobby')}
          />
        )}

        {currentView === 'online_room' && activeRoomId && userProfile && (
          <OnlineRoomView
            roomId={activeRoomId}
            userProfile={userProfile}
            playerColor={activePlayerColor}
            onLeaveRoom={() => {
              setActiveRoomId(null);
              setCurrentView('lobby');
            }}
          />
        )}

        {currentView === 'leaderboard' && <LeaderboardView />}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={userProfile}
      />

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.25rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          background: 'var(--bg-primary)'
        }}
      >
        G+3 Games Platform • Real-time Chess Engine • Powered by chess.js & react-chessboard
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
