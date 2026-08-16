import React from 'react';
import { Play, Info, Bookmark, Check, Star, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';

interface HeroBannerProps {
  featuredItem: MediaItem;
  featuredList: MediaItem[];
  onSelectFeatured: (item: MediaItem) => void;
  onOpenDetails: (item: MediaItem) => void;
  onOpenPlay: (item: MediaItem) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredItem,
  featuredList,
  onSelectFeatured,
  onOpenDetails,
  onOpenPlay,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  return (
    <div className="relative w-full min-h-[580px] lg:min-h-[660px] flex items-end pb-12 sm:pb-16 pt-24 overflow-hidden border-b border-[#14232c] bg-[#070b0e]">
      {/* Hero Backdrop Image with Multilayer Cinema Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={featuredItem.heroUrl || featuredItem.posterUrl}
          alt={featuredItem.title}
          className="w-full h-full object-cover object-top filter brightness-[0.55] contrast-[1.1] scale-105 transition-all duration-700"
          onError={(e) => {
            // fallback
            (e.target as HTMLImageElement).src = featuredItem.posterUrl;
          }}
        />
        {/* Dark Teal & Black Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080b] via-[#05080b]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080b] via-[#05080b]/90 md:via-[#05080b]/70 to-transparent" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#05080b]/40 to-[#05080b]" />
        
        {/* Subtle gothic crimson aura */}
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#8B1E1E]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          {/* Left Column: Title, Metadata, Synopsis, Actions */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Badges Bar: Ranking, Editorial Badge, Type */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {featuredItem.ranking && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#8B1E1E] text-white font-mono-code text-xs font-bold uppercase tracking-wider rounded-sm shadow-md shadow-[#8B1E1E]/40 border border-[#b82a2a]">
                  <span className="text-[10px]">#</span>
                  <span>{featuredItem.ranking} NO RANKING CINECLUB</span>
                </div>
              )}
              <span className="px-2.5 py-1 bg-[#0d1c24]/90 border border-[#1b3747] text-[#6de0d6] font-mono-code text-[11px] font-semibold uppercase tracking-widest rounded-sm">
                {featuredItem.type}
              </span>
              <span className="px-2 py-1 bg-[#101b22]/90 border border-[#233b49] text-[#e8c07d] font-mono-code text-[11px] font-bold flex items-center gap-1 rounded-sm">
                <Star className="w-3 h-3 fill-[#e8c07d] text-[#e8c07d]" />
                IMDb {featuredItem.rating}
              </span>
              <span className="px-2 py-1 bg-[#101b22]/90 border border-[#233b49] text-[#93a9b5] text-[11px] font-mono-code rounded-sm">
                {featuredItem.year}
              </span>
              {featuredItem.ageRating && (
                <span className="px-1.5 py-0.5 border border-[#8B1E1E]/70 text-[#f58f8f] text-[10px] font-mono-code font-bold rounded-sm">
                  {featuredItem.ageRating}
                </span>
              )}
              {featuredItem.durationOrSeasons && (
                <span className="text-xs text-[#8ca1ad] font-sans font-medium">
                  • {featuredItem.durationOrSeasons}
                </span>
              )}
            </div>

            {/* Giant Editorial Title */}
            <div>
              <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-[#f9f5ed] tracking-tight leading-[1.05] drop-shadow-lg">
                {featuredItem.title}
              </h1>
              {featuredItem.originalTitle && featuredItem.originalTitle !== featuredItem.title && (
                <p className="text-xs uppercase tracking-[0.2em] text-[#718c9b] font-sans mt-1">
                  Título Original: {featuredItem.originalTitle}
                </p>
              )}
            </div>

            {/* Curator Quote / Editorial Note */}
            {featuredItem.editorialCuratorNote && (
              <div className="border-l-2 border-[#8B1E1E] pl-3.5 py-0.5 text-[#d5c7b3] font-editorial text-lg sm:text-xl italic leading-snug">
                “{featuredItem.editorialCuratorNote}”
              </div>
            )}

            {/* Synopsis */}
            <p className="text-[#a4b5bf] text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-4 font-sans">
              {featuredItem.synopsis}
            </p>

            {/* Genre Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {featuredItem.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2.5 py-0.5 bg-[#0a151b] border border-[#162a36] text-[#869da9] text-xs rounded-full font-sans"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3">
              {/* Primary Watch / Direct Links Button */}
              <button
                id="hero-play-btn"
                onClick={() => onOpenPlay(featuredItem)}
                className="flex items-center gap-2.5 px-6 py-3 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-95 text-[#fbf7f0] font-sans font-bold text-sm uppercase tracking-wider rounded-sm shadow-xl shadow-[#8B1E1E]/30 border border-[#be2e2e] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Assistir / Acessar Título</span>
              </button>

              {/* View Details Button */}
              <button
                id="hero-details-btn"
                onClick={() => onOpenDetails(featuredItem)}
                className="flex items-center gap-2 px-5 py-3 bg-[#0d1d26]/80 hover:bg-[#142d3b] text-[#ded6c7] hover:text-white font-sans font-medium text-sm uppercase tracking-wider rounded-sm border border-[#1e3e50] transition-all"
              >
                <Info className="w-4 h-4 text-[#6de0d6]" />
                <span>Ver detalhes</span>
              </button>

              {/* Watchlist Toggle */}
              <button
                id="hero-watchlist-btn"
                onClick={() => onToggleWatchlist(featuredItem)}
                className={`p-3 rounded-sm border transition-all ${
                  isWatchlisted
                    ? 'bg-[#8B1E1E]/20 border-[#8B1E1E] text-[#f27474]'
                    : 'bg-[#0d1d26]/80 border-[#1e3e50] text-[#a4b6c1] hover:text-white hover:border-[#2d5870]'
                }`}
                title={isWatchlisted ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
              >
                {isWatchlisted ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Right Column: Featured Mini Carousel Switcher */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-[#071116]/85 border border-[#162c38] p-4 rounded-sm shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#142630]">
                <span className="text-[11px] uppercase tracking-[0.2em] font-mono-code text-[#738d9c] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#8B1E1E]" />
                  Destaques da Curadoria
                </span>
                <span className="text-[10px] font-mono-code text-[#556d7b]">
                  {featuredList.length} Obras
                </span>
              </div>

              <div className="space-y-2.5">
                {featuredList.slice(0, 4).map((item) => {
                  const isSelected = item.id === featuredItem.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectFeatured(item)}
                      className={`w-full flex items-center gap-3 p-2 rounded text-left transition-all group ${
                        isSelected
                          ? 'bg-[#10232c] border border-[#8B1E1E]/60 shadow-md'
                          : 'hover:bg-[#0c181f] border border-transparent'
                      }`}
                    >
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-11 h-14 object-cover rounded-sm border border-[#1b3240] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.ranking && (
                            <span className="text-[10px] font-mono-code font-bold text-[#e57575]">
                              #{item.ranking}
                            </span>
                          )}
                          <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-[#fbf6ee]' : 'text-[#c6bcac] group-hover:text-white'}`}>
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#6d8492] truncate mt-0.5">
                          {item.type} • {item.genres[0]} • IMDb {item.rating}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#8B1E1E] translate-x-0.5' : 'text-[#394f5c] group-hover:text-[#6f8a9a]'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
