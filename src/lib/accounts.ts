import { createFirebaseDb, firebaseDocId, isFirebaseConfigured } from "./firebase";

export const USERS_KEY = "yokislearn:accounts";
export const SESSION_KEY = "yokislearn:session";

export interface AppAccount {
  nim: string;
  name: string;
  role: "developer" | "guru" | "murid";
  createdBy?: string;
}

export const seededUsers: AppAccount[] = [
  { nim: "DEV001", name: "Developer", role: "developer", createdBy: "system" },
  { nim: "GURU001", name: "Guru LPK Baraya", role: "guru", createdBy: "system" },
];

export function normalizeNim(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

export function escapeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getLocalUsers() {
  let stored: AppAccount[] = [];
  try {
    stored = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    stored = [];
  }

  const unique = new Map<string, AppAccount>();
  [...seededUsers, ...stored].forEach((user) => {
    unique.set(normalizeNim(user.nim), { ...user, nim: normalizeNim(user.nim) });
  });

  return [...unique.values()];
}

export function saveLocalUser(user: AppAccount) {
  const users = getLocalUsers();
  const nim = normalizeNim(user.nim);
  const nextUsers = users.filter((item) => item.nim !== nim && item.createdBy !== "system");
  nextUsers.push({ ...user, nim });
  localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
}

export async function getRemoteUsers() {
  if (!isFirebaseConfigured) {
    return { users: [] as AppAccount[], error: null as Error | null };
  }

  try {
    const db = await createFirebaseDb();
    if (!db) return { users: [] as AppAccount[], error: null };

    const { collection, getDocs, orderBy, query } = await import("firebase/firestore");
    const snapshot = await getDocs(query(collection(db, "accounts"), orderBy("name", "asc")));

    const users = snapshot.docs.map((docSnapshot) => {
      const user = docSnapshot.data();
      return {
        nim: normalizeNim(user.nim),
        name: String(user.name || ""),
        role: user.role,
        createdBy: user.createdBy || user.created_by || undefined,
      };
    }) as AppAccount[];

    return {
      users,
      error: null,
    };
  } catch (error) {
    return { users: [] as AppAccount[], error: error as Error };
  }
}

export async function getUsers() {
  const localUsers = getLocalUsers();
  const { users: remoteUsers, error } = await getRemoteUsers();
  const unique = new Map<string, AppAccount>();

  [...seededUsers, ...localUsers, ...remoteUsers].forEach((user) => {
    unique.set(normalizeNim(user.nim), { ...user, nim: normalizeNim(user.nim) });
  });

  return { users: [...unique.values()], remoteError: error };
}

export async function createStudentAccount(input: { nim: string; name: string; createdBy: string }) {
  const account: AppAccount = {
    nim: normalizeNim(input.nim),
    name: input.name.trim(),
    role: "murid",
    createdBy: normalizeNim(input.createdBy) || "REGISTER",
  };

  if (!account.nim || !account.name) {
    return { account, remoteSaved: false, error: new Error("NIM dan nama wajib diisi.") };
  }

  const { users } = await getUsers();
  if (users.some((user) => normalizeNim(user.nim) === account.nim)) {
    return { account, remoteSaved: false, error: new Error("NIM sudah dipakai.") };
  }

  if (!isFirebaseConfigured) {
    saveLocalUser(account);
    return {
      account,
      remoteSaved: false,
      error: null,
      remoteError: new Error("Firebase belum aktif di browser. Redeploy Netlify setelah mengisi env Firebase."),
    };
  }

  if (isFirebaseConfigured) {
    try {
      const db = await createFirebaseDb();
      if (db) {
        const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "accounts", firebaseDocId(account.nim)), {
          nim: account.nim,
          name: account.name,
          role: account.role,
          createdBy: account.createdBy,
          createdAt: serverTimestamp(),
        });

        saveLocalUser(account);
        return { account, remoteSaved: true, error: null };
      }
    } catch (error) {
      saveLocalUser(account);
      return { account, remoteSaved: false, error: null, remoteError: error as Error };
    }
  }

  saveLocalUser(account);
  return { account, remoteSaved: false, error: null, remoteError: null };
}

export async function syncLocalStudentsToRemote() {
  if (!isFirebaseConfigured) {
    return { synced: 0, error: new Error("Firebase belum aktif di browser.") };
  }

  try {
    const db = await createFirebaseDb();
    if (!db) return { synced: 0, error: null };

    const { users: remoteUsers, error: remoteError } = await getRemoteUsers();
    if (remoteError) return { synced: 0, error: remoteError };

    const remoteNims = new Set(remoteUsers.map((user) => normalizeNim(user.nim)));
    const localStudents = getLocalUsers().filter(
      (user) => user.role === "murid" && user.createdBy !== "system" && !remoteNims.has(normalizeNim(user.nim)),
    );

    if (!localStudents.length) {
      return { synced: 0, error: null };
    }

    const { doc, serverTimestamp, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    localStudents.forEach((user) => {
      batch.set(doc(db, "accounts", firebaseDocId(normalizeNim(user.nim))), {
        nim: normalizeNim(user.nim),
        name: user.name,
        role: "murid",
        createdBy: user.createdBy || "local-sync",
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();

    return { synced: localStudents.length, error: null };
  } catch (error) {
    return { synced: 0, error: error as Error };
  }
}

export async function findAccountByNim(nim: string) {
  const normalized = normalizeNim(nim);
  const { users, remoteError } = await getUsers();
  return {
    user: users.find((item) => item.nim === normalized) || null,
    remoteError,
  };
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AppAccount | null;
  } catch {
    return null;
  }
}

export function setSession(user: AppAccount) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
