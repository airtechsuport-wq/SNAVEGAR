import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem('snavegar_install_dismissed')) {
      return;
    }

    // iOS Detection
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIos && !isStandalone) {
      // Show iOS specific instructions
      setShowIOSPrompt(true);
    }

    // Android/Chrome/Edge Detection
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowAndroidPrompt(false);
    }
  };

  const dismiss = () => {
    setIsDismissed(true);
    setShowAndroidPrompt(false);
    setShowIOSPrompt(false);
    sessionStorage.setItem('snavegar_install_dismissed', 'true');
  };

  if (isDismissed || (!showAndroidPrompt && !showIOSPrompt)) return null;

  return (
    <>
      {/* Android / Desktop Prompt */}
      {showAndroidPrompt && (
        <div className="fixed top-4 left-4 right-4 z-[100] p-4 bg-black text-white shadow-2xl rounded-2xl flex items-center justify-between animate-fade-in-down md:hidden border border-white/10">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
              <Download size={24} />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">Instalar SNavegar</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Acesso rápido e offline</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleInstallClick}
              className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-95 transition-all"
            >
              Instalar
            </button>
            <button 
              onClick={dismiss}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* iOS Prompt (Tooltip Style) */}
      {showIOSPrompt && (
        <div className="fixed bottom-24 left-6 right-6 z-[100] bg-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 animate-fade-in-up md:hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <PlusSquare size={22} />
                </div>
                <div>
                    <span className="font-bold text-base block leading-tight">Instalar App</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">No seu iPhone</span>
                </div>
            </div>
            <button onClick={dismiss} className="bg-surface hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X size={18} />
            </button>
          </div>
          <div className="text-sm text-gray-600 space-y-4">
            <p className="font-medium text-gray-500">Siga estes passos para adicionar à tela de início:</p>
            <div className="flex items-center space-x-3 bg-surface p-3 rounded-2xl border border-black/5">
                <div className="bg-white p-2 rounded-xl shadow-sm text-gray-800"><Share size={16} /></div>
                <span className="text-sm font-semibold text-gray-700">Toque no botão <strong className="text-black">Compartilhar</strong></span>
            </div>
            <div className="flex items-center space-x-3 bg-surface p-3 rounded-2xl border border-black/5">
                <div className="bg-white p-2 rounded-xl shadow-sm text-gray-800"><PlusSquare size={16} /></div>
                <span className="text-sm font-semibold text-gray-700">Selecione <strong className="text-black">Adicionar à Tela de Início</strong></span>
            </div>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-black/5"></div>
        </div>
      )}

      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default InstallPrompt;