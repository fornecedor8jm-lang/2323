package com.cineclub.tv

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.Window
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : Activity() {
    private lateinit var root: FrameLayout
    private lateinit var contentList: LinearLayout
    private lateinit var status: TextView
    private var items: List<M3uItem> = emptyList()
    private var selectedType: ContentType? = null
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val fileRequestCode = 4101

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN)
        showCatalog()
    }

    private fun showCatalog() {
        root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(10, 11, 16)) }
        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 32, 48, 28)
        }
        val title = TextView(this).apply {
            text = "CINECLUB"
            textSize = 30f
            setTextColor(Color.WHITE)
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        val subtitle = TextView(this).apply {
            text = "Nuvem M3U — catálogo pessoal"
            textSize = 17f
            setTextColor(Color.LTGRAY)
            setPadding(0, 4, 0, 20)
        }
        val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        actions.addView(tvButton("Adicionar URL") { askForPlaylistUrl() })
        actions.addView(tvButton("Abrir arquivo") { openPlaylistFile() })
        actions.addView(tvButton("Todos") { selectedType = null; renderItems() })
        actions.addView(tvButton("Canais") { selectedType = ContentType.CHANNEL; renderItems() })
        actions.addView(tvButton("Filmes") { selectedType = ContentType.MOVIE; renderItems() })
        actions.addView(tvButton("Séries") { selectedType = ContentType.SERIES; renderItems() })
        status = TextView(this).apply {
            text = "Adicione uma lista M3U ou M3U8 para começar."
            textSize = 16f
            setTextColor(Color.rgb(190, 190, 200))
            setPadding(0, 20, 0, 14)
        }
        contentList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val scroll = ScrollView(this).apply { addView(contentList) }
        page.addView(title)
        page.addView(subtitle)
        page.addView(actions)
        page.addView(status)
        page.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        root.addView(page)
        setContentView(root)
        renderItems()
    }

    private fun tvButton(label: String, action: () -> Unit): Button = Button(this).apply {
        text = label
        isFocusable = true
        isFocusableInTouchMode = true
        setOnClickListener { action() }
        val params = LinearLayout.LayoutParams(-2, 58)
        params.setMargins(0, 0, 10, 0)
        layoutParams = params
    }

    private fun askForPlaylistUrl() {
        val input = EditText(this).apply {
            hint = "https://servidor.exemplo/lista.m3u8"
            setSingleLine(true)
            setTextColor(Color.WHITE)
            setHintTextColor(Color.GRAY)
        }
        AlertDialog.Builder(this)
            .setTitle("Adicionar Nuvem M3U")
            .setMessage("Cole a URL completa da lista. O Cineclub aceita M3U e M3U8.")
            .setView(input)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Importar") { _, _ -> importFromUrl(input.text.toString().trim()) }
            .show()
    }

    private fun openPlaylistFile() {
        startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }, fileRequestCode)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != fileRequestCode || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        Thread {
            val content = runCatching { contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() } }.getOrNull()
            mainHandler.post { if (content.isNullOrBlank()) showStatus("Não foi possível ler o arquivo.") else applyPlaylist(content, uri.toString()) }
        }.start()
    }

    private fun importFromUrl(url: String) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            showStatus("Informe uma URL HTTP ou HTTPS válida.")
            return
        }
        showStatus("Baixando a lista…")
        Thread {
            val content = runCatching {
                (URL(url).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 15000
                    readTimeout = 30000
                    requestMethod = "GET"
                    setRequestProperty("User-Agent", "CineclubTV/1.0")
                }.let { connection ->
                    if (connection.responseCode !in 200..299) error("HTTP ${connection.responseCode}")
                    connection.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                }
            }.getOrNull()
            mainHandler.post { if (content.isNullOrBlank()) showStatus("Falha ao buscar a lista. Verifique a URL e o acesso do servidor.") else applyPlaylist(content, url) }
        }.start()
    }

    private fun applyPlaylist(content: String, sourceUrl: String?) {
        val parsed = runCatching { M3uParser.parse(content, sourceUrl) }.getOrNull().orEmpty().toMutableList()
        if (parsed.isEmpty() && sourceUrl != null && sourceUrl.substringBefore('?').lowercase().endsWith(".m3u8")) {
            parsed += M3uItem(sourceUrl.substringAfterLast('/').substringBefore('?').ifBlank { "Canal M3U8" }, sourceUrl, "M3U8", ContentType.CHANNEL)
        }
        items = parsed
        selectedType = null
        status.text = if (parsed.isEmpty()) "Lista lida, mas nenhum stream válido foi encontrado." else "${parsed.size} itens importados."
        renderItems()
    }

    private fun renderItems() {
        if (!::contentList.isInitialized) return
        contentList.removeAllViews()
        val visible = selectedType?.let { type -> items.filter { it.type == type } } ?: items
        if (visible.isEmpty()) {
            contentList.addView(TextView(this).apply {
                text = "Nenhum conteúdo nesta categoria."
                textSize = 18f
                setTextColor(Color.LTGRAY)
                setPadding(0, 20, 0, 20)
            })
            return
        }
        visible.take(500).forEach { item ->
            val row = TextView(this).apply {
                text = "${typeLabel(item.type)}  ${item.title}${if (item.type == ContentType.SERIES) "  • T${item.season ?: 1} E${item.episode ?: 1}" else ""}\n${item.group}"
                textSize = 18f
                setTextColor(Color.WHITE)
                setPadding(22, 16, 22, 16)
                isFocusable = true
                isFocusableInTouchMode = true
                setOnClickListener { play(item) }
                setOnFocusChangeListener { view, focused -> view.setBackgroundColor(if (focused) Color.rgb(90, 45, 55) else Color.TRANSPARENT) }
            }
            contentList.addView(row, LinearLayout.LayoutParams(-1, 82))
        }
    }

    private fun typeLabel(type: ContentType) = when (type) {
        ContentType.CHANNEL -> "CANAL"
        ContentType.MOVIE -> "FILME"
        ContentType.SERIES -> "SÉRIE"
    }

    private fun play(item: M3uItem) {
        player?.release()
        player = ExoPlayer.Builder(this).build().also { exo ->
            exo.setMediaItem(MediaItem.fromUri(Uri.parse(item.streamUrl)))
            exo.prepare()
            exo.playWhenReady = true
        }
        playerView = PlayerView(this).apply {
            useController = true
            player = this@MainActivity.player
            setBackgroundColor(Color.BLACK)
            requestFocus()
        }
        setContentView(playerView)
        hideSystemUi()
    }

    private fun hideSystemUi() {
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)
    }

    private fun showStatus(message: String) {
        if (::status.isInitialized) status.text = message
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && playerView != null) {
            player?.release()
            player = null
            playerView = null
            showCatalog()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        player?.release()
        player = null
        super.onDestroy()
    }
}
