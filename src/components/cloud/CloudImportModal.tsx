import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Link as LinkIcon, 
  Upload, 
  QrCode, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Radio, 
  Tv, 
  Film, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone,
  Sliders,
  Server,
  User,
  KeyRound,
  Clock
} from 'lucide-react';
import { parseM3U, SAMPLE_DEMO_M3U } from '../../utils/m3uParser';
import { parseM3uUrl, buildXtreamUrl, maskUrlPassword } from '../../utils/urlParser';
import { CloudMediaItem, CloudSource } from '../../types';

interface CloudImportModalProps {
  isOpen: boolean;
  initialTab?: 'url' | 'file' | 'qr' | 'demo';
  onClose: () => void;
  onImportSuccess: (source: CloudSource, items: CloudMediaItem[], toastMessage?: string) => void;
}

export type CloudImportTab = 'qr' | 'url' | 'file' | 'demo';

export const CloudImportModal: React.FC<CloudImportModalProps> = ({
  isOpen,
  initialTab = 'qr',
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<CloudImportTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [serverInput, setServerInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [typeInput, setTypeInput] = useState('m3u_plus');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // File state
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // QR Pairing state (TV Session)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pairingSessionId, setPairingSessionId] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [pairExpiresIn, setPairExpiresIn] = useState<number>(300); // 5 minutes
  const [isPairingPolling, setIsPairingPolling] = useState(false);
  const [pairStatus, setPairStatus] = useState<'idle' | 'waiting' | 'success' | 'expired'>('idle');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [isSubmittingPair, setIsSubmittingPair] = useState(false);

  // Auto-parse URL in real-time
  const detectedUrl = useMemo(() => {
    if (!urlInput.trim()) return null;
    const parsed = parseM3uUrl(urlInput.trim());
    if (parsed.server || parsed.username) {
      return parsed;
    }
    return null;
  }, [urlInput]);

  // Initialize QR session when opening QR tab
  useEffect(() => {
    if (activeTab === 'qr' && isOpen) {
      initPairSession();
    }
  }, [activeTab, isOpen]);

  // Countdown timer for pairing session (5 minutes)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (activeTab === 'qr' && pairStatus === 'waiting' && pairExpiresIn > 0) {
      timer = setInterval(() => {
        setPairExpiresIn((prev) => {
          if (prev <= 1) {
            setPairStatus('expired');
            setIsPairingPolling(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTab, pairStatus, pairExpiresIn]);

  // Polling loop for TV session (Every 2.5s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTab === 'qr' && pairingSessionId && isPairingPolling && pairStatus === 'waiting') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/cloud/pairing/session/${pairingSessionId}`);
          if (!res.ok) return;

          const data = await res.json();
          if (data.status === 'received') {
            setPairStatus('success');
            setIsPairingPolling(false);

            let rawM3uText = data.content;

            // If URL was provided, fetch through proxy
            if (!rawM3uText && data.url) {
              const proxyRes = await fetch(`/api/cloud/proxy-m3u?url=${encodeURIComponent(data.url)}`);
              if (proxyRes.ok) {
                rawM3uText = await proxyRes.text();
              }
            }

            if (rawM3uText) {
              const sourceId = `src-qr-${Date.now()}`;
              const parsedItems = parseM3U(rawM3uText, sourceId);

              const channelsCount = parsedItems.filter((i) => i.type === 'channel').length;
              const moviesCount = parsedItems.filter((i) => i.type === 'movie').length;
              const seriesCount = parsedItems.filter((i) => i.type === 'series').length;

              const newSource: CloudSource = {
                id: sourceId,
                name: data.name || `Nuvem Pareada (${pairingCode})`,
                type: 'pair',
                url: maskUrlPassword(data.url),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                totalCount: parsedItems.length,
                channelsCount,
                moviesCount,
                seriesCount,
              };

              setTimeout(() => {
                const toast = `Nuvem importada com sucesso: ${channelsCount} canais, ${moviesCount} filmes e ${seriesCount} séries encontradas.`;
                onImportSuccess(newSource, parsedItems, toast);
                onClose();
              }, 1200);
            }
          }
        } catch (e) {
          console.error('Pairing poll error:', e);
          setIsPairingPolling(false);
          setErrorMsg('Atenção: a TV perdeu a conexão com o servidor de pareamento. Gere um novo QR Code ou use a aba Arquivo para importar a lista diretamente.');
        }
      }, 2500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, pairingSessionId, isPairingPolling, pairStatus, pairingCode]);

  if (!isOpen) return null;

  const initPairSession = async () => {
    try {
      setPairStatus('waiting');
      setIsPairingPolling(true);
      setErrorMsg('');

      const res = await fetch('/api/cloud/pairing/session', { method: 'POST' });
      const data = await res.json();

      if (data.pairingCode && data.sessionId) {
        setPairingSessionId(data.sessionId);
        setPairingCode(data.pairingCode);
        setPairExpiresIn(data.expiresInSeconds || 300);

        // Security: The pairing URL contains ONLY the temporary pairing token / code
        const pairFullUrl = `${window.location.origin}/?pairCode=${data.pairingCode}`;
        setQrUrl(pairFullUrl);

        setTimeout(() => {
          if (qrCanvasRef.current) {
            QRCode.toCanvas(qrCanvasRef.current, pairFullUrl, {
              width: 190,
              margin: 1.5,
              color: {
                dark: '#030608',
                light: '#f6eee2',
              },
            });
          }
        }, 100);
      }
    } catch (err: any) {
      setPairStatus('idle');
      setIsPairingPolling(false);
      setErrorMsg('Atenção: não foi possível conectar ao servidor do Cineclub para gerar o QR Code. Verifique a internet e tente novamente. Se continuar, use a aba Arquivo ou URL manual.');
    }
  };

  // 1. Handle URL Import
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let targetUrl = urlInput.trim();
    if (!targetUrl && showAdvancedFields && serverInput && usernameInput && passwordInput) {
      targetUrl = buildXtreamUrl({
        server: serverInput,
        username: usernameInput,
        password: passwordInput,
        type: typeInput,
      });
    }

    if (!targetUrl) {
      setErrorMsg('Por favor, informe a URL da lista M3U.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let rawText = '';

      // First try fetching through backend proxy to avoid CORS
      try {
        const proxyRes = await fetch(`/api/cloud/proxy-m3u?url=${encodeURIComponent(targetUrl)}`);
        if (proxyRes.ok) {
          rawText = await proxyRes.text();
        }
      } catch (proxyErr) {
        console.warn('Proxy failed, trying direct fetch:', proxyErr);
      }

      // If proxy didn't return text, try direct fetch
      if (!rawText) {
        const directRes = await fetch(targetUrl);
        if (directRes.ok) {
          rawText = await directRes.text();
        }
      }

      if (!rawText || (!rawText.includes('#EXTM3U') && !rawText.includes('http'))) {
        throw new Error('Não foi possível ler esta lista. Verifique se o arquivo é M3U ou M3U8 válido.');
      }

      const sourceId = `src-url-${Date.now()}`;
      const parsedItems = parseM3U(rawText, sourceId);

      if (parsedItems.length === 0) {
        throw new Error('Nenhum canal, filme ou série foi encontrado nesta lista.');
      }

      const channelsCount = parsedItems.filter((i) => i.type === 'channel').length;
      const moviesCount = parsedItems.filter((i) => i.type === 'movie').length;
      const seriesCount = parsedItems.filter((i) => i.type === 'series').length;

      const maskedUrl = maskUrlPassword(targetUrl);

      const newSource: CloudSource = {
        id: sourceId,
        name: nameInput.trim() || 'Nuvem M3U',
        type: 'url',
        url: maskedUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalCount: parsedItems.length,
        channelsCount,
        moviesCount,
        seriesCount,
      };

      const successToast = `Nuvem importada com sucesso: ${channelsCount} canais, ${moviesCount} filmes e ${seriesCount} séries encontradas.`;
      onImportSuccess(newSource, parsedItems, successToast);
      onClose();
    } catch (err: any) {
      const message = err instanceof TypeError || err?.message === 'Failed to fetch'
        ? 'Atenção: não foi possível buscar a lista pela internet. Verifique a URL, sua conexão e se o servidor permite acesso externo. Você também pode baixar a lista e usar a aba Arquivo.'
        : (err.message || 'Não foi possível ler esta lista. Verifique se o arquivo é M3U ou M3U8 válido.');
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle File Import
  const handleFileProcess = (file: File) => {
    setIsLoading(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawText = e.target?.result as string;
        if (!rawText || (!rawText.includes('#EXTM3U') && !rawText.includes('#EXTINF'))) {
          throw new Error('Não foi possível ler esta lista. Verifique se o arquivo é M3U ou M3U8 válido.');
        }

        const sourceId = `src-file-${Date.now()}`;
        const parsedItems = parseM3U(rawText, sourceId);

        if (parsedItems.length === 0) {
          throw new Error('Nenhum canal, filme ou série válido encontrado no arquivo.');
        }

        const channelsCount = parsedItems.filter((i) => i.type === 'channel').length;
        const moviesCount = parsedItems.filter((i) => i.type === 'movie').length;
        const seriesCount = parsedItems.filter((i) => i.type === 'series').length;

        const newSource: CloudSource = {
          id: sourceId,
          name: file.name.replace(/\.[^/.]+$/, '') || 'Arquivo M3U Local',
          type: 'file',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalCount: parsedItems.length,
          channelsCount,
          moviesCount,
          seriesCount,
        };

        const successToast = `Nuvem importada com sucesso: ${channelsCount} canais, ${moviesCount} filmes e ${seriesCount} séries encontradas.`;
        onImportSuccess(newSource, parsedItems, successToast);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Não foi possível ler esta lista. Verifique se o arquivo é M3U ou M3U8 válido.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Não foi possível ler este arquivo do dispositivo.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  // 3. Handle Demo Pack Import
  const handleLoadDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const sourceId = `src-demo-${Date.now()}`;
      const parsedItems = parseM3U(SAMPLE_DEMO_M3U, sourceId);

      const channelsCount = parsedItems.filter((i) => i.type === 'channel').length;
      const moviesCount = parsedItems.filter((i) => i.type === 'movie').length;
      const seriesCount = parsedItems.filter((i) => i.type === 'series').length;

      const newSource: CloudSource = {
        id: sourceId,
        name: 'Demonstração Aberta (Canais & Filmes)',
        type: 'sample',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalCount: parsedItems.length,
        channelsCount,
        moviesCount,
        seriesCount,
      };

      const successToast = `Nuvem importada com sucesso: ${channelsCount} canais, ${moviesCount} filmes e ${seriesCount} séries encontradas.`;
      onImportSuccess(newSource, parsedItems, successToast);
      setIsLoading(false);
      onClose();
    }, 400);
  };

  // Submit test pair from this browser
  const handleSimulatePairSubmit = async () => {
    if (!manualCodeInput.trim() || !manualUrlInput.trim()) {
      setErrorMsg('Preencha o código e a URL.');
      return;
    }
    setIsSubmittingPair(true);
    try {
      const res = await fetch(`/api/cloud/pairing/${manualCodeInput.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: manualCodeInput.trim(),
          url: manualUrlInput.trim(),
          name: 'Nuvem Pareada via Teste',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao parear');
      setErrorMsg('');
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmittingPair(false);
    }
  };

  // Format seconds to mm:ss
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#030608]/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#060c10] border border-[#162732] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#081217] border-b border-[#14242f]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#8B1E1E]/20 text-[#8B1E1E] border border-[#8B1E1E]/30 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#f5eee2] tracking-tight">
                Adicionar Nuvem ao Cineclub
              </h2>
              <p className="text-xs text-[#75909e]">
                Configure sua segunda fonte de conteúdos via Celular (QR Code), URL M3U ou Arquivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#718997] hover:text-white hover:bg-[#12222b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-[#14242f] bg-[#050a0d] text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('qr'); setErrorMsg(''); }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'qr'
                ? 'border-[#8B1E1E] text-[#f5eee2] bg-[#0a151b]'
                : 'border-transparent text-[#77919f] hover:text-[#d3c8b7]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#8B1E1E]" />
            <span className="hidden sm:inline">Configurar pelo Celular</span>
            <span className="sm:hidden">Celular</span>
          </button>

          <button
            onClick={() => { setActiveTab('url'); setErrorMsg(''); }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'url'
                ? 'border-[#8B1E1E] text-[#f5eee2] bg-[#0a151b]'
                : 'border-transparent text-[#77919f] hover:text-[#d3c8b7]'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Colar URL M3U</span>
            <span className="sm:hidden">URL</span>
          </button>

          <button
            onClick={() => { setActiveTab('file'); setErrorMsg(''); }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-[#8B1E1E] text-[#f5eee2] bg-[#0a151b]'
                : 'border-transparent text-[#77919f] hover:text-[#d3c8b7]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar Arquivo</span>
            <span className="sm:hidden">Arquivo</span>
          </button>

          <button
            onClick={() => { setActiveTab('demo'); setErrorMsg(''); }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'demo'
                ? 'border-[#8B1E1E] text-[#f5eee2] bg-[#0a151b]'
                : 'border-transparent text-[#77919f] hover:text-[#d3c8b7]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Demonstração</span>
            <span className="sm:hidden">Demo</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#8B1E1E]/20 border border-[#8B1E1E]/50 text-xs text-[#f7b0b0] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#f57575] mt-0.5" />
              <div>
                <span className="font-bold block">Atenção</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* TAB 1: CONFIGURAR PELO CELULAR USANDO QR CODE (TV VIEW) */}
          {activeTab === 'qr' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-[#081217] border border-[#162732] shadow-inner">
                
                {/* QR Code Canvas */}
                <div className="p-3 rounded-xl bg-white shadow-2xl flex flex-col items-center shrink-0 border-2 border-white">
                  <canvas ref={qrCanvasRef} className="w-44 h-44 rounded" />
                  <span className="text-[11px] font-mono-code font-bold text-black tracking-widest mt-1.5">
                    {pairingCode || 'GERANDO...'}
                  </span>
                </div>

                <div className="space-y-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono-code tracking-[0.2em] text-[#8B1E1E] font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Pareamento Temporário & Seguro
                    </span>
                    <h3 className="font-display font-black text-2xl text-[#f6eee2] tracking-tight">
                      Código: <span className="text-[#8B1E1E] tracking-widest">{pairingCode}</span>
                    </h3>
                  </div>

                  <p className="text-xs text-[#95abb8] leading-relaxed">
                    Escaneie este QR Code com o celular para adicionar sua Nuvem. O código expira em 5 minutos.
                  </p>

                  {/* Status indicator & Countdown */}
                  <div className="flex items-center gap-3 text-xs font-mono-code pt-1">
                    {pairStatus === 'waiting' && (
                      <>
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>Aguardando envio pelo celular...</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#839fae]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatCountdown(pairExpiresIn)}</span>
                        </div>
                      </>
                    )}

                    {pairStatus === 'success' && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded border border-green-500/30 font-bold animate-pulse">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>Nuvem adicionada com sucesso. Processando catálogo...</span>
                      </div>
                    )}

                    {pairStatus === 'expired' && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Código expirado.</span>
                        <button
                          onClick={initPairSession}
                          className="underline hover:text-white font-bold"
                        >
                          Gerar novo código
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* In-browser test simulator */}
              <div className="p-3.5 rounded-lg bg-[#070e12] border border-[#13222b] space-y-2.5">
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#7e97a5] block">
                  Ou teste o envio sem celular por este navegador:
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Código (ex: 8H4K2P)"
                    value={manualCodeInput || pairingCode}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    className="w-full sm:w-36 px-3 py-2 text-xs bg-[#0a1419] border border-[#1b313e] text-[#f6eee2] rounded focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="http://servidor.exemplo/get.php?username=240624&password=240624&type=m3u_plus"
                    value={manualUrlInput}
                    onChange={(e) => setManualUrlInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#0a1419] border border-[#1b313e] text-[#f6eee2] rounded focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSimulatePairSubmit}
                    disabled={isSubmittingPair}
                    className="px-4 py-2 bg-[#12232d] hover:bg-[#8B1E1E] text-xs font-bold uppercase tracking-wider text-[#f4efe5] rounded transition-colors"
                  >
                    Transmitir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLAR URL M3U */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlImport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9fb3bf]">
                  URL Completa da Lista M3U / M3U8
                </label>
                <textarea
                  rows={2}
                  placeholder="http://servidor.exemplo/get.php?username=240624&password=240624&type=m3u_plus"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none resize-none"
                />
                <span className="text-[11px] text-[#637d8b] block">
                  O sistema reconhece automaticamente o servidor, usuário, senha e tipo de lista. A senha será mascarada.
                </span>
              </div>

              {/* Detected Realtime URL info */}
              {detectedUrl && (
                <div className="p-3.5 rounded-lg bg-[#050c10] border border-[#152a36] space-y-2">
                  <span className="text-[10px] font-mono-code uppercase tracking-widest text-green-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                    Parâmetros Identificados Automaticamente
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-code">
                    <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                      <span className="text-[#627e8d] block text-[9px] uppercase">Servidor:</span>
                      <span className="text-[#f5ebd9] truncate block">{detectedUrl.server || 'N/D'}</span>
                    </div>
                    <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                      <span className="text-[#627e8d] block text-[9px] uppercase">Usuário:</span>
                      <span className="text-[#f5ebd9] truncate block">{detectedUrl.username || 'N/D'}</span>
                    </div>
                    <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                      <span className="text-[#627e8d] block text-[9px] uppercase">Senha:</span>
                      <span className="text-[#84a1b0] tracking-widest block font-bold">••••••</span>
                    </div>
                    <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                      <span className="text-[#627e8d] block text-[9px] uppercase">Tipo:</span>
                      <span className="text-[#f5ebd9] truncate block">{detectedUrl.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced fields toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="text-xs text-[#809ba9] hover:text-[#f4ebd9] flex items-center gap-1.5 font-mono-code"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{showAdvancedFields ? 'Ocultar campos separados' : 'Preencher Servidor / Usuário / Senha separadamente (Avançado)'}</span>
                </button>
              </div>

              {/* Advanced Separate Fields */}
              {showAdvancedFields && (
                <div className="p-3.5 rounded-lg bg-[#070e13] border border-[#132531] space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1">
                      <Server className="w-3 h-3 text-[#8B1E1E]" />
                      <span>Servidor (Host:Porta)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="servidor.exemplo:8080"
                      value={serverInput}
                      onChange={(e) => setServerInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] text-[#f6eee2] rounded focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#8B1E1E]" />
                        <span>Usuário</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Usuário"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] text-[#f6eee2] rounded focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[#8B1E1E]" />
                        <span>Senha</span>
                      </label>
                      <input
                        type="password"
                        placeholder="Senha"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] text-[#f6eee2] rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9fb3bf]">
                  Identificação / Nome da Nuvem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Minha Lista Pessoal"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-[0.99] disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#8B1E1E]/20"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processando e organizando catálogo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Carregar e Adicionar à Nuvem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: IMPORTAR ARQUIVO M3U */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".m3u,.m3u8,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  dragActive
                    ? 'border-[#8B1E1E] bg-[#8B1E1E]/10'
                    : 'border-[#1b313e] hover:border-[#8B1E1E]/60 bg-[#081217]'
                }`}
              >
                <div className="p-3.5 rounded-full bg-[#10212b] text-[#8B1E1E] border border-[#1f3a4b]">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="font-display font-bold text-sm text-[#f5eee2] block">
                    Clique para selecionar ou arraste o arquivo .M3U aqui
                  </span>
                  <span className="text-xs text-[#6e8897] block">
                    Suporta arquivos .m3u, .m3u8 ou listas estruturadas com cabeçalho #EXTM3U
                  </span>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-[#12232d] hover:bg-[#1a3443] border border-[#213f51] text-xs uppercase tracking-wider font-semibold text-[#f1e6d4] rounded-lg"
                >
                  Procurar no Dispositivo
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: INSTANT DEMO PACK */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#0c181f] to-[#060c10] border border-[#1c3543] space-y-3">
                <div className="flex items-center gap-2 text-[#8B1E1E]">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-display font-bold text-sm uppercase tracking-wider text-[#f5ebd8]">
                    Pacote Aberto de Demonstração
                  </span>
                </div>
                <p className="text-xs text-[#95abb7] leading-relaxed">
                  Carregue instantaneamente uma lista de teste com canais públicos abertos (TV Brasil, TV Cultura, NASA TV, Red Bull TV) e obras clássicas em domínio público (Nosferatu, A Noite dos Mortos-Vivos, Além da Imaginação) organizados em <strong>Canais</strong>, <strong>Filmes</strong> e <strong>Séries</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono-code text-[11px] text-[#718b99]">
                  <div className="p-2 rounded bg-[#070e13] border border-[#142631] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#8B1E1E]" />
                    <span>5 Canais Ao Vivo</span>
                  </div>
                  <div className="p-2 rounded bg-[#070e13] border border-[#142631] flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#8B1E1E]" />
                    <span>3 Filmes Cult</span>
                  </div>
                  <div className="p-2 rounded bg-[#070e13] border border-[#142631] flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-[#8B1E1E]" />
                    <span>Série Clássica</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadDemo}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#8B1E1E]/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Carregar Demonstração Agora</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
