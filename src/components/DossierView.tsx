import React from 'react';
import { BookOpen, Clock, Calendar, ArrowRight, User, Sparkles, X, Share2, Check } from 'lucide-react';
import { EDITORIAL_ARTICLES } from '../data/catalog';
import { EditorialArticle, MediaItem } from '../types';

interface DossierViewProps {
  onSelectMedia: (item: MediaItem) => void;
  catalog: MediaItem[];
}

export const DossierView: React.FC<DossierViewProps> = ({
  onSelectMedia,
  catalog,
}) => {
  const [selectedArticle, setSelectedArticle] = React.useState<EditorialArticle | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleShare = (article: EditorialArticle) => {
    navigator.clipboard.writeText(`${article.title} — Revista Cineclub: ${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-300">
      
      {/* Editorial Header */}
      <div className="border-b border-[#142631] pb-8 space-y-3">
        <div className="flex items-center gap-2 text-[#8B1E1E]">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs uppercase font-mono-code tracking-[0.25em] font-bold">
            Revista Cultural & Crítica de Cinema
          </span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#f6eee2] tracking-tight">
          Dossiê & Bastidores Cineclub
        </h1>
        <p className="font-editorial text-xl sm:text-2xl text-[#99adb9] italic max-w-3xl">
          Ensaios críticos, análises de cena, reflexões sobre horror gótico e a anatomia dos grandes clássicos da televisão e do cinema autoral.
        </p>
      </div>

      {/* Featured Articles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {EDITORIAL_ARTICLES.map((article, idx) => (
          <article
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className={`group bg-[#070e12] border border-[#132530] hover:border-[#8B1E1E] rounded-sm overflow-hidden flex flex-col cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-[#8B1E1E]/15 ${
              idx === 0 ? 'lg:col-span-2' : 'lg:col-span-1'
            }`}
          >
            {/* Article Cover */}
            <div className={`relative overflow-hidden bg-[#09151b] ${idx === 0 ? 'h-64 sm:h-80' : 'h-52'}`}>
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover object-top filter brightness-85 group-hover:scale-103 group-hover:brightness-95 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070e12] via-[#070e12]/40 to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-[#8B1E1E] text-white text-[10px] uppercase font-mono-code font-bold rounded-sm shadow-md">
                  {article.category}
                </span>
              </div>
            </div>

            {/* Article Content Preview */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[11px] font-mono-code text-[#6c8593]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#8B1E1E]" />
                    {article.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8B1E1E]" />
                    {article.readTime}
                  </span>
                </div>

                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#f3ece0] group-hover:text-white transition-colors leading-snug">
                  {article.title}
                </h2>

                <p className="font-editorial text-base sm:text-lg text-[#95abb7] italic line-clamp-2">
                  {article.subtitle}
                </p>
              </div>

              {article.highlightQuote && idx === 0 && (
                <div className="border-l-2 border-[#8B1E1E] pl-3 py-1 font-editorial text-base text-[#d1c3b0] italic bg-[#0a1820] rounded-r">
                  {article.highlightQuote}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#11232d] text-xs">
                <span className="text-[#658190] font-sans flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {article.author}
                </span>

                <span className="text-[#8B1E1E] group-hover:text-[#db4242] font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span>Ler Dossiê Completo</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ARTICLE FULL MODAL / READER */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-[#030608]/90 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-3xl bg-[#060c10] border border-[#1b3443] rounded-sm shadow-2xl overflow-hidden text-[#ded7c8] my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-[#071116]/95 border-b border-[#142631] backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase bg-[#8B1E1E] text-white rounded-sm">
                  {selectedArticle.category}
                </span>
                <span className="text-xs font-mono-code text-[#6f8998]">
                  {selectedArticle.readTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(selectedArticle)}
                  className="p-1.5 text-[#728d9c] hover:text-white bg-[#0e1d25] rounded border border-[#1a3443]"
                  title="Compartilhar"
                >
                  {copied ? <Check className="w-4 h-4 text-[#5ae88a]" /> : <Share2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1.5 text-[#728d9c] hover:text-white bg-[#0e1d25] hover:bg-[#8B1E1E] rounded border border-[#1a3443]"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
              <div className="space-y-3">
                <h1 className="font-display font-black text-2xl sm:text-4xl text-[#faf4ea] leading-tight">
                  {selectedArticle.title}
                </h1>
                <p className="font-editorial text-xl text-[#9cb0bd] italic">
                  {selectedArticle.subtitle}
                </p>
                <div className="flex items-center gap-2 text-xs font-mono-code text-[#698492] pt-1">
                  <span>Por {selectedArticle.author}</span>
                  <span>•</span>
                  <span>Publicado em {selectedArticle.date}</span>
                </div>
              </div>

              {selectedArticle.highlightQuote && (
                <div className="p-5 bg-[#09171f] border-l-4 border-[#8B1E1E] rounded-r font-editorial text-xl sm:text-2xl text-[#ebd8be] italic leading-relaxed">
                  {selectedArticle.highlightQuote}
                </div>
              )}

              {/* Body Text */}
              <div className="font-sans text-sm sm:text-base text-[#bcccd6] leading-relaxed space-y-4 whitespace-pre-line">
                {selectedArticle.content}
              </div>

              {/* Related Media in Cineclub */}
              {selectedArticle.relatedMediaIds.length > 0 && (
                <div className="pt-8 border-t border-[#12232d] space-y-3">
                  <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#d5c7b3] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B1E1E]" />
                    <span>Títulos Citados no Dossiê (Acesse no Cineclub)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedArticle.relatedMediaIds.map((id) => {
                      const media = catalog.find((c) => c.id === id);
                      if (!media) return null;
                      return (
                        <div
                          key={media.id}
                          onClick={() => {
                            setSelectedArticle(null);
                            onSelectMedia(media);
                          }}
                          className="flex items-center gap-2.5 p-2 bg-[#081216] border border-[#162934] hover:border-[#8B1E1E] rounded-sm cursor-pointer transition-colors"
                        >
                          <img
                            src={media.posterUrl}
                            alt={media.title}
                            className="w-10 h-14 object-cover rounded-sm border border-[#1b3240]"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-[#eee5d6] truncate">
                              {media.title}
                            </h5>
                            <p className="text-[10px] font-mono-code text-[#6a8492]">
                              {media.type} • {media.year}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
