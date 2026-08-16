import { getSessionByCode, handleOptions, jsonResponse, maskPasswordInUrl } from '../../_lib/pairing';

export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'POST') return jsonResponse(res, { error: 'Método não permitido' }, 405);

  const session = getSessionByCode(String(req.query?.pairingCode || ''));
  if (!session) return jsonResponse(res, { error: 'Código de pareamento não encontrado ou expirado. Gere um novo na TV.' }, 404);

  const body = req.body || {};
  let finalUrl = typeof body.url === 'string' ? body.url.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';

  if (!finalUrl && body.server && body.username && body.password) {
    const server = String(body.server).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    const type = String(body.type || 'm3u_plus');
    finalUrl = `http://${server}/get.php?username=${encodeURIComponent(body.username)}&password=${encodeURIComponent(body.password)}&type=${encodeURIComponent(type)}`;
  }

  if (!finalUrl && !content) return jsonResponse(res, { error: 'Forneça uma URL M3U ou selecione um arquivo no celular.' }, 400);

  session.status = 'received';
  session.sourceName = String(body.name || 'Nuvem Pareada via Celular');
  session.url = finalUrl || undefined;
  session.content = content || undefined;

  return jsonResponse(res, {
    success: true,
    message: 'Nuvem enviada para a TV. Você já pode voltar para a tela da televisão.',
    maskedUrl: maskPasswordInUrl(finalUrl),
  });
}
