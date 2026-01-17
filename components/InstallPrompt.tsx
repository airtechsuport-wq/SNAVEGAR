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
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-primary text-white shadow-xl flex items-center justify-between animate-fade-in md:hidden">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Instalar App</p>
              <p className="text-xs text-blue-100 opacity-90">Adicione à tela inicial para acesso rápido</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleInstallClick}
              className="bg-white text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm hover:bg-gray-50 active:scale-95 transition-transform"
            >
              Instalar
            </button>
            <button 
              onClick={dismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* iOS Prompt (Tooltip Style) */}
      {showIOSPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 animate-fade-in md:hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2 text-primary">
                <PlusSquare size={20} />
                <span className="font-bold text-sm">Instalar SNavegar</span>
            </div>
            <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
            </button>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Instale este app no seu iPhone para a melhor experiência:</p>
            <div className="flex items-center space-x-2">
                <span className="bg-gray-100 p-1.5 rounded text-gray-800"><Share size={14} /></span>
                <span>Toque no botão <strong>Compartilhar</strong></span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="bg-gray-100 p-1.5 rounded text-gray-800"><PlusSquare size={14} /></span>
                <span>Selecione <strong>Adicionar à Tela de Início</strong></span>
            </div>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;