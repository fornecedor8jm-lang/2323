
# Primeira versão Android TV

- [x] Estrutura de build compilável para Android TV
- [x] Interface nativa sem WebView
- [x] Importação de playlist por URL e arquivo
- [x] Parser M3U/M3U8 com canais, filmes e séries
- [x] Player Media3 em tela cheia
- [x] Navegação por controle remoto e botão Voltar
- [x] Validação e instruções para gerar o APK de teste

# Correção de abertura do APK

- [x] Adicionar categoria LAUNCHER sem remover LEANBACK_LAUNCHER
- [x] Gerar APK corrigido com abertura direta após instalação
- [x] Validar manifesto, assinatura e instruções de instalação

# Correção visual da primeira versão

- [x] Restaurar o catálogo principal Cineclub na tela inicial
- [x] Criar abas Filmes, Séries, Canais e Nuvem
- [x] Manter a configuração M3U dentro da aba Nuvem
- [x] Corrigir botões cortados e dimensionamento para tela de TV
- [x] Adicionar cards de conteúdo e foco visível para controle remoto
- [x] Gerar nova versão APK com visual de plataforma de streaming

# Portabilidade das funções do Cineclub

- [x] Portar tela inicial com destaque e adicionados recentemente
- [x] Portar navegação Filmes, Séries, Terror, Acervo e Sobre
- [x] Portar detalhes com pôster, sinopse, nota, ano, elenco e gêneros
- [x] Portar temporadas, episódios e links do acervo
- [x] Portar busca, filtros, ordenação e Minha Lista
- [x] Manter Nuvem M3U como aba complementar, não como tela principal
- [x] Remover aparência de IPTV genérico da versão Android TV

# Aproximação visual ao repositório

- [ ] Recriar cabeçalho visual do Cineclub com marca completa e navegação escura
- [ ] Adicionar hero/banner com pôster de destaque e informações do título
- [ ] Aplicar paleta, bordas, estados de foco e espaçamentos do site
- [ ] Trocar botões genéricos por controles visuais coerentes com streaming
- [ ] Corrigir a tela Nuvem para manter o mesmo acabamento do catálogo
- [ ] Gerar APK visualmente atualizado para novo teste na TV

# Ajuste da interface TV

- [ ] Exibir CINECLUB completo no cabeçalho
- [ ] Substituir botões Android padrão por componentes escuros do Cineclub
- [ ] Corrigir altura, padding e tipografia dos controles
- [ ] Criar estado vazio visual para a Nuvem
- [ ] Melhorar foco do controle remoto e destaque da aba ativa

# Referência de player

- [ ] Analisar vídeo de referência do Google Drive
- [ ] Documentar comportamento de tela cheia, controles e retorno
- [ ] Adaptar o player Media3 nativo ao comportamento observado

# Build solicitado pelo usuário

- [x] Revisar arquivos Android TV rastreados no repositório
- [x] Compilar todos os módulos e assets do APK
- [x] Validar assinatura e manifesto do APK gerado
- [x] Entregar o APK compilado ao usuário

# Migração da base cineclub-tv-android

- [x] Criar backup da base Android TV atual
- [x] Migrar catálogo, interface, player e Nuvem da versão privada
- [x] Preservar a regra sem WebView e o launcher Android TV
- [ ] Integrar QR Code, legendas e fallback de links externos
- [x] Compilar e validar o APK resultante
