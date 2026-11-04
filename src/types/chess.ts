import type { Square, PieceSymbol, Color } from 'chess.js';

export type TimeControlId = 
  | '1+0' 
  | '2+1' 
  | '3+0' 
  | '3+2' 
  | '5+0' 
  | '10+0' 
  | '15+10' 
  | 'untimed';

export interface TimeControlConfig {
  id: TimeControlId;
  name: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Casual';
  initialSeconds: number; // 0 for untimed
  incrementSeconds: number;
}

export const TIME_CONTROLS: Record<TimeControlId, TimeControlConfig> = {
  '1+0': { id: '1+0', name: '1 min', category: 'Bullet', initialSeconds: 60, incrementSeconds: 0 },
  '2+1': { id: '2+1', name: '2 | 1', category: 'Bullet', initialSeconds: 120, incrementSeconds: 1 },
  '3+0': { id: '3+0', name: '3 min', category: 'Blitz', initialSeconds: 180, incrementSeconds: 0 },
  '3+2': { id: '3+2', name: '3 | 2', category: 'Blitz', initialSeconds: 180, incrementSeconds: 2 },
  '5+0': { id: '5+0', name: '5 min', category: 'Blitz', initialSeconds: 300, incrementSeconds: 0 },
  '10+0': { id: '10+0', name: '10 min', category: 'Rapid', initialSeconds: 600, incrementSeconds: 0 },
  '15+10': { id: '15+10', name: '15 | 10', category: 'Rapid', initialSeconds: 900, incrementSeconds: 10 },
  'untimed': { id: 'untimed', name: 'Casual (No Clock)', category: 'Casual', initialSeconds: 0, incrementSeconds: 0 },
};

export type GameEndReason = 
  | 'checkmate'
  | 'stalemate'
  | 'insufficient_material'
  | 'threefold_repetition'
  | 'fifty_moves'
  | 'resignation'
  | 'timeout'
  | 'draw_agreement';

export interface MoveRecord {
  san: string;
  from: Square;
  to: Square;
  color: Color;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  fenBefore: string;
  fenAfter: string;
}

export interface PlayerDetails {
  name: string;
  rating?: number;
  avatar?: string;
  isOnline?: boolean;
}

export interface CapturedPiecesSummary {
  p: number; // pawns
  n: number; // knights
  b: number; // bishops
  r: number; // rooks
  q: number; // queens
}
