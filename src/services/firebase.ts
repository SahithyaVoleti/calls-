import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if credentials are real Firebase credentials or default placeholder
export const isLiveFirebase = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('mock-') &&
  firebaseConfig.apiKey.length >= 20 &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('demo')
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isLiveFirebase) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);

    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
    }
  } catch (err) {
    console.warn('[Firebase] Initialization skipped or using fallback mode:', err);
  }
}

export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export default app;
