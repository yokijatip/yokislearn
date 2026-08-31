const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export async function createFirebaseDb() {
  if (!isFirebaseConfigured) {
    return null;
  }

  const [{ initializeApp, getApps }, { getFirestore }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export function firebaseDocId(value: string) {
  return value.replaceAll("/", "_");
}

export const firebaseCollections = [
  "accounts",
  "user_progress",
  "game_rooms",
  "game_scores",
] as const;
