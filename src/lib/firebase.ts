import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBUFZRTZ3kbfoLHHgmVn8Kw-6BUrSjjF2Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "g-plus-games.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://g-plus-games-default-rtdb.firebaseio.com/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "g-plus-games",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "g-plus-games.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "251385504913",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:251385504913:web:1f505b178879c77fee8b30"
};

// Initialize Firebase only once
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);
export const rtdb: Database = getDatabase(app);

