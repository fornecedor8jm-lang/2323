/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MEDIA_CATALOG } from './data/catalog';
import { MediaItem, MediaType } from './types';
import { Navbar, NavTab } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { EditorialSection } from './components/EditorialSection';
import { MediaDetailModal } from './components/MediaDetailModal';
import { CatalogFilters } from './components/CatalogFilters';
import { MediaCard } from './components/MediaCard';
import { WatchlistView } from './components/WatchlistView';
import { AboutView } from './components/AboutView';
import { ApkGuideModal } from './components/ApkGuideModal';
import { Footer } from './components/Footer';
import { Sparkles, Film, Tv, Flame, Compass, Star, Clock, Skull } from 'lucide-react';

export default function App() {
  // Navigation & View states
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | MediaType>('ALL');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sortBy, setSortBy] = useState<'curated' | 'rating' | 'year' | 'title'>('curated');

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

  // Filtered Catalog for Search / Tab Views
  const filteredCatalog = useMemo(() => {
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

    // Search query
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
      // Curated ranking order
      result.sort((a, b) => {
        const rA = a.ranking || 999;
        const rB = b.ranking || 999;
        return rA - rB;
      });
    }

    return result;
  }, [activeTab, selectedType, selectedGenre, searchQuery, sortBy]);

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
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
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
                subtitle="Novos títulos, temporadas atualizadas e lançamentos recém-chegados ao acervo."
                curatorTag="Novidades no Acervo"
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
                curatorTag="Curadoria Sombria"
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

        {/* VIEW 2: CATALOG / SÉRIES / TERROR / FILMES / RECENTES (Filterable Grid & Search) */}
        {(activeTab === 'catalog' || activeTab === 'series' || activeTab === 'terror' || activeTab === 'movies' || activeTab === 'recent') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
            
            {/* View Header */}
            <div className="border-b border-[#142631] pb-6 space-y-2">
              <div className="flex items-center gap-2 text-[#8B1E1E]">
                <Film className="w-5 h-5" />
                <span className="text-xs uppercase font-mono-code tracking-[0.25em] font-bold">
                  {activeTab === 'series'
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
                {activeTab === 'series'
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
                {activeTab === 'recent'
                  ? 'Doctor Who, Pretty Little Liars, Se as Flores Falassem e novos lançamentos catalogados.'
                  : 'Curadoria cinematográfica completa com reprodução estável e links organizados.'}
              </p>
            </div>

            {/* Filter Bar */}
            <CatalogFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalResults={filteredCatalog.length}
            />

            {/* Results Grid */}
            {filteredCatalog.length > 0 ? (
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
            ) : (
              <div className="text-center py-20 bg-[#070e12] border border-[#142631] rounded-sm space-y-4 max-w-lg mx-auto">
                <p className="font-editorial text-xl text-[#9cb0bd] italic">
                  Nenhum título encontrado para "{searchQuery || selectedGenre}".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('Todos');
                    setSelectedType('ALL');
                  }}
                  className="px-5 py-2.5 bg-[#8B1E1E] text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                >
                  Restaurar Filtros
                </button>
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

      {/* Title Details & Links Modal */}
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

      {/* APK Roadmap & Specification Modal */}
      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

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
