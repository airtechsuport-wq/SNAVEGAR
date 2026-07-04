import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import RecordForm from './pages/RecordForm';
import RecordList from './pages/RecordList';
import RecordDetail from './pages/RecordDetail';
import Analytics from './pages/Analytics';
import { supabase } from './services/supabaseClient';
import { RecordProvider } from './contexts/RecordContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      console.log("🚀 Iniciando App com verificação de segurança...");
      
      // Promessa de Timeout: Rejeita se demorar mais de 2s
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_SUPABASE')), 2000)
      );

      try {
        if (!supabase) {
            console.warn("Supabase não configurado (URL inválida). Modo Offline ativo.");
            throw new Error("Supabase não inicializado");
        }

        // Corrida: Quem responder primeiro ganha (O banco ou o relógio)
        const { data } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any;

        if (data?.session) {
          console.log("✅ Sessão válida encontrada.");
          setIsAuthenticated(true);
        } else {
          console.log("ℹ️ Nenhuma sessão ativa.");
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        console.warn("⚠️ Modo Offline:", error.message || error);
        setIsAuthenticated(false);
      } finally {
        // GARANTIA ABSOLUTA QUE O LOADING VAI SUMIR
        setLoading(false);
      }
    };

    initApp();

    // Listener de Auth (apenas se o supabase estiver configurado)
    let authListener: any = null;
    if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) setIsAuthenticated(true);
            if (event === 'SIGNED_OUT') setIsAuthenticated(false);
        });
        authListener = data;
    }

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
        if (supabase) await supabase.auth.signOut();
    } catch (e) {
        console.error("Erro ao sair (possível offline):", e);
    }
    setIsAuthenticated(false);
  };

  if (loading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-primary animate-fade-in">
            <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 bg-white rounded-full shadow-soft flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">SNavegar</h1>
            <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-gray-400">Conectando ao sistema</span>
            <p className="text-xs text-gray-400 mt-8 opacity-50">Se demorar, entraremos em modo offline.</p>
        </div>
      );
  }

  return (
    <HashRouter>
      <RecordProvider>
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
          />
          
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create" element={<RecordForm />} />
                    <Route path="/records" element={<RecordList viewMode="active" />} />
                    <Route path="/archived" element={<RecordList viewMode="archived" />} />
                    <Route path="/records/:id" element={<RecordDetail />} />
                    <Route path="/records/:id/edit" element={<RecordForm />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </RecordProvider>
    </HashRouter>
  );
};

export default App;