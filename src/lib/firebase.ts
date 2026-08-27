import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '@/firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // If we have a user but no token cached yet, we might need to re-authenticate or wait.
    // However, during sign-in, cachedAccessToken is set.
    // If the page was refreshed, the token is gone from memory, so we'll need to trigger login again.
    // This is safe since we keep token in-memory only.
    listeners.forEach((listener) => listener(user, cachedAccessToken));
  } else {
    cachedAccessToken = null;
    listeners.forEach((listener) => listener(null, null));
  }
});

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
