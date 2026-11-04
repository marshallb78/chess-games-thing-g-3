import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/Screens/HomeScreen';
import { ModeSelectScreen } from './components/Screens/ModeSelectScreen';
import { BotSetupScreen } from './components/Screens/BotSetupScreen';
import { LocalSetupScreen } from './components/Screens/LocalSetupScreen';
import { OnlineLobbyScreen } from './components/Screens/OnlineLobbyScreen';
import { ChessGame } from './components/Chess/ChessGame';
import { OnlineRoomView } from './components/Chess/OnlineRoomView';
import { AuthModal } from './components/Auth/AuthModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { FriendsModal } from './components/Friends/FriendsModal';
import { InvitationToast } from './components/Invitations/InvitationToast';
import { InvitationModal } from './components/Invitations/InvitationModal';
import { roomService } from './lib/roomService';
import { onlineService, type MatchInvitationData, type IncomingFriendRequest } from './lib/onlineService';
import type { TimeControlId, BotDifficulty } from './types/chess';

type AppScreen =
  | 'home'
  | 'mode_select'
  | 'bot_setup'
  | 'local_setup'
  | 'online_lobby'
  | 'local_game'
  | 'bot_game'
  | 'online_game';

function MainApp() {
  const { currentUser, userProfile, isGuest, signOut, refreshProfile, playAsGuest } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');

  // Game configuration states
  const [activeTimeControl, setActiveTimeControl] = useState<TimeControlId>('10+0');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [botPlayerColor, setBotPlayerColor] = useState<'w' | 'b'>('w');
  const [localWhiteName, setLocalWhiteName] = useState('Player 1 (White)');
  const [localBlackName, setLocalBlackName] = useState('Player 2 (Black)');

  // Online active room
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activePlayerColor, setActivePlayerColor] = useState<'w' | 'b'>('w');

  // Modals & Notifications
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);

  // Invitations
  const [incomingInvite, setIncomingInvite] = useState<MatchInvitationData | null>(null);
  const [viewingInvite, setViewingInvite] = useState<MatchInvitationData | null>(null);

  // Friend requests count
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>([]);

  // 1. Presence tracking: keeps this client active in RTDB
  useEffect(() => {
    if (!userProfile) return;
    const cleanupPresence = onlineService.trackPresence(userProfile);
    return () => cleanupPresence();
  }, [userProfile]);

  // 2. Listen for incoming invitations in real time
  useEffect(() => {
    if (!userProfile) return;
    const unsub = onlineService.subscribeToIncomingInvitations(userProfile.uid, (inv) => {
      setIncomingInvite(inv);
    });
    return () => unsub();
  }, [userProfile]);

  // 3. Listen for friend requests count
  useEffect(() => {
    if (!currentUser || isGuest) return;
    const unsub = onlineService.subscribeToFriendRequests(currentUser.uid, (reqs) => {
      setFriendRequests(reqs);
    });
    return () => unsub();
  }, [currentUser, isGuest]);

  // 4. URL query params for direct room link (e.g. ?room=AB12CD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && userProfile) {
      handleJoinByRoomCode(roomCode);
    }
  }, [userProfile]);

  // Handlers for Navigation
  const handlePlayClick = () => {
    if (!currentUser && !sessionStorage.getItem('g3_seen_auth_prompt')) {
      sessionStorage.setItem('g3_seen_auth_prompt', 'true');
      setAuthInitialMode('signin');
      setAuthModalOpen(true);
      return;
    }
    setCurrentScreen('mode_select');
  };

  const handleStartBotGame = (
    tc: TimeControlId,
    diff: BotDifficulty,
    color: 'w' | 'b'
  ) => {
    setActiveTimeControl(tc);
    setBotDifficulty(diff);
    setBotPlayerColor(color);
    setCurrentScreen('bot_game');
  };

  const handleStartLocalGame = (
    tc: TimeControlId,
    whiteName: string,
    blackName: string
  ) => {
    setActiveTimeControl(tc);
    setLocalWhiteName(whiteName || 'White');
    setLocalBlackName(blackName || 'Black');
    setCurrentScreen('local_game');
  };

  const handleCreateRoomCode = async (tc: TimeControlId) => {
    if (!userProfile) return;
    try {
      const { roomId } = await roomService.createRoom(userProfile, tc);
      setActiveRoomId(roomId);
      setActivePlayerColor('w');
      setCurrentScreen('online_game');
    } catch (e) {
      alert((e as Error).message || 'Failed to create room');
    }
  };

  const handleJoinByRoomCode = async (code: string) => {
    if (!userProfile) return;
    try {
      const { roomId, playerColor } = await roomService.joinRoomByCode(userProfile, code);
      setActiveRoomId(roomId);
      setActivePlayerColor(playerColor);
      setCurrentScreen('online_game');
    } catch (e) {
      alert((e as Error).message || 'Failed to join room');
    }
  };

  // Invitation handlers
  const handleAcceptInvitation = async (invitation: MatchInvitationData) => {
    if (!userProfile) return;
    try {
      const roomId = await onlineService.acceptInvitation(invitation, userProfile);
      setViewingInvite(null);
      setIncomingInvite(null);
      setActiveRoomId(roomId);
      setActivePlayerColor('b'); // Recipient plays as Black
      setCurrentScreen('online_game');
    } catch (e) {
      alert((e as Error).message || 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!userProfile) return;
    await onlineService.declineInvitation(invitationId, userProfile.uid);
    setIncomingInvite(null);
    setViewingInvite(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Floating Match Invitation Notification */}
      <InvitationToast
        invitation={incomingInvite}
        onView={(inv) => {
          setViewingInvite(inv);
          setIncomingInvite(null);
        }}
        onDecline={handleDeclineInvitation}
      />

      {/* Top Navbar */}
      <Navbar
        currentUser={
          currentUser
            ? { uid: currentUser.uid, displayName: currentUser.displayName, email: currentUser.email, isGuest: false }
            : userProfile
            ? { uid: userProfile.uid, displayName: userProfile.displayName, isGuest: true }
            : null
        }
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenFriends={() => setFriendsModalOpen(true)}
        onSignOut={signOut}
        onGoHome={() => setCurrentScreen('home')}
        friendRequestsCount={friendRequests.length}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 1. HOME SCREEN */}
        {currentScreen === 'home' && (
          <HomeScreen
            onPlay={handlePlayClick}
            onOpenAuth={() => {
              setAuthInitialMode('signin');
              setAuthModalOpen(true);
            }}
            currentUser={currentUser ? { uid: currentUser.uid, displayName: currentUser.displayName } : null}
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}

        {/* 2. MODE SELECT SCREEN (Exactly 3 main cards) */}
        {currentScreen === 'mode_select' && (
          <ModeSelectScreen
            onSelectMode={(mode) => {
              if (mode === 'online') setCurrentScreen('online_lobby');
              else if (mode === 'bot') setCurrentScreen('bot_setup');
              else if (mode === 'local') setCurrentScreen('local_setup');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {/* 3. BOT SETUP SCREEN */}
        {currentScreen === 'bot_setup' && (
          <BotSetupScreen
            onStartGame={handleStartBotGame}
            onBack={() => setCurrentScreen('mode_select')}
          />
        )}

        {/* 4. LOCAL SETUP SCREEN */}
        {currentScreen === 'local_setup' && (
          <LocalSetupScreen
            onStartGame={handleStartLocalGame}
            onBack={() => setCurrentScreen('mode_select')}
          />
        )}

        {/* 5. ONLINE LOBBY SCREEN */}
        {currentScreen === 'online_lobby' && userProfile && (
          <OnlineLobbyScreen
            currentUser={userProfile}
            onStartBotGame={() => setCurrentScreen('bot_setup')}
            onGoHome={() => setCurrentScreen('home')}
            onJoinRoom={(roomId, color) => {
              setActiveRoomId(roomId);
              setActivePlayerColor(color);
              setCurrentScreen('online_game');
            }}
            onCreateRoomCode={handleCreateRoomCode}
            onJoinRoomCode={handleJoinByRoomCode}
            onOpenFriends={() => setFriendsModalOpen(true)}
          />
        )}

        {/* 6. BOT CHESS GAME */}
        {currentScreen === 'bot_game' && (
          <div style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <ChessGame
              timeControlId={activeTimeControl}
              isBotGame={true}
              botDifficulty={botDifficulty}
              playerColor={botPlayerColor}
              whiteName={botPlayerColor === 'w' ? userProfile?.displayName || 'You' : `Bot (${botDifficulty})`}
              blackName={botPlayerColor === 'b' ? userProfile?.displayName || 'You' : `Bot (${botDifficulty})`}
              onReturnToLobby={() => setCurrentScreen('mode_select')}
            />
          </div>
        )}

        {/* 7. LOCAL 2P CHESS GAME */}
        {currentScreen === 'local_game' && (
          <div style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <ChessGame
              timeControlId={activeTimeControl}
              isBotGame={false}
              isOnlineGame={false}
              whiteName={localWhiteName}
              blackName={localBlackName}
              onReturnToLobby={() => setCurrentScreen('mode_select')}
            />
          </div>
        )}

        {/* 8. ONLINE MULTIPLAYER CHESS GAME */}
        {currentScreen === 'online_game' && activeRoomId && userProfile && (
          <div style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <OnlineRoomView
              roomId={activeRoomId}
              userProfile={userProfile}
              playerColor={activePlayerColor}
              onLeaveRoom={() => {
                setActiveRoomId(null);
                setCurrentScreen('online_lobby');
              }}
            />
          </div>
        )}
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onPlayAsGuest={() => {
          playAsGuest();
          setCurrentScreen('mode_select');
        }}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={userProfile}
        onProfileUpdated={refreshProfile}
      />

      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
        currentUser={
          currentUser
            ? { uid: currentUser.uid, displayName: currentUser.displayName || 'Player', isGuest: false }
            : userProfile
            ? { uid: userProfile.uid, displayName: userProfile.displayName, isGuest: true }
            : null
        }
        onInviteFriend={(friendUid) => {
          if (!userProfile) return;
          onlineService
            .sendInvitation(
              {
                uid: userProfile.uid,
                displayName: userProfile.displayName,
                rating: userProfile.ratings?.rapid?.rating || 1200,
                avatar: userProfile.avatar
              },
              friendUid,
              activeTimeControl
            )
            .then(() => alert('Match invitation sent to friend!'))
            .catch((e) => alert((e as Error).message || 'Failed to send invite'));
        }}
        onOpenAuth={() => {
          setFriendsModalOpen(false);
          setAuthInitialMode('signup');
          setAuthModalOpen(true);
        }}
      />

      {/* Received Invitation Details Modal */}
      <InvitationModal
        invitation={viewingInvite}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
        onClose={() => setViewingInvite(null)}
      />
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
