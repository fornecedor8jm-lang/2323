/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MEDIA_CATALOG } from './data/catalog';
import { MediaItem, MediaType, CloudSource, CloudMediaItem, CloudSeriesGroup, CloudEpisode } from './types';
import { Navbar, NavTab } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { EditorialSection } from './components/EditorialSection';
import { MediaDetailModal } from './components/MediaDetailModal';
import { CatalogFilters, ContentSourceFilter } from './components/CatalogFilters';
import { MediaCard } from './components/MediaCard';
import { CloudMediaCard } from './components/CloudMediaCard';
import { WatchlistView } from './components/WatchlistView';
import { AboutView } from './components/AboutView';
import { ApkGuideModal } from './components/ApkGuideModal';
import { CloudView } from './components/cloud/CloudView';
import { CloudPlayerModal } from './components/cloud/CloudPlayerModal';
import { MobilePairPortal } from './components/cloud/MobilePairPortal';
import { Footer } from './components/Footer';
import { groupCloudSeries } from './utils/m3uParser';
import { Sparkles, Film, Tv, Flame, Compass, Star, Clock, Skull, Cloud, Radio, Search } from 'lucide-react';

export default function App() {
  // Navigation & View states
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  
  // Mobile pair code query parameter detection (?pairCode=CCN-XXXX)
  const [activePairPortalCode, setActivePairPortalCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check query param (?pairCode=XXXX)
      const urlParams = new URLSearchParams(window.location.search);
      const pairCodeParam = urlParams.get('pairCode');
      if (pairCodeParam) {
        setActivePairPortalCode(pairCodeParam.toUpperCase().trim());
        return;
      }

      // Check path (/pair/XXXX)
      const pathParts = window.location.pathname.split('/');
      const pairIndex = pathParts.indexOf('pair');
      if (pairIndex !== -1 && pathParts[pairIndex + 1]) {
        setActivePairPortalCode(pathParts[pairIndex + 1].toUpperCase().trim());
      }
    } catch (e) {
      console.error('URL params error:', e);
    }
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | MediaType | 'Canal'>('ALL');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sourceFilter, setSourceFilter] = useState<ContentSourceFilter>('ALL');
  const [sortBy, setSortBy] = useState<'curated' | 'rating' | 'year' | 'title'>('curated');

  // Cloud (Nuvem) State persistence (localStorage)
  const [cloudSources, setCloudSources] = useState<CloudSource[]>(() => {
    try {
      const saved = localStorage.getItem('cineclub_cloud_sources');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [activeSourceId, setActiveSourceId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cineclub_cloud_active_source');
    } catch (e) {
      return null;
    }
  });

  const [cloudItems, setCloudItems] = useState<CloudMediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('cineclub_cloud_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const activeCloudSource = useMemo(() => {
    if (cloudSources.length === 0) return null;
    return cloudSources.find((s) => s.id === activeSourceId) || cloudSources[0] || null;
  }, [cloudSources, activeSourceId]);

  // Cloud Player Modal State
  const [cloudPlayerItem, setCloudPlayerItem] = useState<CloudMediaItem | null>(null);
  const [cloudPlayerSeries, setCloudPlayerSeries] = useState<CloudSeriesGroup | null>(null);
  const [cloudPlayerEpisode, setCloudPlayerEpisode] = useState<CloudEpisode | null>(null);

  const handleOpenCloudPlayer = (item: CloudMediaItem) => {
    setCloudPlayerItem(item);
    setCloudPlayerSeries(null);
    setCloudPlayerEpisode(null);
  };

  const handleOpenCloudSeries = (series: CloudSeriesGroup) => {
    setCloudPlayerSeries(series);
    const firstEp = series.seasons[0]?.episodes[0] || null;
    setCloudPlayerEpisode(firstEp);
    setCloudPlayerItem(null);
  };

  const handleImportSuccess = (newSource: CloudSource, newItems: CloudMediaItem[], toastMessage?: string) => {
    setCloudSources((prev) => {
      const filtered = prev.filter((s) => s.id !== newSource.id);
      const updated = [newSource, ...filtered];
      try {
        localStorage.setItem('cineclub_cloud_sources', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setCloudItems((prev) => {
      const otherItems = prev.filter((i) => i.sourceId !== newSource.id);
      const updated = [...otherItems, ...newItems];
      try {
        localStorage.setItem('cineclub_cloud_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setActiveSourceId(newSource.id);
    try {
      localStorage.setItem('cineclub_cloud_active_source', newSource.id);
    } catch (e) {
      console.error(e);
    }

    setActiveTab('cloud');
    showToast(toastMessage || `Nuvem "${newSource.name}" adicionada com ${newItems.length} conteúdos!`);
  };

  const handleSelectCloudSource = (source: CloudSource) => {
    setActiveSourceId(source.id);
    try {
      localStorage.setItem('cineclub_cloud_active_source', source.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCloudSource = (sourceId: string) => {
    setCloudSources((prev) => {
      const updated = prev.filter((s) => s.id !== sourceId);
      try {
        localStorage.setItem('cineclub_cloud_sources', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setCloudItems((prev) => {
      const updated = prev.filter((i) => i.sourceId !== sourceId);
      try {
        localStorage.setItem('cineclub_cloud_items', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (activeSourceId === sourceId) {
      setActiveSourceId(null);
      try {
        localStorage.removeItem('cineclub_cloud_active_source');
      } catch (e) {
        console.error(e);
      }
    }

    showToast('Fonte removida da Nuvem.');
  };

  // Featured Item in Hero (Default: The Boys #1)
  const defaultFeatured = useMemo(() => {
    return MEDIA_CATALOG.find((m) => m.id === 'the-boys') || MEDIA_CATALOG[0];
  }, []);
  const [featuredItem, setFeaturedItem] = useState<MediaItem>(defaultFeatured);

  // Top featured highlights for hero switcher
  const featuredList = useMemo(() => {
    return [
      MEDIA_CATALOG.find((m) => m.id === 'the-boys')!,
      MEDIA_CATALOG.find((m) => m.id === 'doctor-who')!,
      MEDIA_CATALOG.find((m) => m.id === 'constantine')!,
      MEDIA_CATALOG.find((m) => m.id === 'penny-dreadful')!,
      MEDIA_CATALOG.find((m) => m.id === 'supernatural')!,
      MEDIA_CATALOG.find((m) => m.id === 'ratched')!,
      MEDIA_CATALOG.find((m) => m.id === 'pretty-little-liars')!,
      MEDIA_CATALOG.find((m) => m.id === 'tudo-em-todo-lugar')!,
    ].filter(Boolean);
  }, []);

  // Modal & Detail states
  const [selectedMediaModal, setSelectedMediaModal] = useState<MediaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'details' | 'player'>('details');

  // APK Guide Modal
  const [isApkGuideOpen, setIsApkGuideOpen] = useState(false);

  // Watchlist persistence (localStorage)
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('cineclub_watchlist');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial seed for pleasant first impression
    return new Set(['the-boys', 'doctor-who', 'penny-dreadful', 'constantine']);
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleWatchlist = (item: MediaItem) => {
    setWatchlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        showToast(`Removido da Minha Lista: "${item.title}"`);
      } else {
        next.add(item.id);
        showToast(`Adicionado à Minha Lista: "${item.title}"`);
      }
      try {
        localStorage.setItem('cineclub_watchlist', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleClearWatchlist = () => {
    setWatchlistIds(new Set());
    try {
      localStorage.removeItem('cineclub_watchlist');
    } catch (e) {
      console.error(e);
    }
    showToast('Minha Lista foi limpa.');
  };

  const handleOpenDetails = (item: MediaItem) => {
    setSelectedMediaModal(item);
    setModalInitialMode('details');
    setIsDetailModalOpen(true);
  };

  const handleOpenPlay = (item: MediaItem) => {
    setSelectedMediaModal(item);
    setModalInitialMode('player');
    setIsDetailModalOpen(true);
  };

  // Watchlist items resolved
  const watchlistItems = useMemo(() => {
    return MEDIA_CATALOG.filter((item) => watchlistIds.has(item.id));
  }, [watchlistIds]);

  // Section 1: Adicionados Recentemente
  const recentItems = useMemo(() => {
    return MEDIA_CATALOG.filter(
      (m) => m.isRecentlyAdded || m.year === 2026 || m.year === 2025 || m.id === 'doctor-who' || m.id === 'pretty-little-liars' || m.id === 'se-as-flores-falassem'
    );
  }, []);

  // Section 2: Top Recomendados pelo IMDb (Rating >= 8.0)
  const topImdbItems = useMemo(() => {
    return [...MEDIA_CATALOG]
      .filter((m) => m.rating >= 8.0)
      .sort((a, b) => b.rating - a.rating);
  }, []);

  // Section 3: Seleção Sobrenatural
  const sobrenaturalItems = useMemo(() => {
    return MEDIA_CATALOG.filter(
      (m) => m.editorialCategory === 'sobrenatural' || m.genres.includes('Sobrenatural') || m.genres.includes('Fantasia Sombria')
    );
  }, []);

  // Section 4: Noites de Terror
  const terrorItems = useMemo(() => {
    return MEDIA_CATALOG.filter(
      (m) => m.editorialCategory === 'terror' || m.genres.includes('Terror') || m.genres.includes('Terror Gótico')
    );
  }, []);

  // Section 5: Para Maratonar
  const maratonarItems = useMemo(() => {
    return MEDIA_CATALOG.filter(
      (m) => m.editorialCategory === 'maratonar' || (m.type === 'Série' && m.rating >= 7.8)
    );
  }, []);

  // Section 6: Mais Histórias & Clássicos Cult
  const historiasItems = useMemo(() => {
    return MEDIA_CATALOG.filter(
      (m) => m.editorialCategory === 'historias' || m.genres.includes('Mistério') || m.genres.includes('Cult')
    );
  }, []);

  // Section 7: Filmes em Destaque
  const filmesItems = useMemo(() => {
    return MEDIA_CATALOG.filter((m) => m.type === 'Filme');
  }, []);

  // =========================================================================
  // INTEGRATED SEARCH: CONSULTA TANTO CATÁLOGO DE FÁBRICA QUANTO NUVEM ATIVA
  // =========================================================================

  // Filtered Factory Catalog
  const filteredCatalog = useMemo(() => {
    if (sourceFilter === 'CLOUD' || selectedType === 'Canal') return [];

    let result = [...MEDIA_CATALOG];

    // Category tab overrides
    if (activeTab === 'series') {
      result = result.filter((m) => m.type === 'Série');
    } else if (activeTab === 'movies') {
      result = result.filter((m) => m.type === 'Filme');
    } else if (activeTab === 'terror') {
      result = result.filter((m) => m.editorialCategory === 'terror' || m.genres.includes('Terror') || m.genres.includes('Sobrenatural'));
    } else if (activeTab === 'recent') {
      result = result.filter((m) => m.isRecentlyAdded || m.year === 2026 || m.year === 2025 || m.id === 'doctor-who' || m.id === 'pretty-little-liars' || m.id === 'se-as-flores-falassem');
    } else if (selectedType !== 'ALL') {
      result = result.filter((m) => m.type === selectedType);
    }

    // Genre filter
    if (selectedGenre !== 'Todos') {
      result = result.filter((m) => 
        m.genres.some((g) => g.toLowerCase().includes(selectedGenre.toLowerCase()))
      );
    }

    // Search query: título, título original, elenco, diretor, tema
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        const inTitle = m.title.toLowerCase().includes(q);
        const inOrig = m.originalTitle?.toLowerCase().includes(q);
        const inSynopsis = m.synopsis.toLowerCase().includes(q);
        const inGenres = m.genres.some((g) => g.toLowerCase().includes(q));
        const inCast = m.cast?.some((c) => c.toLowerCase().includes(q));
        const inDirector = m.directorOrCreator?.toLowerCase().includes(q);
        const inType = m.type.toLowerCase().includes(q);
        return inTitle || inOrig || inSynopsis || inGenres || inCast || inDirector || inType;
      });
    }

    // Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'year') {
      result.sort((a, b) => {
        const yA = typeof a.year === 'number' ? a.year : parseInt(String(a.year).substring(0, 4)) || 0;
        const yB = typeof b.year === 'number' ? b.year : parseInt(String(b.year).substring(0, 4)) || 0;
        return yB - yA;
      });
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
    }

    return result;
  }, [activeTab, selectedType, selectedGenre, searchQuery, sortBy, sourceFilter]);

  // Filtered Cloud Items (Consulta título, título original, canal, grupo M3U, temporada e episódio)
  const filteredCloudResults = useMemo(() => {
    if (sourceFilter === 'CATALOG' || cloudItems.length === 0) return [];

    let result = [...cloudItems];

    // Filter by type if applicable
    if (selectedType === 'Série' || activeTab === 'series') {
      result = result.filter((i) => i.type === 'series');
    } else if (selectedType === 'Filme' || activeTab === 'movies') {
      result = result.filter((i) => i.type === 'movie');
    } else if (selectedType === 'Canal') {
      result = result.filter((i) => i.type === 'channel');
    }

    // Genre / Group Filter
    if (selectedGenre !== 'Todos') {
      const gLower = selectedGenre.toLowerCase();
      result = result.filter((i) => (i.group && i.group.toLowerCase().includes(gLower)));
    }

    // Search query: título, canal, grupo da M3U, temporada e episódio
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((i) => {
        const inTitle = i.title.toLowerCase().includes(q);
        const inGroup = i.group ? i.group.toLowerCase().includes(q) : false;
        const inSeriesTitle = i.seriesTitle ? i.seriesTitle.toLowerCase().includes(q) : false;
        const inTvgName = i.tvgName ? i.tvgName.toLowerCase().includes(q) : false;
        const inSeason = i.season !== undefined && (`t${i.season}`.includes(q) || `temp ${i.season}`.includes(q) || `temporada ${i.season}`.includes(q));
        const inEpisode = i.episode !== undefined && (`e${i.episode}`.includes(q) || `ep ${i.episode}`.includes(q) || `episodio ${i.episode}`.includes(q) || `episódio ${i.episode}`.includes(q));
        return inTitle || inGroup || inSeriesTitle || inTvgName || inSeason || inEpisode;
      });
    }

    // Sorting
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [cloudItems, sourceFilter, selectedType, activeTab, selectedGenre, searchQuery, sortBy]);

  const totalIntegratedResults = filteredCatalog.length + filteredCloudResults.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#05080b] text-[#ded9cd] cinema-grain">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0d1e28] border border-[#8B1E1E] text-[#f7ece0] text-xs font-semibold rounded-sm shadow-2xl animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#8B1E1E] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        watchlistCount={watchlistIds.size}
        cloudItemsCount={cloudItems.length}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW 0: NUVEM CINECLUB (Private Cloud Source / M3U / QR Sync) */}
        {activeTab === 'cloud' && (
          <CloudView
            sources={cloudSources}
            activeSource={activeCloudSource}
            cloudItems={cloudItems}
            onSelectSource={handleSelectCloudSource}
            onDeleteSource={handleDeleteCloudSource}
            onImportSuccess={handleImportSuccess}
          />
        )}

        {/* VIEW 1: HOME (Hero & All Curated Editorial Sections) */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* Hero Feature Showcase */}
            <HeroBanner
              featuredItem={featuredItem}
              featuredList={featuredList}
              onSelectFeatured={(item) => setFeaturedItem(item)}
              onOpenDetails={handleOpenDetails}
              onOpenPlay={handleOpenPlay}
              isWatchlisted={watchlistIds.has(featuredItem.id)}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Curated Sections */}
            <div className="space-y-2">
              
              {/* Section: Adicionados Recentemente */}
              <EditorialSection
                id="recentes"
                title="Adicionados Recentemente"
                subtitle="Novos filmes, séries e temporadas disponíveis no Cineclub."
                curatorTag="Disponíveis agora"
                items={recentItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Top Recomendados pelo IMDb */}
              <EditorialSection
                id="top-imdb"
                title="Top Recomendados pelo IMDb"
                subtitle="As maiores notas e aclamações críticas da história do cinema e da televisão."
                curatorTag="Notas IMDb 8.0+"
                items={topImdbItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Seleção Sobrenatural */}
              <EditorialSection
                id="sobrenatural"
                title="Seleção Sobrenatural"
                subtitle="Ocultismo, pactos arcanos e batalhas além do véu da realidade."
                curatorTag="Terror & Fantasia"
                items={sobrenaturalItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Noites de Terror */}
              <EditorialSection
                id="terror"
                title="Noites de Terror"
                subtitle="Horror vitoriano, lendas urbanas aterrorizantes e contágios mortais."
                curatorTag="Cinema de Horror"
                items={terrorItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Para Maratonar */}
              <EditorialSection
                id="maratonar"
                title="Para Maratonar"
                subtitle="Sagas envolventes, ficção científica cult e sagas que prendem até o último segundo."
                curatorTag="Altas Avaliações"
                items={maratonarItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Mais Histórias */}
              <EditorialSection
                id="historias"
                title="Mais Histórias"
                subtitle="Suspenses adolescentes, mistérios rurais e investigações fascinantes."
                curatorTag="Narrativas Envolventes"
                items={historiasItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Section: Filmes em Destaque */}
              <EditorialSection
                id="filmes"
                title="Filmes"
                subtitle="Grandes produções, dramas premiados, paródias e odisseias cinematográficas."
                curatorTag="Longas-Metragens"
                items={filmesItems}
                onOpenDetails={handleOpenDetails}
                onOpenPlay={handleOpenPlay}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />

            </div>

          </div>
        )}

        {/* VIEW 2: INTEGRATED CATALOG / SÉRIES / TERROR / FILMES / RECENTES / SEARCH */}
        {(activeTab === 'catalog' || activeTab === 'series' || activeTab === 'terror' || activeTab === 'movies' || activeTab === 'recent') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
            
            {/* View Header */}
            <div className="border-b border-[#142631] pb-6 space-y-2">
              <div className="flex items-center gap-2 text-[#8B1E1E]">
                <Film className="w-5 h-5" />
                <span className="text-xs uppercase font-mono-code tracking-[0.25em] font-bold">
                  {searchQuery.trim() !== ''
                    ? 'Busca Integrada'
                    : activeTab === 'series'
                    ? 'Acervo de Séries'
                    : activeTab === 'terror'
                    ? 'Especial Terror & Sobrenatural'
                    : activeTab === 'movies'
                    ? 'Acervo de Filmes'
                    : activeTab === 'recent'
                    ? 'Adicionados Recentemente'
                    : 'Catálogo Geral'}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-[#f4ece0] tracking-tight">
                {searchQuery.trim() !== ''
                  ? `Resultados para "${searchQuery}"`
                  : activeTab === 'series'
                  ? 'Todas as Séries & Temporadas'
                  : activeTab === 'terror'
                  ? 'Terror, Horror Gótico & Sobrenatural'
                  : activeTab === 'movies'
                  ? 'Todos os Filmes em Catálogo'
                  : activeTab === 'recent'
                  ? 'Títulos Recém-Adicionados'
                  : 'Explorar Todo o Acervo Cineclub'}
              </h1>
              <p className="font-editorial text-lg text-[#92a6b2] italic">
                {searchQuery.trim() !== ''
                  ? 'Consulta simultânea no Catálogo de Fábrica e na Nuvem M3U ativa com identificação por selos.'
                  : activeTab === 'recent'
                  ? 'Doctor Who, Pretty Little Liars, Se as Flores Falassem e novos lançamentos catalogados.'
                  : 'Catálogo completo com links diretos organizados por temporadas e episódios.'}
              </p>
            </div>

            {/* Integrated Filter Bar */}
            <CatalogFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              totalResults={totalIntegratedResults}
              catalogResultsCount={filteredCatalog.length}
              cloudResultsCount={filteredCloudResults.length}
            />

            {/* Results Grid: Shows Factory Catalog items AND Cloud items */}
            {totalIntegratedResults > 0 ? (
              <div className="space-y-8">
                
                {/* 1. Factory Catalog Section (if any results) */}
                {filteredCatalog.length > 0 && (
                  <div className="space-y-4">
                    {filteredCloudResults.length > 0 && (
                      <div className="flex items-center gap-2 pb-2 border-b border-[#142631]">
                        <span className="w-2 h-2 rounded-full bg-[#8B1E1E]" />
                        <h3 className="font-display font-bold text-base text-[#f0e8db]">
                          Catálogo de Fábrica Cineclub ({filteredCatalog.length})
                        </h3>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                      {filteredCatalog.map((item) => (
                        <MediaCard
                          key={item.id}
                          item={item}
                          onOpenDetails={handleOpenDetails}
                          onOpenPlay={handleOpenPlay}
                          isWatchlisted={watchlistIds.has(item.id)}
                          onToggleWatchlist={handleToggleWatchlist}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Cloud (Nuvem) Results Section (with mandatory "Nuvem" Badge) */}
                {filteredCloudResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#142631]">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-[#8B1E1E] text-white">
                          <Cloud className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="font-display font-bold text-base text-[#f0e8db]">
                          Resultados da Nuvem Privada ({filteredCloudResults.length})
                        </h3>
                      </div>
                      <span className="text-xs font-mono-code text-[#76909f]">
                        Fonte M3U/M3U8 do usuário
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                      {filteredCloudResults.map((cloudItem) => (
                        <CloudMediaCard
                          key={cloudItem.id}
                          item={cloudItem}
                          onPlay={handleOpenCloudPlayer}
                          onOpenSeries={(series) => handleOpenCloudSeries(series)}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-20 bg-[#070e12] border border-[#142631] rounded-sm space-y-4 max-w-lg mx-auto p-6">
                <Search className="w-10 h-10 text-[#8B1E1E] mx-auto opacity-70" />
                <h4 className="font-display font-bold text-lg text-[#f0e8da]">
                  Nenhum título encontrado
                </h4>
                <p className="font-editorial text-sm text-[#9cb0bd] italic">
                  Não localizamos conteúdos correspondentes a "{searchQuery || selectedGenre}" nem no Catálogo de Fábrica nem na Nuvem ativa.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('Todos');
                      setSelectedType('ALL');
                      setSourceFilter('ALL');
                    }}
                    className="px-5 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
                  >
                    Restaurar Filtros & Buscar Novamente
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: SOBRE (About Cineclub & Mobile / APK Experience) */}
        {activeTab === 'about' && (
          <AboutView
            onExploreCatalog={() => setActiveTab('catalog')}
            onOpenRecent={() => setActiveTab('recent')}
          />
        )}

        {/* VIEW 4: MINHA LISTA (Watchlist) */}
        {activeTab === 'watchlist' && (
          <WatchlistView
            watchlistItems={watchlistItems}
            onOpenDetails={handleOpenDetails}
            onOpenPlay={handleOpenPlay}
            onToggleWatchlist={handleToggleWatchlist}
            onClearWatchlist={handleClearWatchlist}
            onExploreCatalog={() => setActiveTab('catalog')}
          />
        )}

      </main>

      {/* Title Details & Links Modal (Factory Catalog) */}
      <MediaDetailModal
        item={selectedMediaModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isWatchlisted={selectedMediaModal ? watchlistIds.has(selectedMediaModal.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onSelectRelated={(item) => {
          setSelectedMediaModal(item);
        }}
        allCatalog={MEDIA_CATALOG}
        initialMode={modalInitialMode}
      />

      {/* Cloud Player Modal (Direct Nuvem Streaming & Episodes) */}
      {(cloudPlayerItem || cloudPlayerEpisode) && (
        <CloudPlayerModal
          item={cloudPlayerItem}
          activeSeries={cloudPlayerSeries}
          currentEpisode={cloudPlayerEpisode}
          onClose={() => {
            setCloudPlayerItem(null);
            setCloudPlayerSeries(null);
            setCloudPlayerEpisode(null);
          }}
          onSelectEpisode={(ep) => setCloudPlayerEpisode(ep)}
        />
      )}

      {/* APK Roadmap & Specification Modal */}
      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

      {/* Mobile QR Companion Pairing Portal Modal */}
      {activePairPortalCode && (
        <MobilePairPortal
          pairCode={activePairPortalCode}
          onClose={() => {
            setActivePairPortalCode(null);
            // Clean URL
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('pairCode');
              window.history.replaceState({}, '', url.toString());
            } catch (e) {}
          }}
        />
      )}

      {/* Editorial Footer */}
      <Footer
        onSelectCategory={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
      />

    </div>
  );
}
