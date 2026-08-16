# Cineclub 🎬

**Cineclub** é uma plataforma de streaming independente e catálogo interativo dedicado a filmes, séries, horror gótico, suspense sobrenatural e produções autorais. O projeto conta com uma interface cinematográfica escura, rica em detalhes visuais e focada na experiência do usuário para descobrir títulos, consultar informações completas, salvar na lista e acessar transmissões diretas.

---

## 🌟 Principais Recursos

- **Banner Principal de Destaques (Hero Banner)**:
  - Exibição de produções em destaque com arte em alta definição, classificação indicativa, nota IMDb, sinopse oficial e mini-carrossel lateral para alternar rapidamente entre títulos.
  - Botão de ação rápida **Assistir / Acessar Título** e **Ver detalhes**.
  - Atalho para adicionar/remover de **Minha Lista**.

- **Catálogo & Seções Temáticas**:
  - **Adicionados Recentemente**: Títulos recém-chegados ao acervo (*Doctor Who 15 Temporadas*, *Pretty Little Liars*, *Se as Flores Falassem*, *Ratched*, *Todo Mundo em Pânico 2026*, etc.).
  - **Top Recomendados pelo IMDb**: Filmes e séries com as melhores notas disponíveis no catálogo.
  - **Sobrenatural & Noites de Terror**: Obras com temática gótica, mistério e suspense.
  - **Para Maratonar & Mais Histórias**: Séries completas organizadas por temporadas.
  - **Filmes**: Longas-metragens catalogados.

- **Modal de Detalhes Completo**:
  - **Links & Episódios**: Acesso direto a servidores e pastas em nuvem (Google Drive, Google Photos, YouTube, Gofile) organizados por temporadas e episódios, com identificação de áudio (Dublado / Legendado) e botão para copiar links.
  - **Sinopse & Detalhes**: Visão geral da trama e gêneros.
  - **Ficha Técnica**: Direção, criadores, elenco principal, ano e classificação.
  - **Títulos Recomendados**: Sugestões automáticas baseadas em gênero e tema.

- **Minha Lista (Watchlist)**:
  - Armazenamento local persistente dos títulos favoritos.
  - Filtros rápidos por tipo (Todos, Séries, Filmes, Animes).
  - Recurso de compartilhamento/exportação da lista.

- **Busca e Filtros Dinâmicos**:
  - Pesquisa em tempo real por título, ator, criador ou gênero.
  - Ordenação por Recomendados, Nota IMDb, Ano de Lançamento e Ordem Alfabética (A-Z).
  - Filtro interativo por gêneros e formatos.

---

## 🎨 Identidade Visual

- **Paleta de Cores**:
  - Fundo principal: Preto azulado profundo (`#05080b` / `#070e12`).
  - Destaques e botões de ação: Vermelho carmesim escuro (`#8B1E1E` / `#a62424`).
  - Acentos de informação: Ciano/Turquesa suave (`#6de0d6`) e Dourado IMDb (`#e8c07d`).
  - Tipografia: Tons creme e marfim para alta legibilidade e conforto visual em sessões noturnas.

---

## 🛠️ Tecnologias Utilizadas

- **React 18** com **TypeScript**
- **Vite** (Build tool e dev server)
- **Tailwind CSS** para estilização utilitária e responsiva
- **Lucide React** para iconografia consistente

---

## 🚀 Como Executar o Projeto

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Construa a versão de produção:
   ```bash
   npm run build
   ```


## Modo Android TV

A aplicação possui uma interface adaptada para Android TV. Ela é ativada automaticamente quando o navegador informa que está em uma Android TV ou pode ser aberta manualmente adicionando `?tv=1` ao endereço do Cineclub.

Exemplo:

```text
https://seu-dominio.exemplo/?tv=1
```

No modo TV, os cards ficam maiores, o foco recebe destaque visual, as ações principais continuam acessíveis sem mouse e as setas do controle remoto navegam entre os elementos visíveis. A tecla ou botão Enter abre os detalhes ou inicia a ação do card selecionado. A mesma base continua funcionando em celulares e computadores sem o parâmetro `tv=1`.
