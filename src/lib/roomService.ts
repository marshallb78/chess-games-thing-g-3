import {
  ref,
  set,
  get,
  update,
  onValue,
  runTransaction,
  push,
  onDisconnect,
  type Unsubscribe
} from 'firebase/database';
import { rtdb } from './firebase';
import type { GameRoom, ChatMessage } from '../types/room';
import type { TimeControlId, GameEndReason } from '../types/chess';
import { TIME_CONTROLS } from '../types/chess';
import type { UserProfile } from '../types/user';
import type { Color } from 'chess.js';
import {
  resolveDisplayName,
  resolvePlayerRating,
  normalizeRoomPlayer,
  sanitizeForFirebase
} from './playerUtils';

// Random alphanumeric room code generator (excludes confusing chars 0/O, 1/I)
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const roomService = {
  /**
   * Create a new online multiplayer room
   */
  async createRoom(
    user: UserProfile,
    timeControlId: TimeControlId
  ): Promise<{ roomId: string; roomCode: string }> {
    const tc = TIME_CONTROLS[timeControlId] || TIME_CONTROLS['10+0'];
    const roomCode = generateRoomCode();
    const roomsRef = ref(rtdb, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key;

    if (!roomId) throw new Error('Failed to generate room ID');

    const whitePlayer = normalizeRoomPlayer({
      uid: user.uid,
      displayName: resolveDisplayName(user, null, user.displayName),
      connected: true,
      rating: resolvePlayerRating(user, 1200)
    }, 'White Player');

    const initialRoom: GameRoom = {
      roomId,
      roomCode,
      hostUid: user.uid,
      status: 'waiting',
      timeControlId,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      players: {
        white: whitePlayer,
        black: null
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

    // Save room and code lookup
    await set(newRoomRef, sanitizeForFirebase(initialRoom));
    await set(ref(rtdb, `roomCodes/${roomCode}`), roomId);

    // Setup disconnect presence for host
    const whitePresenceRef = ref(rtdb, `rooms/${roomId}/players/white/connected`);
    onDisconnect(whitePresenceRef).set(false);

    return { roomId, roomCode };
  },

  /**
   * Join an existing room using code
   */
  async joinRoomByCode(
    user: UserProfile,
    roomCode: string
  ): Promise<{ roomId: string; playerColor: 'w' | 'b' }> {
    const cleanCode = roomCode.trim().toUpperCase();
    const codeRef = ref(rtdb, `roomCodes/${cleanCode}`);
    const codeSnap = await get(codeRef);

    if (!codeSnap.exists()) {
      throw new Error(`Room code "${cleanCode}" was not found. Please verify the code.`);
    }

    const roomId = codeSnap.val() as string;
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    // Transaction to safely join room as Black or reconnect
    const joinState: { color: 'w' | 'b' } = { color: 'b' };

    const txResult = await runTransaction(roomRef, (currentRoom: GameRoom | null) => {
      if (!currentRoom) return currentRoom;

      // Case 1: Reconnecting as White
      if (currentRoom.players.white?.uid === user.uid) {
        currentRoom.players.white.connected = true;
        currentRoom.lastActivityAt = Date.now();
        joinState.color = 'w';
        return currentRoom;
      }

      // Case 2: Reconnecting as Black
      if (currentRoom.players.black?.uid === user.uid) {
        currentRoom.players.black.connected = true;
        currentRoom.lastActivityAt = Date.now();
        joinState.color = 'b';
        return currentRoom;
      }

      // Case 3: Joining as new opponent (Black)
      if (!currentRoom.players.black) {
        currentRoom.players.black = normalizeRoomPlayer({
          uid: user.uid,
          displayName: resolveDisplayName(user, null, user.displayName),
          connected: true,
          rating: resolvePlayerRating(user, 1200)
        }, 'Black Player');
        currentRoom.status = 'playing';
        currentRoom.lastActivityAt = Date.now();
        joinState.color = 'b';
        return sanitizeForFirebase(currentRoom);
      }

      // Case 4: Room is already full
      return; // abort transaction
    });

    if (!txResult.committed) {
      throw new Error('This room already has two active players.');
    }

    // Set presence disconnect handler
    const presenceRef = ref(rtdb, `rooms/${roomId}/players/${joinState.color === 'w' ? 'white' : 'black'}/connected`);
    onDisconnect(presenceRef).set(false);

    return { roomId, playerColor: joinState.color };
  },

  /**
   * Listen to real-time room updates
   */
  subscribeToRoom(roomId: string, onUpdate: (room: GameRoom | null) => void): Unsubscribe {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.val() as GameRoom);
      } else {
        onUpdate(null);
      }
    });
  },

  /**
   * Broadcast move
   */
  async submitMove(
    roomId: string,
    _color: 'w' | 'b',
    moveData: {
      from: string;
      to: string;
      san: string;
      promotion?: string;
      newFen: string;
      newTurn: Color;
      isCheck: boolean;
      isGameOver: boolean;
      winner: Color | 'draw' | null;
      endReason: GameEndReason | null;
      whiteTime: number;
      blackTime: number;
    }
  ): Promise<void> {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await update(roomRef, {
      'gameState/fen': moveData.newFen,
      'gameState/turn': moveData.newTurn,
      'gameState/isCheck': moveData.isCheck,
      'gameState/lastMove': {
        from: moveData.from,
        to: moveData.to,
        san: moveData.san,
        promotion: moveData.promotion || null
      },
      'gameState/whiteTime': moveData.whiteTime,
      'gameState/blackTime': moveData.blackTime,
      'gameState/lastMoveTimestamp': Date.now(),
      'gameState/isGameOver': moveData.isGameOver,
      'gameState/winner': moveData.winner,
      'gameState/endReason': moveData.endReason,
      'gameState/drawOffer': null,
      status: moveData.isGameOver ? 'ended' : 'playing',
      lastActivityAt: Date.now()
    });
  },

  /**
   * Resign game
   */
  async resignGame(roomId: string, resigningColor: 'w' | 'b'): Promise<void> {
    const winner: Color = resigningColor === 'w' ? 'b' : 'w';
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await update(roomRef, {
      'gameState/isGameOver': true,
      'gameState/winner': winner,
      'gameState/endReason': 'resignation',
      status: 'ended',
      lastActivityAt: Date.now()
    });
  },

  /**
   * Offer or accept draw
   */
  async offerOrAcceptDraw(roomId: string, color: 'w' | 'b', currentDrawOffer: Color | null): Promise<void> {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    if (currentDrawOffer && currentDrawOffer !== color) {
      // Draw accepted!
      await update(roomRef, {
        'gameState/isGameOver': true,
        'gameState/winner': 'draw',
        'gameState/endReason': 'draw_agreement',
        'gameState/drawOffer': null,
        status: 'ended',
        lastActivityAt: Date.now()
      });
    } else {
      // Propose draw
      await update(roomRef, {
        'gameState/drawOffer': color,
        lastActivityAt: Date.now()
      });
    }
  },

  /**
   * Rematch request
   */
  async requestRematch(roomId: string, color: 'w' | 'b', initialSeconds: number): Promise<void> {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await runTransaction(roomRef, (room: GameRoom | null) => {
      if (!room) return room;

      if (!room.rematch) {
        room.rematch = { whiteRequested: false, blackRequested: false };
      }

      if (color === 'w') {
        room.rematch.whiteRequested = true;
      } else {
        room.rematch.blackRequested = true;
      }

      // If both requested rematch, reset board for fresh game!
      if (room.rematch.whiteRequested && room.rematch.blackRequested) {
        room.gameState = {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'w',
          isCheck: false,
          lastMove: null,
          whiteTime: initialSeconds,
          blackTime: initialSeconds,
          lastMoveTimestamp: Date.now(),
          isGameOver: false,
          winner: null,
          endReason: null,
          drawOffer: null
        };
        room.status = 'playing';
        room.rematch = { whiteRequested: false, blackRequested: false };
      }

      room.lastActivityAt = Date.now();
      return room;
    });
  },

  /**
   * Send chat message in room
   */
  async sendChatMessage(roomId: string, user: UserProfile, text: string): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length > 200) return;

    const chatRef = ref(rtdb, `chat/${roomId}`);
    const newMsgRef = push(chatRef);
    const senderName = resolveDisplayName(user, null, user.displayName || 'Player');
    const msg: ChatMessage = {
      id: newMsgRef.key || Math.random().toString(),
      senderUid: user.uid,
      senderName,
      text: cleanText,
      timestamp: Date.now()
    };
    await set(newMsgRef, sanitizeForFirebase(msg));
  },

  /**
   * Listen to chat messages in room
   */
  subscribeToChat(roomId: string, onMessages: (messages: ChatMessage[]) => void): Unsubscribe {
    const chatRef = ref(rtdb, `chat/${roomId}`);
    return onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as Record<string, ChatMessage>;
        const list = Object.values(val).sort((a, b) => a.timestamp - b.timestamp);
        onMessages(list);
      } else {
        onMessages([]);
      }
    });
  }
};
