import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Force Google sign-in to show account selector
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Track active listeners
const listeners = new Set<(user: User | null, token: string | null) => void>();

// Ensure an authenticated session exists for Firestore cross-device access
export const ensureFirebaseAuth = async (): Promise<User | null> => {
  try {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth notice:', err);
    return auth.currentUser;
  }
};

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    listeners.forEach((listener) => listener(user, cachedAccessToken));
  } else {
    cachedAccessToken = null;
    listeners.forEach((listener) => listener(null, null));
    // Re-authenticate anonymously if needed for Firestore security
    ensureFirebaseAuth().catch(() => {});
  }
});

// Auto-trigger auth check on load
ensureFirebaseAuth().catch(() => {});

export const initAuth = (
  onAuthChange: (user: User | null, token: string | null) => void
) => {
  listeners.add(onAuthChange);
  // Trigger initial call with current state
  onAuthChange(auth.currentUser, cachedAccessToken);
  return () => {
    listeners.delete(onAuthChange);
  };
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    listeners.forEach((listener) => listener(result.user, cachedAccessToken));
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  listeners.forEach((listener) => listener(null, null));
};
