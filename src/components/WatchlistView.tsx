import React from 'react';
import { Bookmark, Trash2, Film, Tv, Sparkles, Compass, Share2, Check } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { MediaCard } from './MediaCard';

interface WatchlistViewProps {
  watchlistItems: MediaItem[];
  onOpenDetails: (item: MediaItem) => void;
  onOpenPlay: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
  onClearWatchlist: () => void;
  onExploreCatalog: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlistItems,
  onOpenDetails,
  onOpenPlay,
  onToggleWatchlist,
  onClearWatchlist,
  onExploreCatalog,
}) => {
  const [filterType, setFilterType] = React.useState<'ALL' | MediaType>('ALL');
  const [copiedShare, setCopiedShare] = React.useState(false);

  const filtered = watchlistItems.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const handleShareList = () => {
    const titleNames = watchlistItems.map((item) => `• ${item.title} (${item.type})`).join('\n');
    const text = `🎬 Minha Lista no Cineclub:\n${titleNames}\n\nAcesse no Cineclub Streaming: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const seriesCount = watchlistItems.filter((i) => i.type === 'Série').length;
  const moviesCount = watchlistItems.filter((i) => i.type === 'Filme').length;
  const animeCount = watchlistItems.filter((i) => i.type === 'Anime').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#14232c] gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#8B1E1E]">
            <Bookmark className="w-5 h-5 fill-current" />
            <span className="text-xs uppercase font-mono-code tracking-[0.25em] font-bold">
              Minha Lista
            </span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#f5ebd9] tracking-tight">
            Títulos Salvos para Assistir
          </h1>
          <p className="font-editorial text-lg text-[#90a3ae] italic">
            Suas séries e filmes favoritos reunidos em um só lugar para maratonar.
          </p>
        </div>

        {/* Action Controls */}
        {watchlistItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleShareList}
              className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold bg-[#0d1f27] hover:bg-[#15323f] text-[#ded1be] hover:text-white border border-[#1b3b4b] rounded-sm transition-colors"
              title="Compartilhar lista"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-[#5ae88a]" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedShare ? 'Lista Copiada!' : 'Exportar Lista'}</span>
            </button>

            <button
              onClick={onClearWatchlist}
              className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wider font-semibold bg-[#1a0f0f] hover:bg-[#2b1414] text-[#f28e8e] border border-[#4d1f1f] rounded-sm transition-colors"
              title="Limpar todos os itens"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Lista</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {watchlistItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#081216] p-4 border border-[#132631] rounded-sm text-xs font-mono-code">
          <div className="space-y-0.5">
            <span className="text-[#647f8d]">Total de Títulos</span>
            <p className="text-base font-bold text-[#f5ecd8]">{watchlistItems.length}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[#647f8d]">Séries Salvas</span>
            <p className="text-base font-bold text-[#f7a1a1]">{seriesCount}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[#647f8d]">Filmes Salvos</span>
            <p className="text-base font-bold text-[#71e2d6]">{moviesCount}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[#647f8d]">Animes & Especiais</span>
            <p className="text-base font-bold text-[#c48ff5]">{animeCount}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {watchlistItems.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors ${
              filterType === 'ALL'
                ? 'bg-[#8B1E1E] text-white font-bold'
                : 'bg-[#091419] text-[#78919f] hover:text-white border border-[#142631]'
            }`}
          >
            Todos ({watchlistItems.length})
          </button>
          <button
            onClick={() => setFilterType('Série')}
            className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors ${
              filterType === 'Série'
                ? 'bg-[#8B1E1E] text-white font-bold'
                : 'bg-[#091419] text-[#78919f] hover:text-white border border-[#142631]'
            }`}
          >
            Séries ({seriesCount})
          </button>
          <button
            onClick={() => setFilterType('Filme')}
            className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors ${
              filterType === 'Filme'
                ? 'bg-[#8B1E1E] text-white font-bold'
                : 'bg-[#091419] text-[#78919f] hover:text-white border border-[#142631]'
            }`}
          >
            Filmes ({moviesCount})
          </button>
          <button
            onClick={() => setFilterType('Anime')}
            className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors ${
              filterType === 'Anime'
                ? 'bg-[#8B1E1E] text-white font-bold'
                : 'bg-[#091419] text-[#78919f] hover:text-white border border-[#142631]'
            }`}
          >
            Animes ({animeCount})
          </button>
        </div>
      )}

      {/* Grid of Saved Titles */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onOpenDetails={onOpenDetails}
              onOpenPlay={onOpenPlay}
              isWatchlisted={true}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}
        </div>
      ) : watchlistItems.length > 0 ? (
        <div className="text-center py-16 bg-[#081216] border border-[#132631] rounded-sm space-y-3">
          <p className="font-editorial text-xl text-[#9cb0bd] italic">
            Nenhum título encontrado nesta categoria da sua lista.
          </p>
          <button
            onClick={() => setFilterType('ALL')}
            className="px-4 py-2 bg-[#12242e] text-[#e0d6c4] text-xs uppercase tracking-wider rounded-sm border border-[#1f3f50]"
          >
            Exibir Todos
          </button>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 px-4 bg-[#070e12] border border-[#142632] rounded-sm space-y-5 max-w-xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#11232d] border border-[#1c3949] flex items-center justify-center mx-auto text-[#8B1E1E]">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl text-[#f3ece0]">
              Sua lista está vazia
            </h3>
            <p className="font-editorial text-lg text-[#889ea9] italic max-w-md mx-auto">
              Explore nossa curadoria independente de terror, fantasia e suspense e salve obras para assistir quando quiser.
            </p>
          </div>
          <button
            onClick={onExploreCatalog}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm border border-[#c12e2e] shadow-lg shadow-[#8B1E1E]/30 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explorar o Catálogo Cineclub</span>
          </button>
        </div>
      )}

    </div>
  );
};
