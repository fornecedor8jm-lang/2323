import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Radio, 
  Tv, 
  Film, 
  ChevronRight, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw,
  AlertCircle,
  ListVideo,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { CloudMediaItem, CloudEpisode, CloudSeriesGroup } from '../../types';
import { 
  getPlaybackProgress, 
  savePlaybackProgress, 
  formatTimeDisplay 
} from '../../utils/playbackProgress';

interface CloudPlayerModalProps {
  item: CloudMediaItem | null;
  activeSeries?: CloudSeriesGroup | null;
  currentEpisode?: CloudEpisode | null;
  channelList?: CloudMediaItem[];
  onClose: () => void;
  onSelectChannel?: (channel: CloudMediaItem) => void;
  onSelectEpisode?: (episode: CloudEpisode) => void;
}

export const CloudPlayerModal: React.FC<CloudPlayerModalProps> = ({
  item,
  activeSeries,
  currentEpisode,
  channelList = [],
  onClose,
  onSelectChannel,
  onSelectEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChannelDrawer, setShowChannelDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Playback progress & timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resumePrompt, setResumePrompt] = useState<{ time: number; formatted: string } | null>(null);

  const activeId = currentEpisode ? currentEpisode.id : item?.id || '';
  const activeStreamUrl = currentEpisode ? currentEpisode.streamUrl : item?.streamUrl || '';
  const activeTitle = currentEpisode 
    ? `${activeSeries?.title || 'Série'} - ${currentEpisode.title}` 
    : item?.title || 'Reprodução Nuvem';
  const isVod = item?.type === 'movie' || item?.type === 'series' || !!currentEpisode;

  // Check saved progress on item load
  useEffect(() => {
    if (!activeId || !isVod) {
      setResumePrompt(null);
      return;
    }

    const saved = getPlaybackProgress(activeId);
    if (saved && saved.currentTime > 15 && saved.duration > 0 && !saved.completed) {
      setResumePrompt({
        time: saved.currentTime,
        formatted: formatTimeDisplay(saved.currentTime),
      });
    } else {
      setResumePrompt(null);
    }
  }, [activeId, isVod]);

  // Periodic progress persistence
  useEffect(() => {
    if (!isVod || !activeId) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.duration > 0 && !videoRef.current.paused) {
        const cTime = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(cTime);
        setDuration(dur);
        savePlaybackProgress(activeId, activeTitle, cTime, dur);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeId, activeTitle, isVod]);

  // Initialize and load video stream
  useEffect(() => {
    if (!activeStreamUrl || !videoRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    const video = videoRef.current;

    // Clean up previous Hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = activeStreamUrl.includes('.m3u8') || activeStreamUrl.includes('hls');

    const handleLoaded = () => {
      setIsLoading(false);
      setDuration(video.duration || 0);

      // Auto-resume if prompt exists
      const saved = getPlaybackProgress(activeId);
      if (saved && saved.currentTime > 15 && saved.duration > 0 && !saved.completed) {
        video.currentTime = saved.currentTime;
      }

      video.play().catch(() => {
        setIsPlaying(false);
      });
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(activeStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        handleLoaded();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('Não foi possível reproduzir este fluxo. O link pode estar offline, com token expirado ou protegido contra reprodução web.');
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = activeStreamUrl;
      video.addEventListener('loadedmetadata', handleLoaded);
    } else {
      // Direct MP4 / WebM / Generic Video
      video.src = activeStreamUrl;
      video.onloadeddata = handleLoaded;
      video.onerror = () => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Formato de mídia não suportado diretamente pelo navegador ou link inacessível (403/CORS).');
      };
    }

    const timeUpdateHandler = () => {
      if (video) {
        setCurrentTime(video.currentTime);
        if (video.duration) setDuration(video.duration);
      }
    };

    video.addEventListener('timeupdate', timeUpdateHandler);

    return () => {
      video.removeEventListener('timeupdate', timeUpdateHandler);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl, activeId]);

  if (!item && !currentEpisode) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyLink = () => {
    if (activeStreamUrl) {
      navigator.clipboard.writeText(activeStreamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const retryStream = () => {
    if (!activeStreamUrl || !videoRef.current) return;
    setHasError(false);
    setIsLoading(true);
    const video = videoRef.current;
    video.load();
    video.play().catch(() => {});
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#030608]/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={containerRef}
        className="relative w-full max-w-5xl bg-[#060c10] border border-[#162732] rounded-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Player Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#081217] border-b border-[#14242f] z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 rounded bg-[#8B1E1E]/20 text-[#8B1E1E] border border-[#8B1E1E]/30 shrink-0">
              {item?.type === 'channel' ? <Radio className="w-4 h-4" /> : item?.type === 'series' ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-[#f6eee2] truncate">
                  {activeTitle}
                </span>
                <span className="text-[10px] uppercase font-mono-code px-1.5 py-0.5 bg-[#12232e] text-[#93abb9] rounded shrink-0">
                  {item?.group || 'Nuvem'}
                </span>
              </div>
              <span className="text-[11px] text-[#698392] truncate block">
                Fonte Externa Privada • Transmissão Direta
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Drawer Toggles */}
            {item?.type === 'channel' && channelList.length > 1 && (
              <button
                onClick={() => setShowChannelDrawer(!showChannelDrawer)}
                className={`p-2 rounded text-xs flex items-center gap-1.5 border transition-colors ${
                  showChannelDrawer 
                    ? 'bg-[#8B1E1E] text-white border-[#be2e2e]' 
                    : 'bg-[#0e1b22] text-[#9fb5c2] border-[#1d3443] hover:text-white'
                }`}
                title="Lista de Canais"
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Canais ({channelList.length})</span>
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="p-2 rounded bg-[#0e1b22] hover:bg-[#152731] border border-[#1d3443] text-[#9fb5c2] hover:text-white transition-colors"
              title="Copiar Link de Reprodução"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={activeStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded bg-[#0e1b22] hover:bg-[#152731] border border-[#1d3443] text-[#9fb5c2] hover:text-white transition-colors"
              title="Abrir URL em reprodutor externo"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded bg-[#0e1b22] hover:bg-[#8B1E1E] border border-[#1d3443] hover:border-[#8B1E1E] text-[#9fb5c2] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas & Overlays */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-10 pointer-events-none">
              <div className="w-10 h-10 border-2 border-[#8B1E1E] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono-code text-[#cfc5b4] tracking-wider">
                Conectando ao fluxo de streaming...
              </span>
            </div>
          )}

          {/* Error Banner */}
          {hasError && (
            <div className="absolute inset-0 bg-[#060c10]/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
              <AlertCircle className="w-12 h-12 text-[#db4242]" />
              <div className="max-w-md space-y-1">
                <h4 className="font-display font-bold text-base text-[#f5ebd9]">
                  Falha na transmissão do canal/vídeo
                </h4>
                <p className="text-xs text-[#8ca1ae] leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={retryStream}
                  className="flex items-center gap-2 px-4 py-2 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-sans font-bold text-xs uppercase tracking-wider rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>

                <a
                  href={activeStreamUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#102029] hover:bg-[#1a313e] border border-[#244253] text-[#d6c9b6] font-sans text-xs uppercase tracking-wider rounded transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no VLC / Player Nativo</span>
                </a>
              </div>
            </div>
          )}

          {/* Series Episode Selector Drawer (Overlay on right side) */}
          {activeSeries && activeSeries.seasons.length > 0 && (
            <div className="absolute top-0 right-0 bottom-0 w-72 bg-[#060c10]/95 border-l border-[#192f3c] p-4 overflow-y-auto hidden md:block z-15 backdrop-blur-md">
              <div className="pb-3 border-b border-[#142630] mb-3">
                <span className="text-[10px] uppercase font-mono-code text-[#7b93a0] tracking-widest block">
                  Episódios da Série
                </span>
                <h4 className="font-display font-bold text-sm text-[#f6eee2] truncate">
                  {activeSeries.title}
                </h4>
              </div>

              <div className="space-y-4">
                {activeSeries.seasons.map((season) => (
                  <div key={season.seasonNumber} className="space-y-1.5">
                    <span className="text-xs font-bold text-[#8B1E1E] uppercase tracking-wider block">
                      Temporada {season.seasonNumber}
                    </span>
                    <div className="space-y-1">
                      {season.episodes.map((ep) => {
                        const isCurrent = currentEpisode?.id === ep.id;
                        return (
                          <button
                            key={ep.id}
                            onClick={() => onSelectEpisode?.(ep)}
                            className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border transition-all ${
                              isCurrent
                                ? 'bg-[#8B1E1E] text-white border-[#be2e2e]'
                                : 'bg-[#0b1419] text-[#9fb3be] border-[#13232c] hover:bg-[#132531] hover:text-white'
                            }`}
                          >
                            <span className="truncate pr-2">{ep.title}</span>
                            {isCurrent ? <Play className="w-3 h-3 fill-current shrink-0" /> : <ChevronRight className="w-3 h-3 text-[#58717f] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Channels Drawer (Overlay on left side) */}
          {showChannelDrawer && channelList.length > 0 && (
            <div className="absolute top-0 left-0 bottom-0 w-80 bg-[#060c10]/95 border-r border-[#192f3c] p-4 overflow-y-auto z-15 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#142630] mb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono-code text-[#7b93a0] tracking-widest block">
                    Troca Rápida de Canais
                  </span>
                  <span className="text-xs font-display font-bold text-[#f6eee2]">
                    {channelList.length} Canais Disponíveis
                  </span>
                </div>
                <button
                  onClick={() => setShowChannelDrawer(false)}
                  className="p-1 text-[#6b8593] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {channelList.map((ch) => {
                  const isCurrent = item?.id === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onSelectChannel?.(ch);
                        setShowChannelDrawer(false);
                      }}
                      className={`w-full text-left p-2.5 rounded text-xs flex items-center gap-2.5 border transition-all ${
                        isCurrent
                          ? 'bg-[#8B1E1E] text-white border-[#be2e2e]'
                          : 'bg-[#0b1419] text-[#a1b5c0] border-[#13232c] hover:bg-[#132531] hover:text-white'
                      }`}
                    >
                      {ch.logo ? (
                        <img src={ch.logo} alt="" className="w-6 h-6 object-contain rounded bg-[#04080a] p-0.5" />
                      ) : (
                        <Radio className="w-4 h-4 text-[#8B1E1E] shrink-0" />
                      )}
                      <div className="truncate flex-1">
                        <span className="font-semibold block truncate">{ch.title}</span>
                        <span className="text-[10px] text-[#718a97] block truncate">{ch.group}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Player Bottom Control Bar */}
        <div className="p-3 bg-[#081217] border-t border-[#14242f] flex flex-col gap-2.5 text-xs font-mono-code text-[#9ab0bd]">
          {/* VOD Timeline Slider if movie or episode */}
          {isVod && duration > 0 && (
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] text-[#7c94a2] w-10 text-right shrink-0">
                {formatTimeDisplay(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="flex-1 accent-[#8B1E1E] h-1.5 bg-[#162732] rounded cursor-pointer"
              />
              <span className="text-[11px] text-[#7c94a2] w-10 shrink-0">
                {formatTimeDisplay(duration)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded bg-[#8B1E1E] hover:bg-[#a62424] text-white transition-colors"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-[#8ca1ae] hover:text-white">
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-24 accent-[#8B1E1E] h-1 bg-[#162732] rounded cursor-pointer"
                />
              </div>

              <span className="hidden sm:inline text-[11px] text-[#698492]">
                {item?.type === 'channel' ? '• AO VIVO' : '• VOD NUVEM'}
              </span>

              {resumePrompt && (
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = resumePrompt.time;
                    }
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#102430] hover:bg-[#163040] border border-[#1b3a4d] text-[10px] text-[#e8c07d] transition-colors"
                  title="Continuar de onde parou"
                >
                  <RotateCcw className="w-2.5 h-2.5 text-[#8B1E1E]" />
                  <span>Continuar de {resumePrompt.formatted}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded bg-[#0e1b22] hover:bg-[#152731] text-[#9fb5c2] hover:text-white border border-[#1d3443] transition-colors"
                title="Tela cheia"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
