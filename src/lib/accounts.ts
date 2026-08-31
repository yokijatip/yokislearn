import { createFirebaseDb, firebaseDocId, isFirebaseConfigured } from "./firebase";

const LEGACY_USERS_KEY = "yokislearn:accounts";
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

export function clearLegacyLocalAccounts() {
  try {
    localStorage.removeItem(LEGACY_USERS_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export async function getRemoteUsers() {
  if (!isFirebaseConfigured) {
    return {
      users: [] as AppAccount[],
      error: new Error("Firebase belum aktif di browser. Akun lokal tidak dipakai lagi."),
    };
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
  clearLegacyLocalAccounts();
  const { users: remoteUsers, error } = await getRemoteUsers();
  const unique = new Map<string, AppAccount>();

  [...seededUsers, ...remoteUsers].forEach((user) => {
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
    return {
      account,
      remoteSaved: false,
      error: new Error("Firebase belum aktif di browser. Akun tidak disimpan."),
      remoteError: null,
    };
  }

  try {
    const db = await createFirebaseDb();
    if (!db) {
      return { account, remoteSaved: false, error: new Error("Firebase belum siap. Akun tidak disimpan."), remoteError: null };
    }

    const { doc, serverTimestamp, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "accounts", firebaseDocId(account.nim)), {
      nim: account.nim,
      name: account.name,
      role: account.role,
      createdBy: account.createdBy,
      createdAt: serverTimestamp(),
    });

    return { account, remoteSaved: true, error: null, remoteError: null };
  } catch (error) {
    return { account, remoteSaved: false, error: new Error(`Gagal menyimpan ke Firebase: ${(error as Error).message}`), remoteError: error as Error };
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
