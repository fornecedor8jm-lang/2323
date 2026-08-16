import React, { useState, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Smartphone, 
  Send, 
  Link as LinkIcon, 
  Sliders, 
  Upload,
  Lock,
  Server,
  User,
  KeyRound,
  Tv
} from 'lucide-react';
import { parseM3uUrl, buildXtreamUrl } from '../../utils/urlParser';

interface MobilePairPortalProps {
  pairCode: string;
  onClose: () => void;
}

type InputMode = 'smart_url' | 'credentials' | 'file';

export const MobilePairPortal: React.FC<MobilePairPortalProps> = ({
  pairCode,
  onClose,
}) => {
  const [mode, setMode] = useState<InputMode>('smart_url');

  // Smart URL mode
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Separate credentials mode
  const [serverInput, setServerInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [typeInput, setTypeInput] = useState('m3u_plus');

  // File mode
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Real-time URL parse detection
  const detected = useMemo(() => {
    if (!urlInput.trim()) return null;
    const parsed = parseM3uUrl(urlInput.trim());
    if (parsed.server || parsed.username) {
      return parsed;
    }
    return null;
  }, [urlInput]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const codeClean = pairCode.toUpperCase().trim();
      let bodyPayload: any = {
        code: codeClean,
        name: nameInput.trim() || 'Nuvem Celular',
      };

      if (mode === 'smart_url') {
        if (!urlInput.trim()) {
          throw new Error('Cole a URL da lista M3U.');
        }
        bodyPayload.url = urlInput.trim();
      } else if (mode === 'credentials') {
        if (!serverInput.trim() || !usernameInput.trim() || !passwordInput.trim()) {
          throw new Error('Preencha Servidor, Usuário e Senha.');
        }
        bodyPayload.server = serverInput.trim();
        bodyPayload.username = usernameInput.trim();
        bodyPayload.password = passwordInput.trim();
        bodyPayload.type = typeInput;
        bodyPayload.url = buildXtreamUrl({
          server: serverInput,
          username: usernameInput,
          password: passwordInput,
          type: typeInput,
        });
      } else if (mode === 'file') {
        if (!fileContent.trim()) {
          throw new Error('Selecione um arquivo M3U válido no seu celular.');
        }
        bodyPayload.content = fileContent;
        bodyPayload.name = nameInput.trim() || selectedFileName || 'Lista do Celular';
      }

      // Send to both REST endpoints for maximum reliability
      const res = await fetch(`/api/cloud/pairing/${codeClean}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao parear lista com a TV.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      const message = err instanceof TypeError || err?.message === 'Failed to fetch'
        ? 'Atenção: não foi possível conectar ao servidor do Cineclub. Verifique a internet, confirme o código da TV e tente enviar novamente. Se continuar, use a importação manual na própria TV.'
        : (err.message || 'Erro ao enviar lista para a TV.');
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#030608]/95 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-[#070e13] border border-[#1a313f] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xl my-auto">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-[#132531] pb-4">
          <div className="w-12 h-12 rounded-xl bg-[#8B1E1E]/20 border border-[#8B1E1E]/40 text-[#8B1E1E] flex items-center justify-center mx-auto shadow-lg shadow-[#8B1E1E]/10">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono-code tracking-[0.2em] text-[#8B1E1E] font-bold block">
              Cineclub TV Sync
            </span>
            <h2 className="font-display font-black text-2xl text-[#f6eee2] tracking-tight">
              Adicionar Nuvem ao Cineclub
            </h2>
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="text-xs text-[#7f98a7]">Conectando à TV:</span>
              <span className="text-xs font-mono-code font-bold text-white bg-[#11232d] px-2.5 py-0.5 rounded border border-[#203a49]">
                {pairCode}
              </span>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-6 rounded-xl bg-[#09181f] border border-green-500/40 text-center space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/30">
              <Check className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-[#f5eee2]">
                Nuvem enviada para a TV!
              </h3>
              <p className="text-xs text-[#8ca4b3] leading-relaxed max-w-sm mx-auto">
                Sua TV já recebeu a configuração e está processando o catálogo de Canais, Filmes e Séries. Você já pode fechar esta página.
              </p>
            </div>

            <div className="p-3 bg-[#050e13] rounded-lg border border-[#132836] flex items-center justify-center gap-2 text-xs text-green-400 font-mono-code">
              <Tv className="w-4 h-4" />
              <span>Sincronização concluída com a TV</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#8B1E1E] hover:bg-[#a62424] text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg"
            >
              Concluir & Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-[#8B1E1E]/20 border border-[#8B1E1E]/50 text-xs text-[#f8a8a8] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#f57575] mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 bg-[#04080b] p-1 rounded-lg border border-[#132531] text-[11px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setMode('smart_url')}
                className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'smart_url'
                    ? 'bg-[#8B1E1E] text-white shadow'
                    : 'text-[#7e99a8] hover:text-[#e4d7c5]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Colar URL</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('credentials')}
                className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'credentials'
                    ? 'bg-[#8B1E1E] text-white shadow'
                    : 'text-[#7e99a8] hover:text-[#e4d7c5]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Dados</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('file')}
                className={`py-2 px-1 rounded flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'file'
                    ? 'bg-[#8B1E1E] text-white shadow'
                    : 'text-[#7e99a8] hover:text-[#e4d7c5]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Arquivo</span>
              </button>
            </div>

            {/* OPTION 1: SMART URL PASTE WITH AUTO DETECTION */}
            {mode === 'smart_url' && (
              <div className="space-y-3.5 animate-in fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd]">
                    URL da M3U / M3U8
                  </label>
                  <textarea
                    rows={2}
                    placeholder="http://servidor.exemplo/get.php?username=240624&password=240624&type=m3u_plus"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none resize-none"
                  />
                  <span className="text-[11px] text-[#658190] block">
                    Cole o link completo. O Cineclub detecta o servidor, usuário e senha automaticamente.
                  </span>
                </div>

                {/* Auto-detected params preview */}
                {detected && (
                  <div className="p-3.5 rounded-lg bg-[#050c10] border border-[#152a36] space-y-2 animate-in fade-in">
                    <span className="text-[10px] font-mono-code uppercase tracking-widest text-green-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                      Parâmetros Identificados com Sucesso
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                      {detected.server && (
                        <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                          <span className="text-[#627e8d] block text-[9px] uppercase">Servidor:</span>
                          <span className="text-[#f5ebd9] truncate block">{detected.server}</span>
                        </div>
                      )}
                      {detected.username && (
                        <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                          <span className="text-[#627e8d] block text-[9px] uppercase">Usuário:</span>
                          <span className="text-[#f5ebd9] truncate block">{detected.username}</span>
                        </div>
                      )}
                      {detected.password && (
                        <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                          <span className="text-[#627e8d] block text-[9px] uppercase">Senha:</span>
                          <span className="text-[#84a1b0] tracking-widest block font-bold">••••••••</span>
                        </div>
                      )}
                      {detected.type && (
                        <div className="p-2 rounded bg-[#09161d] border border-[#162934]">
                          <span className="text-[#627e8d] block text-[9px] uppercase">Tipo:</span>
                          <span className="text-[#f5ebd9] truncate block">{detected.type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OPTION 2: SEPARATE CREDENTIALS (ADVANCED) */}
            {mode === 'credentials' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="space-y-1">
                  <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#8B1E1E]" />
                    <span>Servidor (Host:Porta)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ex: servidor.exemplo:8080"
                    value={serverInput}
                    onChange={(e) => setServerInput(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8B1E1E]" />
                      <span>Usuário</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Seu usuário"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#8B1E1E]" />
                      <span>Senha</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Sua senha"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd]">
                    Tipo de Formato
                  </label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] rounded-lg focus:outline-none"
                  >
                    <option value="m3u_plus">M3U Plus (Completo com Grupos & Logos)</option>
                    <option value="m3u8">M3U8 HLS Padrão</option>
                  </select>
                </div>
              </div>
            )}

            {/* OPTION 3: FILE UPLOAD FROM PHONE */}
            {mode === 'file' && (
              <div className="space-y-3 animate-in fade-in">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-[#1d3646] hover:border-[#8B1E1E] rounded-xl text-center cursor-pointer bg-[#081217] space-y-2 transition-colors"
                >
                  <Upload className="w-7 h-7 text-[#8B1E1E] mx-auto" />
                  <span className="font-display font-bold text-xs text-[#f5eee2] block">
                    {selectedFileName ? selectedFileName : 'Toque para selecionar a lista (.M3U/.M3U8)'}
                  </span>
                  <span className="text-[10px] text-[#6b8593] block">
                    Envie o arquivo direto da memória do seu smartphone
                  </span>
                </div>
              </div>
            )}

            {/* Source Name Optional */}
            <div className="space-y-1">
              <label className="block text-xs font-mono-code uppercase tracking-wider text-[#9db1bd]">
                Nome da Lista (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Minha Nuvem Pessoal"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#091318] border border-[#1b313e] focus:border-[#8B1E1E] text-[#f6eee2] placeholder-[#4f6775] rounded-lg focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#8B1E1E] hover:bg-[#a62424] active:scale-[0.99] disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-[#8B1E1E]/20"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitindo para a TV...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Adicionar à TV</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 text-xs text-[#718a97] hover:text-[#c4b6a2] transition-colors"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
