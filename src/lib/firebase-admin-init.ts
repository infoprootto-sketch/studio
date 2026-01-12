'use server';

import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It's designed to be safely called multiple times; it will only initialize once.
export async function initializeAdminApp() {
  // Check if the app is already initialized to prevent errors.
  if (admin.apps.length === 0) {
    try {
      // When running in a Google Cloud environment (like Cloud Run, Cloud Functions, or App Engine),
      // the SDK can automatically find the service account credentials.
      // We will explicitly provide the project ID to avoid environment ambiguity.
      admin.initializeApp({
        projectId: 'staycentralv2-67504826-2d582',
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      console.error('Firebase Admin SDK initialization error:', error);
      // In a real production scenario, you might want to throw this error
      // or handle it more gracefully, but for this context, logging is sufficient.
    }
  }
}
