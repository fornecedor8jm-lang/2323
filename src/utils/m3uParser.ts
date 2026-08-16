import { CloudMediaItem, CloudSeriesGroup, CloudContentType } from '../types';

/**
 * Parses raw M3U / M3U8 playlist text into structured CloudMediaItems
 */
export function parseM3U(content: string, sourceId: string): CloudMediaItem[] {
  const lines = content.split(/\r?\n/);
  const items: CloudMediaItem[] = [];

  let currentExtInf: string | null = null;
  let currentExtGrp: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      currentExtInf = line;
    } else if (line.startsWith('#EXTGRP:')) {
      currentExtGrp = line.substring(8).trim();
    } else if (!line.startsWith('#')) {
      // This is a stream URL line
      if (currentExtInf) {
        const parsed = parseExtInfLine(currentExtInf, line, currentExtGrp, sourceId, items.length + 1);
        if (parsed) {
          items.push(parsed);
        }
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        // Standalone stream URL without EXTINF
        const fallbackTitle = `Transmissão #${items.length + 1}`;
        items.push({
          id: `cloud-${sourceId}-${items.length + 1}`,
          title: fallbackTitle,
          type: 'channel',
          group: currentExtGrp || 'Geral',
          streamUrl: line,
          sourceId,
        });
      }

      currentExtInf = null;
      currentExtGrp = null;
    }
  }

  return items;
}

/**
 * Parses a single #EXTINF line and extracts metadata
 */
function parseExtInfLine(
  extinf: string,
  url: string,
  groupOverride: string | null,
  sourceId: string,
  index: number
): CloudMediaItem {
  // Extract attributes (tvg-name="...", tvg-logo="...", group-title="...", etc.)
  const attributes: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match;

  while ((match = attrRegex.exec(extinf)) !== null) {
    attributes[match[1].toLowerCase()] = match[2];
  }

  // Extract raw display title after the last comma
  const commaIndex = extinf.lastIndexOf(',');
  let rawTitle = commaIndex !== -1 ? extinf.substring(commaIndex + 1).trim() : `Canal #${index}`;

  // Clean title
  rawTitle = rawTitle.replace(/^-\s*/, '').trim();

  const tvgId = attributes['tvg-id'];
  const tvgName = attributes['tvg-name'];
  const logo = attributes['tvg-logo'] || attributes['logo'];
  const group = groupOverride || attributes['group-title'] || 'Geral';

  // Detect content type & series details
  const { type, seriesTitle, season, episode, cleanTitle } = detectContentTypeAndSeries(rawTitle, group, url);

  return {
    id: `cloud-${sourceId}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle || rawTitle,
    type,
    group,
    logo: logo || undefined,
    streamUrl: url,
    tvgId: tvgId || undefined,
    tvgName: tvgName || undefined,
    season,
    episode,
    seriesTitle,
    sourceId,
    rawAttributes: attributes,
  };
}

/**
 * Smart detection of Content Type (Channel vs Movie vs Series) and SxxExx parsing
 */
function detectContentTypeAndSeries(
  rawTitle: string,
  group: string,
  url: string
): {
  type: CloudContentType;
  seriesTitle?: string;
  season?: number;
  episode?: number;
  cleanTitle: string;
} {
  const upperGroup = group.toUpperCase();
  const lowerUrl = url.toLowerCase();

  // 1. Check for Series Pattern in Title: S01E02, S1 E2, T01E02, T1 E2, Temporada 1 Ep 2, etc.
  const seriesPattern1 = /^(.*?)\s*[-:|/]?\s*[SsTt](\d{1,2})\s*[-_. ]?[Ee](\d{1,3})(.*)$/i;
  const seriesPattern2 = /^(.*?)\s*[-:|/]?\s*(?:Temporada|Season|Temp)\s*(\d{1,2})\s*[-_. ]?(?:Episódio|Episodio|Episode|Ep|Cap)\s*(\d{1,3})(.*)$/i;
  const seriesPattern3 = /^(.*?)\s*[-:|/]?\s*(?:Episódio|Episodio|Episode|Ep|Cap)\s*(\d{1,3})(.*)$/i;

  let match = rawTitle.match(seriesPattern1) || rawTitle.match(seriesPattern2);

  if (match) {
    const seriesTitle = match[1].trim() || 'Série';
    const season = parseInt(match[2], 10);
    const episode = parseInt(match[3], 10);
    const extra = match[4]?.replace(/^[-: ]+/, '').trim();
    const cleanTitle = extra ? `T${season}:E${episode} - ${extra}` : `Temporada ${season}, Episódio ${episode}`;

    return {
      type: 'series',
      seriesTitle,
      season,
      episode,
      cleanTitle,
    };
  }

  // Pattern with only episode
  const matchEpOnly = rawTitle.match(seriesPattern3);
  if (matchEpOnly && (upperGroup.includes('SERIE') || upperGroup.includes('SÉRIE') || upperGroup.includes('ANIME'))) {
    const seriesTitle = matchEpOnly[1].trim() || 'Série';
    const episode = parseInt(matchEpOnly[2], 10);
    const extra = matchEpOnly[3]?.replace(/^[-: ]+/, '').trim();
    const cleanTitle = extra ? `Episódio ${episode} - ${extra}` : `Episódio ${episode}`;

    return {
      type: 'series',
      seriesTitle,
      season: 1,
      episode,
      cleanTitle,
    };
  }

  // 2. Explicit Group Tag Heuristics
  const isSeriesGroup = 
    upperGroup.includes('SERIE') || 
    upperGroup.includes('SÉRIE') || 
    upperGroup.includes('SEASON') || 
    upperGroup.includes('NOVELA') || 
    upperGroup.includes('ANIMES') ||
    upperGroup.includes('DORAMA');

  if (isSeriesGroup) {
    return {
      type: 'series',
      seriesTitle: rawTitle,
      season: 1,
      episode: 1,
      cleanTitle: rawTitle,
    };
  }

  const isMovieGroup = 
    upperGroup.includes('FILME') || 
    upperGroup.includes('MOVIE') || 
    upperGroup.includes('CINEMA') || 
    upperGroup.includes('VOD') || 
    upperGroup.includes('LANCAMENTO') || 
    upperGroup.includes('LANÇAMENTO') || 
    upperGroup.includes('4K') || 
    upperGroup.includes('ANIMACAO') || 
    upperGroup.includes('ANIMAÇÃO') ||
    upperGroup.includes('TERROR') ||
    upperGroup.includes('SUSPENSE') ||
    upperGroup.includes('ACAO') ||
    upperGroup.includes('AÇÃO');

  if (isMovieGroup) {
    return {
      type: 'movie',
      cleanTitle: rawTitle,
    };
  }

  const isChannelGroup = 
    upperGroup.includes('CANAL') || 
    upperGroup.includes('CANAIS') || 
    upperGroup.includes('AO VIVO') || 
    upperGroup.includes('LIVE') || 
    upperGroup.includes('ABERTO') || 
    upperGroup.includes('NOTICIA') || 
    upperGroup.includes('NOTÍCIA') || 
    upperGroup.includes('ESPORTE') || 
    upperGroup.includes('24H') || 
    upperGroup.includes('IPTV') ||
    upperGroup.includes('INFANTIL') ||
    upperGroup.includes('DOCUMENTARIOS');

  if (isChannelGroup) {
    return {
      type: 'channel',
      cleanTitle: rawTitle,
    };
  }

  // 3. File extension & URL Heuristics
  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mkv') || lowerUrl.endsWith('.avi')) {
    return {
      type: 'movie',
      cleanTitle: rawTitle,
    };
  }

  // Default fallback is channel
  return {
    type: 'channel',
    cleanTitle: rawTitle,
  };
}

/**
 * Groups series items into structured Series -> Seasons -> Episodes
 */
export function groupCloudSeries(items: CloudMediaItem[]): CloudSeriesGroup[] {
  const seriesItems = items.filter((item) => item.type === 'series');
  const seriesMap: Map<string, CloudSeriesGroup> = new Map();

  for (const item of seriesItems) {
    const rawSeriesTitle = (item.seriesTitle || item.title).trim();
    // Normalize series key
    const normalizedKey = rawSeriesTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!seriesMap.has(normalizedKey)) {
      seriesMap.set(normalizedKey, {
        id: `series-${item.sourceId}-${normalizedKey}`,
        title: rawSeriesTitle,
        group: item.group,
        logo: item.logo,
        sourceId: item.sourceId,
        seasons: [],
        totalEpisodes: 0,
      });
    }

    const series = seriesMap.get(normalizedKey)!;
    const seasonNum = item.season || 1;
    const episodeNum = item.episode || 1;

    let season = series.seasons.find((s) => s.seasonNumber === seasonNum);
    if (!season) {
      season = {
        seasonNumber: seasonNum,
        episodes: [],
      };
      series.seasons.push(season);
    }

    season.episodes.push({
      id: item.id,
      episodeNumber: episodeNum,
      title: item.title,
      streamUrl: item.streamUrl,
      logo: item.logo,
    });

    series.totalEpisodes += 1;
  }

  // Sort seasons and episodes numerically
  const result = Array.from(seriesMap.values());
  for (const series of result) {
    series.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    for (const season of series.seasons) {
      season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    }
  }

  // Sort series alphabetically
  result.sort((a, b) => a.title.localeCompare(b.title));

  return result;
}

/**
 * Sample Demo M3U Playlist for instant testing of Nuvem features
 */
export const SAMPLE_DEMO_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="tvbrasil" tvg-name="TV Brasil" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/TV_Brasil_logo_2023.svg/320px-TV_Brasil_logo_2023.svg.png" group-title="Canais Abertos",TV Brasil HD
https://tvbrasil-live.ebc.com.br/hls/tvbrasil/index.m3u8

#EXTINF:-1 tvg-id="cultura" tvg-name="TV Cultura" tvg-logo="https://upload.wikimedia.org/wikipedia/pt/thumb/d/d4/Logotipo_da_TV_Cultura.svg/320px-Logotipo_da_TV_Cultura.svg.png" group-title="Canais Abertos",TV Cultura
https://stream.tvbrasil.ebc.com.br/hls/tvbrasil/index.m3u8

#EXTINF:-1 tvg-id="nasatv" tvg-name="NASA TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png" group-title="Notícias & Ciência",NASA TV Public Channel (Ao Vivo)
https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8

#EXTINF:-1 tvg-id="redbull" tvg-name="Red Bull TV" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Red_Bull_TV_logo.svg/320px-Red_Bull_TV_logo.svg.png" group-title="Esportes & Aventura",Red Bull TV Live
https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8

#EXTINF:-1 tvg-id="dw" tvg-name="DW Brasil" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_logo.svg/320px-Deutsche_Welle_logo.svg.png" group-title="Notícias & Mundo",DW Português (Documentários)
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8

#EXTINF:-1 tvg-id="nosferatu1922" tvg-name="Nosferatu" tvg-logo="https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=600&q=80" group-title="Filmes de Culto & Terror",Nosferatu (1922) - Versão Restaurada HD
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

#EXTINF:-1 tvg-id="nightdead" tvg-name="A Noite dos Mortos-Vivos" tvg-logo="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" group-title="Filmes de Culto & Terror",A Noite dos Mortos-Vivos (1968)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4

#EXTINF:-1 tvg-id="sintel" tvg-name="Sintel - A Jornada" tvg-logo="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80" group-title="Filmes de Fantasia",Sintel - O Dragão e o Destino (4K)
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4

#EXTINF:-1 tvg-id="twilightzone" tvg-name="Além da Imaginação" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" group-title="Séries de Suspense",Além da Imaginação S01E01 - Onde Estão Todos?
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4

#EXTINF:-1 tvg-id="twilightzone2" tvg-name="Além da Imaginação" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" group-title="Séries de Suspense",Além da Imaginação S01E02 - Um por Um
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4

#EXTINF:-1 tvg-id="twilightzone3" tvg-name="Além da Imaginação" tvg-logo="https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80" group-title="Séries de Suspense",Além da Imaginação S02E01 - O Homem no Castelo
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4
`;
