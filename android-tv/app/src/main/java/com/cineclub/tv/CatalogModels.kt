package com.cineclub.tv

import android.content.Context
import org.json.JSONArray


data class CatalogLink(
    val label: String,
    val provider: String,
    val season: Int? = null,
    val episode: Int? = null,
    val url: String,
)

data class CatalogItem(
    val id: String,
    val title: String,
    val posterUrl: String,
    val heroUrl: String?,
    val type: String,
    val rating: Double,
    val year: String,
    val genres: List<String>,
    val catalogCategory: String,
    val durationOrSeasons: String,
    val ageRating: String,
    val synopsis: String,
    val originalTitle: String?,
    val directorOrCreator: String?,
    val cast: List<String>,
    val accessLinks: List<CatalogLink>,
)

object CatalogRepository {
    fun load(context: Context): List<CatalogItem> {
        return runCatching {
            val json = context.assets.open("catalog.json").bufferedReader().use { it.readText() }
            parse(JSONArray(json))
        }.getOrDefault(emptyList())
    }

    private fun parse(array: JSONArray): List<CatalogItem> = buildList {
        for (index in 0 until array.length()) {
            val item = array.getJSONObject(index)
            val genres = item.optJSONArray("genres").toStringList()
            val cast = item.optJSONArray("cast").toStringList()
            val links = item.optJSONArray("accessLinks").let { linksJson ->
                buildList {
                    if (linksJson != null) for (linkIndex in 0 until linksJson.length()) {
                        val link = linksJson.getJSONObject(linkIndex)
                        add(CatalogLink(
                            label = link.optString("label", "Abrir conteúdo"),
                            provider = link.optString("provider", "link"),
                            season = link.optIntOrNull("season"),
                            episode = link.optIntOrNull("episode"),
                            url = link.optString("url"),
                        ))
                    }
                }
            }
            add(CatalogItem(
                id = item.optString("id"),
                title = item.optString("title", "Sem título"),
                posterUrl = item.optString("posterUrl"),
                heroUrl = item.optString("heroUrl").ifBlank { null },
                type = item.optString("type", "Filme"),
                rating = item.optDouble("rating", 0.0),
                year = item.optString("year"),
                genres = genres,
                catalogCategory = item.optString("catalogCategory", "catalogo"),
                durationOrSeasons = item.optString("durationOrSeasons"),
                ageRating = item.optString("ageRating"),
                synopsis = item.optString("synopsis"),
                originalTitle = item.optString("originalTitle").ifBlank { null },
                directorOrCreator = item.optString("directorOrCreator").ifBlank { null },
                cast = cast,
                accessLinks = links,
            ))
        }
    }

    private fun JSONArray?.toStringList(): List<String> {
        if (this == null) return emptyList()
        return buildList { for (index in 0 until length()) add(optString(index)) }
    }

    private fun org.json.JSONObject.optIntOrNull(key: String): Int? = if (has(key) && !isNull(key)) optInt(key) else null
}
