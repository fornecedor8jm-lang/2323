import { createPairSession, handleOptions, jsonResponse } from '../../_lib/pairing';

export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return jsonResponse(res, { error: 'Método não permitido' }, 405);

  try {
    const session = createPairSession();
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    return jsonResponse(res, {
      success: true,
      sessionId: session.sessionId,
      pairingCode: session.code,
      qrUrl: `${protocol}://${host}/?pairCode=${session.code}`,
      expiresInSeconds: Math.ceil((session.expiresAt - Date.now()) / 1000),
      expiresAt: new Date(session.expiresAt).toISOString(),
    });
  } catch {
    return jsonResponse(res, { error: 'Não foi possível criar a sessão do QR Code. Tente novamente.' }, 500);
  }
}
