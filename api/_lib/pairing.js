const crypto = require('node:crypto');

const globalStore = globalThis;
const store = globalStore.__cineclubPairStore || {
  bySession: new Map(),
  byCode: new Map(),
};
globalStore.__cineclubPairStore = store;

const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const TTL_MS = 5 * 60 * 1000;

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of store.bySession) {
    if (session.expiresAt <= now) {
      store.bySession.delete(sessionId);
      store.byCode.delete(session.code);
    }
  }
}

function createPairSession() {
  cleanExpiredSessions();
  const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join('');
  const now = Date.now();
  const session = { sessionId, code, createdAt: now, expiresAt: now + TTL_MS, status: 'pending' };
  store.bySession.set(sessionId, session);
  store.byCode.set(code, session);
  return session;
}

function getSession(sessionId) {
  cleanExpiredSessions();
  return store.bySession.get(sessionId);
}

function getSessionByCode(code) {
  cleanExpiredSessions();
  return store.byCode.get(String(code || '').trim().toUpperCase());
}

function deleteSession(session) {
  store.bySession.delete(session.sessionId);
  store.byCode.delete(session.code);
}

function maskPasswordInUrl(url) {
  if (!url) return '';
  return String(url).replace(/([?&](?:password|pass)=)[^&#]+/gi, '$1••••••');
}

function jsonResponse(res, payload, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(status).json(payload);
}

function handleOptions(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res.status(204).end();
}

module.exports = { createPairSession, getSession, getSessionByCode, deleteSession, maskPasswordInUrl, jsonResponse, handleOptions };
