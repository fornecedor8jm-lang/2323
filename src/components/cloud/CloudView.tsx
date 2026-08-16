import React, { useState, useMemo } from 'react';
import { 
  Cloud, 
  Radio, 
  Tv, 
  Film, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Play, 
  Sparkles, 
  Layers, 
  FolderOpen, 
  ChevronRight, 
  Info,
  Filter,
  Smartphone,
  Upload,
  Link as LinkIcon,
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CloudMediaItem, CloudSource, CloudSeriesGroup, CloudEpisode } from '../../types';
import { groupCloudSeries, parseM3U } from '../../utils/m3uParser';
import { maskUrlPassword } from '../../utils/urlParser';
import { CloudPlayerModal } from './CloudPlayerModal';
import { CloudImportModal, CloudImportTab } from './CloudImportModal';

interface CloudViewProps {
  sources: CloudSource[];
  activeSource: CloudSource | null;
  cloudItems: CloudMediaItem[];
  onSelectSource: (source: CloudSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onImportSuccess: (source: CloudSource, items: CloudMediaItem[], toastMessage?: string) => void;
  onShowToast?: (message: string) => void;
}

export type CloudNavSection = 'sources' | 'add' | 'channels' | 'movies' | 'series';

export const CloudView: React.FC<CloudViewProps> = ({
  sources,
  activeSource,
  cloudItems,
  onSelectSource,
  onDeleteSource,
  onImportSuccess,
  onShowToast,
}) => {
  const [activeSection, setActiveSection] = useState<CloudNavSection>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<CloudImportTab>('qr');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Player modal state
  const [playerItem, setPlayerItem] = useState<CloudMediaItem | null>(null);
  const [activeSeriesGroup, setActiveSeriesGroup] = useState<CloudSeriesGroup | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<CloudEpisode | null>(null);

  // Series Detail Drawer state
  const [expandedSeries, setExpandedSeries] = useState<CloudSeriesGroup | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);

  // Filter items by active source
  const currentSourceItems = useMemo(() => {
    if (!activeSource) return [];
    return cloudItems.filter((item) => item.sourceId === activeSource.id);
  }, [cloudItems, activeSource]);

  // Separate items by type
  const channels = useMemo(() => currentSourceItems.filter((i) => i.type === 'channel'), [currentSourceItems]);
  const movies = useMemo(() => currentSourceItems.filter((i) => i.type === 'movie'), [currentSourceItems]);
  const seriesGroups = useMemo(() => groupCloudSeries(currentSourceItems), [currentSourceItems]);

  // Available groups for filter dropdown
  const availableGroups = useMemo(() => {
    let targetItems: CloudMediaItem[] = [];
    if (activeSection === 'channels') targetItems = channels;
    else if (activeSection === 'movies') targetItems = movies;
    else if (activeSection === 'series') targetItems = currentSourceItems.filter((i) => i.type === 'series');

    const groups = new Set<string>();
    targetItems.forEach((item) => {
      if (item.group) groups.add(item.group);
    });
    return Array.from(groups).sort();
  }, [activeSection, channels, movies, currentSourceItems]);

  // Filtered Channels
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchSearch = searchQuery === '' || 
        ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'all' || ch.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [channels, searchQuery, selectedGroup]);

  // Filtered Movies
  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchSearch = searchQuery === '' || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'all' || m.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [movies, searchQuery, selectedGroup]);

  // Filtered Series
  const filteredSeries = useMemo(() => {
    return seriesGroups.filter((s) => {
      const matchSearch = searchQuery === '' || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGroup = selectedGroup === 'all' || s.group === selectedGroup;
      return matchSearch && matchGroup;
    });
  }, [seriesGroups, searchQuery, selectedGroup]);

  // Quick Open Modal with specific tab
  const handleOpenImportModal = (tab: CloudImportTab) => {
    setModalInitialTab(tab);
    setIsImportModalOpen(true);
  };

  // Refresh active cloud source
  const handleRefreshSource = async (source: CloudSource) => {
    if (!source.url) {
      if (onShowToast) onShowToast('Esta fonte não possui URL remota para atualização.');
      return;
    }

    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/cloud/sources/${source.id}/refresh`, {
        method: 'POST',
      });
      const data = await res.json();

      let rawText = data.rawText;
      if (!rawText) {
        const proxyRes = await fetch(`/api/cloud/proxy-m3u?url=${encodeURIComponent(source.url)}`);
        if (proxyRes.ok) {
          rawText = await proxyRes.text();
        }
      }

      if (rawText) {
        const updatedItems = parseM3U(rawText, source.id);
        const channelsCount = updatedItems.filter((i) => i.type === 'channel').length;
        const moviesCount = updatedItems.filter((i) => i.type === 'movie').length;
        const seriesCount = updatedItems.filter((i) => i.type === 'series').length;

        const updatedSource: CloudSource = {
          ...source,
          updatedAt: new Date().toISOString(),
          totalCount: updatedItems.length,
          channelsCount,
          moviesCount,
          seriesCount,
        };

        onImportSuccess(updatedSource, updatedItems, `Nuvem "${source.name}" atualizada com sucesso!`);
      } else {
        throw new Error('Não foi possível obter a lista atualizada.');
      }
    } catch (e: any) {
      if (onShowToast) onShowToast(`Erro ao atualizar fonte: ${e.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Play a channel
  const handlePlayChannel = (channel: CloudMediaItem) => {
    setActiveSeriesGroup(null);
    setCurrentEpisode(null);
    setPlayerItem(channel);
  };

  // Play a movie
  const handlePlayMovie = (movie: CloudMediaItem) => {
    setActiveSeriesGroup(null);
    setCurrentEpisode(null);
    setPlayerItem(movie);
  };

  // Play an episode from series
  const handlePlayEpisode = (series: CloudSeriesGroup, episode: CloudEpisode) => {
    setActiveSeriesGroup(series);
    setCurrentEpisode(episode);
    setPlayerItem({
      id: episode.id,
      title: `${series.title} - ${episode.title}`,
      type: 'series',
      group: series.group,
      logo: series.logo,
      streamUrl: episode.streamUrl,
      sourceId: series.sourceId,
    });
  };

  const hasSources = sources.length > 0 && activeSource && currentSourceItems.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7 animate-in fade-in duration-300">
      
      {/* Cloud Header & Navigation Bar */}
      <div className="bg-gradient-to-r from-[#071117] via-[#09171f] to-[#060c10] border border-[#162a37] rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Main Title & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#142632] pb-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#8B1E1E]/20 text-[#8B1E1E] border border-[#8B1E1E]/40 shadow-lg shadow-[#8B1E1E]/10 shrink-0">
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display font-black text-2xl sm:text-3xl text-[#f6eee2] tracking-tight">
                  Nuvem Cineclub
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-mono-code font-bold bg-[#8B1E1E]/20 border border-[#8B1E1E]/50 text-[#f58a8a] rounded-md">
                  Segunda Fonte
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#87a0af] mt-0.5">
                Transmissões ao vivo, filmes e séries da sua lista M3U privada sem alterar o catálogo de fábrica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {activeSource && (
              <button
                onClick={() => handleRefreshSource(activeSource)}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#0b1820] hover:bg-[#132836] border border-[#1e394b] text-[#e5dcd0] font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                title="Atualizar lista M3U da fonte ativa"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8B1E1E]' : ''}`} />
                <span className="hidden sm:inline">Atualizar Nuvem</span>
              </button>
            )}

            <button
              onClick={() => handleOpenImportModal('qr')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#8B1E1E]/20 border border-[#be2e2e]"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Nuvem</span>
            </button>
          </div>
        </div>

        {/* 5 Structural Navigation Options */}
        <div className="flex items-center gap-1.5 bg-[#050a0d] p-1.5 rounded-lg border border-[#132531] overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider">
          
          <button
            onClick={() => setActiveSection('sources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
              activeSection === 'sources'
                ? 'bg-[#8B1E1E] text-white shadow'
                : 'text-[#8299a7] hover:text-[#ded5c5]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Minhas Fontes</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono-code bg-black/40 rounded">
              {sources.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveSection('add'); handleOpenImportModal('qr'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
              activeSection === 'add'
                ? 'bg-[#8B1E1E] text-white shadow'
                : 'text-[#8299a7] hover:text-[#ded5c5]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Nuvem</span>
          </button>

          <button
            onClick={() => { setActiveSection('channels'); setSelectedGroup('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
              activeSection === 'channels'
                ? 'bg-[#8B1E1E] text-white shadow'
                : 'text-[#8299a7] hover:text-[#ded5c5]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Canais</span>
            {hasSources && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono-code bg-black/40 rounded">
                {channels.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveSection('movies'); setSelectedGroup('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
              activeSection === 'movies'
                ? 'bg-[#8B1E1E] text-white shadow'
                : 'text-[#8299a7] hover:text-[#ded5c5]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes</span>
            {hasSources && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono-code bg-black/40 rounded">
                {movies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveSection('series'); setSelectedGroup('all'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all shrink-0 ${
              activeSection === 'series'
                ? 'bg-[#8B1E1E] text-white shadow'
                : 'text-[#8299a7] hover:text-[#ded5c5]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Séries</span>
            {hasSources && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono-code bg-black/40 rounded">
                {seriesGroups.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Source Banner (when sources exist) */}
        {hasSources && activeSource && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs border-t border-[#132531]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-mono-code text-[#698492] uppercase tracking-wider shrink-0">
                Fonte em exibição:
              </span>
              {sources.map((src) => {
                const isActive = activeSource.id === src.id;
                return (
                  <button
                    key={src.id}
                    onClick={() => {
                      onSelectSource(src);
                      setSelectedGroup('all');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 border transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#12242e] text-[#f5ebd9] border-[#29485b] shadow-sm'
                        : 'bg-[#081116] text-[#7a93a2] border-[#14242f] hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="truncate max-w-[150px]">{src.name}</span>
                    <span className="text-[10px] font-mono-code text-[#5e7785]">
                      ({src.totalCount})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] font-mono-code text-[#738f9e]">
                {channels.length} canais • {movies.length} filmes • {seriesGroups.length} séries
              </span>
              <button
                onClick={() => onDeleteSource(activeSource.id)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono-code rounded text-[#e05656] hover:bg-[#8B1E1E]/20 transition-colors"
                title="Remover esta fonte da Nuvem"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover fonte</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ZERO SOURCES: OFFICIAL EMPTY STATE AS REQUESTED */}
      {!hasSources && (
        <div className="border border-[#162a37] rounded-xl p-8 sm:p-14 text-center bg-[#070e12] space-y-7 max-w-3xl mx-auto shadow-2xl animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-2xl bg-[#8B1E1E]/15 border border-[#8B1E1E]/30 text-[#8B1E1E] flex items-center justify-center mx-auto shadow-lg shadow-[#8B1E1E]/10">
            <Cloud className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#f6eee2] tracking-tight">
              Sua Nuvem ainda não foi configurada.
            </h2>
            <p className="text-sm text-[#889fae] max-w-lg mx-auto leading-relaxed">
              Adicione uma URL M3U, importe um arquivo ou configure pelo celular usando QR Code.
            </p>
          </div>

          {/* 4 Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl mx-auto pt-2">
            
            <button
              onClick={() => handleOpenImportModal('qr')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-[#8B1E1E] hover:bg-[#a62424] active:scale-[0.99] text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#8B1E1E]/20 border border-[#be2e2e]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Configurar pelo Celular</span>
            </button>

            <button
              onClick={() => handleOpenImportModal('url')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-[#0e1c24] hover:bg-[#152936] text-[#f6eee2] font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-[#1e3b4e]"
            >
              <LinkIcon className="w-4 h-4 text-[#8B1E1E]" />
              <span>Colar URL M3U</span>
            </button>

            <button
              onClick={() => handleOpenImportModal('file')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-[#0e1c24] hover:bg-[#152936] text-[#f6eee2] font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-[#1e3b4e]"
            >
              <Upload className="w-4 h-4 text-[#8B1E1E]" />
              <span>Importar Arquivo M3U</span>
            </button>

            <button
              onClick={() => handleOpenImportModal('demo')}
              className="flex items-center justify-center gap-2.5 p-4 rounded-xl bg-[#0e1c24] hover:bg-[#152936] text-[#f6eee2] font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-[#1e3b4e]"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Carregar Demonstração</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: MINHAS FONTES (Management View) */}
      {activeSection === 'sources' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-xl text-[#f6eee2] tracking-tight">
              Minhas Fontes Cadastradas ({sources.length})
            </h3>
            <button
              onClick={() => handleOpenImportModal('qr')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1E1E] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#a62424]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Nova Fonte</span>
            </button>
          </div>

          {sources.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#070e12] border border-[#142531] text-xs text-[#758e9d]">
              Nenhuma fonte cadastrada na sua Nuvem no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((src) => {
                const isActive = activeSource?.id === src.id;
                const maskedUrl = maskUrlPassword(src.url);

                return (
                  <div
                    key={src.id}
                    className={`p-5 rounded-xl border transition-all space-y-4 ${
                      isActive
                        ? 'bg-[#08151c] border-[#29485b] shadow-lg shadow-[#8B1E1E]/5'
                        : 'bg-[#070e13] border-[#142531] hover:border-[#1d384a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-400 shadow-sm shadow-green-400' : 'bg-gray-500'}`} />
                          <h4 className="font-display font-bold text-base text-[#f6eee2]">
                            {src.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono-code text-[#698492] block uppercase tracking-wider">
                          Tipo: {src.type === 'pair' ? 'Pareamento Celular (QR)' : src.type === 'url' ? 'URL M3U / Xtream' : src.type === 'file' ? 'Arquivo Local' : 'Demonstração'}
                        </span>
                      </div>

                      {isActive ? (
                        <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded">
                          Ativa
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectSource(src);
                            setActiveSection('channels');
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-[#8B1E1E] hover:bg-[#8B1E1E]/10 rounded border border-[#8B1E1E]/40 transition-colors"
                        >
                          Ativar
                        </button>
                      )}
                    </div>

                    {/* Masked URL Display */}
                    {maskedUrl && (
                      <div className="p-2.5 rounded-lg bg-[#04080b] border border-[#11212b] font-mono-code text-[11px] text-[#7d97a6] break-all">
                        <span className="text-[9px] uppercase text-[#536d7a] block">URL Protegida:</span>
                        <span>{maskedUrl}</span>
                      </div>
                    )}

                    {/* Counts */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-code">
                      <div className="p-2 rounded bg-[#0a151b] border border-[#142631]">
                        <span className="text-[#658190] text-[10px] block">Canais</span>
                        <span className="text-[#f6eee2] font-bold">{src.channelsCount}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0a151b] border border-[#142631]">
                        <span className="text-[#658190] text-[10px] block">Filmes</span>
                        <span className="text-[#f6eee2] font-bold">{src.moviesCount}</span>
                      </div>
                      <div className="p-2 rounded bg-[#0a151b] border border-[#142631]">
                        <span className="text-[#658190] text-[10px] block">Séries</span>
                        <span className="text-[#f6eee2] font-bold">{src.seriesCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#12232e] text-xs">
                      <button
                        onClick={() => handleRefreshSource(src)}
                        disabled={isRefreshing || !src.url}
                        className="flex items-center gap-1.5 text-[#88a4b3] hover:text-white disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Atualizar Nuvem</span>
                      </button>

                      <button
                        onClick={() => onDeleteSource(src.id)}
                        className="flex items-center gap-1 text-[#e05656] hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover fonte</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENT AREAS WHEN SOURCES EXIST (CANAIS, FILMES, SÉRIES) */}
      {hasSources && (activeSection === 'channels' || activeSection === 'movies' || activeSection === 'series') && (
        <div className="space-y-6">
          
          {/* Controls Bar: Search & Group Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#081217] border border-[#142531] p-3 rounded-xl">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-code uppercase text-[#738f9e] font-bold">
                {activeSection === 'channels' ? 'Transmissões Ao Vivo' : activeSection === 'movies' ? 'Catálogo de Filmes VOD' : 'Séries & Temporadas'}
              </span>
            </div>

            {/* Search & Group Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Group Selector Dropdown */}
              {availableGroups.length > 0 && (
                <div className="relative w-full sm:w-56">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-[#050a0d] border border-[#162732] text-xs text-[#cfc4b2] py-2 px-3 rounded-lg focus:outline-none focus:border-[#8B1E1E] cursor-pointer"
                  >
                    <option value="all">Todos os Grupos ({availableGroups.length})</option>
                    {availableGroups.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* In-Cloud Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5e7987]" />
                <input
                  type="text"
                  placeholder={`Buscar em ${activeSection === 'channels' ? 'Canais' : activeSection === 'movies' ? 'Filmes' : 'Séries'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#050a0d] border border-[#162732] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#506774] rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 1. CANAIS TAB (Live TV Stream Cards) */}
          {activeSection === 'channels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#718b99]">
                <span>Mostrando {filteredChannels.length} de {channels.length} canais ao vivo</span>
                {selectedGroup !== 'all' && (
                  <span className="text-[#8B1E1E] font-semibold">Grupo: {selectedGroup}</span>
                )}
              </div>

              {filteredChannels.length === 0 ? (
                <div className="p-12 text-center border border-[#142531] rounded-xl bg-[#070e12] text-sm text-[#738b97]">
                  Nenhum canal encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredChannels.map((channel) => (
                    <div
                      key={channel.id}
                      onClick={() => handlePlayChannel(channel)}
                      className="group bg-[#081217] hover:bg-[#0c1a21] border border-[#142631] hover:border-[#8B1E1E]/70 p-3 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-[#8B1E1E]/10"
                    >
                      {/* Logo or Icon */}
                      <div className="relative aspect-video w-full rounded-lg bg-[#04080a] border border-[#101f28] flex items-center justify-center p-2 overflow-hidden mb-2.5">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.title}
                            loading="lazy"
                            className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Radio className="w-8 h-8 text-[#8B1E1E] group-hover:scale-110 transition-transform" />
                        )}

                        {/* Live indicator badge */}
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono-code font-bold text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span>AO VIVO</span>
                        </div>

                        {/* Play hover overlay */}
                        <div className="absolute inset-0 bg-[#8B1E1E]/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="p-2 rounded-full bg-[#8B1E1E] text-white shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Channel Info */}
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-xs text-[#f5eee2] group-hover:text-white truncate" title={channel.title}>
                          {channel.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono-code text-[#6b8593]">
                          <span className="truncate max-w-[90px]">{channel.group}</span>
                          <span className="text-[#8B1E1E] font-bold">Assistir</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. FILMES TAB (VOD Movie Cards) */}
          {activeSection === 'movies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#718b99]">
                <span>Mostrando {filteredMovies.length} de {movies.length} filmes</span>
                {selectedGroup !== 'all' && (
                  <span className="text-[#8B1E1E] font-semibold">Grupo: {selectedGroup}</span>
                )}
              </div>

              {filteredMovies.length === 0 ? (
                <div className="p-12 text-center border border-[#142531] rounded-xl bg-[#070e12] text-sm text-[#738b97]">
                  Nenhum filme encontrado na lista atual.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {filteredMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handlePlayMovie(movie)}
                      className="group bg-[#081217] hover:bg-[#0c1a21] border border-[#142631] hover:border-[#8B1E1E]/70 rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl"
                    >
                      {/* Movie Poster */}
                      <div className="relative aspect-[2/3] w-full bg-[#050a0d] flex items-center justify-center overflow-hidden">
                        {movie.logo ? (
                          <img
                            src={movie.logo}
                            alt={movie.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#050b0f] space-y-1.5">
                            <Film className="w-8 h-8 text-[#8B1E1E]" />
                            <span className="text-[10px] font-mono-code text-[#738c9b] uppercase">Nuvem VOD</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono-code text-[#f2e7d7]">
                          FILME
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-[#030608]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-3 transition-opacity">
                          <div className="p-3 rounded-full bg-[#8B1E1E] text-white shadow-xl">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                          <span className="text-xs font-bold text-[#f5ebd9] uppercase tracking-wider">
                            Assistir Filme
                          </span>
                        </div>
                      </div>

                      {/* Title & Group */}
                      <div className="p-2.5 space-y-1">
                        <h4 className="font-display font-bold text-xs text-[#f5eee2] group-hover:text-white truncate" title={movie.title}>
                          {movie.title}
                        </h4>
                        <span className="text-[10px] font-mono-code text-[#698492] block truncate">
                          {movie.group}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. SÉRIES TAB (Series Grouped with Seasons & Episodes) */}
          {activeSection === 'series' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#718b99]">
                <span>Mostrando {filteredSeries.length} séries organizadas</span>
                {selectedGroup !== 'all' && (
                  <span className="text-[#8B1E1E] font-semibold">Grupo: {selectedGroup}</span>
                )}
              </div>

              {filteredSeries.length === 0 ? (
                <div className="p-12 text-center border border-[#142531] rounded-xl bg-[#070e12] text-sm text-[#738b97]">
                  Nenhuma série identificada nesta lista.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {filteredSeries.map((series) => (
                    <div
                      key={series.id}
                      onClick={() => {
                        setExpandedSeries(series);
                        setSelectedSeasonNumber(series.seasons[0]?.seasonNumber || 1);
                      }}
                      className="group bg-[#081217] hover:bg-[#0c1a21] border border-[#142631] hover:border-[#8B1E1E]/70 rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl"
                    >
                      {/* Series Poster */}
                      <div className="relative aspect-[2/3] w-full bg-[#050a0d] flex items-center justify-center overflow-hidden">
                        {series.logo ? (
                          <img
                            src={series.logo}
                            alt={series.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#050b0f] space-y-1.5">
                            <Tv className="w-8 h-8 text-[#8B1E1E]" />
                            <span className="text-[10px] font-mono-code text-[#738c9b] uppercase">Série Nuvem</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono-code text-[#f2e7d7]">
                          {series.seasons.length} {series.seasons.length === 1 ? 'Temporada' : 'Temporadas'}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-[#030608]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-3 transition-opacity">
                          <div className="p-3 rounded-full bg-[#8B1E1E] text-white shadow-xl">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-[#f5ebd9] uppercase tracking-wider text-center">
                            Ver Episódios ({series.totalEpisodes})
                          </span>
                        </div>
                      </div>

                      {/* Title & Group */}
                      <div className="p-2.5 space-y-1">
                        <h4 className="font-display font-bold text-xs text-[#f5eee2] group-hover:text-white truncate" title={series.title}>
                          {series.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono-code text-[#698492]">
                          <span className="truncate max-w-[80px]">{series.group}</span>
                          <span className="text-[#8B1E1E]">{series.totalEpisodes} eps</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Series Detail & Episodes Drawer Modal */}
      {expandedSeries && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#030608]/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setExpandedSeries(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-[#060c10] border border-[#162732] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#081217] border-b border-[#14242f]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#8B1E1E]/20 text-[#8B1E1E] border border-[#8B1E1E]/30">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[#f6eee2] tracking-tight">
                    {expandedSeries.title}
                  </h3>
                  <span className="text-xs text-[#75909e]">
                    {expandedSeries.seasons.length} temporadas • {expandedSeries.totalEpisodes} episódios no total
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExpandedSeries(null)}
                className="p-1.5 rounded text-[#718997] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Season Selector Tabs */}
            <div className="flex items-center gap-2 px-6 py-3 bg-[#050a0d] border-b border-[#14242f] overflow-x-auto">
              <span className="text-[11px] font-mono-code uppercase text-[#698492] shrink-0 mr-1">
                Temporadas:
              </span>
              {expandedSeries.seasons.map((season) => (
                <button
                  key={season.seasonNumber}
                  onClick={() => setSelectedSeasonNumber(season.seasonNumber)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider shrink-0 transition-colors ${
                    selectedSeasonNumber === season.seasonNumber
                      ? 'bg-[#8B1E1E] text-white'
                      : 'bg-[#091318] text-[#869ea9] hover:text-white border border-[#142631]'
                  }`}
                >
                  Temporada {season.seasonNumber} ({season.episodes.length} eps)
                </button>
              ))}
            </div>

            {/* Episodes List for Active Season */}
            <div className="p-6 overflow-y-auto space-y-2">
              {expandedSeries.seasons
                .find((s) => s.seasonNumber === selectedSeasonNumber)
                ?.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      handlePlayEpisode(expandedSeries, ep);
                      setExpandedSeries(null);
                    }}
                    className="p-3 rounded-lg bg-[#081217] hover:bg-[#0f212c] border border-[#142631] hover:border-[#8B1E1E]/60 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#050a0d] text-[#8B1E1E] font-mono-code font-bold text-xs flex items-center justify-center border border-[#152834] group-hover:border-[#8B1E1E]">
                        {ep.episodeNumber}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-[#f5eee2] group-hover:text-white block">
                          {ep.title}
                        </span>
                        <span className="text-[10px] text-[#698492] font-mono-code">
                          Transmissão Nuvem Direta
                        </span>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase rounded-md opacity-90 group-hover:opacity-100 transition-all">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Assistir</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Cloud Streaming Video Player Modal */}
      {playerItem && (
        <CloudPlayerModal
          item={playerItem}
          activeSeries={activeSeriesGroup}
          currentEpisode={currentEpisode}
          channelList={channels}
          onClose={() => {
            setPlayerItem(null);
            setActiveSeriesGroup(null);
            setCurrentEpisode(null);
          }}
          onSelectChannel={(ch) => handlePlayChannel(ch)}
          onSelectEpisode={(ep) => {
            if (activeSeriesGroup) {
              handlePlayEpisode(activeSeriesGroup, ep);
            }
          }}
        />
      )}

      {/* Cloud Import & Pairing Modal */}
      <CloudImportModal
        isOpen={isImportModalOpen}
        initialTab={modalInitialTab}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={onImportSuccess}
      />
    </div>
  );
};
