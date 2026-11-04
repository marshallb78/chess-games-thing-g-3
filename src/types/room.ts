import type { TimeControlId, GameEndReason } from './chess';
import type { Color } from 'chess.js';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface RoomPlayer {
  uid: string;
  displayName: string;
  connected: boolean;
  rating?: number;
}

export interface RoomGameState {
  fen: string;
  turn: Color;
  isCheck: boolean;
  lastMove: {
    from: string;
    to: string;
    san: string;
    promotion?: string;
  } | null;
  whiteTime: number;
  blackTime: number;
  lastMoveTimestamp: number;
  isGameOver: boolean;
  winner: Color | 'draw' | null;
  endReason: GameEndReason | null;
  drawOffer: Color | null;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface GameRoom {
  roomId: string;
  roomCode: string;
  hostUid: string;
  status: RoomStatus;
  timeControlId: TimeControlId;
  createdAt: number;
  lastActivityAt: number;
  players: {
    white: RoomPlayer;
    black: RoomPlayer | null;
  };
  gameState: RoomGameState;
  rematch: {
    whiteRequested: boolean;
    blackRequested: boolean;
  };
}

