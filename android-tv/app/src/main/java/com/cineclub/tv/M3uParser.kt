package com.cineclub.tv

import java.net.URI
import java.net.URLDecoder
import java.util.Locale

data class M3uItem(
    val title: String,
    val streamUrl: String,
    val group: String,
    val type: ContentType,
    val logo: String? = null,
    val seriesTitle: String? = null,
    val season: Int? = null,
    val episode: Int? = null,
)

enum class ContentType { CHANNEL, MOVIE, SERIES }

object M3uParser {
    private val seriesWords = listOf("SERIE", "SÉRIE", "SERIES", "SEASON", "TEMPORADA", "NOVELA", "ANIME", "DORAMA")
    private val movieWords = listOf("FILME", "FILMES", "MOVIE", "MOVIES", "CINEMA", "VOD", "LANÇAMENTO", "LANCAMENTO")
    private val channelWords = listOf("CANAL", "CANAIS", "AO VIVO", "LIVE", "ABERTO", "NOTÍCIA", "ESPORTE", "SPORT", "24H", "IPTV", "RÁDIO", "RADIO")

    fun parse(content: String, playlistUrl: String? = null): List<M3uItem> {
        val lines = content.replace("\uFEFF", "").replace("\r\n", "\n").replace('\r', '\n').lines()
        val result = mutableListOf<M3uItem>()
        val seen = HashSet<String>()
        var extInf: ExtInf? = null
        var group = ""
        var attributes = emptyMap<String, String>()
        var mediaPlaylist = false

        for (raw in lines) {
            val line = raw.trim()
            if (line.isEmpty()) continue
            if (line.startsWith("#EXT-X-TARGETDURATION") || line.startsWith("#EXT-X-MEDIA-SEQUENCE")) {
                mediaPlaylist = true
                continue
            }
            when {
                line.startsWith("#EXTINF:", ignoreCase = true) -> {
                    extInf = parseExtInf(line.substringAfter(':'))
                    attributes = extInf?.attributes.orEmpty()
                }
                line.startsWith("#EXTGRP:", ignoreCase = true) -> group = line.substringAfter(':').clean()
                line.startsWith("#EXTVLCOPT:", ignoreCase = true) || line.startsWith("#KODIPROP:", ignoreCase = true) -> Unit
                line.startsWith("#") -> Unit
                else -> {
                    val streamUrl = resolveUrl(line, playlistUrl)
                    if (!isStreamUrl(streamUrl) || (mediaPlaylist && extInf == null)) {
                        extInf = null; group = ""; attributes = emptyMap(); continue
                    }
                    val title = (extInf?.title ?: inferTitle(streamUrl)).clean().ifBlank { "Transmissão ${result.size + 1}" }
                    val actualGroup = (group.ifBlank { attributes["group-title"] ?: attributes["group"] ?: attributes["category"] ?: "Geral" }).clean()
                    val series = detectSeries(title, actualGroup, attributes, streamUrl)
                    val type = detectType(title, actualGroup, attributes, streamUrl, series)
                    val displayTitle = series?.episodeTitle ?: cleanDisplayTitle(title)
                    val item = M3uItem(displayTitle, streamUrl, actualGroup, type, attributes.firstLogo(), series?.seriesTitle, series?.season, series?.episode)
                    val key = "${item.title.normalizeKey()}|${item.streamUrl.lowercase(Locale.ROOT)}"
                    if (seen.add(key)) result += item
                    extInf = null; group = ""; attributes = emptyMap()
                }
            }
        }
        return result
    }

    private data class ExtInf(val title: String, val attributes: Map<String, String>)
    private data class Series(val seriesTitle: String, val season: Int, val episode: Int, val episodeTitle: String)

    private fun parseExtInf(body: String): ExtInf {
        val comma = findSeparator(body)
        val metadata = if (comma >= 0) body.substring(0, comma) else body
        val title = if (comma >= 0) body.substring(comma + 1) else ""
        val attrs = Regex("([\\w:-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s]+))").findAll(metadata)
            .associate { it.groupValues[1].lowercase(Locale.ROOT) to (it.groupValues[2].ifBlank { it.groupValues[3].ifBlank { it.groupValues[4] } }).clean() }
        return ExtInf(title.clean().ifBlank { attrs["tvg-name"].orEmpty() }, attrs)
    }

    private fun findSeparator(value: String): Int {
        var quote: Char? = null
        value.forEachIndexed { index, char ->
            if ((char == '"' || char == '\'') && (index == 0 || value[index - 1] != '\\')) quote = if (quote == char) null else quote ?: char
            else if (char == ',' && quote == null) return index
        }
        return -1
    }

    private fun detectSeries(title: String, group: String, attrs: Map<String, String>, url: String): Series? {
        val clean = title.replace(Regex("[\\[\\]{}]"), " ").replace(Regex("\\s+"), " ").trim()
        val patterns = listOf(
            Regex("^(.*?)\\s*[\\[( -]?\\s*[Ss](\\d{1,2})\\s*[-_. ]?[Ee](\\d{1,3})(?:\\s*[-_.: ]?\\s*(.*))?$", RegexOption.IGNORE_CASE),
            Regex("^(.*?)\\s*[\\[( -]?\\s*(\\d{1,2})[xX](\\d{1,3})(?:\\s*[-_.: ]?\\s*(.*))?$", RegexOption.IGNORE_CASE),
            Regex("^(.*?)\\s*[\\[( -]?\\s*(?:Temporada|Season|Temp)\\s*(\\d{1,2})\\s*[-_.: ]?\\s*(?:Episódio|Episodio|Episode|Ep|Cap)\\s*(\\d{1,3})(?:\\s*[-_.: ]?\\s*(.*))?$", RegexOption.IGNORE_CASE),
        )
        for (pattern in patterns) {
            val m = pattern.matchEntire(clean) ?: continue
            return Series(m.groupValues[1].cleanSeries(), m.groupValues[2].toInt(), m.groupValues[3].toInt(), m.groupValues.getOrNull(4).orEmpty().cleanEpisode().ifBlank { "Episódio ${m.groupValues[3]}" })
        }
        val season = attrs["season"]?.toIntOrNull() ?: attrs["season-number"]?.toIntOrNull() ?: attrs["tvg-season"]?.toIntOrNull()
        val episode = attrs["episode"]?.toIntOrNull() ?: attrs["episode-number"]?.toIntOrNull() ?: attrs["tvg-episode"]?.toIntOrNull()
        if (season != null || episode != null) return Series((attrs["series-title"] ?: attrs["tvg-name"] ?: title).cleanSeries(), season ?: 1, episode ?: 1, title.cleanEpisode())
        val path = Regex("[\\/]s(\\d{1,2})[ex](\\d{1,3})[\\/]", RegexOption.IGNORE_CASE).find(url)
        if (path != null) return Series((attrs["series-title"] ?: attrs["tvg-name"] ?: title).cleanSeries(), path.groupValues[1].toInt(), path.groupValues[2].toInt(), title.cleanEpisode())
        if (seriesWords.any { group.normalizeKey().contains(it.normalizeKey()) }) return Series(title.cleanSeries(), 1, 1, title.cleanEpisode())
        return null
    }

    private fun detectType(title: String, group: String, attrs: Map<String, String>, url: String, series: Series?): ContentType {
        if (series != null) return ContentType.SERIES
        val explicit = (attrs["tvg-type"] ?: attrs["type"] ?: attrs["content-type"]).orEmpty().normalizeKey()
        if (explicit.contains("movie") || explicit.contains("filme") || explicit.contains("vod")) return ContentType.MOVIE
        if (explicit.contains("series") || explicit.contains("serie") || explicit.contains("show")) return ContentType.SERIES
        if (explicit.contains("channel") || explicit.contains("live") || explicit.contains("canal")) return ContentType.CHANNEL
        val g = group.normalizeKey()
        if (movieWords.any { g.contains(it.normalizeKey()) }) return ContentType.MOVIE
        if (seriesWords.any { g.contains(it.normalizeKey()) }) return ContentType.SERIES
        if (channelWords.any { g.contains(it.normalizeKey()) }) return ContentType.CHANNEL
        val extension = url.substringBefore('?').lowercase(Locale.ROOT)
        if (extension.matches(Regex(".*\\.(mp4|m4v|webm|mkv|avi|mov|wmv)$"))) return ContentType.MOVIE
        return ContentType.CHANNEL
    }

    private fun isStreamUrl(value: String) = value.matches(Regex("^(https?:)?//.+", RegexOption.IGNORE_CASE)) || value.matches(Regex("^(rtmp|rtsp|udp|p2p):.+", RegexOption.IGNORE_CASE))
    private fun resolveUrl(value: String, base: String?): String = if (base == null || value.matches(Regex("^(https?:|//).+", RegexOption.IGNORE_CASE))) value else runCatching { URI(base).resolve(value).toString() }.getOrDefault(value)
    private fun inferTitle(url: String): String = runCatching { URLDecoder.decode(URI(url).path.substringAfterLast('/').substringBeforeLast('.'), "UTF-8").replace(Regex("[._-]+"), " ").clean() }.getOrDefault("Transmissão")
    private fun cleanDisplayTitle(value: String) = value.replace(Regex("\\s*[|•]\\s*(?:4K|8K|FHD|HD|SD|H265|HEVC|Dublado|Legendado).*$", RegexOption.IGNORE_CASE), "").clean()
    private fun String.clean() = replace(Regex("\\s+"), " ").trim()
    private fun String.cleanSeries() = clean().replace(Regex("\\s*[|•-]\\s*(?:Série|Serie|Series|Temporada|Season).*$", RegexOption.IGNORE_CASE), "").clean().ifBlank { "Série" }
    private fun String.cleanEpisode() = clean().replace(Regex("^[-_.:| ]+"), "").ifBlank { "Episódio" }
    private fun String.normalizeKey() = lowercase(Locale.ROOT).replace(Regex("[áàãâä]"), "a").replace(Regex("[éèêë]"), "e").replace(Regex("[íìîï]"), "i").replace(Regex("[óòõôö]"), "o").replace(Regex("[úùûü]"), "u").replace(Regex("[^a-z0-9]+"), " ").trim()
    private fun Map<String, String>.firstLogo() = listOf("tvg-logo", "logo", "logo-url", "icon").mapNotNull { this[it] }.firstOrNull { it.isNotBlank() }
}
