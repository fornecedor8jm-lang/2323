import React from 'react';
import { Search, Filter, ArrowUpDown, X, Tv, Film, Sparkles, SlidersHorizontal, Cloud, Radio } from 'lucide-react';
import { MediaType } from '../types';
import { GENRE_LIST } from '../data/catalog';

export type ContentSourceFilter = 'ALL' | 'CATALOG' | 'CLOUD';

interface CatalogFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: 'ALL' | MediaType | 'Canal';
  setSelectedType: (type: 'ALL' | MediaType | 'Canal') => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  sortBy: 'curated' | 'rating' | 'year' | 'title';
  setSortBy: (sort: 'curated' | 'rating' | 'year' | 'title') => void;
  sourceFilter?: ContentSourceFilter;
  setSourceFilter?: (source: ContentSourceFilter) => void;
  totalResults: number;
  catalogResultsCount?: number;
  cloudResultsCount?: number;
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedGenre,
  setSelectedGenre,
  sortBy,
  setSortBy,
  sourceFilter = 'ALL',
  setSourceFilter,
  totalResults,
  catalogResultsCount = 0,
  cloudResultsCount = 0,
}) => {
  const hasActiveFilters = searchQuery !== '' || selectedType !== 'ALL' || selectedGenre !== 'Todos' || sortBy !== 'curated' || sourceFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedGenre('Todos');
    setSortBy('curated');
    setSourceFilter?.('ALL');
  };

  return (
    <div className="bg-[#070e12] border border-[#142631] p-4 sm:p-6 rounded-sm space-y-4 shadow-xl">
      
      {/* Top Search & Source Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c7785]" />
          <input
            id="catalog-search-input"
            type="text"
            placeholder="Buscar por título, canal, grupo M3U, gênero, temporada ou episódio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-[#09141a] border border-[#182e3b] focus:border-[#8B1E1E] text-xs sm:text-sm text-[#ded7c8] placeholder-[#506876] rounded-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5c7785] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Source Origin Selector: Todos / Catálogo Cineclub / Nuvem */}
        {setSourceFilter && (cloudResultsCount > 0 || sourceFilter === 'CLOUD') && (
          <div className="flex items-center gap-1 bg-[#091419] p-1 border border-[#162a36] rounded-sm">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                sourceFilter === 'ALL'
                  ? 'bg-[#8B1E1E] text-white'
                  : 'text-[#728c9b] hover:text-[#dcd1be]'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setSourceFilter('CATALOG')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                sourceFilter === 'CATALOG'
                  ? 'bg-[#8B1E1E] text-white'
                  : 'text-[#728c9b] hover:text-[#dcd1be]'
              }`}
            >
              <span>Catálogo ({catalogResultsCount})</span>
            </button>
            <button
              onClick={() => setSourceFilter('CLOUD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                sourceFilter === 'CLOUD'
                  ? 'bg-[#8B1E1E] text-white'
                  : 'text-[#728c9b] hover:text-[#dcd1be]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Nuvem ({cloudResultsCount})</span>
            </button>
          </div>
        )}

        {/* Content Type Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#091419] p-1 border border-[#162a36] rounded-sm self-start md:self-auto">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
              selectedType === 'ALL'
                ? 'bg-[#8B1E1E] text-white'
                : 'text-[#728c9b] hover:text-[#dcd1be]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType('Série')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
              selectedType === 'Série'
                ? 'bg-[#8B1E1E] text-white'
                : 'text-[#728c9b] hover:text-[#dcd1be]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Séries</span>
          </button>
          <button
            onClick={() => setSelectedType('Filme')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
              selectedType === 'Filme'
                ? 'bg-[#8B1E1E] text-white'
                : 'text-[#728c9b] hover:text-[#dcd1be]'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes</span>
          </button>
          <button
            onClick={() => setSelectedType('Canal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors ${
              selectedType === 'Canal'
                ? 'bg-[#8B1E1E] text-white'
                : 'text-[#728c9b] hover:text-[#dcd1be]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Canais</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[#5c7785]" />
          <select
            id="catalog-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#09141a] border border-[#182e3b] text-xs text-[#cfc4b2] py-2 px-3 rounded-sm focus:outline-none focus:border-[#8B1E1E] cursor-pointer"
          >
            <option value="curated">Recomendados</option>
            <option value="rating">Melhor Nota (IMDb)</option>
            <option value="year">Mais Recentes</option>
            <option value="title">Ordem Alfabética (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Genre Chips */}
      <div className="pt-2 border-t border-[#101f28] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#637d8c] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-[#8B1E1E]" />
            Gêneros & Coleções
          </span>

          <div className="flex items-center gap-3 text-xs font-mono-code text-[#698493]">
            <span>{totalResults} {totalResults === 1 ? 'resultado integrado' : 'resultados integrados'}</span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[#e27373] hover:text-[#ff8f8f] hover:underline"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {GENRE_LIST.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1 text-xs rounded-full font-medium shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#8B1E1E] text-white font-semibold shadow-sm'
                    : 'bg-[#09151c] text-[#7893a1] hover:text-[#e4dbcd] border border-[#162934]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
