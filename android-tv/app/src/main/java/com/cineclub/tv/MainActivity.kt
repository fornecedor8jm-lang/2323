package com.cineclub.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.net.http.SslError
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.Window
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var root: FrameLayout
    private lateinit var errorPanel: LinearLayout
    private val handler = Handler(Looper.getMainLooper())
    private val cineclubUrl = "https://2323-theta.vercel.app/?tv=1"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(11, 11, 16)) }
        webView = WebView(this)
        errorPanel = createErrorPanel()
        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        root.addView(errorPanel, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        configureWebView()
        loadCineclub()
    }

    private fun configureWebView() {
        webView.apply {
            isFocusable = true
            isFocusableInTouchMode = true
            requestFocus(View.FOCUS_DOWN)
            setBackgroundColor(Color.rgb(11, 11, 16))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
                builtInZoomControls = false
                displayZoomControls = false
                setSupportZoom(false)
                userAgentString = "$userAgentString CineclubTV/1.0"
            }
            CookieManager.getInstance().setAcceptCookie(true)
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    hideError()
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    hideError()
                    webView.requestFocus(View.FOCUS_DOWN)
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    if (request?.isForMainFrame != false) showError()
                }

                override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                    handler?.cancel()
                    showError()
                }
            }
        }
    }

    private fun loadCineclub() {
        hideError()
        webView.loadUrl(cineclubUrl)
    }

    private fun createErrorPanel(): LinearLayout {
        val title = TextView(this).apply {
            text = "Não foi possível conectar ao Cineclub"
            textSize = 24f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        val message = TextView(this).apply {
            text = "Verifique a internet da TV e tente novamente."
            textSize = 16f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
            setPadding(0, 18, 0, 28)
        }
        val retry = Button(this).apply {
            text = "Tentar novamente"
            isFocusable = true
            isFocusableInTouchMode = true
            setOnClickListener { loadCineclub() }
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 24, 48, 24)
            addView(title, LinearLayout.LayoutParams(-1, -2))
            addView(message, LinearLayout.LayoutParams(-1, -2))
            addView(retry, LinearLayout.LayoutParams(-2, -2))
            visibility = View.GONE
        }
    }

    private fun showError() {
        handler.post { errorPanel.visibility = View.VISIBLE }
    }

    private fun hideError() {
        handler.post { errorPanel.visibility = View.GONE }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }
}
