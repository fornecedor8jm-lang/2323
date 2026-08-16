import React from 'react';
import { Search, Bookmark, Film, Tv, Sparkles, BookOpen, Smartphone, X, Cloud } from 'lucide-react';
import { MediaType } from '../types';

export type NavTab = 'home' | 'series' | 'terror' | 'movies' | 'cloud' | 'catalog' | 'recent' | 'watchlist' | 'about';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  watchlistCount: number;
  cloudItemsCount?: number;
  onOpenApkGuide: () => void;
}

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  watchlistCount,
  cloudItemsCount = 0,
  onOpenApkGuide,
}) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Início', icon: Sparkles },
    { id: 'series', label: 'Séries', icon: Tv },
    { id: 'movies', label: 'Filmes', icon: Film },
    { id: 'terror', label: 'Terror', icon: Film },
    { id: 'cloud', label: 'Nuvem', icon: Cloud, badge: cloudItemsCount > 0 ? cloudItemsCount : undefined },
    { id: 'recent', label: 'Adicionados recentemente', icon: Sparkles },
    { id: 'catalog', label: 'Acervo', icon: Film },
    { id: 'watchlist', label: 'Minha lista', icon: Bookmark, badge: watchlistCount },
    { id: 'about', label: 'Sobre', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#05080bee]/90 backdrop-blur-md border-b border-[#14232c] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6">
            <button
              id="cineclub-logo-btn"
              onClick={() => {
                setActiveTab('home');
                setSearchQuery('');
              }}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#8B1E1E] via-[#5c1313] to-[#0d222b] flex items-center justify-center border border-[#a82525]/40 shadow-lg shadow-[#8B1E1E]/20 group-hover:border-[#d93838] transition-colors">
                <span className="font-display font-bold text-xl text-[#f3ece0] tracking-wider">C</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-xl tracking-[0.2em] text-[#f4efe6] group-hover:text-white transition-colors">
                    CINECLUB
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-mono-code bg-[#8B1E1E]/20 border border-[#8B1E1E]/50 text-[#f58a8a] rounded">
                    Catálogo
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#7d939f] font-sans">
                  Filmes e séries para assistir
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-[#14232c]">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'catalog' || item.id === 'home') setSearchQuery('');
                    }}
                    className={`relative px-3.5 py-2 text-xs uppercase tracking-wider font-medium rounded transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#f5ebd9] bg-[#0f1d24] border border-[#203947]'
                        : 'text-[#8da0ab] hover:text-[#e4dbcb] hover:bg-[#0b151a]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono-code font-bold bg-[#8B1E1E] text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#8B1E1E]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <div className={`flex items-center transition-all duration-300 ${
                isSearchOpen ? 'w-64 sm:w-80' : 'w-48 sm:w-64'
              }`}>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f7a88]" />
                  <input
                    id="global-search-input"
                    type="text"
                    placeholder="Buscar filmes, séries, diretores..."
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeTab === 'home' && e.target.value.trim().length > 0) {
                        setActiveTab('catalog');
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-[#081014] border border-[#182b36] focus:border-[#8B1E1E] text-[#ded9ce] placeholder-[#506774] rounded focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5f7a88] hover:text-white"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Watchlist Quick Button for mobile */}
            <button
              id="mobile-watchlist-btn"
              onClick={() => setActiveTab('watchlist')}
              className="relative lg:hidden p-2 rounded bg-[#0b151a] border border-[#1a2d38] text-[#c7beaf] hover:text-white"
              title="Minha Lista"
            >
              <Bookmark className="w-4 h-4" />
              {watchlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B1E1E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* APK / App Showcase Button */}
            <button
              id="apk-guide-btn"
              onClick={onOpenApkGuide}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-semibold text-[#f2dfca] bg-[#12232c] hover:bg-[#8B1E1E] border border-[#234152] hover:border-[#8B1E1E] rounded transition-all shadow-sm"
              title="Visualizar App & Versão APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#e59898]" />
              <span>App APK</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#8da0ab] hover:text-white bg-[#0b151a] border border-[#1a2d38] rounded"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`h-0.5 bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`h-0.5 bg-current transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-current transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#070d11] border-b border-[#1b2f3b] px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
                if (item.id === 'catalog' || item.id === 'home') setSearchQuery('');
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded text-sm uppercase tracking-wider font-medium ${
                activeTab === item.id
                  ? 'bg-[#8B1E1E]/20 text-[#f5ebd9] border border-[#8B1E1E]/40'
                  : 'text-[#96a9b4] hover:bg-[#0d181f] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-[#8B1E1E]" />
                <span>{item.label}</span>
              </div>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-mono-code font-bold bg-[#8B1E1E] text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-2 border-t border-[#162731]">
            <button
              onClick={() => {
                onOpenApkGuide();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs uppercase tracking-wider font-bold text-[#f2dfca] bg-[#8B1E1E] rounded"
            >
              <Smartphone className="w-4 h-4" />
              <span>Guia do Futuro APK Cineclub</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
