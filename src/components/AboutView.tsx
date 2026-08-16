import React from 'react';
import { Film, Shield, Smartphone, Tv, Sparkles, CheckCircle2, Bookmark, FolderHeart, Info, ArrowRight } from 'lucide-react';

interface AboutViewProps {
  onExploreCatalog: () => void;
  onOpenRecent: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onExploreCatalog, onOpenRecent }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-[#142631] pb-8 space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 text-[#8B1E1E] bg-[#8B1E1E]/10 px-3 py-1 border border-[#8B1E1E]/30 rounded-sm">
          <Film className="w-4 h-4" />
          <span className="text-xs uppercase font-mono-code tracking-[0.25em] font-bold">
            Sobre o Cineclub
          </span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#f6eee2] tracking-tight">
          Catálogo Independente & Experiência Mobile
        </h1>
        <p className="font-cinematic text-xl sm:text-2xl text-[#9cb0bd] italic max-w-3xl">
          Plataforma dedicada a filmes, séries, horror gótico, suspense e histórias sobrenaturais com links diretos em alta definição.
        </p>
      </div>

      {/* Main Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1 */}
        <div className="p-6 bg-[#070e12] border border-[#142631] rounded-sm space-y-3">
          <div className="flex items-center gap-3 text-[#f58a8a]">
            <div className="p-2 bg-[#8B1E1E]/20 border border-[#8B1E1E]/40 rounded-sm">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#f4ede0]">
              Identidade Visual Cinematográfica
            </h3>
          </div>
          <p className="text-sm text-[#94abb8] leading-relaxed">
            O Cineclub combina tons de azul-petróleo escuro, preto azulado, vermelho queimado e tipografia em tons creme, criando um ambiente noturno elegante, imersivo e sem distrações visuais.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 bg-[#070e12] border border-[#142631] rounded-sm space-y-3">
          <div className="flex items-center gap-3 text-[#6de0d6]">
            <div className="p-2 bg-[#122e3b] border border-[#1d4c62] rounded-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#f4ede0]">
              Versão Web e Futuro APK Android
            </h3>
          </div>
          <p className="text-sm text-[#94abb8] leading-relaxed">
            A versão mobile e o aplicativo para Android mantêm estritamente a mesma organização, as mesmas cores e a mesma facilidade de navegação do site, adaptados para telas de toque com respostas rápidas.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 bg-[#070e12] border border-[#142631] rounded-sm space-y-3">
          <div className="flex items-center gap-3 text-[#e5ba72]">
            <div className="p-2 bg-[#2d2211] border border-[#523d1d] rounded-sm">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#f4ede0]">
              Minha Lista & Favoritos
            </h3>
          </div>
          <p className="text-sm text-[#94abb8] leading-relaxed">
            Salve suas séries e filmes preferidos para acessar instantaneamente com um clique. A lista é mantida salva no seu dispositivo para consultas rápidas.
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-6 bg-[#070e12] border border-[#142631] rounded-sm space-y-3">
          <div className="flex items-center gap-3 text-[#5ae88a]">
            <div className="p-2 bg-[#10291c] border border-[#1c4b31] rounded-sm">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#f4ede0]">
              Mais de 100 Links de Acesso Direto
            </h3>
          </div>
          <p className="text-sm text-[#94abb8] leading-relaxed">
            Acesso organizado a pastas completas em nuvem (Google Drive, Google Photos, YouTube e servidores diretos) para assistir com reprodução estável.
          </p>
        </div>

      </div>

      {/* How it Works Banner */}
      <div className="p-6 sm:p-8 bg-[#09151c] border-l-4 border-[#8B1E1E] rounded-r-sm space-y-4">
        <h3 className="font-display font-bold text-xl text-[#f6eee2]">
          Como Funciona o Cineclub
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <span className="text-xs font-mono-code text-[#8B1E1E] font-bold">PASSO 1</span>
            <h4 className="font-semibold text-sm text-[#eae2d3]">Navegue pelo Catálogo</h4>
            <p className="text-xs text-[#8da2b0]">Escolha por seções temáticas, séries, terror, filmes ou use a busca instantânea.</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono-code text-[#8B1E1E] font-bold">PASSO 2</span>
            <h4 className="font-semibold text-sm text-[#eae2d3]">Veja os Detalhes</h4>
            <p className="text-xs text-[#8da2b0]">Consulte sinopse oficial, nota IMDb, elenco, temporadas disponíveis e informações técnicas.</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono-code text-[#8B1E1E] font-bold">PASSO 3</span>
            <h4 className="font-semibold text-sm text-[#eae2d3]">Acesse os Links</h4>
            <p className="text-xs text-[#8da2b0]">Abra as temporadas ou episódios desejados diretamente na nuvem em alta qualidade.</p>
          </div>
        </div>
      </div>

      {/* Call to actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[#070e12] border border-[#142631] rounded-sm">
        <div>
          <h4 className="font-display font-bold text-base text-[#f4ece0]">
            Pronto para maratonar?
          </h4>
          <p className="text-xs text-[#849ca9]">
            Explore os títulos recém-adicionados ou consulte o acervo completo.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenRecent}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
          >
            Ver Adicionados Recentemente
          </button>
          <button
            onClick={onExploreCatalog}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#0e1d25] hover:bg-[#152a36] text-[#ded7c8] text-xs font-bold uppercase tracking-wider rounded-sm border border-[#1b3443] transition-colors"
          >
            Explorar Acervo
          </button>
        </div>
      </div>

    </div>
  );
};
