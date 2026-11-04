import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/Common/ToastContainer';
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
import { OutgoingChallengeModal } from './components/Invitations/OutgoingChallengeModal';
import { roomService } from './lib/roomService';
import { onlineService, type MatchInvitationData, type IncomingFriendRequest } from './lib/onlineService';
import { resolveDisplayName, resolvePlayerRating } from './lib/playerUtils';
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
  const { showToast } = useToast();

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

  // Incoming invitations
  const [incomingInvite, setIncomingInvite] = useState<MatchInvitationData | null>(null);
  const [viewingInvite, setViewingInvite] = useState<MatchInvitationData | null>(null);

  // Outgoing match challenge
  const [outgoingChallenge, setOutgoingChallenge] = useState<{
    invitationId: string;
    targetPlayerUid: string;
    targetPlayerName: string;
    targetPlayerRating?: number;
    timeControlId: TimeControlId;
  } | null>(null);

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

  // Game start handlers
  const handleStartBotGame = (tc: TimeControlId, difficulty: BotDifficulty, playerColor: 'w' | 'b') => {
    setActiveTimeControl(tc);
    setBotDifficulty(difficulty);
    setBotPlayerColor(playerColor);
    setCurrentScreen('bot_game');
  };

  const handleStartLocalGame = (tc: TimeControlId, whiteName?: string, blackName?: string) => {
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
      showToast({ type: 'success', message: 'Room created! Waiting for opponent.' });
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message || 'Failed to create room' });
    }
  };

  const handleJoinByRoomCode = async (code: string) => {
    if (!userProfile) return;
    try {
      const { roomId, playerColor } = await roomService.joinRoomByCode(userProfile, code);
      setActiveRoomId(roomId);
      setActivePlayerColor(playerColor);
      setCurrentScreen('online_game');
      showToast({ type: 'success', message: 'Joined room successfully!' });
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message || 'Failed to join room' });
    }
  };

  // 4. URL query params for direct room link (e.g. ?room=AB12CD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode && userProfile) {
      handleJoinByRoomCode(roomCode);
    }
  }, [userProfile]);

  // Outgoing Challenge Handler
  const handleStartOutgoingChallenge = async (
    targetPlayer: { uid: string; displayName: string; rating?: number },
    timeControl: TimeControlId
  ) => {
    if (!userProfile) return;
    try {
      const myDisplayName = resolveDisplayName(userProfile, currentUser);
      const myRating = resolvePlayerRating(userProfile, 1200);

      const inviteId = await onlineService.sendInvitation(
        {
          uid: userProfile.uid,
          displayName: myDisplayName,
          rating: myRating,
          avatar: userProfile.avatar,
          ratings: userProfile.ratings
        },
        targetPlayer.uid,
        timeControl
      );

      setOutgoingChallenge({
        invitationId: inviteId,
        targetPlayerUid: targetPlayer.uid,
        targetPlayerName: targetPlayer.displayName,
        targetPlayerRating: targetPlayer.rating,
        timeControlId: timeControl
      });
    } catch (err: unknown) {
      showToast({ type: 'error', message: (err as Error).message || 'Failed to send challenge' });
    }
  };

  const handleCancelOutgoingChallenge = async () => {
    if (outgoingChallenge) {
      await onlineService.cancelInvitation(outgoingChallenge.invitationId, outgoingChallenge.targetPlayerUid);
      setOutgoingChallenge(null);
    }
  };

  const handleReinviteOutgoingChallenge = async () => {
    if (!outgoingChallenge || !userProfile) return;
    try {
      const myDisplayName = resolveDisplayName(userProfile, currentUser);
      const myRating = resolvePlayerRating(userProfile, 1200);

      const inviteId = await onlineService.sendInvitation(
        {
          uid: userProfile.uid,
          displayName: myDisplayName,
          rating: myRating,
          avatar: userProfile.avatar,
          ratings: userProfile.ratings
        },
        outgoingChallenge.targetPlayerUid,
        outgoingChallenge.timeControlId
      );
      setOutgoingChallenge((prev) => (prev ? { ...prev, invitationId: inviteId } : null));
      showToast({ type: 'info', message: 'Challenge re-sent.' });
    } catch (err: unknown) {
      showToast({ type: 'error', message: (err as Error).message || 'Failed to re-send challenge' });
    }
  };

  // Incoming Invitation Handlers
  const handleAcceptInvitation = async (invitation: MatchInvitationData) => {
    if (!userProfile) return;
    try {
      const recipientData = {
        uid: userProfile.uid,
        displayName: resolveDisplayName(userProfile, currentUser),
        rating: resolvePlayerRating(userProfile, 1200),
        ratings: userProfile.ratings
      };
      const roomId = await onlineService.acceptInvitation(invitation, recipientData);
      setViewingInvite(null);
      setIncomingInvite(null);
      setActiveRoomId(roomId);
      setActivePlayerColor('b'); // Recipient plays as Black
      setCurrentScreen('online_game');
      showToast({ type: 'success', message: 'Challenge accepted! Entering match.' });
    } catch (e) {
      showToast({ type: 'error', message: (e as Error).message || 'Failed to accept invitation' });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!userProfile) return;
    await onlineService.declineInvitation(invitationId, userProfile.uid);
    setIncomingInvite(null);
    setViewingInvite(null);
    showToast({ type: 'info', message: 'Invitation declined.' });
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
          userProfile || currentUser
            ? {
                uid: userProfile?.uid || currentUser!.uid,
                displayName: resolveDisplayName(userProfile, currentUser),
                email: currentUser?.email,
                isGuest: !currentUser || !!userProfile?.isGuest
              }
            : null
        }
        friendRequestsCount={friendRequests.length}
        onOpenAuth={() => {
          setAuthInitialMode('signin');
          setAuthModalOpen(true);
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenFriends={() => setFriendsModalOpen(true)}
        onSignOut={async () => {
          await signOut();
          setCurrentScreen('home');
          showToast({ type: 'info', message: 'Signed out.' });
        }}
        onGoHome={() => setCurrentScreen('home')}
      />

      {/* Dynamic Screen View */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentScreen === 'home' && (
          <HomeScreen
            onPlay={() => {
              if (!currentUser && !isGuest) {
                playAsGuest();
              }
              setCurrentScreen('mode_select');
            }}
            onOpenAuth={() => {
              setAuthInitialMode('signin');
              setAuthModalOpen(true);
            }}
            currentUser={
              userProfile || currentUser
                ? {
                    uid: userProfile?.uid || currentUser!.uid,
                    displayName: resolveDisplayName(userProfile, currentUser)
                  }
                : null
            }
            onOpenProfile={() => setProfileModalOpen(true)}
          />
        )}

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

        {currentScreen === 'bot_setup' && (
          <BotSetupScreen
            onStartGame={handleStartBotGame}
            onBack={() => setCurrentScreen('mode_select')}
          />
        )}

        {currentScreen === 'local_setup' && (
          <LocalSetupScreen
            onStartGame={handleStartLocalGame}
            onBack={() => setCurrentScreen('mode_select')}
          />
        )}

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
            onChallengePlayer={(player, tc) => {
              handleStartOutgoingChallenge(player, tc);
            }}
          />
        )}

        {currentScreen === 'bot_game' && (
          <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0.75rem' }}>
            <ChessGame
              timeControlId={activeTimeControl}
              isBotGame={true}
              botDifficulty={botDifficulty}
              playerColor={botPlayerColor}
              whiteName={botPlayerColor === 'w' ? resolveDisplayName(userProfile, currentUser, 'You') : `Bot (${botDifficulty})`}
              blackName={botPlayerColor === 'b' ? resolveDisplayName(userProfile, currentUser, 'You') : `Bot (${botDifficulty})`}
              onReturnToLobby={() => setCurrentScreen('home')}
            />
          </div>
        )}

        {currentScreen === 'local_game' && (
          <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0.75rem' }}>
            <ChessGame
              timeControlId={activeTimeControl}
              whiteName={localWhiteName}
              blackName={localBlackName}
              onReturnToLobby={() => setCurrentScreen('home')}
            />
          </div>
        )}

        {currentScreen === 'online_game' && activeRoomId && userProfile && (
          <OnlineRoomView
            roomId={activeRoomId}
            userProfile={userProfile}
            playerColor={activePlayerColor}
            onLeaveRoom={() => {
              setActiveRoomId(null);
              setCurrentScreen('online_lobby');
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onPlayAsGuest={() => {
          playAsGuest();
          setAuthModalOpen(false);
          showToast({ type: 'info', message: 'Playing as Guest' });
        }}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        profile={userProfile}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdated={refreshProfile}
      />

      <FriendsModal
        isOpen={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
        currentUser={
          userProfile || currentUser
            ? {
                uid: userProfile?.uid || currentUser!.uid,
                displayName: resolveDisplayName(userProfile, currentUser),
                isGuest: !currentUser || !!userProfile?.isGuest
              }
            : null
        }
        onInviteFriend={(friendUid, friendName) => {
          handleStartOutgoingChallenge({ uid: friendUid, displayName: friendName }, activeTimeControl);
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

      {/* Outgoing Challenge Status Modal */}
      <OutgoingChallengeModal
        invitationId={outgoingChallenge?.invitationId || null}
        targetPlayerName={outgoingChallenge?.targetPlayerName || 'Opponent'}
        targetPlayerRating={outgoingChallenge?.targetPlayerRating}
        timeControlId={outgoingChallenge?.timeControlId || '10+0'}
        onMatchStarted={(roomId) => {
          setOutgoingChallenge(null);
          setActiveRoomId(roomId);
          setActivePlayerColor('w'); // Challenger is White
          setCurrentScreen('online_game');
          showToast({ type: 'success', message: 'Challenge accepted! Match starting.' });
        }}
        onCancel={handleCancelOutgoingChallenge}
        onInviteAgain={handleReinviteOutgoingChallenge}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
