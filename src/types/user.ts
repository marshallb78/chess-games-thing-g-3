export interface RatingInfo {
  rating: number;
  provisional: boolean;
  gamesPlayed: number;
}

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  publicId: string;
  avatar: string;
  createdAt: number;
  lastActive: number;
  about?: string;
  isGuest?: boolean;
  stats: UserStats;
  ratings: {
    bullet: RatingInfo;
    blitz: RatingInfo;
    rapid: RatingInfo;
    casual: RatingInfo;
  };
}

export interface MatchHistoryEntry {
  matchId: string;
  timestamp: number;
  timeControl: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Casual';
  whitePlayer: {
    uid: string;
    displayName: string;
  };
  blackPlayer: {
    uid: string;
    displayName: string;
  };
  result: '1-0' | '0-1' | '1/2-1/2';
  reason: string;
  movesCount: number;
}

