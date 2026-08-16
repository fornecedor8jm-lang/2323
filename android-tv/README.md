# Cineclub TV — casca nativa Android TV

Este módulo gera o aplicativo nativo **Cineclub TV**. Ele não duplica o catálogo nem o player: a atividade abre a versão web publicada em `https://2323-theta.vercel.app/?tv=1`, permitindo que atualizações da interface e da integração M3U sejam publicadas no site sem exigir uma nova instalação do APK.

A atividade foi preparada para televisores e dispositivos Android TV com `LEANBACK_LAUNCHER`, orientação horizontal, foco navegável pelo controle remoto, botão Voltar com histórico do WebView e painel de erro com tentativa de reconexão. O tráfego da aplicação é HTTPS; URLs HTTP de listas M3U continuam sendo tratadas pela lógica da versão web, não pelo shell nativo.

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

Para apontar a casca para outro ambiente, altere a constante `cineclubUrl` em `app/src/main/java/com/cineclub/tv/MainActivity.kt`, mantendo o parâmetro `?tv=1` para ativar os ajustes de interface voltados a televisão.
