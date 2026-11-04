import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  onDisconnect,
  runTransaction,
  type Unsubscribe
} from 'firebase/database';
import { rtdb } from './firebase';
import type { TimeControlId } from '../types/chess';
import { TIME_CONTROLS } from '../types/chess';
import type { GameRoom } from '../types/room';

export interface OnlinePresenceUser {
  uid: string;
  displayName: string;
  rating?: number;
  avatar?: string;
  publicId?: string;
  isOnline: boolean;
  isGuest: boolean;
  lastSeen: number;
  about?: string;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface MatchInvitationData {
  id: string;
  senderUid: string;
  senderName: string;
  senderRating?: number;
  senderAvatar?: string;
  recipientUid: string;
  timeControlId: TimeControlId;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: number;
  roomId?: string;
}

export interface FriendEntry {
  uid: string;
  displayName: string;
  avatar?: string;
  rating?: number;
  publicId?: string;
  since: number;
}

export interface IncomingFriendRequest {
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  timestamp: number;
}

export const onlineService = {
  /**
   * Set up real-time presence with onDisconnect automatic cleanup
   */
  trackPresence(user: {
    uid: string;
    displayName: string;
    rating?: number;
    avatar?: string;
    publicId?: string;
    isGuest?: boolean;
    about?: string;
    wins?: number;
    losses?: number;
    draws?: number;
  }): () => void {
    const presenceRef = ref(rtdb, `presence/${user.uid}`);

    const presenceData: OnlinePresenceUser = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      rating: user.rating || 1200,
      avatar: user.avatar || 'default',
      publicId: user.publicId || user.uid.substring(0, 6).toUpperCase(),
      isOnline: true,
      isGuest: !!user.isGuest,
      lastSeen: Date.now(),
      about: user.about || 'Chess enthusiast on G+3.',
      wins: user.wins || 0,
      losses: user.losses || 0,
      draws: user.draws || 0
    };

    set(presenceRef, presenceData).catch(() => {});

    // On disconnect, mark offline
    const disconnectHandler = onDisconnect(presenceRef);
    disconnectHandler.set({ ...presenceData, isOnline: false, lastSeen: Date.now() });

    // Periodic heartbeat every 60s
    const interval = window.setInterval(() => {
      update(presenceRef, { lastSeen: Date.now(), isOnline: true }).catch(() => {});
    }, 60000);

    return () => {
      clearInterval(interval);
      disconnectHandler.cancel();
      update(presenceRef, { isOnline: false, lastSeen: Date.now() }).catch(() => {});
    };
  },

  /**
   * Listen to active online players (excluding self)
   */
  subscribeToOnlinePlayers(
    selfUid: string,
    callback: (players: OnlinePresenceUser[]) => void
  ): Unsubscribe {
    const presenceRef = ref(rtdb, 'presence');
    return onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val() as Record<string, OnlinePresenceUser>;
        const now = Date.now();
        const active = Object.values(raw).filter(
          (p) =>
            p.uid !== selfUid &&
            p.isOnline === true &&
            now - p.lastSeen < 180000 // Active within last 3 minutes
        );
        callback(active);
      } else {
        callback([]);
      }
    });
  },

  /**
   * Safe Matchmaking Queue
   */
  async enterMatchmaking(
    user: { uid: string; displayName: string; rating?: number; isGuest?: boolean },
    timeControlId: TimeControlId
  ): Promise<{ queueKey: string }> {
    const queueRef = ref(rtdb, 'matchmaking/queue');
    const newEntryRef = push(queueRef);
    const queueKey = newEntryRef.key;
    if (!queueKey) throw new Error('Failed to generate queue key');

    const entryData = {
      queueKey,
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      rating: user.rating || 1200,
      timeControlId,
      createdAt: Date.now(),
      isGuest: !!user.isGuest
    };

    await set(newEntryRef, entryData);
    onDisconnect(newEntryRef).remove();

    // Try to pair with an existing waiting player atomically
    try {
      const snap = await get(queueRef);
      if (snap.exists()) {
        const allEntries = snap.val() as Record<string, typeof entryData>;
        const otherEntries = Object.values(allEntries).filter(
          (e) => e.uid !== user.uid && e.queueKey !== queueKey && e.timeControlId === timeControlId
        );

        if (otherEntries.length > 0) {
          const opponent = otherEntries[0];

          // Use transaction to pair atomically
          const roomRef = push(ref(rtdb, 'rooms'));
          const roomId = roomRef.key;
          if (roomId) {
            const tc = TIME_CONTROLS[timeControlId] || TIME_CONTROLS['10+0'];
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            // Randomize White / Black assignment
            const isSelfWhite = Math.random() < 0.5;

            const room: GameRoom = {
              roomId,
              roomCode,
              hostUid: user.uid,
              status: 'playing',
              timeControlId,
              createdAt: Date.now(),
              lastActivityAt: Date.now(),
              players: {
                white: {
                  uid: isSelfWhite ? user.uid : opponent.uid,
                  displayName: isSelfWhite ? user.displayName : opponent.displayName,
                  connected: true,
                  rating: isSelfWhite ? user.rating : opponent.rating
                },
                black: {
                  uid: isSelfWhite ? opponent.uid : user.uid,
                  displayName: isSelfWhite ? opponent.displayName : user.displayName,
                  connected: true,
                  rating: isSelfWhite ? opponent.rating : user.rating
                }
              },
              gameState: {
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                turn: 'w',
                isCheck: false,
                lastMove: null,
                whiteTime: tc.initialSeconds,
                blackTime: tc.initialSeconds,
                lastMoveTimestamp: Date.now(),
                isGameOver: false,
                winner: null,
                endReason: null,
                drawOffer: null
              },
              rematch: {
                whiteRequested: false,
                blackRequested: false
              }
            };

            await set(roomRef, room);
            await set(ref(rtdb, `roomCodes/${roomCode}`), roomId);

            // Notify both players by updating their queue entry
            await update(ref(rtdb, `matchmaking/queue/${queueKey}`), { matchedRoomId: roomId });
            await update(ref(rtdb, `matchmaking/queue/${opponent.queueKey}`), { matchedRoomId: roomId });
          }
        }
      }
    } catch (e) {
      console.warn('Matchmaking check error:', e);
    }

    return { queueKey };
  },

  /**
   * Listen to match assignment
   */
  listenToMatchmaking(
    queueKey: string,
    onMatched: (roomId: string) => void
  ): Unsubscribe {
    const entryRef = ref(rtdb, `matchmaking/queue/${queueKey}`);
    return onValue(entryRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && val.matchedRoomId) {
          onMatched(val.matchedRoomId);
          // Clean up entry after reading
          remove(entryRef).catch(() => {});
        }
      }
    });
  },

  /**
   * Cancel waiting in matchmaking
   */
  async cancelMatchmaking(queueKey: string): Promise<void> {
    const entryRef = ref(rtdb, `matchmaking/queue/${queueKey}`);
    await remove(entryRef);
  },

  /**
   * Send a real-time match invitation
   */
  async sendInvitation(
    sender: { uid: string; displayName: string; rating?: number; avatar?: string },
    recipientUid: string,
    timeControlId: TimeControlId
  ): Promise<string> {
    if (sender.uid === recipientUid) {
      throw new Error('You cannot challenge yourself to a match.');
    }

    const invitesRef = ref(rtdb, 'invitations');
    const newInviteRef = push(invitesRef);
    const inviteId = newInviteRef.key;
    if (!inviteId) throw new Error('Failed to create invitation');

    const inviteData: MatchInvitationData = {
      id: inviteId,
      senderUid: sender.uid,
      senderName: sender.displayName,
      senderRating: sender.rating || 1200,
      senderAvatar: sender.avatar || 'default',
      recipientUid,
      timeControlId,
      status: 'pending',
      createdAt: Date.now()
    };

    await set(newInviteRef, inviteData);
    // Link to recipient inbox
    await set(ref(rtdb, `userInvitations/${recipientUid}/${inviteId}`), true);

    return inviteId;
  },

  /**
   * Listen for incoming invitations
   */
  subscribeToIncomingInvitations(
    selfUid: string,
    callback: (invitation: MatchInvitationData | null) => void
  ): Unsubscribe {
    const inboxRef = ref(rtdb, `userInvitations/${selfUid}`);
    return onValue(inboxRef, async (snapshot) => {
      if (snapshot.exists()) {
        const inviteIds = Object.keys(snapshot.val());
        if (inviteIds.length > 0) {
          const latestId = inviteIds[inviteIds.length - 1];
          const inviteSnap = await get(ref(rtdb, `invitations/${latestId}`));
          if (inviteSnap.exists()) {
            const data = inviteSnap.val() as MatchInvitationData;
            // Only trigger if pending and not expired (> 2 mins)
            if (data.status === 'pending' && Date.now() - data.createdAt < 120000) {
              callback(data);
              return;
            }
          }
        }
      }
      callback(null);
    });
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string, recipientUid: string): Promise<void> {
    await update(ref(rtdb, `invitations/${invitationId}`), { status: 'declined' });
    await remove(ref(rtdb, `userInvitations/${recipientUid}/${invitationId}`));
  },

  /**
   * Accept an invitation and initialize shared online match
   */
  async acceptInvitation(
    invitation: MatchInvitationData,
    recipient: { uid: string; displayName: string; rating?: number }
  ): Promise<string> {
    const inviteRef = ref(rtdb, `invitations/${invitation.id}`);

    // Verify still pending via transaction
    let assignedRoomId: string | null = null;

    const tx = await runTransaction(inviteRef, (current: MatchInvitationData | null) => {
      if (!current || current.status !== 'pending') return; // abort

      const roomRef = push(ref(rtdb, 'rooms'));
      const roomId = roomRef.key;
      if (!roomId) return;

      const tc = TIME_CONTROLS[invitation.timeControlId] || TIME_CONTROLS['10+0'];
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      current.status = 'accepted';
      current.roomId = roomId;
      assignedRoomId = roomId;

      // Create room synchronously
      const room: GameRoom = {
        roomId,
        roomCode,
        hostUid: invitation.senderUid,
        status: 'playing',
        timeControlId: invitation.timeControlId,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        players: {
          white: {
            uid: invitation.senderUid,
            displayName: invitation.senderName,
            connected: true,
            rating: invitation.senderRating
          },
          black: {
            uid: recipient.uid,
            displayName: recipient.displayName,
            connected: true,
            rating: recipient.rating
          }
        },
        gameState: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'w',
          isCheck: false,
          lastMove: null,
          whiteTime: tc.initialSeconds,
          blackTime: tc.initialSeconds,
          lastMoveTimestamp: Date.now(),
          isGameOver: false,
          winner: null,
          endReason: null,
          drawOffer: null
        },
        rematch: {
          whiteRequested: false,
          blackRequested: false
        }
      };

      set(ref(rtdb, `rooms/${roomId}`), room).catch(() => {});
      set(ref(rtdb, `roomCodes/${roomCode}`), roomId).catch(() => {});

      return current;
    });

    if (!tx.committed || !assignedRoomId) {
      throw new Error('This invitation has already expired or been resolved.');
    }

    // Clean up recipient inbox
    await remove(ref(rtdb, `userInvitations/${recipient.uid}/${invitation.id}`));

    return assignedRoomId;
  },

  /**
   * Listen to an invitation you sent (to see if it was accepted or declined)
   */
  listenToSentInvitation(
    invitationId: string,
    onStatusChange: (status: 'accepted' | 'declined' | 'pending' | 'expired', roomId?: string) => void
  ): Unsubscribe {
    const inviteRef = ref(rtdb, `invitations/${invitationId}`);
    return onValue(inviteRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as MatchInvitationData;
        onStatusChange(val.status, val.roomId);
      }
    });
  },

  /**
   * FRIENDS SYSTEM
   */
  async sendFriendRequest(
    currentUser: { uid: string; displayName: string },
    targetUid: string
  ): Promise<void> {
    if (currentUser.uid === targetUid) throw new Error('Cannot add yourself as a friend');
    const reqRef = ref(rtdb, `friendRequests/${targetUid}/${currentUser.uid}`);
    await set(reqRef, {
      fromUid: currentUser.uid,
      fromName: currentUser.displayName,
      timestamp: Date.now()
    });
  },

  async acceptFriendRequest(
    currentUser: { uid: string; displayName: string },
    request: IncomingFriendRequest
  ): Promise<void> {
    // Add to both users' friends lists
    await set(ref(rtdb, `friends/${currentUser.uid}/${request.fromUid}`), {
      uid: request.fromUid,
      displayName: request.fromName,
      since: Date.now()
    });
    await set(ref(rtdb, `friends/${request.fromUid}/${currentUser.uid}`), {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      since: Date.now()
    });
    // Remove pending request
    await remove(ref(rtdb, `friendRequests/${currentUser.uid}/${request.fromUid}`));
  },

  async declineFriendRequest(currentUserUid: string, fromUid: string): Promise<void> {
    await remove(ref(rtdb, `friendRequests/${currentUserUid}/${fromUid}`));
  },

  async removeFriend(currentUserUid: string, friendUid: string): Promise<void> {
    await remove(ref(rtdb, `friends/${currentUserUid}/${friendUid}`));
    await remove(ref(rtdb, `friends/${friendUid}/${currentUserUid}`));
  },

  subscribeToFriends(
    currentUserUid: string,
    callback: (friends: FriendEntry[]) => void
  ): Unsubscribe {
    const friendsRef = ref(rtdb, `friends/${currentUserUid}`);
    return onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as Record<string, FriendEntry>;
        callback(Object.values(val));
      } else {
        callback([]);
      }
    });
  },

  subscribeToFriendRequests(
    currentUserUid: string,
    callback: (requests: IncomingFriendRequest[]) => void
  ): Unsubscribe {
    const reqRef = ref(rtdb, `friendRequests/${currentUserUid}`);
    return onValue(reqRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as Record<string, IncomingFriendRequest>;
        callback(Object.values(val));
      } else {
        callback([]);
      }
    });
  },

  async searchRegisteredPlayers(query: string): Promise<OnlinePresenceUser[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const snap = await get(ref(rtdb, 'profiles'));
    if (!snap.exists()) return [];

    const all = snap.val() as Record<string, any>;
    return Object.values(all)
      .filter((p) => p.displayName && p.displayName.toLowerCase().includes(clean))
      .slice(0, 8)
      .map((p) => ({
        uid: p.uid,
        displayName: p.displayName,
        rating: p.ratings?.rapid?.rating || 1200,
        avatar: p.avatar || 'default',
        publicId: p.publicId,
        isOnline: false,
        isGuest: false,
        lastSeen: p.lastActive || Date.now(),
        about: p.about || 'Chess player',
        wins: p.stats?.wins || 0,
        losses: p.stats?.losses || 0,
        draws: p.stats?.draws || 0
      }));
  }
};
