const { handleOptions, jsonResponse } = require('../_lib/pairing');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return jsonResponse(res, { error: 'Método não permitido' }, 405);

  const target = String(req.query?.url || '').trim();
  if (!target) return jsonResponse(res, { error: 'URL da lista M3U não informada.' }, 400);

  let targetUrl;
  try {
    targetUrl = new URL(target);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) throw new Error('protocol');
  } catch {
    return jsonResponse(res, { error: 'A URL informada não é válida.' }, 400);
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain, */*',
        'User-Agent': 'Cineclub/1.0 M3U importer',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) return jsonResponse(res, { error: `O servidor da lista respondeu com HTTP ${upstream.status}.` }, 502);
    const text = await upstream.text();
    if (!text.trim()) return jsonResponse(res, { error: 'O servidor retornou uma lista vazia.' }, 502);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(text);
  } catch {
    return jsonResponse(res, {
      error: 'Não foi possível conectar ao servidor da lista. Verifique a URL, a rede e se o provedor permite acesso externo.',
    }, 502);
  }
};
