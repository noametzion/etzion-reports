import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminStorage = admin.storage();
export const bucket = adminStorage.bucket();

export default admin;
