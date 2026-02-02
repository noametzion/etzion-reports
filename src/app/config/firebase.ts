import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore} from "@firebase/firestore";

const FIRESTORE_EMULATOR_PORT = 8080;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Use emulator only in local dev *when you explicitly enable it*
const useEmu = process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === "true";

// if (useEmu) connectFirestoreEmulator(db, "localhost", 8080);

if (process.env.NODE_ENV === "development" && useEmu) {
  const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? "localhost";
  const port = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? FIRESTORE_EMULATOR_PORT);

  // avoid reconnect errors on Next.js hot reload
  // eslint-disable-next-line
  const g = globalThis as any;
  if (!g.__FIRESTORE_EMU_CONNECTED__) {
    connectFirestoreEmulator(db, host, port);
    g.__FIRESTORE_EMU_CONNECTED__ = true;
  }
}

export { auth, storage, db };
export default app;
