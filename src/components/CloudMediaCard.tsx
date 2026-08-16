import React, { useState, useEffect } from 'react';
import { Play, Info, Radio, Film, Tv, Cloud, ImageOff, RotateCcw } from 'lucide-react';
import { CloudMediaItem, CloudSeriesGroup } from '../types';
import { getPlaybackProgress, formatTimeDisplay } from '../utils/playbackProgress';

interface CloudMediaCardProps {
  item: CloudMediaItem;
  seriesGroup?: CloudSeriesGroup;
  onPlay: (item: CloudMediaItem) => void;
  onOpenSeries?: (series: CloudSeriesGroup) => void;
}

export const CloudMediaCard: React.FC<CloudMediaCardProps> = ({
  item,
  seriesGroup,
  onPlay,
  onOpenSeries,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [progress, setProgress] = useState<{ currentTime: number; duration: number } | null>(null);

  useEffect(() => {
    if (item.type === 'movie') {
      const saved = getPlaybackProgress(item.id);
      if (saved && saved.duration > 0 && !saved.completed) {
        setProgress({ currentTime: saved.currentTime, duration: saved.duration });
      }
    }
  }, [item.id, item.type]);

  const isChannel = item.type === 'channel';
  const isSeries = item.type === 'series';
  const isMovie = item.type === 'movie';

  const handleClick = () => {
    if (isSeries && seriesGroup && onOpenSeries) {
      onOpenSeries(seriesGroup);
    } else {
      onPlay(item);
    }
  };

  return (
    <div
      id={`cloud-card-${item.id}`}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} — ${isSeries ? 'abrir episódios' : 'assistir'}`}
      onKeyDown={(event) => {
        if ((event.key === 'Enter' || event.key === ' ') && event.currentTarget === event.target) {
          event.preventDefault();
          handleClick();
        }
      }}
      className="group relative flex flex-col bg-[#070e12] rounded-sm border border-[#162733] hover:border-[#8B1E1E]/80 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-[#8B1E1E]/15 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual Canvas (Poster or Video Aspect Container) */}
      <div
        className={`relative ${isChannel ? 'aspect-video' : 'aspect-[2/3]'} w-full overflow-hidden bg-[#091319] cursor-pointer flex items-center justify-center`}
        onClick={handleClick}
      >
        {!imgError && item.logo ? (
          <img
            src={item.logo}
            alt={item.title}
            loading="lazy"
            className={`w-full h-full ${isChannel ? 'object-contain p-2' : 'object-cover object-center'} transition-transform duration-500 group-hover:scale-105 filter brightness-[0.92] contrast-[1.05]`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#071015] space-y-1.5 border border-[#14232c]">
            {isChannel ? (
              <Radio className="w-8 h-8 text-[#8B1E1E]" />
            ) : isSeries ? (
              <Tv className="w-8 h-8 text-[#8B1E1E]" />
            ) : (
              <Film className="w-8 h-8 text-[#8B1E1E]" />
            )}
            <span className="text-[10px] font-mono-code text-[#738d9c] uppercase tracking-wider line-clamp-1">
              {isChannel ? 'Canal Ao Vivo' : isSeries ? 'Série Nuvem' : 'Filme Nuvem'}
            </span>
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060c10] via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none" />

        {/* Top Badges: Nuvem Badge (Mandatory Requirement) & Type */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-1">
          {/* Distinctive Nuvem Badge */}
          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono-code font-bold uppercase tracking-wider rounded-sm bg-[#8B1E1E] text-white shadow-md border border-[#ad2828]">
            <Cloud className="w-2.5 h-2.5" />
            <span>Nuvem</span>
          </span>

          {/* Type / Live Badge */}
          {isChannel ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded-sm bg-red-950/80 text-red-400 border border-red-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>AO VIVO</span>
            </span>
          ) : isSeries ? (
            <span className="px-1.5 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded-sm bg-[#12232e] text-[#86e2d5] border border-[#1e3c4e]">
              {seriesGroup ? `${seriesGroup.seasons.length} Temp.` : 'SÉRIE'}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded-sm bg-[#12232e] text-[#e8c07d] border border-[#1e3c4e]">
              FILME
            </span>
          )}
        </div>

        {/* Playback Progress Bar for Movies */}
        {progress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-10">
            <div
              className="h-full bg-[#8B1E1E]"
              style={{ width: `${Math.min(100, (progress.currentTime / progress.duration) * 100)}%` }}
            />
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div
          className={`tv-action absolute inset-0 bg-[#05090cee]/85 flex flex-col items-center justify-center gap-2 p-3 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-md border border-[#c12e2e] transition-colors"
          >
            {isSeries ? (
              <>
                <Tv className="w-3.5 h-3.5" />
                <span>Ver Episódios</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{progress ? 'Continuar' : 'Assistir'}</span>
              </>
            )}
          </button>

          {progress && (
            <span className="text-[10px] font-mono-code text-[#f0e2cf] flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5 text-[#8B1E1E]" />
              <span>Parou em {formatTimeDisplay(progress.currentTime)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Info */}
      <div className="p-3 flex flex-col justify-between flex-1 space-y-1.5">
        <div>
          <h3
            onClick={handleClick}
            className="font-display font-bold text-xs sm:text-sm text-[#ece4d5] group-hover:text-white line-clamp-1 cursor-pointer transition-colors"
            title={item.title}
          >
            {item.title}
          </h3>
          <p className="text-[11px] font-mono-code text-[#6c8695] line-clamp-1 mt-0.5">
            {item.group || 'Geral / Não categorizado'}
          </p>
        </div>

        {/* Season / Episode Info if present */}
        {(item.season !== undefined || item.episode !== undefined) && (
          <div className="text-[10px] font-mono-code text-[#9cb0bd] flex items-center gap-1">
            {item.season !== undefined && <span>T{item.season}</span>}
            {item.episode !== undefined && <span>E{item.episode}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
