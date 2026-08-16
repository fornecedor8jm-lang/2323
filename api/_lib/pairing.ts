import crypto from 'node:crypto';

export interface PairSession {
  sessionId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'received';
  sourceName?: string;
  url?: string;
  content?: string;
}

type PairStore = {
  bySession: Map<string, PairSession>;
  byCode: Map<string, PairSession>;
};

const globalStore = globalThis as typeof globalThis & { __cineclubPairStore?: PairStore };
const store: PairStore = globalStore.__cineclubPairStore ?? {
  bySession: new Map(),
  byCode: new Map(),
};
globalStore.__cineclubPairStore = store;

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const TTL_MS = 5 * 60 * 1000;

export function cleanExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of store.bySession) {
    if (session.expiresAt <= now) {
      store.bySession.delete(sessionId);
      store.byCode.delete(session.code);
    }
  }
}

export function createPairSession() {
  cleanExpiredSessions();
  const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join('');
  const now = Date.now();
  const session: PairSession = {
    sessionId,
    code,
    createdAt: now,
    expiresAt: now + TTL_MS,
    status: 'pending',
  };
  store.bySession.set(sessionId, session);
  store.byCode.set(code, session);
  return session;
}

export function getSession(sessionId: string) {
  cleanExpiredSessions();
  return store.bySession.get(sessionId);
}

export function getSessionByCode(code: string) {
  cleanExpiredSessions();
  return store.byCode.get(code.trim().toUpperCase());
}

export function deleteSession(session: PairSession) {
  store.bySession.delete(session.sessionId);
  store.byCode.delete(session.code);
}

export function maskPasswordInUrl(url?: string) {
  if (!url) return '';
  return url.replace(/([?&](?:password|pass)=)[^&#]+/gi, '$1••••••');
}

export function jsonResponse(res: any, payload: unknown, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(payload);
}

export function handleOptions(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
}
