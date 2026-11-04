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
import {
  resolveDisplayName,
  resolvePlayerRating,
  normalizeRoomPlayer,
  sanitizeForFirebase
} from './playerUtils';

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
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  createdAt: number;
  expiresAt: number;
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
   * Set up real-time presence with .info/connected and onDisconnect automatic cleanup
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
    const connectedRef = ref(rtdb, '.info/connected');

    const cleanName = resolveDisplayName(user, null, user.displayName);
    const cleanRating = resolvePlayerRating(user, 1200);

    const presenceData: OnlinePresenceUser = {
      uid: user.uid,
      displayName: cleanName,
      rating: cleanRating,
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

    let heartbeatTimer: number | null = null;
    let unsubConnected: Unsubscribe | null = null;

    unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Connected to RTDB server: register onDisconnect
        const disconnectHandler = onDisconnect(presenceRef);
        disconnectHandler.update({
          isOnline: false,
          lastSeen: Date.now()
        });

        // Set live presence
        update(presenceRef, {
          ...presenceData,
          lastSeen: Date.now(),
          isOnline: true
        }).catch(() => {});

        // Periodic heartbeat every 30s to keep lastSeen current
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = window.setInterval(() => {
          update(presenceRef, {
            lastSeen: Date.now(),
            isOnline: true
          }).catch(() => {});
        }, 30000);
      }
    });

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubConnected) unsubConnected();
      update(presenceRef, {
        isOnline: false,
        lastSeen: Date.now()
      }).catch(() => {});
    };
  },

  /**
   * Listen to the real count of active online players in RTDB
   */
  subscribeToOnlineCount(
    callback: (count: number | null, isConnected: boolean) => void
  ): Unsubscribe {
    const presenceRef = ref(rtdb, 'presence');
    const connectedRef = ref(rtdb, '.info/connected');

    let isDbConnected = false;
    const unsubConn = onValue(connectedRef, (snap) => {
      isDbConnected = snap.val() === true;
    });

    const unsubPresence = onValue(
      presenceRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(0, isDbConnected);
          return;
        }

        const raw = snapshot.val() as Record<string, OnlinePresenceUser>;
        const now = Date.now();
        // A player is counted if isOnline is true and lastSeen within last 120 seconds (2 mins)
        // Deduplicate: keyed by unique UID in presence node
        const activeUsers = Object.values(raw).filter(
          (p) => p && p.isOnline === true && now - (p.lastSeen || 0) < 120000
        );

        callback(activeUsers.length, isDbConnected);
      },
      (err) => {
        console.warn('Presence count listener error:', err);
        callback(null, false);
      }
    );

    return () => {
      unsubConn();
      unsubPresence();
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
            now - p.lastSeen < 120000 // Active within last 2 minutes
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

    const cleanName = resolveDisplayName(user, null, user.displayName);
    const cleanRating = resolvePlayerRating(user, 1200);

    const entryData = {
      queueKey,
      uid: user.uid,
      displayName: cleanName,
      rating: cleanRating,
      timeControlId,
      createdAt: Date.now(),
      isGuest: !!user.isGuest
    };

    await set(newEntryRef, sanitizeForFirebase(entryData));
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

            const whitePlayer = normalizeRoomPlayer({
              uid: isSelfWhite ? user.uid : opponent.uid,
              displayName: isSelfWhite ? cleanName : opponent.displayName,
              connected: true,
              rating: isSelfWhite ? cleanRating : opponent.rating
            }, 'White Player');

            const blackPlayer = normalizeRoomPlayer({
              uid: isSelfWhite ? opponent.uid : user.uid,
              displayName: isSelfWhite ? opponent.displayName : cleanName,
              connected: true,
              rating: isSelfWhite ? opponent.rating : cleanRating
            }, 'Black Player');

            const room: GameRoom = {
              roomId,
              roomCode,
              hostUid: user.uid,
              status: 'playing',
              timeControlId,
              createdAt: Date.now(),
              lastActivityAt: Date.now(),
              players: {
                white: whitePlayer,
                black: blackPlayer
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

            await set(roomRef, sanitizeForFirebase(room));
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
    sender: { uid: string; displayName: string; rating?: number; avatar?: string; ratings?: any },
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

    const now = Date.now();
    const cleanSenderName = resolveDisplayName(sender, null, sender.displayName);
    const cleanSenderRating = resolvePlayerRating(sender, 1200);

    const inviteData: MatchInvitationData = {
      id: inviteId,
      senderUid: sender.uid,
      senderName: cleanSenderName,
      senderRating: cleanSenderRating,
      senderAvatar: sender.avatar || 'default',
      recipientUid,
      timeControlId,
      status: 'pending',
      createdAt: now,
      expiresAt: now + 60000 // 60s
    };

    await set(newInviteRef, sanitizeForFirebase(inviteData));
    // Link to recipient inbox
    await set(ref(rtdb, `userInvitations/${recipientUid}/${inviteId}`), true);

    return inviteId;
  },

  /**
   * Sender cancels an invitation while still pending
   */
  async cancelInvitation(invitationId: string, recipientUid: string): Promise<void> {
    await update(ref(rtdb, `invitations/${invitationId}`), { status: 'cancelled' }).catch(() => {});
    await remove(ref(rtdb, `userInvitations/${recipientUid}/${invitationId}`)).catch(() => {});
  },

  /**
   * Mark invitation expired after timeout
   */
  async markInvitationExpired(invitationId: string, recipientUid?: string): Promise<void> {
    await update(ref(rtdb, `invitations/${invitationId}`), { status: 'expired' }).catch(() => {});
    if (recipientUid) {
      await remove(ref(rtdb, `userInvitations/${recipientUid}/${invitationId}`)).catch(() => {});
    }
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
        const now = Date.now();

        // Find the latest valid pending invitation
        for (let i = inviteIds.length - 1; i >= 0; i--) {
          const inviteId = inviteIds[i];
          const inviteSnap = await get(ref(rtdb, `invitations/${inviteId}`));
          if (inviteSnap.exists()) {
            const data = inviteSnap.val() as MatchInvitationData;
            const expiresAt = data.expiresAt || data.createdAt + 60000;

            if (data.status === 'pending' && now < expiresAt) {
              callback(data);
              return;
            } else if (data.status !== 'pending' || now >= expiresAt) {
              // Clean up non-pending or expired from recipient inbox
              remove(ref(rtdb, `userInvitations/${selfUid}/${inviteId}`)).catch(() => {});
            }
          } else {
            remove(ref(rtdb, `userInvitations/${selfUid}/${inviteId}`)).catch(() => {});
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
    await update(ref(rtdb, `invitations/${invitationId}`), { status: 'declined' }).catch(() => {});
    await remove(ref(rtdb, `userInvitations/${recipientUid}/${invitationId}`)).catch(() => {});
  },

  /**
   * Accept an invitation and initialize shared online match
   */
  async acceptInvitation(
    invitation: MatchInvitationData,
    recipient: { uid: string; displayName?: string | null; rating?: number | null; ratings?: any }
  ): Promise<string> {
    const inviteRef = ref(rtdb, `invitations/${invitation.id}`);
    const snap = await get(inviteRef);

    if (!snap.exists()) {
      throw new Error('This invitation no longer exists.');
    }

    const current = snap.val() as MatchInvitationData;

    if (current.recipientUid !== recipient.uid) {
      throw new Error('You are not the intended recipient of this invitation.');
    }

    // If already accepted and roomId exists (e.g. duplicate accept click), safely return room ID
    if (current.status === 'accepted' && current.roomId) {
      await remove(ref(rtdb, `userInvitations/${recipient.uid}/${invitation.id}`)).catch(() => {});
      return current.roomId;
    }

    if (current.status === 'declined') {
      throw new Error('This invitation was already declined.');
    }

    if (current.status === 'cancelled') {
      throw new Error('The challenger cancelled this invitation.');
    }

    const expiresAt = current.expiresAt || current.createdAt + 60000;
    // Allow 5-second grace window for slight clock skew
    if (Date.now() > expiresAt + 5000 || current.status === 'expired') {
      await update(inviteRef, { status: 'expired' }).catch(() => {});
      await remove(ref(rtdb, `userInvitations/${recipient.uid}/${invitation.id}`)).catch(() => {});
      throw new Error('This invitation has expired.');
    }

    // Generate room details
    const roomRef = push(ref(rtdb, 'rooms'));
    const roomId = roomRef.key;
    if (!roomId) throw new Error('Failed to generate match room');

    const tc = TIME_CONTROLS[invitation.timeControlId] || TIME_CONTROLS['10+0'];
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const whitePlayer = normalizeRoomPlayer({
      uid: current.senderUid,
      displayName: current.senderName,
      connected: true,
      rating: current.senderRating
    }, 'White Player');

    const blackPlayer = normalizeRoomPlayer({
      uid: recipient.uid,
      displayName: resolveDisplayName(recipient, null, recipient.displayName),
      connected: true,
      rating: resolvePlayerRating(recipient, 1200)
    }, 'Black Player');

    // Setup GameRoom object
    const room: GameRoom = {
      roomId,
      roomCode,
      hostUid: current.senderUid,
      status: 'playing',
      timeControlId: current.timeControlId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      players: {
        white: whitePlayer,
        black: blackPlayer
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

    // Commit room first so both players can read it immediately without undefined values
    await set(ref(rtdb, `rooms/${roomId}`), sanitizeForFirebase(room));
    await set(ref(rtdb, `roomCodes/${roomCode}`), roomId);

    // Atomically transition invitation to accepted
    const tx = await runTransaction(inviteRef, (existing: MatchInvitationData | null) => {
      // Return existing when null so Firebase continues fetching from server!
      if (existing === null) return existing;
      if (existing.status !== 'pending') return; // Abort if resolved by someone else
      existing.status = 'accepted';
      existing.roomId = roomId;
      return existing;
    });

    if (!tx.committed) {
      // If someone else claimed it, check if they set a roomId
      const recheck = await get(inviteRef);
      if (recheck.exists()) {
        const updated = recheck.val() as MatchInvitationData;
        if (updated.status === 'accepted' && updated.roomId) {
          await remove(ref(rtdb, `userInvitations/${recipient.uid}/${invitation.id}`)).catch(() => {});
          return updated.roomId;
        }
      }
      throw new Error('This invitation has already expired or been resolved.');
    }

    // Clean up recipient inbox
    await remove(ref(rtdb, `userInvitations/${recipient.uid}/${invitation.id}`)).catch(() => {});

    return roomId;
  },

  /**
   * Listen to an invitation you sent (to see if it was accepted, declined, or expired)
   */
  listenToSentInvitation(
    invitationId: string,
    onStatusChange: (status: 'accepted' | 'declined' | 'pending' | 'expired' | 'cancelled', roomId?: string) => void
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
    currentUser: { uid: string; displayName?: string | null },
    targetUid: string
  ): Promise<void> {
    if (currentUser.uid === targetUid) throw new Error('Cannot add yourself as a friend');
    const cleanName = resolveDisplayName(currentUser, null, currentUser.displayName || 'Player');
    const reqRef = ref(rtdb, `friendRequests/${targetUid}/${currentUser.uid}`);
    await set(reqRef, sanitizeForFirebase({
      fromUid: currentUser.uid,
      fromName: cleanName,
      timestamp: Date.now()
    }));
  },

  async acceptFriendRequest(
    currentUser: { uid: string; displayName?: string | null },
    request: IncomingFriendRequest
  ): Promise<void> {
    const myCleanName = resolveDisplayName(currentUser, null, currentUser.displayName || 'Player');
    const reqCleanName = resolveDisplayName({ displayName: request.fromName }, null, 'Player');

    // Add to both users' friends lists
    await set(ref(rtdb, `friends/${currentUser.uid}/${request.fromUid}`), sanitizeForFirebase({
      uid: request.fromUid,
      displayName: reqCleanName,
      since: Date.now()
    }));
    await set(ref(rtdb, `friends/${request.fromUid}/${currentUser.uid}`), sanitizeForFirebase({
      uid: currentUser.uid,
      displayName: myCleanName,
      since: Date.now()
    }));
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
