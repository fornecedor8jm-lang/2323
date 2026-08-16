import { deleteSession, getSession, handleOptions, jsonResponse } from '../../../_lib/pairing';

export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return jsonResponse(res, { error: 'Método não permitido' }, 405);

  const session = getSession(String(req.query?.sessionId || '').trim());
  if (!session) return jsonResponse(res, { error: 'Sessão não encontrada ou expirada.' }, 404);

  if (session.status === 'received') {
    const payload = {
      status: 'received',
      name: session.sourceName || 'Nuvem Pareada via Celular',
      url: session.url,
      maskedUrl: session.url,
      content: session.content,
    };
    deleteSession(session);
    return jsonResponse(res, payload);
  }

  return jsonResponse(res, {
    status: 'pending',
    sessionId: session.sessionId,
    expiresInSeconds: Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000)),
  });
}
