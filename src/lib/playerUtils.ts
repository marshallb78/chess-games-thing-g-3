import type { UserProfile } from '../types/user';
import type { RoomPlayer } from '../types/room';

/**
 * Priority system for resolving a player's display name:
 * 1. Valid saved profile display name
 * 2. Authenticated user's existing display name
 * 3. Explicitly assigned guest display name
 * 4. 'Anonymous' as final fallback
 */
export function resolveDisplayName(
  profile?: { displayName?: string | null; isGuest?: boolean } | null,
  authUser?: { displayName?: string | null } | null,
  fallbackGuestName?: string | null
): string {
  // 1. Saved profile display name (from RTDB / UserProfile)
  const profileName = profile?.displayName?.trim();
  if (profileName && profileName.length > 0 && profileName !== 'Anonymous' && profileName !== 'Player') {
    return profileName;
  }

  // 2. Authenticated user's display name
  const authName = authUser?.displayName?.trim();
  if (authName && authName.length > 0 && authName !== 'Anonymous' && authName !== 'Player') {
    return authName;
  }

  // If profile had a name even if 'Player' or 'Guest ...'
  if (profileName && profileName.length > 0) {
    return profileName;
  }

  // 3. Explicitly assigned guest display name
  const guestName = fallbackGuestName?.trim();
  if (guestName && guestName.length > 0) {
    return guestName;
  }

  if (authName && authName.length > 0) {
    return authName;
  }

  // 4. Final fallback
  return 'Anonymous';
}

/**
 * Safely extracts a numeric rating from a player profile or object.
 * Always returns a valid number (e.g. 1200), never undefined, string, or NaN.
 */
export function resolvePlayerRating(
  user?: {
    rating?: number | null;
    ratings?: {
      rapid?: { rating?: number | null };
      casual?: { rating?: number | null };
      blitz?: { rating?: number | null };
      bullet?: { rating?: number | null };
    } | null;
  } | null,
  defaultRating = 1200
): number {
  if (!user) return defaultRating;

  // Direct rating property
  if (typeof user.rating === 'number' && !isNaN(user.rating) && user.rating > 0) {
    return Math.round(user.rating);
  }

  // Nested ratings object (standard UserProfile)
  if (user.ratings) {
    const rapid = user.ratings.rapid?.rating;
    if (typeof rapid === 'number' && !isNaN(rapid) && rapid > 0) {
      return Math.round(rapid);
    }
    const casual = user.ratings.casual?.rating;
    if (typeof casual === 'number' && !isNaN(casual) && casual > 0) {
      return Math.round(casual);
    }
    const blitz = user.ratings.blitz?.rating;
    if (typeof blitz === 'number' && !isNaN(blitz) && blitz > 0) {
      return Math.round(blitz);
    }
    const bullet = user.ratings.bullet?.rating;
    if (typeof bullet === 'number' && !isNaN(bullet) && bullet > 0) {
      return Math.round(bullet);
    }
  }

  return defaultRating;
}

/**
 * Creates a clean, safe RoomPlayer object for Firebase RTDB.
 * Guarantees uid, displayName, connected, and rating are valid, never undefined!
 */
export function normalizeRoomPlayer(
  player: {
    uid: string;
    displayName?: string | null;
    rating?: number | null;
    connected?: boolean | null;
    ratings?: UserProfile['ratings'];
  },
  fallbackName = 'Player'
): RoomPlayer {
  const cleanUid = player.uid?.trim() || 'unknown_player';
  const cleanName = player.displayName?.trim() || fallbackName;
  const cleanRating = resolvePlayerRating(player, 1200);

  return {
    uid: cleanUid,
    displayName: cleanName,
    connected: player.connected ?? true,
    rating: cleanRating
  };
}

/**
 * Recursively removes any `undefined` values from an object before writing to Firebase.
 * Ensures Firebase RTDB set/update operations never fail with undefined argument errors.
 */
export function sanitizeForFirebase<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirebase(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirebase(value);
      }
    }
    return result as T;
  }

  return data;
}
