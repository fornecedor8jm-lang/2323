import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

interface PairSession {
  sessionId: string;
  code: string;
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'received' | 'expired';
  sourceName?: string;
  url?: string;
  maskedUrl?: string;
  content?: string;
  sourceId?: string;
}

// In-memory pair sessions store (hashed / tokenized)
const pairSessionsBySessionId = new Map<string, PairSession>();
const pairSessionsByCode = new Map<string, PairSession>();

// In-memory Cloud Sources store
interface StoredCloudSource {
  id: string;
  name: string;
  type: 'url' | 'file' | 'pair' | 'sample';
  url?: string;
  maskedUrl?: string;
  createdAt: string;
  updatedAt: string;
  totalCount: number;
  channelsCount: number;
  moviesCount: number;
  seriesCount: number;
  items: any[];
}

const cloudSourcesStore = new Map<string, StoredCloudSource>();

// Cleanup expired sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of pairSessionsBySessionId.entries()) {
    if (session.expiresAt < now) {
      pairSessionsBySessionId.delete(id);
      pairSessionsByCode.delete(session.code);
    }
  }
}, 2 * 60 * 1000);

function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function maskPasswordInUrl(urlStr?: string): string {
  if (!urlStr) return '';
  return urlStr.replace(/([?&](?:password|pass)=)[^&#]+/gi, '$1••••••');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // 1. PAIRING ENDPOINTS (QR & Phone Sync)
  // ==========================================

  /**
   * POST /api/cloud/pairing/session
   * Inicia sessão temporária de pareamento.
   * Retorna identificador da sessão, código curto, URL do QR Code e horário de expiração.
   */
  app.post('/api/cloud/pairing/session', (req, res) => {
    try {
      const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
      const pairingCode = generateShortCode();
      const tokenHash = crypto.createHash('sha256').update(sessionId + pairingCode).digest('hex');
      const now = Date.now();
      const expiresInSeconds = 300; // 5 minutes
      const expiresAt = now + expiresInSeconds * 1000;

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const qrUrl = `${protocol}://${host}/pair/${pairingCode}`;

      const session: PairSession = {
        sessionId,
        code: pairingCode,
        tokenHash,
        createdAt: now,
        expiresAt,
        status: 'pending',
      };

      pairSessionsBySessionId.set(sessionId, session);
      pairSessionsByCode.set(pairingCode, session);

      res.json({
        success: true,
        sessionId,
        pairingCode,
        qrUrl,
        expiresInSeconds,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao gerar sessão de pareamento' });
    }
  });

  /**
   * Legacy alias for session creation
   */
  app.post('/api/cloud/pair-session', (req, res) => {
    try {
      const sessionId = 'sess_' + crypto.randomBytes(16).toString('hex');
      const pairingCode = generateShortCode();
      const now = Date.now();
      const expiresInSeconds = 300; // 5 minutes
      const expiresAt = now + expiresInSeconds * 1000;

      const session: PairSession = {
        sessionId,
        code: pairingCode,
        tokenHash: crypto.createHash('sha256').update(sessionId).digest('hex'),
        createdAt: now,
        expiresAt,
        status: 'pending',
      };

      pairSessionsBySessionId.set(sessionId, session);
      pairSessionsByCode.set(pairingCode, session);

      res.json({
        success: true,
        sessionId,
        code: pairingCode,
        pairingCode,
        expiresInSeconds,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao gerar sessão de pareamento' });
    }
  });

  /**
   * GET /api/cloud/pairing/session/:sessionId
   * Consulta o estado do pareamento.
   * Devolve "pending" enquanto aguarda; "received" após envio pelo celular.
   */
  app.get('/api/cloud/pairing/session/:sessionId', (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const session = pairSessionsBySessionId.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Sessão de pareamento não encontrada' });
      }

      if (session.expiresAt < Date.now()) {
        session.status = 'expired';
        pairSessionsBySessionId.delete(sessionId);
        pairSessionsByCode.delete(session.code);
        return res.status(410).json({ status: 'expired', error: 'Sessão expirada' });
      }

      if (session.status === 'received') {
        const payload = {
          status: 'received',
          sourceId: session.sourceId,
          name: session.sourceName || 'Nuvem Pareada via Celular',
          url: session.url,
          maskedUrl: session.maskedUrl || maskPasswordInUrl(session.url),
          content: session.content,
        };

        // Invalidate session immediately after successful delivery
        pairSessionsBySessionId.delete(sessionId);
        pairSessionsByCode.delete(session.code);

        return res.json(payload);
      }

      res.json({
        status: 'pending',
        sessionId: session.sessionId,
        expiresInSeconds: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar sessão' });
    }
  });

  /**
   * GET /api/cloud/poll-pair/:code
   * Fallback poll by pairing code
   */
  app.get('/api/cloud/poll-pair/:code', (req, res) => {
    try {
      const code = req.params.code.trim().toUpperCase();
      const session = pairSessionsByCode.get(code);

      if (!session) {
        return res.status(404).json({ error: 'Sessão não encontrada' });
      }

      if (session.expiresAt < Date.now()) {
        pairSessionsByCode.delete(code);
        pairSessionsBySessionId.delete(session.sessionId);
        return res.status(410).json({ error: 'Sessão expirada' });
      }

      if (session.status === 'received') {
        const payload = {
          success: true,
          status: 'ready',
          name: session.sourceName,
          url: session.url,
          maskedUrl: session.maskedUrl,
          content: session.content,
        };
        // Clean up once consumed
        pairSessionsByCode.delete(code);
        pairSessionsBySessionId.delete(session.sessionId);
        return res.json(payload);
      }

      res.json({
        success: true,
        status: 'waiting',
        expiresInSeconds: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao verificar sessão' });
    }
  });

  /**
   * POST /api/cloud/pairing/:pairingCode
   * Recebe a configuração enviada pelo celular (URL, arquivo ou dados de servidor/usuário/senha).
   */
  app.post('/api/cloud/pairing/:pairingCode', (req, res) => {
    try {
      const pairingCode = req.params.pairingCode.trim().toUpperCase();
      const { url, content, name, server, username, password, type } = req.body;

      const session = pairSessionsByCode.get(pairingCode);

      if (!session) {
        return res.status(404).json({ error: 'Código de pareamento não encontrado ou expirado.' });
      }

      if (session.expiresAt < Date.now()) {
        pairSessionsByCode.delete(pairingCode);
        pairSessionsBySessionId.delete(session.sessionId);
        return res.status(410).json({ error: 'Este código de pareamento expirou. Gere um novo código na TV.' });
      }

      let finalUrl = url;
      if (!finalUrl && server && username && password) {
        const cleanServer = server.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        const listType = type || 'm3u_plus';
        finalUrl = `http://${cleanServer}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=${listType}`;
      }

      if (!finalUrl && !content) {
        return res.status(400).json({ error: 'Forneça a URL da lista M3U ou selecione um arquivo.' });
      }

      session.status = 'received';
      session.sourceName = name || 'Nuvem Pareada via Celular';
      session.url = finalUrl;
      session.maskedUrl = maskPasswordInUrl(finalUrl);
      session.content = content;
      session.sourceId = `src-pair-${Date.now()}`;

      res.json({
        success: true,
        message: 'Nuvem enviada para a TV. Você já pode fechar esta página.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao processar pareamento' });
    }
  });

  /**
   * Legacy alias for submit-pair
   */
  app.post('/api/cloud/submit-pair', (req, res) => {
    try {
      const { code, url, content, name, server, username, password, type } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Código de pareamento obrigatório' });
      }

      const formattedCode = String(code).trim().toUpperCase();
      const session = pairSessionsByCode.get(formattedCode);

      if (!session) {
        return res.status(404).json({ error: 'Código de pareamento não encontrado ou expirado' });
      }

      if (session.expiresAt < Date.now()) {
        pairSessionsByCode.delete(formattedCode);
        pairSessionsBySessionId.delete(session.sessionId);
        return res.status(410).json({ error: 'Este código de pareamento expirou. Gere um novo no seu Cineclub.' });
      }

      let finalUrl = url;
      if (!finalUrl && server && username && password) {
        const cleanServer = server.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        const listType = type || 'm3u_plus';
        finalUrl = `http://${cleanServer}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=${listType}`;
      }

      if (!finalUrl && !content) {
        return res.status(400).json({ error: 'Forneça uma URL M3U ou o conteúdo da lista.' });
      }

      session.status = 'received';
      session.sourceName = name || 'Nuvem Pareada via Celular';
      session.url = finalUrl;
      session.maskedUrl = maskPasswordInUrl(finalUrl);
      session.content = content;
      session.sourceId = `src-pair-${Date.now()}`;

      res.json({
        success: true,
        message: 'Nuvem enviada para a TV. Você já pode fechar esta página.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao processar envio do pareamento' });
    }
  });

  // ==========================================
  // 2. SOURCES MANAGEMENT ENDPOINTS
  // ==========================================

  /**
   * POST /api/cloud/sources
   * Importa e valida uma nova fonte Nuvem
   */
  app.post('/api/cloud/sources', async (req, res) => {
    try {
      const { name, url, content, type = 'url', items = [] } = req.body;

      const sourceId = `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const channelsCount = items.filter((i: any) => i.type === 'channel').length;
      const moviesCount = items.filter((i: any) => i.type === 'movie').length;
      const seriesCount = items.filter((i: any) => i.type === 'series').length;

      const newSource: StoredCloudSource = {
        id: sourceId,
        name: name || 'Minha Nuvem',
        type,
        url,
        maskedUrl: maskPasswordInUrl(url),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalCount: items.length,
        channelsCount,
        moviesCount,
        seriesCount,
        items,
      };

      cloudSourcesStore.set(sourceId, newSource);

      res.json({
        success: true,
        sourceId,
        source: {
          id: newSource.id,
          name: newSource.name,
          type: newSource.type,
          url: newSource.maskedUrl,
          maskedUrl: newSource.maskedUrl,
          createdAt: newSource.createdAt,
          updatedAt: newSource.updatedAt,
          totalCount: newSource.totalCount,
          channelsCount: newSource.channelsCount,
          moviesCount: newSource.moviesCount,
          seriesCount: newSource.seriesCount,
        },
        itemsCount: items.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao criar fonte Nuvem' });
    }
  });

  /**
   * GET /api/cloud/sources/:sourceId/items?category=channels|movies|series
   * Consulta itens por categoria
   */
  app.get('/api/cloud/sources/:sourceId/items', (req, res) => {
    try {
      const { sourceId } = req.params;
      const { category, search, group } = req.query;

      const source = cloudSourcesStore.get(sourceId);
      if (!source) {
        return res.status(404).json({ error: 'Fonte Nuvem não encontrada' });
      }

      let filtered = source.items;

      if (category === 'channels') {
        filtered = filtered.filter((i) => i.type === 'channel');
      } else if (category === 'movies') {
        filtered = filtered.filter((i) => i.type === 'movie');
      } else if (category === 'series') {
        filtered = filtered.filter((i) => i.type === 'series');
      }

      if (group && group !== 'all') {
        filtered = filtered.filter((i) => i.group === group);
      }

      if (search) {
        const query = String(search).toLowerCase();
        filtered = filtered.filter(
          (i) => i.title.toLowerCase().includes(query) || (i.group && i.group.toLowerCase().includes(query))
        );
      }

      res.json({
        success: true,
        sourceId,
        total: filtered.length,
        items: filtered,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar itens da fonte' });
    }
  });

  /**
   * POST /api/cloud/sources/:sourceId/refresh
   * Atualiza a fonte re-baixando o conteúdo da URL
   */
  app.post('/api/cloud/sources/:sourceId/refresh', async (req, res) => {
    try {
      const { sourceId } = req.params;
      const source = cloudSourcesStore.get(sourceId);

      if (!source) {
        return res.status(404).json({ error: 'Fonte Nuvem não encontrada' });
      }

      if (!source.url) {
        return res.status(400).json({ error: 'Esta fonte não possui URL para atualização automática.' });
      }

      // Fetch fresh content
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Cineclub/1.0 IPTV-Player',
          Accept: '*/*',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `O servidor respondeu com status ${response.status}`,
        });
      }

      const rawText = await response.text();
      source.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        sourceId,
        updatedAt: source.updatedAt,
        rawText,
        message: 'Nuvem sincronizada com sucesso!',
      });
    } catch (err: any) {
      res.status(500).json({ error: `Erro ao atualizar Nuvem: ${err.message}` });
    }
  });

  /**
   * DELETE /api/cloud/sources/:sourceId
   * Remove a fonte Nuvem
   */
  app.delete('/api/cloud/sources/:sourceId', (req, res) => {
    try {
      const { sourceId } = req.params;
      const existed = cloudSourcesStore.delete(sourceId);
      res.json({
        success: true,
        deleted: existed,
        message: 'Fonte removida com sucesso.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao remover fonte' });
    }
  });

  /**
   * GET /api/cloud/proxy-m3u
   * Proxy external M3U / M3U8 URL to bypass browser CORS
   */
  app.get('/api/cloud/proxy-m3u', async (req, res) => {
    const targetUrl = req.query.url as string;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Parâmetro url é obrigatório' });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Cineclub/1.0 IPTV-Player',
          Accept: '*/*',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).json({
          error: `O servidor da lista respondeu com status ${response.status} (${response.statusText})`,
        });
      }

      const text = await response.text();
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(text);
    } catch (err: any) {
      console.error('Error proxying M3U:', err);
      res.status(502).json({
        error: `Não foi possível carregar a lista M3U da URL fornecida. Verifique se o link está ativo e acessível. (${err.message})`,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
