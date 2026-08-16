import { handleOptions, jsonResponse } from './_lib/pairing';

export default function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return handleOptions(res);
  if (req.method !== 'GET') return jsonResponse(res, { error: 'Método não permitido' }, 405);
  return jsonResponse(res, { status: 'ok', service: 'cineclub-api', time: new Date().toISOString() });
}
