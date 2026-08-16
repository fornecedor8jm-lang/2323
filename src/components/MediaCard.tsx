import React from 'react';
import { Star, Play, Info, Bookmark, Check, Layers, ImageOff } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onOpenDetails: (item: MediaItem) => void;
  onOpenPlay: (item: MediaItem) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onOpenDetails,
  onOpenPlay,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  // Type badge styling
  const getTypeColor = () => {
    switch (item.type) {
      case 'Anime':
        return 'bg-[#29173d] text-[#c48ff5] border-[#4a2b6e]';
      case 'Filme':
        return 'bg-[#0f2429] text-[#71e2d6] border-[#1c4852]';
      case 'Série':
      default:
        return 'bg-[#2b1717] text-[#f7a1a1] border-[#5e2727]';
    }
  };

  // Format streaming availability label
  const getAvailabilityLabel = () => {
    if (item.durationOrSeasons) {
      return item.durationOrSeasons;
    }
    if (item.type === 'Série') {
      const seasonLinks = item.accessLinks.filter((l) => l.season !== undefined);
      if (seasonLinks.length > 1) {
        return `${seasonLinks.length} temporadas`;
      }
      if (item.accessLinks.length > 1) {
        return `${item.accessLinks.length} episódios`;
      }
      return 'Temporadas disponíveis';
    }
    if (item.type === 'Filme') {
      return 'Assistir filme';
    }
    return `${item.accessLinks.length} episódios`;
  };

  return (
    <div
      id={`card-${item.id}`}
      className="group relative flex flex-col bg-[#070e12] rounded-sm border border-[#13252f] hover:border-[#8B1E1E]/80 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-[#8B1E1E]/15 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image Container */}
      <div 
        className="relative aspect-[2/3] w-full overflow-hidden bg-[#0a141a] cursor-pointer flex items-center justify-center"
        onClick={() => onOpenDetails(item)}
      >
        {!imgError && item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 filter brightness-[0.92] contrast-[1.05]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#081217] text-center border border-[#162732] space-y-2">
            <ImageOff className="w-8 h-8 text-[#546b77]" />
            <span className="text-xs font-mono-code text-[#7e97a5] uppercase tracking-wider">
              Pôster não disponível
            </span>
          </div>
        )}

        {/* Dark film tint vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060c10] via-[#060c10]/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />

        {/* Top Badges: Type Pill & Ranking */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className={`px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase tracking-wider rounded-sm border ${getTypeColor()}`}>
            {item.type}
          </span>

          {item.ranking && (
            <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold bg-[#8B1E1E] text-white rounded-sm shadow-md border border-[#b22828]">
              #{item.ranking}
            </span>
          )}
        </div>

        {/* Rating Badge on Bottom Corner */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-[#070e12]/90 border border-[#19323f] rounded-sm backdrop-blur-xs">
          <Star className="w-3 h-3 fill-[#e5ba72] text-[#e5ba72]" />
          <span className="text-[11px] font-mono-code font-bold text-[#f0dfc4]">{item.rating}</span>
          <span className="text-[10px] font-mono-code text-[#738b97]">• {item.year}</span>
        </div>

        {/* Hover Quick Action Overlay */}
        <div className={`absolute inset-0 bg-[#05090cee]/85 flex flex-col items-center justify-center gap-2.5 p-4 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenPlay(item);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-md border border-[#c12e2e] transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Assistir</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(item);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#0d1f28] hover:bg-[#142e3b] text-[#ded3c1] text-xs font-medium uppercase tracking-wider rounded-sm border border-[#1e3c4d] transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-[#6de0d6]" />
            <span>Ver detalhes</span>
          </button>
        </div>
      </div>

      {/* Card Footer Info */}
      <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <h3 
            onClick={() => onOpenDetails(item)}
            className="font-display font-bold text-sm text-[#ece4d5] group-hover:text-white line-clamp-1 cursor-pointer transition-colors"
            title={item.title}
          >
            {item.title}
          </h3>
          
          <p className="text-[11px] text-[#718894] line-clamp-1 font-sans mt-0.5">
            {item.genres.slice(0, 2).join(' • ')}
          </p>
        </div>

        {/* Bottom bar with seasons / availability & watchlist toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-[#101d24]">
          <div className="flex items-center gap-1 text-[10px] font-mono-code text-[#7892a0]">
            <Layers className="w-3 h-3 text-[#8B1E1E]" />
            <span>{getAvailabilityLabel()}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(item);
            }}
            className={`p-1.5 rounded transition-colors ${
              isWatchlisted
                ? 'text-[#f57a7a] hover:text-[#ff9494] bg-[#8B1E1E]/20'
                : 'text-[#5d7380] hover:text-[#ded2bf] hover:bg-[#0c1820]'
            }`}
            title={isWatchlisted ? 'Remover da Lista' : 'Salvar na Minha Lista'}
          >
            {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
