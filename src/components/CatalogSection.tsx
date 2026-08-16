import React from 'react';
import { ChevronLeft, ChevronRight, Grid, List, Sparkles } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface CatalogSectionProps {
  id: string;
  title: string;
  subtitle: string;
  curatorTag?: string;
  items: MediaItem[];
  onOpenDetails: (item: MediaItem) => void;
  onOpenPlay: (item: MediaItem) => void;
  watchlistIds: Set<string>;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  id,
  title,
  subtitle,
  curatorTag,
  items,
  onOpenDetails,
  onOpenPlay,
  watchlistIds,
  onToggleWatchlist,
}) => {
  const [viewMode, setViewMode] = React.useState<'carousel' | 'grid'>('carousel');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <section id={`section-${id}`} className="py-8 sm:py-10 border-b border-[#0f1d24]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Catalog Styling */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-5 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B1E1E]" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-[#f3ece0] tracking-wide">
                {title}
              </h2>
              {curatorTag && (
                <span className="hidden md:inline-block px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono-code bg-[#11232d] text-[#6fe0d6] border border-[#1f3e4e] rounded">
                  {curatorTag}
                </span>
              )}
            </div>
            <p className="font-cinematic text-base sm:text-lg text-[#95a8b4] italic pl-4">
              {subtitle}
            </p>
          </div>

          {/* View Mode & Carousel Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Toggle Carousel vs Grid */}
            <div className="flex items-center bg-[#091318] border border-[#162731] rounded p-0.5">
              <button
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'carousel'
                    ? 'bg-[#152934] text-[#ece4d6]'
                    : 'text-[#5d7380] hover:text-[#c4b9a8]'
                }`}
                title="Visualização em Carrossel"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#152934] text-[#ece4d6]'
                    : 'text-[#5d7380] hover:text-[#c4b9a8]'
                }`}
                title="Visualização em Grade Completa"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Carousel Navigation Arrows */}
            {viewMode === 'carousel' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScroll('left')}
                  className="p-1.5 bg-[#091318] hover:bg-[#132732] text-[#869da9] hover:text-white border border-[#162731] rounded transition-colors"
                  title="Rolar para esquerda"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="p-1.5 bg-[#091318] hover:bg-[#132732] text-[#869da9] hover:text-white border border-[#162731] rounded transition-colors"
                  title="Rolar para direita"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Presentation: Carousel or Grid */}
        {viewMode === 'carousel' ? (
          <div
            ref={scrollContainerRef}
            className="catalog-section-row flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="w-44 sm:w-52 lg:w-56 shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <MediaCard
                  item={item}
                  onOpenDetails={onOpenDetails}
                  onOpenPlay={onOpenPlay}
                  isWatchlisted={watchlistIds.has(item.id)}
                  onToggleWatchlist={onToggleWatchlist}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pt-2">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onOpenDetails={onOpenDetails}
                onOpenPlay={onOpenPlay}
                isWatchlisted={watchlistIds.has(item.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
