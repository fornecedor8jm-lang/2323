# Cineclub TV — casca nativa Android TV

Este módulo gera o aplicativo nativo **Cineclub TV**. A interface é construída com views Android e o player usa AndroidX Media3/ExoPlayer; **não existe WebView no fluxo do aplicativo**. O conteúdo M3U/M3U8 é baixado, interpretado e reproduzido diretamente no dispositivo, com a tela do player ocupando a área inteira da TV.

A atividade foi preparada para televisores e dispositivos Android TV com `LEANBACK_LAUNCHER`, orientação horizontal, foco navegável pelo controle remoto, importação por URL ou arquivo e botão Voltar para sair do player e retornar ao catálogo. O parser separa canais, filmes e séries, aceita atributos `tvg-*`, grupos, URLs relativas e padrões de temporada/episódio.

## Compilação

Abra a pasta `android-tv/` no Android Studio recente, aceite a instalação do Android SDK Platform 35 e deixe o Gradle sincronizar. Em seguida, use **Build > Build APK(s)** ou execute no terminal:

```bash
./gradlew assembleDebug
```

O APK de teste será criado em `app/build/outputs/apk/debug/app-debug.apk`. Para uma versão de distribuição, escolha **Build > Generate Signed App Bundle / APK** e use uma chave de assinatura própria.

O ambiente deste repositório pode não conter o Android SDK ou o Gradle Wrapper. Nesse caso, a compilação deve ser feita no Android Studio ou em uma máquina com Android SDK 35, JDK 17 e Gradle Wrapper gerado pelo próprio Android Studio.

## Teste em Android TV

Instale o APK em um emulador Android TV ou dispositivo físico com `adb install -r app-debug.apk`. Ao abrir o Cineclub TV, a tela inicial carrega o site publicado em modo TV. O controle direcional movimenta o foco dos elementos HTML; **OK/Enter** ativa o item focado; **Voltar** retorna à página anterior e, na tela inicial, encerra a atividade.

## Atualização do endereço web

A versão Android TV não depende de endereço web para abrir a interface. Para alterar a lógica, edite `MainActivity.kt` e `M3uParser.kt`; a URL informada pelo usuário é a própria fonte M3U/M3U8 e é reproduzida pelo player nativo.
