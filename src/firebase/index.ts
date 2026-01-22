
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  let firestore: Firestore | null = null;
  try {
    firestore = getFirestore(firebaseApp);
  } catch (error) {
    console.error("Failed to initialize Firestore. Please ensure it is enabled in your Firebase project.", error);
    // The app will continue to run, and components should handle the null firestore instance.
  }
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
