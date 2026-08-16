package com.cineclub.tv

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
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
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private lateinit var root: FrameLayout
    private lateinit var page: LinearLayout
    private var catalog = emptyList<CatalogItem>()
    private var cloudItems = emptyList<M3uItem>()
    private var currentTab = "home"
    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val imageExecutor = Executors.newFixedThreadPool(4)
    private val fileRequestCode = 4101
    private val prefs by lazy { getSharedPreferences("cineclub", Context.MODE_PRIVATE) }

    private val bg = Color.rgb(8, 10, 14)
    private val surface = Color.rgb(20, 23, 30)
    private val accent = Color.rgb(220, 92, 98)
    private val textColor = Color.rgb(246, 243, 238)
    private val muted = Color.rgb(164, 169, 180)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN)
        catalog = CatalogRepository.load(this)
        showHome()
        CatalogRepository.refreshRemote { remote ->
            if (!remote.isNullOrEmpty()) mainHandler.post { catalog = remote; renderTab() }
        }
    }

    private fun showHome() {
        root = FrameLayout(this).apply { setBackgroundColor(bg) }
        page = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(48, 28, 48, 20) }
        root.addView(page, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)
        buildChrome()
        renderTab()
    }

    private fun buildChrome() {
        val header = LinearLayout(this).apply { gravity = Gravity.CENTER_VERTICAL }
        val brand = TextView(this).apply {
            text = "CINECLUB"
            textSize = 28f
            setTextColor(textColor)
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            letterSpacing = 0.10f
            gravity = Gravity.CENTER_VERTICAL
            includeFontPadding = false
        }
        header.addView(brand, LinearLayout.LayoutParams(170, 62))
        header.addView(navButton("Início", "home"))
        header.addView(navButton("Filmes", "movies"))
        header.addView(navButton("Séries", "series"))
        header.addView(navButton("Terror", "terror"))
        header.addView(navButton("Acervo", "catalog"))
        header.addView(navButton("Nuvem", "cloud"))
        header.addView(navButton("Minha lista", "watchlist"))
        header.addView(navButton("Sobre", "about"))
        page.addView(header)
        val divider = View(this).apply { setBackgroundColor(Color.rgb(45, 48, 58)) }
        page.addView(divider, LinearLayout.LayoutParams(-1, 1))
    }

    private fun navButton(label: String, tab: String) = Button(this).apply {
        text = label
        textSize = 15f
        isAllCaps = false
        minHeight = 0
        minWidth = 0
        stateListAnimator = null
        includeFontPadding = false
        setPadding(20, 0, 20, 0)
        setTextColor(if (currentTab == tab) textColor else muted)
        background = cineclubButtonBackground(false)
        setOnFocusChangeListener { view, focused -> view.background = cineclubButtonBackground(focused) }
        setOnClickListener { currentTab = tab; renderTab() }
        val params = LinearLayout.LayoutParams(-2, 54)
        params.setMargins(4, 4, 4, 4)
        layoutParams = params
    }

    private fun cineclubButtonBackground(active: Boolean): GradientDrawable = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = 8f
        setColor(if (active) Color.rgb(125, 38, 48) else Color.rgb(25, 29, 38))
        setStroke(1, if (active) Color.rgb(223, 91, 100) else Color.rgb(62, 67, 78))
    }

    private fun renderTab() {
        while (page.childCount > 2) page.removeViewAt(2)
        val content = when (currentTab) {
            "movies" -> catalogPage("Filmes", catalog.filter { it.type.equals("Filme", true) })
            "series" -> catalogPage("Séries", catalog.filter { it.type.equals("Série", true) })
            "terror" -> catalogPage("Terror", catalog.filter { it.genres.any { genre -> genre.contains("terror", true) } })
            "catalog" -> catalogPage("Acervo", catalog)
            "watchlist" -> catalogPage("Minha lista", catalog.filter { prefs.getBoolean("saved_${it.id}", false) })
            "cloud" -> cloudPage()
            "about" -> aboutPage()
            else -> homePage()
        }
        page.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
    }

    private fun homePage(): View {
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val featured = catalog.firstOrNull { it.id == "the-boys" } ?: catalog.firstOrNull()
        if (featured != null) content.addView(hero(featured))
        addSection(content, "Adicionados recentemente", "Novos títulos no catálogo Cineclub", catalog.takeLast(10).reversed())
        addSection(content, "Para maratonar", "Séries e histórias para assistir em sequência", catalog.filter { it.type.equals("Série", true) }.take(10))
        addSection(content, "Filmes", "Filmes do acervo Cineclub", catalog.filter { it.type.equals("Filme", true) }.take(10))
        return scroll(content)
    }

    private fun catalogPage(title: String, items: List<CatalogItem>): View {
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val heading = TextView(this).apply { text = title; textSize = 30f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD); setPadding(0, 22, 0, 10) }
        content.addView(heading)
        val search = Button(this).apply { text = "Buscar nesta seção"; isAllCaps = false; minHeight = 56; setOnClickListener { askSearch(items, title) } }
        content.addView(search, LinearLayout.LayoutParams(-2, 56))
        addSection(content, title, "${items.size} títulos disponíveis", items)
        return scroll(content)
    }

    private fun addSection(parent: LinearLayout, title: String, subtitle: String, items: List<CatalogItem>) {
        if (items.isEmpty()) return
        val heading = TextView(this).apply { text = title; textSize = 23f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD); setPadding(0, 24, 0, 2) }
        val sub = TextView(this).apply { text = subtitle; textSize = 15f; setTextColor(muted); setPadding(0, 0, 0, 10) }
        parent.addView(heading)
        parent.addView(sub)
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        items.forEach { row.addView(card(it)) }
        val horizontal = HorizontalScrollView(this).apply { isHorizontalScrollBarEnabled = false; addView(row) }
        parent.addView(horizontal, LinearLayout.LayoutParams(-1, 290))
    }

    private fun card(item: CatalogItem): View {
        val card = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; isFocusable = true; isFocusableInTouchMode = true; setPadding(4, 4, 12, 4) }
        val image = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; setBackgroundColor(surface); contentDescription = item.title }
        card.addView(image, LinearLayout.LayoutParams(150, 220))
        val title = TextView(this).apply { text = item.title; textSize = 14f; setTextColor(textColor); maxLines = 1; ellipsize = android.text.TextUtils.TruncateAt.END; setPadding(2, 6, 2, 0) }
        card.addView(title, LinearLayout.LayoutParams(150, 34))
        card.setOnFocusChangeListener { view, focused -> view.setBackgroundColor(if (focused) Color.rgb(64, 38, 45) else Color.TRANSPARENT) }
        card.setOnClickListener { showDetails(item) }
        loadImage(item.posterUrl, image, item.localPoster)
        return card
    }

    private fun hero(item: CatalogItem): View {
        val hero = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(0, 18, 0, 8) }
        val eyebrow = TextView(this).apply { text = "DESTAQUE CINECLUB"; textSize = 13f; setTextColor(accent); letterSpacing = 0.12f }
        val title = TextView(this).apply { text = item.title; textSize = 38f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD); setPadding(0, 4, 0, 2) }
        val meta = TextView(this).apply { text = "${item.type}  •  ${item.year}  •  ${item.ageRating}  •  IMDb ${item.rating}"; textSize = 16f; setTextColor(muted) }
        val synopsis = TextView(this).apply { text = item.synopsis; textSize = 16f; setTextColor(Color.rgb(205, 207, 214)); maxLines = 2; setPadding(0, 8, 0, 8) }
        val button = Button(this).apply { text = "Ver detalhes"; isAllCaps = false; minHeight = 58; setOnClickListener { showDetails(item) } }
        hero.addView(eyebrow); hero.addView(title); hero.addView(meta); hero.addView(synopsis); hero.addView(button, LinearLayout.LayoutParams(-2, 58))
        return hero
    }

    private fun showDetails(item: CatalogItem) {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(28, 18, 28, 12) }
        val poster = ImageView(this).apply { scaleType = ImageView.ScaleType.CENTER_CROP; setBackgroundColor(surface); contentDescription = item.title }
        box.addView(poster, LinearLayout.LayoutParams(120, 176))
        loadImage(item.posterUrl, poster, item.localPoster)
        val title = TextView(this).apply { text = item.title; textSize = 28f; setTextColor(Color.WHITE); setTypeface(typeface, Typeface.BOLD) }
        val meta = TextView(this).apply { text = "${item.type}  •  ${item.year}  •  ${item.ageRating}  •  IMDb ${item.rating}"; textSize = 15f; setTextColor(Color.LTGRAY); setPadding(0, 8, 0, 10) }
        val synopsis = TextView(this).apply { text = item.synopsis; textSize = 16f; setTextColor(Color.WHITE); setPadding(0, 4, 0, 10) }
        val save = Button(this).apply { text = if (prefs.getBoolean("saved_${item.id}", false)) "Remover da Minha lista" else "Adicionar à Minha lista"; isAllCaps = false; setOnClickListener { prefs.edit().putBoolean("saved_${item.id}", !prefs.getBoolean("saved_${item.id}", false)).apply(); dismissAndRefresh() } }
        box.addView(title); box.addView(meta); box.addView(synopsis); box.addView(save)
        item.accessLinks.take(12).forEach { link ->
            val open = Button(this).apply { text = link.label; isAllCaps = false; setOnClickListener { openExternal(link.url) } }
            box.addView(open)
        }
        AlertDialog.Builder(this).setView(box).setNegativeButton("Fechar", null).show()
    }

    private fun dismissAndRefresh() { renderTab() }

    private fun cloudPage(): View {
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(0, 18, 0, 0) }
        val title = TextView(this).apply { text = "Nuvem"; textSize = 30f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD) }
        val subtitle = TextView(this).apply { text = "Sua fonte pessoal de canais, filmes e séries M3U/M3U8"; textSize = 16f; setTextColor(muted); setPadding(0, 4, 0, 16) }
        val actions = LinearLayout(this)
        actions.addView(actionButton("Adicionar URL") { askForPlaylistUrl() })
        actions.addView(actionButton("Abrir arquivo") { openPlaylistFile() })
        content.addView(title); content.addView(subtitle); content.addView(actions)
        val count = TextView(this).apply { text = if (cloudItems.isEmpty()) "Nenhuma Nuvem adicionada" else "${cloudItems.size} itens na Nuvem"; textSize = 17f; setTextColor(Color.LTGRAY); setPadding(0, 20, 0, 12) }
        content.addView(count)
        if (cloudItems.isNotEmpty()) {
            addCloudSection(content, "Canais", ContentType.CHANNEL)
            addCloudSection(content, "Filmes", ContentType.MOVIE)
            addCloudSection(content, "Séries", ContentType.SERIES)
        }
        return scroll(content)
    }

    private fun addCloudSection(parent: LinearLayout, title: String, type: ContentType) {
        val items = cloudItems.filter { it.type == type }
        if (items.isEmpty()) return
        val heading = TextView(this).apply { text = title; textSize = 22f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD); setPadding(0, 18, 0, 6) }
        parent.addView(heading)
        items.take(100).forEach { item ->
            val row = Button(this).apply { text = item.title; isAllCaps = false; minHeight = 58; setOnClickListener { play(item.streamUrl, item.title) } }
            parent.addView(row, LinearLayout.LayoutParams(-1, 58))
        }
    }

    private fun aboutPage(): View {
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(0, 30, 0, 0) }
        content.addView(TextView(this).apply { text = "Sobre o Cineclub"; textSize = 30f; setTextColor(textColor); setTypeface(typeface, Typeface.BOLD) })
        content.addView(TextView(this).apply { text = "O Cineclub é uma plataforma de filmes e séries com catálogo próprio e uma Nuvem complementar para listas M3U/M3U8 do usuário.\n\nA Nuvem não substitui o catálogo Cineclub. Ela é apenas uma fonte adicional de conteúdo."; textSize = 18f; setTextColor(Color.LTGRAY); setPadding(0, 18, 0, 0) })
        return content
    }

    private fun actionButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        textSize = 16f
        isAllCaps = false
        minHeight = 0
        stateListAnimator = null
        includeFontPadding = false
        setTextColor(textColor)
        setPadding(26, 0, 26, 0)
        background = cineclubButtonBackground(false)
        setOnFocusChangeListener { view, focused -> view.background = cineclubButtonBackground(focused) }
        setOnClickListener { action() }
        layoutParams = LinearLayout.LayoutParams(-2, 64).apply { setMargins(0, 0, 14, 0) }
    }

    private fun askSearch(items: List<CatalogItem>, section: String) {
        val input = EditText(this).apply { hint = "Título, gênero ou ano"; setSingleLine(true) }
        AlertDialog.Builder(this).setTitle("Buscar em $section").setView(input).setNegativeButton("Cancelar", null).setPositiveButton("Buscar") { _, _ ->
            val query = input.text.toString().trim()
            val filtered = items.filter { it.title.contains(query, true) || it.genres.any { genre -> genre.contains(query, true) } || it.year.contains(query, true) }
            val result = catalogPage("Resultados", filtered)
            while (page.childCount > 2) page.removeViewAt(2)
            page.addView(result, LinearLayout.LayoutParams(-1, 0, 1f))
        }.show()
    }

    private fun openExternal(url: String) { runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }

    private fun scroll(view: View) = ScrollView(this).apply { isFillViewport = true; addView(view) }

    private fun loadImage(url: String, target: ImageView, localPoster: String? = null) {
        imageExecutor.execute {
            val bitmap = runCatching {
                val connection = URL(url).openConnection() as HttpURLConnection
                connection.connectTimeout = 10000; connection.readTimeout = 15000; connection.connect()
                connection.inputStream.use { BitmapFactory.decodeStream(it) }
            }.getOrNull() ?: localPoster?.let { assetName -> runCatching { assets.open("posters/$assetName").use { BitmapFactory.decodeStream(it) } }.getOrNull() }
            if (bitmap != null) mainHandler.post { target.setImageBitmap(bitmap) }
        }
    }

    private fun askForPlaylistUrl() {
        val input = EditText(this).apply { hint = "https://servidor.exemplo/lista.m3u8"; setSingleLine(true) }
        AlertDialog.Builder(this).setTitle("Adicionar Nuvem M3U").setMessage("Cole a URL completa da lista M3U ou M3U8.").setView(input).setNegativeButton("Cancelar", null).setPositiveButton("Importar") { _, _ -> importFromUrl(input.text.toString().trim()) }.show()
    }

    private fun openPlaylistFile() {
        startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*" }, fileRequestCode)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != fileRequestCode || resultCode != RESULT_OK) return
        val uri = data?.data ?: return
        Thread { val content = runCatching { contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() } }.getOrNull(); mainHandler.post { if (content != null) applyCloud(content, uri.toString()) } }.start()
    }

    private fun importFromUrl(url: String) {
        Thread {
            val content = runCatching { (URL(url).openConnection() as HttpURLConnection).apply { connectTimeout = 15000; readTimeout = 30000; setRequestProperty("User-Agent", "CineclubTV/1.0") }.let { it.inputStream.bufferedReader().use { reader -> reader.readText() } } }.getOrNull()
            mainHandler.post { if (content != null) applyCloud(content, url) }
        }.start()
    }

    private fun applyCloud(content: String, source: String?) { cloudItems = M3uParser.parse(content, source); currentTab = "cloud"; renderTab() }

    private fun play(streamUrl: String, title: String) {
        player?.release()
        player = ExoPlayer.Builder(this).build().also { it.setMediaItem(MediaItem.fromUri(streamUrl)); it.prepare(); it.playWhenReady = true }
        playerView = PlayerView(this).apply { player = this@MainActivity.player; useController = true; setBackgroundColor(Color.BLACK); contentDescription = title; requestFocus() }
        setContentView(playerView)
        window.decorView.systemUiVisibility = 5894
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && playerView != null) { player?.release(); player = null; playerView = null; showHome(); return true }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() { player?.release(); imageExecutor.shutdownNow(); super.onDestroy() }
}
