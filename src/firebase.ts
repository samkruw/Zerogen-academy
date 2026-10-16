import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { parseCourses } from './model.ts';
import type { Course } from './model.ts';
import type { Remote, RemoteStore } from './sync.ts';

export function decodeRemote(value: unknown, etag: string): Remote {
  if (value === null) return { revision: null, courses: [], etag };
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Ungültiger Cloud-Stand. Lokale Daten bleiben erhalten.');
  const data = value as Record<string, unknown>;
  if (typeof data.revision !== 'string' || !data.revision || data.revision.length > 100 ||
    (data.items != null && (typeof data.items !== 'object' || Array.isArray(data.items)))) throw new Error('Ungültiges Cloud-Schema.');
  const courses = Object.entries(data.items ?? {}).map(([id, item]) => {
    if (!item || typeof item !== 'object' || (item as Course).id !== id) throw new Error('Ungültige Cloud-Kurs-ID.');
    return { ...item, score: (item as Course).score ?? null };
  });
  return { revision: data.revision, courses: parseCourses(courses), etag };
}

export class FirebaseRemote implements RemoteStore {
  private url: string;
  private user: User;
  constructor(databaseURL: string, ownerUid: string, user: User) {
    if (user.uid !== ownerUid) throw new Error('Dieses Konto ist nicht freigegeben.');
    const database = new URL(databaseURL);
    if (database.protocol !== 'https:' || !/\.(firebaseio\.com|firebasedatabase\.app)$/.test(database.hostname) || database.pathname !== '/') throw new Error('Ungültige Realtime-Database-Adresse.');
    this.url = `${database.origin}/users/${encodeURIComponent(ownerUid)}/courses.json`;
    this.user = user;
  }
  private async request(method: string, headers: Record<string, string>, body?: string) {
    const token = await this.user.getIdToken();
    // RTDB REST supports Firebase ID tokens through `auth`. Never log this URL.
    return fetch(`${this.url}?auth=${encodeURIComponent(token)}`, { method, headers, body, cache: 'no-store', signal: AbortSignal.timeout(12000) });
  }
  async read(): Promise<Remote> {
    const response = await this.request('GET', { 'X-Firebase-ETag': 'true' });
    if (!response.ok) throw new Error(`Cloud-Zugriff abgelehnt (${response.status}). Owner-Konfiguration und Rules prüfen.`);
    const etag = response.headers.get('ETag');
    if (!etag) throw new Error('Cloud liefert keine Versionsprüfung. Kein Upload möglich.');
    return decodeRemote(await response.json(), etag);
  }
  async write(expected: Remote, courses: Course[], revision: string): Promise<boolean> {
    const items = Object.fromEntries(parseCourses(courses).map(c => [c.id, c]));
    const response = await this.request('PUT', { 'Content-Type': 'application/json', 'if-match': expected.etag }, JSON.stringify({ revision, items }));
    if (response.status === 412) return false;
    if (!response.ok) throw new Error(`Cloud-Speicherung abgelehnt (${response.status}). Lokal gesichert.`);
    return true;
  }
}

export function setupFirebase(accountChanged: (remote: RemoteStore | null, message: string) => void) {
  const env = import.meta.env;
  const config = { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL, projectId: env.VITE_FIREBASE_PROJECT_ID };
  const ownerUid = env.VITE_OWNER_UID;
  if (!ownerUid || Object.values(config).some(value => !value)) throw new Error('Firebase-Konfiguration ist unvollständig.');
  const auth = getAuth(initializeApp(config));
  onAuthStateChanged(auth, async user => {
    if (!user) { accountChanged(null, 'Abgemeldet. Dein Lernstand ist lokal gespeichert.'); return; }
    if (user.uid !== ownerUid) { await signOut(auth); accountChanged(null, 'Dieses Konto ist nicht freigegeben.'); return; }
    try { accountChanged(new FirebaseRemote(config.databaseURL, ownerUid, user), 'Eigentümerkonto angemeldet.'); }
    catch { accountChanged(null, 'Firebase-Adresse ungültig. Lokale Daten bleiben erhalten.'); }
  });
  return {
    login: (email: string, password: string) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth)
  };
}
