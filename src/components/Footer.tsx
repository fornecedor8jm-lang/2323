import React from 'react';
import { Film, Sparkles, BookOpen, Bookmark, ShieldCheck, Heart, Smartphone } from 'lucide-react';
import { NavTab } from './Navbar';

interface FooterProps {
  onSelectCategory: (tab: NavTab) => void;
  onOpenApkGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenApkGuide }) => {
  return (
    <footer className="bg-[#040709] border-t border-[#101e26] text-[#869da9] text-xs pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#0e1b22]">
          
          {/* Brand & Manifesto */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-[#8B1E1E] to-[#0e2430] flex items-center justify-center border border-[#8B1E1E]/50">
                <span className="font-display font-bold text-base text-white">C</span>
              </div>
              <span className="font-display font-black text-lg tracking-[0.2em] text-[#f2ebd9]">
                CINECLUB
              </span>
            </div>

            <p className="font-editorial text-base text-[#9fb3bf] italic leading-relaxed max-w-md">
              Plataforma independente de filmes e séries com estética de cinema, horror gótico, produções cult e acesso direto aos servidores em alta definição.
            </p>

            <div className="flex items-center gap-4 text-[11px] font-mono-code text-[#607986] pt-1">
              <span>41+ Obras Catalogadas</span>
              <span>•</span>
              <span>105+ Links de Acesso Direto</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#d5c7b4]">
              Navegação do Acervo
            </h4>
            <ul className="space-y-1.5 font-sans">
              <li>
                <button
                  onClick={() => onSelectCategory('home')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Início / Destaque Principal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('series')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Séries & Maratonas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('terror')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Terror & Sobrenatural
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('cloud')}
                  className="hover:text-[#f4ebd9] transition-colors flex items-center gap-1.5 text-[#f0dfcc]"
                >
                  <span>Nuvem (Segunda Fonte)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('movies')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Filmes em Destaque
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('recent')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Adicionados Recentemente
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('catalog')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Acervo Completo
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('watchlist')}
                  className="hover:text-[#f4ebd9] transition-colors"
                >
                  Minha Lista Personalizada
                </button>
              </li>
            </ul>
          </div>

          {/* Editorial & App */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-[#d5c7b4]">
              Sobre & Aplicativo
            </h4>
            <ul className="space-y-1.5 font-sans">
              <li>
                <button
                  onClick={() => onSelectCategory('about')}
                  className="hover:text-[#f4ebd9] transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#8B1E1E]" />
                  <span>Sobre o Cineclub</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenApkGuide}
                  className="hover:text-[#f4ebd9] transition-colors flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#8B1E1E]" />
                  <span>Versão Mobile & Futuro APK</span>
                </button>
              </li>
            </ul>

            <div className="p-3 bg-[#071116] border border-[#12232c] rounded-sm mt-3">
              <p className="text-[11px] text-[#6d8593] leading-normal font-sans">
                Os links de reprodução direcionam para pastas do Google Drive, Google Photos, YouTube e servidores em nuvem organizados pelo acervo.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono-code text-[#556e7c]">
          <p>© 2026 Cineclub — Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5">
            <span>Estética Cinematográfica</span>
            <span>•</span>
            <span className="text-[#8B1E1E]">Catálogo Cineclub.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
