import serviceAccount from "../../../../etzionreports-firebase-adminsdk-fbsvc-ef7fcd4575.json"
import { ServiceAccount} from "firebase-admin";
import * as admin from 'firebase-admin';

export const getFirebaseAdmin = () => {
  const firebaseAdminApps = admin.apps;
  if (firebaseAdminApps.length > 0 && firebaseAdminApps[0]) {
    return firebaseAdminApps[0];
  } else {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  }
}

export const getFirebaseAdminAuth = () => {
  return getFirebaseAdmin()?.auth();
}
