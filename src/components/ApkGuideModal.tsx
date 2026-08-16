import React from 'react';
import { Smartphone, Check, Download, Shield, Sparkles, X, Layers, Star, Bookmark, BookOpen, ExternalLink } from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-[#030608]/92 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#060c10] border border-[#1b3443] rounded-sm shadow-2xl overflow-hidden text-[#ded7c8] my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#071116] border-b border-[#142631]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#8B1E1E]/20 text-[#f58a8a] border border-[#8B1E1E]/40 rounded-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-[#f6eee2]">
                Guia de Especificações do App / APK Cineclub
              </h2>
              <p className="text-xs text-[#75909e] font-sans">
                Diretrizes de design e arquitetura mobile para Android / PWA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#728d9c] hover:text-white bg-[#0e1d25] hover:bg-[#8B1E1E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-sm leading-relaxed">
          
          {/* Visual Identity Summary Card */}
          <div className="p-4 sm:p-5 bg-[#08151c] border-l-4 border-[#8B1E1E] rounded-r-sm space-y-2">
            <h3 className="font-display font-bold text-base text-[#f5ecd8]">
              Diretriz Visual Oficial do Streaming Mobile
            </h3>
            <p className="font-cinematic text-lg text-[#b8cbd6] italic">
              “A plataforma mantém estritamente a mesma experiência de streaming: fundo escuro em alto contraste, pôsteres verticais, navegação ágil por temporadas e episódios, filtros por gênero, Minha Lista persistente e acesso direto aos servidores de transmissão.”
            </p>
          </div>

          {/* Core App Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#081216] border border-[#142733] rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#6de0d6]">
                <Layers className="w-4 h-4" />
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#eee3d1]">
                  Fundo Escuro & Alto Contraste
                </h4>
              </div>
              <p className="text-xs text-[#8ca2b0]">
                Uso das cores #05080b, #070e12, acentos em carmesim queimado (#8B1E1E) e tipografia em tons creme para não cansar a visão em maratonas noturnas.
              </p>
            </div>

            <div className="p-4 bg-[#081216] border border-[#142733] rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#e5ba72]">
                <Bookmark className="w-4 h-4" />
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#eee3d1]">
                  Área Personalizada "Minha Lista"
                </h4>
              </div>
              <p className="text-xs text-[#8ca2b0]">
                Armazenamento local persistente de títulos favoritos e acesso instantâneo com um toque para continuar assistindo.
              </p>
            </div>

            <div className="p-4 bg-[#081216] border border-[#142733] rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#f58a8a]">
                <BookOpen className="w-4 h-4" />
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#eee3d1]">
                  Informações & Sinopse Detalhada
                </h4>
              </div>
              <p className="text-xs text-[#8ca2b0]">
                Fichas completas com notas IMDb, elenco, temporadas, episódios, anos de lançamento e classificação indicativa.
              </p>
            </div>

            <div className="p-4 bg-[#081216] border border-[#142733] rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#5ae88a]">
                <Shield className="w-4 h-4" />
                <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-[#eee3d1]">
                  Acesso Direto a 100+ Servidores
                </h4>
              </div>
              <p className="text-xs text-[#8ca2b0]">
                Pastas organizadas de Google Drive, Google Photos, YouTube e servidores em nuvem para reprodução rápida em alta definição.
              </p>
            </div>
          </div>

          {/* Quick Install Guide as PWA / Mobile */}
          <div className="p-4 bg-[#0a1720] border border-[#1c3848] rounded-sm space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#ebdcc6] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B1E1E]" />
              <span>Como Instalar o Cineclub no seu Celular Agora (Modo App)</span>
            </h4>
            <div className="space-y-2 text-xs text-[#95aab7]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#112633] text-[#71e2d6] flex items-center justify-center font-mono-code shrink-0">1</span>
                <p>Abra este site no Chrome ou Safari do seu smartphone Android ou iOS.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#112633] text-[#71e2d6] flex items-center justify-center font-mono-code shrink-0">2</span>
                <p>Toque no menu de opções do navegador (três pontos ou botão de compartilhar).</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#112633] text-[#71e2d6] flex items-center justify-center font-mono-code shrink-0">3</span>
                <p>Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong> para usar como APK nativo em tela cheia.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#071116] border-t border-[#142631] flex items-center justify-between">
          <span className="text-[11px] font-mono-code text-[#627c8a]">
            Cineclub Mobile Core v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8B1E1E] hover:bg-[#a62424] text-white text-xs font-bold uppercase tracking-wider rounded-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
