import assert from 'node:assert/strict';
import { parseM3U, groupCloudSeries, isTvCompatibleStream } from '../src/utils/m3uParser';

const sample = `\uFEFF#EXTM3U
#EXTGRP: Canais Brasil
#EXTINF:-1 tvg-id="canal-1" tvg-logo='https://example.com/logo.png' group-title="Ignorado",Canal Brasil HD
https://example.com/live/channel.m3u8
#EXTINF:-1 tvg-name="Filme Teste" type="movie" group-title="VOD Filmes",Filme Teste (2025) | 4K
https://example.com/filmes/filme-teste.mp4
#EXTINF:-1 group-title="Séries" series-title="A Série",A Série S02E03 - O Retorno
https://example.com/series/a-serie/s02e03.mp4
#EXTINF:-1 group-title="Séries" series-title="A Série",A Série 2x04 - A Chegada
https://example.com/series/a-serie/s02e04.mp4
#EXTINF:-1 group-title="Séries" series-title="A Série",A Série S02E03 - O Retorno
https://example.com/series/a-serie/s02e03.mp4
`;

const items = parseM3U(sample, 'test-source');
assert.equal(items.length, 4, 'deve remover apenas a entrada duplicada');
assert.equal(items[0].type, 'channel');
assert.equal(items[0].group, 'Canais Brasil');
assert.equal(items[0].logo, 'https://example.com/logo.png');
assert.equal(items[1].type, 'movie');
assert.equal(items[2].type, 'series');
assert.equal(items[2].season, 2);
assert.equal(items[2].episode, 3);
assert.equal(items[3].season, 2);
assert.equal(items[3].episode, 4);

const groups = groupCloudSeries(items);
assert.equal(groups.length, 1);
assert.equal(groups[0].title, 'A Série');
assert.equal(groups[0].seasons[0].seasonNumber, 2);
assert.deepEqual(groups[0].seasons[0].episodes.map((episode) => episode.episodeNumber), [3, 4]);

const relative = parseM3U('#EXTM3U\n#EXTINF:-1,Canal\nstreams/live.m3u8', 'relative', 'https://example.com/lists/catalog.m3u');
assert.equal(relative[0].streamUrl, 'https://example.com/lists/streams/live.m3u8');

const standalone = parseM3U('#EXTM3U\nhttps://example.com/live.m3u8', 'standalone');
assert.equal(standalone.length, 1);
assert.equal(standalone[0].type, 'channel');

assert.equal(isTvCompatibleStream('https://example.com/live/master.m3u8'), true);
assert.equal(isTvCompatibleStream('https://example.com/video/movie.mp4'), true);
assert.equal(isTvCompatibleStream('rtsp://example.com/live'), false);
assert.equal(isTvCompatibleStream('rtmp://example.com/live'), false);
assert.equal(isTvCompatibleStream('https://example.com/video/movie.mkv'), false);
assert.equal(isTvCompatibleStream('https://example.com/video/segment.ts'), false);

console.log('M3U parser and Android TV compatibility tests passed:', items.length, 'items;', groups.length, 'series.');
