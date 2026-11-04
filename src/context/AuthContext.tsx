import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, rtdb } from '../lib/firebase';
import type { UserProfile } from '../types/user';
import { resolveDisplayName } from '../lib/playerUtils';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  createAccount: (displayName: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  playAsGuest: () => UserProfile;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getOrCreateGuestProfile(): UserProfile {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('g3_guest_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // invalid JSON
      }
    }
  }

  const guestCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const guestProfile: UserProfile = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 10),
    displayName: 'Guest ' + guestCode,
    publicId: 'G' + guestCode,
    avatar: 'default',
    createdAt: Date.now(),
    lastActive: Date.now(),
    isGuest: true,
    about: 'Casual Guest Player on G+3',
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0
    },
    ratings: {
      bullet: { rating: 1200, provisional: true, gamesPlayed: 0 },
      blitz: { rating: 1200, provisional: true, gamesPlayed: 0 },
      rapid: { rating: 1200, provisional: true, gamesPlayed: 0 },
      casual: { rating: 1200, provisional: true, gamesPlayed: 0 }
    }
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('g3_guest_profile', JSON.stringify(guestProfile));
  }

  return guestProfile;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Fetch or safely initialize profile for user
  const fetchOrCreateProfile = async (user: FirebaseUser, chosenDisplayName?: string): Promise<UserProfile> => {
    const profileRef = ref(rtdb, `profiles/${user.uid}`);
    const snapshot = await get(profileRef);

    if (snapshot.exists()) {
      const existing = snapshot.val() as UserProfile;
      // Update lastActive timestamp only
      await update(profileRef, { lastActive: Date.now() });
      return { ...existing, lastActive: Date.now() };
    }

    // New profile creation
    const emailName = user.email ? user.email.split('@')[0] : 'Player';
    const name = resolveDisplayName({ displayName: chosenDisplayName }, user, emailName);
    const publicId = 'P' + Math.floor(100000 + Math.random() * 900000).toString();

    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: name,
      publicId,
      avatar: 'default',
      createdAt: Date.now(),
      lastActive: Date.now(),
      isGuest: false,
      about: 'Chess player on G+3.',
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0
      },
      ratings: {
        bullet: { rating: 1200, provisional: true, gamesPlayed: 0 },
        blitz: { rating: 1200, provisional: true, gamesPlayed: 0 },
        rapid: { rating: 1200, provisional: true, gamesPlayed: 0 },
        casual: { rating: 1200, provisional: true, gamesPlayed: 0 }
      }
    };

    await set(profileRef, newProfile);
    return newProfile;
  };

  const playAsGuest = (): UserProfile => {
    const guest = getOrCreateGuestProfile();
    setUserProfile(guest);
    setIsGuest(true);
    return guest;
  };

  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const profile = await fetchOrCreateProfile(currentUser);
        setUserProfile(profile);
      } catch (err) {
        console.warn('Could not refresh profile from RTDB:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuest(false);
        try {
          const profile = await fetchOrCreateProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Profile fetch fallback:', err);
          const fallbackName = resolveDisplayName(null, user, user.email?.split('@')[0] || 'Player');
          setUserProfile({
            uid: user.uid,
            displayName: fallbackName,
            publicId: 'P' + user.uid.substring(0, 6).toUpperCase(),
            avatar: 'default',
            createdAt: Date.now(),
            lastActive: Date.now(),
            isGuest: false,
            about: 'Chess player on G+3.',
            stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
            ratings: {
              bullet: { rating: 1200, provisional: true, gamesPlayed: 0 },
              blitz: { rating: 1200, provisional: true, gamesPlayed: 0 },
              rapid: { rating: 1200, provisional: true, gamesPlayed: 0 },
              casual: { rating: 1200, provisional: true, gamesPlayed: 0 }
            }
          });
        }
      } else {
        // If not signed in, initialize a guest profile in memory so the user can play without block
        const guest = getOrCreateGuestProfile();
        setUserProfile(guest);
        setIsGuest(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await fetchOrCreateProfile(credential.user);
    if (profile?.displayName && !credential.user.displayName) {
      try {
        await updateProfile(credential.user, { displayName: profile.displayName });
      } catch (e) {
        console.warn('Could not sync displayName to firebase auth user:', e);
      }
    }
    setUserProfile(profile);
    setIsGuest(false);
  };

  const createAccount = async (displayName: string, email: string, pass: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const cleanName = displayName.trim() || 'Player';
    await updateProfile(credential.user, { displayName: cleanName });
    const profile = await fetchOrCreateProfile(credential.user, cleanName);
    setUserProfile(profile);
    setIsGuest(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOut = async () => {
    await fbSignOut(auth);
    const guest = getOrCreateGuestProfile();
    setUserProfile(guest);
    setIsGuest(true);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isGuest,
        signIn,
        createAccount,
        resetPassword,
        signOut,
        refreshProfile,
        playAsGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
