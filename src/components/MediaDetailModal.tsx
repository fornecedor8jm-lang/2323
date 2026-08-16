import React from 'react';
import { 
  X, Star, Play, Bookmark, Check, ExternalLink, Copy, Film, Tv, 
  Sparkles, Layers, ShieldAlert, Clapperboard, CheckCircle2, ChevronRight,
  Share2, ArrowUpRight, FolderOpen, Video
} from 'lucide-react';
import { MediaItem, AccessLink } from '../types';

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
  onSelectRelated: (item: MediaItem) => void;
  allCatalog: MediaItem[];
  initialMode?: 'details' | 'player';
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
  onSelectRelated,
  allCatalog,
  initialMode = 'details',
}) => {
  const [activeTab, setActiveTab] = React.useState<'links' | 'synopsis' | 'cast'>('links');
  const [variantFilter, setVariantFilter] = React.useState<string>('all');
  const [copiedLinkId, setCopiedLinkId] = React.useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = React.useState<number | string | 'all'>('all');

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveTab('links');
      setVariantFilter('all');
      setSelectedSeason('all');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // Filter access links by audio variant (Dublado / Legendado)
  const filteredLinks = item.accessLinks.filter((link) => {
    if (variantFilter === 'all') return true;
    return link.audioVariant === variantFilter;
  });

  // Extract distinct audio variants if any
  const availableVariants = Array.from(
    new Set(item.accessLinks.map((l) => l.audioVariant).filter(Boolean))
  ) as string[];

  // Extract distinct seasons if series has season-specific links
  const availableSeasons = Array.from(
    new Set(item.accessLinks.map((l) => l.season).filter((s) => s !== undefined))
  );

  const handleCopyLink = (link: AccessLink, e: React.MouseEvent) => {
    e.stopPropagation();
    if (link.url) {
      navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2500);
    }
  };

  const relatedTitles = allCatalog
    .filter((other) => other.id !== item.id && (
      other.editorialCategory === item.editorialCategory ||
      other.genres.some((g) => item.genres.includes(g))
    ))
    .slice(0, 4);

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'drive':
        return { label: 'Google Drive', color: 'text-[#5fc6ff] bg-[#0c2433] border-[#184560]' };
      case 'photos':
        return { label: 'Google Photos', color: 'text-[#ff9c5f] bg-[#331c0c] border-[#603518]' };
      case 'youtube':
        return { label: 'YouTube Playlist', color: 'text-[#ff5f5f] bg-[#330c0c] border-[#601818]' };
      case 'gofile':
        return { label: 'Gofile Cloud', color: 'text-[#7fe878] bg-[#0c3314] border-[#186027]' };
      default:
        return { label: 'Arquivo Direto', color: 'text-[#d4c3ab] bg-[#221f1a] border-[#443e33]' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#030608]/90 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl bg-[#060c10] border border-[#1b3443] rounded-sm shadow-2xl overflow-hidden text-[#ded7c8] my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#071116]/80 text-[#8da2ae] hover:text-white hover:bg-[#8B1E1E] border border-[#1b3240] transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative w-full h-64 sm:h-80 shrink-0 overflow-hidden bg-[#0a151b]">
          <img
            src={item.heroUrl || item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover object-top filter brightness-50 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060c10] via-[#060c10]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060c10] via-transparent to-[#060c10]/80" />

          {/* Floating Details on Hero Bottom */}
          <div className="absolute bottom-4 left-4 sm:left-6 right-16 flex items-end gap-5">
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-sm border-2 border-[#1c384a] shadow-2xl shrink-0 hidden xs:block"
            />
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase tracking-wider bg-[#8B1E1E] text-white rounded-sm">
                  {item.type}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono-code font-bold bg-[#0e1f29] text-[#e8c07d] border border-[#1e3c4e] rounded-sm">
                  <Star className="w-3 h-3 fill-[#e8c07d] text-[#e8c07d]" />
                  IMDb {item.rating}
                </span>
                <span className="text-xs font-mono-code text-[#7e96a4]">
                  {item.year}
                </span>
                {item.durationOrSeasons && (
                  <span className="text-xs font-mono-code text-[#7e96a4]">
                    • {item.durationOrSeasons}
                  </span>
                )}
                {item.ageRating && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono-code font-bold border border-[#8B1E1E]/60 text-[#f58a8a] rounded-sm">
                    {item.ageRating}
                  </span>
                )}
              </div>

              <h2 className="font-display font-black text-2xl sm:text-4xl text-[#fbf6ee] tracking-tight leading-tight drop-shadow-md">
                {item.title}
              </h2>
              {item.originalTitle && item.originalTitle !== item.title && (
                <p className="text-xs text-[#7d97a5] font-sans">
                  {item.originalTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Action Bar: Minha Lista & Fast Access */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#12232d]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleWatchlist(item)}
                className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-sm border transition-colors ${
                  isWatchlisted
                    ? 'bg-[#8B1E1E]/20 text-[#f78f8f] border-[#8B1E1E]'
                    : 'bg-[#0d1d26] text-[#ded2bf] hover:text-white border-[#1e3948] hover:border-[#2d566e]'
                }`}
              >
                {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isWatchlisted ? 'Na Minha Lista' : 'Adicionar à Minha Lista'}</span>
              </button>

              <div className="text-xs font-mono-code text-[#698492]">
                {item.accessLinks.length} fontes de transmissão disponíveis
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex items-center bg-[#081217] p-1 border border-[#142631] rounded-sm">
              <button
                onClick={() => setActiveTab('links')}
                className={`px-3 py-1 text-xs uppercase tracking-wider font-medium rounded-sm transition-colors ${
                  activeTab === 'links'
                    ? 'bg-[#8B1E1E] text-white'
                    : 'text-[#7e95a3] hover:text-[#ded5c5]'
                }`}
              >
                Onde assistir ({item.accessLinks.length})
              </button>
              <button
                onClick={() => setActiveTab('synopsis')}
                className={`px-3 py-1 text-xs uppercase tracking-wider font-medium rounded-sm transition-colors ${
                  activeTab === 'synopsis'
                    ? 'bg-[#8B1E1E] text-white'
                    : 'text-[#7e95a3] hover:text-[#ded5c5]'
                }`}
              >
                Informações
              </button>
              <button
                onClick={() => setActiveTab('cast')}
                className={`px-3 py-1 text-xs uppercase tracking-wider font-medium rounded-sm transition-colors ${
                  activeTab === 'cast'
                    ? 'bg-[#8B1E1E] text-white'
                    : 'text-[#7e95a3] hover:text-[#ded5c5]'
                }`}
              >
                Ficha Técnica
              </button>
            </div>
          </div>

          {/* TAB 1: ACCESS LINKS (Google Drive, Photos, YouTube, Gofile) */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              
              {/* Header & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#f4eee3] flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#8B1E1E]" />
                    <span>Onde assistir</span>
                  </h3>
                  <p className="text-xs text-[#728c9b]">
                    Escolha uma temporada ou episódio para acessar o título.
                  </p>
                </div>

                {/* Variant Selector if Dublado/Legendado exists */}
                {availableVariants.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#09151c] p-1 border border-[#182f3c] rounded text-xs">
                    <span className="text-[10px] uppercase tracking-wider font-mono-code text-[#627f8f] px-1.5">
                      Áudio:
                    </span>
                    <button
                      onClick={() => setVariantFilter('all')}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        variantFilter === 'all'
                          ? 'bg-[#152a36] text-[#f2ebd9] font-bold'
                          : 'text-[#6b8594] hover:text-[#d5ccbd]'
                      }`}
                    >
                      Todos
                    </button>
                    {availableVariants.map((variant) => (
                      <button
                        key={variant}
                        onClick={() => setVariantFilter(variant)}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          variantFilter === variant
                            ? 'bg-[#8B1E1E] text-white font-bold'
                            : 'text-[#6b8594] hover:text-[#d5ccbd]'
                        }`}
                      >
                        {variant}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLinks.map((link) => {
                  const providerBadge = getProviderBadge(link.provider);
                  const isCopied = copiedLinkId === link.id;

                  return (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 bg-[#081217] hover:bg-[#0c1a21] border border-[#152834] hover:border-[#8B1E1E]/60 rounded-sm transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-mono-code font-bold uppercase rounded border ${providerBadge.color}`}>
                            {providerBadge.label}
                          </span>
                          {link.audioVariant && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono-code text-[#e5b376] bg-[#291e0f] border border-[#523d1e] rounded">
                              {link.audioVariant}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-semibold text-[#f0e8dc] group-hover:text-white truncate mt-1">
                          {link.label}
                        </h4>

                        {link.note && (
                          <p className="text-[11px] text-[#6d8896] italic">
                            {link.note}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {link.url ? (
                          <>
                            <button
                              onClick={(e) => handleCopyLink(link, e)}
                              className="p-2 text-[#688392] hover:text-white bg-[#0f212a] hover:bg-[#193646] rounded border border-[#1b3646] transition-colors"
                              title="Copiar Link"
                            >
                              {isCopied ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#5ae88a]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#8B1E1E] hover:bg-[#a62424] rounded border border-[#bf2e2e] shadow-sm transition-colors"
                            >
                              <span>Acessar</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        ) : (
                          <span className="text-[11px] font-mono-code text-[#627783] italic px-2">
                            Informação não disponível
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredLinks.length === 0 && (
                <div className="text-center py-8 text-[#6d8492] font-editorial italic">
                  Nenhum link encontrado para o filtro selecionado.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYNOPSIS & ABOUT */}
          {activeTab === 'synopsis' && (
            <div className="space-y-5">
              {item.editorialCuratorNote && (
                <div className="p-4 bg-[#0a1820] border-l-4 border-[#8B1E1E] rounded-r-sm space-y-1">
                  <span className="text-[10px] uppercase font-mono-code tracking-[0.2em] text-[#e07575] font-bold">
                    Destaque do Título
                  </span>
                  <p className="font-editorial text-xl text-[#ebdcc6] italic leading-snug">
                    “{item.editorialCuratorNote}”
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#d4c6b2]">
                  Sinopse Oficial
                </h4>
                <p className="text-sm sm:text-base text-[#a3b7c2] leading-relaxed font-sans">
                  {item.synopsis}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#d4c6b2]">
                  Gêneros & Atmosferas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.genres.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 bg-[#09151c] border border-[#182f3c] text-[#869ea9] text-xs rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAST & TECHNICAL SPECS */}
          {activeTab === 'cast' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#6d8795]">
                    Direção / Criador
                  </span>
                  <p className="font-medium text-[#f0e8dc] text-sm mt-0.5">
                    {item.directorOrCreator || 'Dados do título'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#6d8795]">
                    Elenco Principal
                  </span>
                  <div className="mt-1 space-y-1">
                    {item.cast && item.cast.length > 0 ? (
                      item.cast.map((actor) => (
                        <div key={actor} className="text-xs text-[#b8cbd6] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B1E1E]" />
                          <span>{actor}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#6e8592]">Informações em catalogação</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-[#081318] p-4 border border-[#142631] rounded-sm">
                <div>
                  <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#6d8795]">
                    Formato & Duração
                  </span>
                  <p className="text-xs text-[#dcd1be] mt-0.5">
                    {item.type} • {item.durationOrSeasons || `${item.year}`}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#6d8795]">
                    Classificação Indicativa
                  </span>
                  <p className="text-xs text-[#dcd1be] mt-0.5">
                    {item.ageRating || 'Não informada'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono-code tracking-widest text-[#6d8795]">
                    Avaliação IMDb
                  </span>
                  <p className="text-xs text-[#e5ba72] font-mono-code font-bold mt-0.5">
                    {item.rating} / 10.0
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RELATED TITLES RECOMMENDATION */}
          {relatedTitles.length > 0 && (
            <div className="pt-6 border-t border-[#12232d] space-y-3">
              <h4 className="font-display font-bold text-sm text-[#e6ddcd] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8B1E1E]" />
                <span>Você também pode gostar</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedTitles.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="group bg-[#081116] border border-[#142530] hover:border-[#8B1E1E] p-2 rounded-sm cursor-pointer transition-all"
                  >
                    <img
                      src={rel.posterUrl}
                      alt={rel.title}
                      className="w-full aspect-[2/3] object-cover rounded-sm filter brightness-90 group-hover:scale-102 transition-transform"
                    />
                    <h5 className="font-display font-semibold text-xs text-[#e8dfd1] group-hover:text-white truncate mt-1.5">
                      {rel.title}
                    </h5>
                    <p className="text-[10px] font-mono-code text-[#698290]">
                      {rel.type} • {rel.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
