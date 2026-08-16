import { CloudMediaItem, CloudSeriesGroup, CloudContentType } from '../types';

interface ParsedExtInf {
  attributes: Record<string, string>;
  title: string;
}

interface SeriesDetection {
  seriesTitle?: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

const SERIES_GROUP_WORDS = [
  'SERIE', 'SÉRIE', 'SERIES', 'SEASON', 'TEMPORADA', 'NOVELA', 'ANIME', 'ANIMES', 'DORAMA',
];

const MOVIE_GROUP_WORDS = [
  'FILME', 'FILMES', 'MOVIE', 'MOVIES', 'CINEMA', 'VOD', 'LANCAMENTO', 'LANÇAMENTO',
  '4K', 'ANIMACAO', 'ANIMAÇÃO', 'TERROR', 'SUSPENSE', 'ACAO', 'AÇÃO', 'KIDS MOVIES',
];

const CHANNEL_GROUP_WORDS = [
  'CANAL', 'CANAIS', 'AO VIVO', 'LIVE', 'ABERTO', 'NOTICIA', 'NOTÍCIA', 'ESPORTE',
  'SPORT', '24H', 'IPTV', 'INFANTIL', 'DOCUMENTARIO', 'DOCUMENTÁRIO', 'RADIO', 'RÁDIO',
];

/**
 * Lê playlists M3U/M3U8 de provedores reais. A função aceita listas IPTV com
 * #EXTINF, #EXTGRP, atributos sem aspas, URLs relativas e entradas sem metadados.
 * O terceiro argumento é opcional e serve para resolver URLs relativas.
 */
export function parseM3U(content: string, sourceId: string, playlistUrl?: string): CloudMediaItem[] {
  const normalized = normalizePlaylistText(content);
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const items: CloudMediaItem[] = [];
  const seen = new Set<string>();
  let pendingExtInf: ParsedExtInf | null = null;
  let pendingGroup = '';
  let pendingAttributes: Record<string, string> = {};
  let mediaPlaylist = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#EXT-X-TARGETDURATION') || line.startsWith('#EXT-X-MEDIA-SEQUENCE')) {
      mediaPlaylist = true;
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      pendingExtInf = parseExtInf(line);
      pendingAttributes = { ...pendingExtInf.attributes };
      continue;
    }

    if (line.startsWith('#EXTGRP:')) {
      pendingGroup = cleanText(line.slice(8));
      continue;
    }

    if (line.startsWith('#EXTVLCOPT:') || line.startsWith('#KODIPROP:')) {
      const separator = line.indexOf(':', line.indexOf(':') + 1);
      if (separator !== -1) {
        const key = normalizeKey(line.slice(line.indexOf(':') + 1, separator));
        pendingAttributes[key] = cleanText(line.slice(separator + 1));
      }
      continue;
    }

    if (line.startsWith('#')) continue;

    const streamUrl = resolveStreamUrl(line, playlistUrl);
    if (!isLikelyStreamUrl(streamUrl)) {
      resetPendingMetadata();
      continue;
    }

    // An HLS media playlist contains segments, not catalog entries. Do not turn
    // every .ts segment into a channel card.
    if (mediaPlaylist && !pendingExtInf) continue;

    const parsed = pendingExtInf
      ? buildItem(pendingExtInf.title, pendingAttributes, pendingGroup, streamUrl, sourceId, items.length)
      : buildItem(inferTitleFromUrl(streamUrl, items.length + 1), pendingAttributes, pendingGroup, streamUrl, sourceId, items.length);

    const dedupeKey = `${normalizeForKey(parsed.title)}|${normalizeUrlForKey(parsed.streamUrl)}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      items.push(parsed);
    }

    resetPendingMetadata();
  }

  return items;

  function resetPendingMetadata() {
    pendingExtInf = null;
    pendingGroup = '';
    pendingAttributes = {};
  }
}

function normalizePlaylistText(content: string): string {
  return String(content || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function parseExtInf(line: string): ParsedExtInf {
  const body = line.slice('#EXTINF:'.length);
  const commaIndex = findTitleSeparator(body);
  const metadata = commaIndex >= 0 ? body.slice(0, commaIndex) : body;
  const title = commaIndex >= 0 ? body.slice(commaIndex + 1).trim() : '';
  const attributes = parseAttributes(metadata);
  return { attributes, title: cleanText(title) || attributes['tvg-name'] || 'Transmissão' };
}

function findTitleSeparator(value: string): number {
  let quote: string | null = null;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if ((char === '"' || char === "'") && value[i - 1] !== '\\') {
      quote = quote === char ? null : quote || char;
    } else if (char === ',' && !quote) {
      return i;
    }
  }
  return -1;
}

function parseAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const regex = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    const key = normalizeKey(match[1]);
    attributes[key] = cleanText(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function buildItem(
  rawTitle: string,
  attributes: Record<string, string>,
  groupOverride: string,
  streamUrl: string,
  sourceId: string,
  index: number,
): CloudMediaItem {
  const group = cleanText(groupOverride || attributes['group-title'] || attributes['group'] || attributes['category'] || 'Geral');
  const title = cleanText(rawTitle) || attributes['tvg-name'] || inferTitleFromUrl(streamUrl, index + 1);
  const detection = detectSeries(title, group, attributes, streamUrl);
  const type = detectContentType(title, group, attributes, streamUrl, detection);
  const cleanTitle = detection.episodeTitle || cleanDisplayTitle(title);
  const logo = firstNonEmpty(attributes['tvg-logo'], attributes['logo'], attributes['logo-url'], attributes['icon']);

  return {
    id: `cloud-${sourceId}-${index + 1}`,
    title: cleanTitle,
    type,
    group,
    logo: logo || undefined,
    streamUrl,
    tvgId: attributes['tvg-id'] || undefined,
    tvgName: attributes['tvg-name'] || undefined,
    season: detection.season,
    episode: detection.episode,
    seriesTitle: detection.seriesTitle,
    sourceId,
    rawAttributes: attributes,
  };
}

function detectSeries(title: string, group: string, attributes: Record<string, string>, streamUrl: string): SeriesDetection {
  const source = title.replace(/[\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  const patterns: RegExp[] = [
    /^(.*?)\s*[\[({-]?\s*[Ss](\d{1,2})\s*[-_. ]?[Ee](\d{1,3})(?:\s*[-_.: ]?\s*(.*))?$/i,
    /^(.*?)\s*[\[({-]?\s*(\d{1,2})\s*[xX]\s*(\d{1,3})(?:\s*[-_.: ]?\s*(.*))?$/i,
    /^(.*?)\s*[\[({-]?\s*(?:Temporada|Season|Temp)\s*(\d{1,2})\s*[-_.: ]?\s*(?:Episódio|Episodio|Episode|Ep|Cap)\s*(\d{1,3})(?:\s*[-_.: ]?\s*(.*))?$/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) {
      const seriesTitle = cleanSeriesTitle(match[1]);
      const season = Number(match[2]);
      const episode = Number(match[3]);
      const episodeName = cleanEpisodeTitle(match[4] || `Episódio ${episode}`);
      return { seriesTitle, season, episode, episodeTitle: episodeName };
    }
  }

  const episodeOnly = source.match(/^(.*?)\s*[-|:]?\s*(?:Episódio|Episodio|Episode|Ep|Cap)\s*(\d{1,3})(?:\s*[-_.: ]?\s*(.*))?$/i);
  const groupUpper = normalizeForKey(group);
  if (episodeOnly && SERIES_GROUP_WORDS.some((word) => groupUpper.includes(normalizeForKey(word)))) {
    const episode = Number(episodeOnly[2]);
    return {
      seriesTitle: cleanSeriesTitle(episodeOnly[1]),
      season: 1,
      episode,
      episodeTitle: cleanEpisodeTitle(episodeOnly[3] || `Episódio ${episode}`),
    };
  }

  const seasonFromAttributes = firstNumber(attributes['season'], attributes['season-number'], attributes['tvg-season']);
  const episodeFromAttributes = firstNumber(attributes['episode'], attributes['episode-number'], attributes['tvg-episode']);
  if (seasonFromAttributes !== undefined || episodeFromAttributes !== undefined) {
    return {
      seriesTitle: cleanSeriesTitle(attributes['series-title'] || attributes['tvg-name'] || title),
      season: seasonFromAttributes ?? 1,
      episode: episodeFromAttributes ?? 1,
      episodeTitle: cleanEpisodeTitle(title),
    };
  }

  const pathMatch = decodeURIComponent(streamUrl).match(/[\\/]s(\d{1,2})[ex](\d{1,3})[\\/]/i);
  if (pathMatch) {
    return {
      seriesTitle: cleanSeriesTitle(attributes['series-title'] || attributes['tvg-name'] || title),
      season: Number(pathMatch[1]),
      episode: Number(pathMatch[2]),
      episodeTitle: cleanEpisodeTitle(title),
    };
  }

  if (SERIES_GROUP_WORDS.some((word) => normalizeForKey(group).includes(normalizeForKey(word)))) {
    return { seriesTitle: cleanSeriesTitle(title), season: 1, episode: 1, episodeTitle: cleanEpisodeTitle(title) };
  }

  return {};
}

function detectContentType(
  title: string,
  group: string,
  attributes: Record<string, string>,
  url: string,
  series: SeriesDetection,
): CloudContentType {
  if (series.seriesTitle) return 'series';

  const explicit = normalizeForKey(attributes['tvg-type'] || attributes['type'] || attributes['content-type'] || '');
  if (explicit.includes('series') || explicit.includes('serie') || explicit.includes('show')) return 'series';
  if (explicit.includes('movie') || explicit.includes('filme') || explicit.includes('vod')) return 'movie';
  if (explicit.includes('channel') || explicit.includes('live') || explicit.includes('canal')) return 'channel';

  const normalizedGroup = normalizeForKey(group);
  if (MOVIE_GROUP_WORDS.some((word) => normalizedGroup.includes(normalizeForKey(word)))) return 'movie';
  if (SERIES_GROUP_WORDS.some((word) => normalizedGroup.includes(normalizeForKey(word)))) return 'series';
  if (CHANNEL_GROUP_WORDS.some((word) => normalizedGroup.includes(normalizeForKey(word)))) return 'channel';

  const lowerUrl = url.toLowerCase().split('?')[0];
  if (/\.(mp4|m4v|webm|mkv|avi|mov|wmv)$/.test(lowerUrl)) return 'movie';
  if (/\.(m3u8|ts|aac|mp3|ogg)$/.test(lowerUrl)) return 'channel';

  const normalizedTitle = normalizeForKey(title);
  if (/\b(s\d{1,2}e\d{1,3}|\d{1,2}x\d{1,3})\b/i.test(title)) return 'series';
  if (normalizedTitle.includes('trailer') || normalizedTitle.includes('filme')) return 'movie';
  return 'channel';
}

function cleanDisplayTitle(title: string): string {
  return title
    .replace(/\s*[|•]\s*(?:4K|8K|FHD|HD|SD|H265|HEVC|Dublado|Legendado).*$/i, '')
    .replace(/\s*\((?:4K|8K|FHD|HD|SD|H265|HEVC)\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSeriesTitle(value: string): string {
  return cleanText(value)
    .replace(/\s*[|•-]\s*(?:Série|Serie|Series|Temporada|Season).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Série';
}

function cleanEpisodeTitle(value: string): string {
  return cleanText(value).replace(/^[-_.:| ]+/, '').replace(/\s+/g, ' ').trim() || 'Episódio';
}

function cleanText(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
  return value.toLowerCase().trim().replace(/_/g, '-');
}

function normalizeForKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function normalizeUrlForKey(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

function resolveStreamUrl(value: string, playlistUrl?: string): string {
  if (!playlistUrl || /^https?:\/\//i.test(value) || value.startsWith('//')) return value;
  try {
    return new URL(value, playlistUrl).toString();
  } catch {
    return value;
  }
}

function isLikelyStreamUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value) || /^(rtmp|rtsp|udp|p2p):/i.test(value);
}

/** Retorna se um item pode ser exibido no player web do modo Android TV. */
export function isTvCompatibleStream(streamUrl: string): boolean {
  const trimmed = String(streamUrl || '').trim();
  if (!trimmed || !/^(https?:)?\/\//i.test(trimmed)) return false;
  if (/^(rtsp|rtmp|udp|p2p):/i.test(trimmed)) return false;

  const pathname = trimmed.toLowerCase().split(/[?#]/, 1)[0];
  if (/\.(mkv|avi|wmv|flv|mpeg|mpg|3gp|asf|ts|m2ts)(?:$|\/)/i.test(pathname)) return false;
  if (/\.(m3u|txt)(?:$|\/)/i.test(pathname)) return false;

  return true;
}

function inferTitleFromUrl(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const part = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '').replace(/\.[a-z0-9]+$/i, '');
    return cleanText(part.replace(/[._-]+/g, ' ')) || `Transmissão ${index}`;
  } catch {
    return `Transmissão ${index}`;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => Boolean(value && value.trim()));
}

function firstNumber(...values: Array<string | undefined>): number | undefined {
  for (const value of values) {
    if (value && /^\d+$/.test(value.trim())) return Number(value.trim());
  }
  return undefined;
}

/** Agrupa itens de série por título normalizado e ordena temporadas/episódios. */
export function groupCloudSeries(items: CloudMediaItem[]): CloudSeriesGroup[] {
  const seriesItems = items.filter((item) => item.type === 'series');
  const seriesMap = new Map<string, CloudSeriesGroup>();

  for (const item of seriesItems) {
    const rawSeriesTitle = cleanText(item.seriesTitle || item.title) || 'Série';
    const normalizedKey = normalizeForKey(rawSeriesTitle).replace(/\s/g, '');

    if (!seriesMap.has(normalizedKey)) {
      seriesMap.set(normalizedKey, {
        id: `series-${item.sourceId}-${normalizedKey.toLowerCase()}`,
        title: rawSeriesTitle,
        group: item.group,
        logo: item.logo,
        sourceId: item.sourceId,
        seasons: [],
        totalEpisodes: 0,
      });
    }

    const series = seriesMap.get(normalizedKey)!;
    const seasonNumber = item.season || 1;
    const episodeNumber = item.episode || series.totalEpisodes + 1;
    let season = series.seasons.find((entry) => entry.seasonNumber === seasonNumber);

    if (!season) {
      season = { seasonNumber, episodes: [] };
      series.seasons.push(season);
    }

    if (!season.episodes.some((episode) => episode.streamUrl === item.streamUrl)) {
      season.episodes.push({
        id: item.id,
        episodeNumber,
        title: item.title,
        streamUrl: item.streamUrl,
        logo: item.logo,
      });
      series.totalEpisodes += 1;
    }
  }

  return Array.from(seriesMap.values())
    .map((series) => ({
      ...series,
      seasons: series.seasons
        .sort((a, b) => a.seasonNumber - b.seasonNumber)
        .map((season) => ({
          ...season,
          episodes: season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber),
        })),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
}

export const SAMPLE_DEMO_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="tvbrasil" tvg-name="TV Brasil" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/TV_Brasil_logo_2023.svg/320px-TV_Brasil_logo_2023.svg.png" group-title="Canais Abertos",TV Brasil HD
https://tvbrasil-live.ebc.com.br/hls/tvbrasil/index.m3u8
#EXTINF:-1 tvg-id="nosferatu1922" tvg-name="Nosferatu" tvg-logo="https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80" group-title="Filmes de Culto & Terror",Nosferatu (1922) - Versão Restaurada HD
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
#EXTINF:-1 tvg-id="twilightzone1" tvg-name="Além da Imaginação" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" group-title="Séries de Suspense",Além da Imaginação S01E01 - Onde Estão Todos?
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4
#EXTINF:-1 tvg-id="twilightzone2" tvg-name="Além da Imaginação" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" group-title="Séries de Suspense",Além da Imaginação S01E02 - Um por Um
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
`;
