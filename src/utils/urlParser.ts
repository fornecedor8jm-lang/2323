/**
 * Intelligent URL & Xtream Parser & Masker for Cineclub Cloud
 */

export interface ParsedXtreamUrl {
  isXtream: boolean;
  server: string;
  protocol: string;
  username: string;
  password?: string;
  type: string;
  output?: string;
  cleanUrl: string;
  maskedUrl: string;
}

/**
 * Extracts Xtream / M3U parameters from a full URL and returns masked credentials
 */
export function parseM3uUrl(rawUrl: string): ParsedXtreamUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isXtream: false,
      server: '',
      protocol: 'http',
      username: '',
      type: 'm3u_plus',
      cleanUrl: '',
      maskedUrl: '',
    };
  }

  const trimmed = rawUrl.trim();

  try {
    const urlObj = new URL(trimmed);
    const protocol = urlObj.protocol.replace(':', '');
    const server = urlObj.host;
    const username = urlObj.searchParams.get('username') || urlObj.searchParams.get('user') || '';
    const password = urlObj.searchParams.get('password') || urlObj.searchParams.get('pass') || '';
    const type = urlObj.searchParams.get('type') || (trimmed.includes('.m3u8') ? 'm3u8' : 'm3u_plus');
    const output = urlObj.searchParams.get('output') || undefined;

    const isXtream = !!(username || password || trimmed.includes('get.php'));

    // Create masked URL safely hiding the password
    const maskedObj = new URL(trimmed);
    if (maskedObj.searchParams.has('password')) {
      maskedObj.searchParams.set('password', '••••••');
    }
    if (maskedObj.searchParams.has('pass')) {
      maskedObj.searchParams.set('pass', '••••••');
    }

    return {
      isXtream,
      server,
      protocol,
      username,
      password: password || undefined,
      type,
      output,
      cleanUrl: trimmed,
      maskedUrl: maskedObj.toString(),
    };
  } catch (e) {
    // If URL constructor fails, attempt regex fallback
    const userMatch = trimmed.match(/[?&](?:username|user)=([^&#]+)/i);
    const passMatch = trimmed.match(/[?&](?:password|pass)=([^&#]+)/i);
    const typeMatch = trimmed.match(/[?&]type=([^&#]+)/i);

    const username = userMatch ? decodeURIComponent(userMatch[1]) : '';
    const password = passMatch ? decodeURIComponent(passMatch[1]) : '';
    const type = typeMatch ? decodeURIComponent(typeMatch[1]) : 'm3u_plus';

    const maskedUrl = trimmed.replace(/([?&](?:password|pass)=)[^&#]+/i, '$1••••••');

    let server = '';
    const hostMatch = trimmed.match(/^https?:\/\/([^/?#]+)/i);
    if (hostMatch) {
      server = hostMatch[1];
    }

    return {
      isXtream: !!(username || password),
      server,
      protocol: trimmed.startsWith('https') ? 'https' : 'http',
      username,
      password: password || undefined,
      type,
      cleanUrl: trimmed,
      maskedUrl,
    };
  }
}

/**
 * Safely masks any password query parameter from an M3U / stream URL
 */
export function maskUrlPassword(url?: string): string {
  if (!url) return '';
  try {
    return url.replace(/([?&](?:password|pass)=)[^&#]+/gi, '$1••••••');
  } catch (e) {
    return url;
  }
}

/**
 * Builds a standardized Xtream M3U Plus URL from separate fields
 */
export function buildXtreamUrl(params: {
  server: string;
  username: string;
  password: string;
  protocol?: string;
  type?: string;
  output?: string;
}): string {
  const protocol = params.protocol || 'http';
  let server = params.server.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const username = encodeURIComponent(params.username.trim());
  const password = encodeURIComponent(params.password.trim());
  const type = params.type || 'm3u_plus';
  const output = params.output ? `&output=${encodeURIComponent(params.output)}` : '';

  return `${protocol}://${server}/get.php?username=${username}&password=${password}&type=${type}${output}`;
}
