
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore | null;
} {
  const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  let firestore: Firestore | null = null;
  try {
    firestore = getFirestore(firebaseApp);
  } catch (error) {
    console.error("Failed to initialize Firestore. This is expected if the service is not enabled yet.", error);
    // Firestore is not available, but the app can continue running without crashing.
    // The UI is designed to show a "Database Not Connected" message in this case.
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
