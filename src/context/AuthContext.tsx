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

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  createAccount: (displayName: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    const name = chosenDisplayName || user.displayName || user.email?.split('@')[0] || 'Player';
    const publicId = 'P' + Math.floor(100000 + Math.random() * 900000).toString();

    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: name,
      publicId,
      avatar: 'default',
      createdAt: Date.now(),
      lastActive: Date.now(),
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

  const refreshProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await fetchOrCreateProfile(currentUser);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Could not refresh profile from RTDB:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await fetchOrCreateProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Profile fetch error:', err);
          // Fallback minimal profile in memory if DB connection is empty
          setUserProfile({
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Player',
            publicId: 'P' + user.uid.substring(0, 6).toUpperCase(),
            avatar: 'default',
            createdAt: Date.now(),
            lastActive: Date.now(),
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
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await fetchOrCreateProfile(credential.user);
    setUserProfile(profile);
  };

  const createAccount = async (displayName: string, email: string, pass: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const cleanName = displayName.trim() || 'Player';
    await updateProfile(credential.user, { displayName: cleanName });
    const profile = await fetchOrCreateProfile(credential.user, cleanName);
    setUserProfile(profile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signIn,
        createAccount,
        resetPassword,
        signOut,
        refreshProfile
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
