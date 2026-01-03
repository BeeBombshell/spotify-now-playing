import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (serviceAccount) {
    let credentials;
    try {
      // Try to parse as raw JSON
      credentials = JSON.parse(serviceAccount);
    } catch (e) {
      try {
        // Try to decode from Base64
        credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
      } catch (e2) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string or Base64 encoded JSON.');
      }
    }
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId,
    });
  } else if (serviceAccountPath) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      projectId,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }
}

const db = admin.firestore();
const USERS_COLLECTION = 'users';

interface UserData {
  uid: string;
  spotifyId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId: string;
  clientSecret: string;
  lastPlayed?: any;
}

export const saveUser = async (uid: string, data: Omit<UserData, 'uid'>) => {
  await db.collection(USERS_COLLECTION).doc(uid).set(data);
};

export const getUser = async (uid: string): Promise<UserData | null> => {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (doc.exists) {
    const data = doc.data() as Omit<UserData, 'uid'>;
    return { uid, ...data };
  }
  return null;
};

export const getUserBySpotifyId = async (spotifyId: string): Promise<UserData | null> => {
  const querySnapshot = await db.collection(USERS_COLLECTION).where('spotifyId', '==', spotifyId).limit(1).get();
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data() as Omit<UserData, 'uid'>;
    return { uid: doc.id, ...data };
  }
  return null;
};

export const deleteUser = async (uid: string) => {
  await db.collection(USERS_COLLECTION).doc(uid).delete();
};
