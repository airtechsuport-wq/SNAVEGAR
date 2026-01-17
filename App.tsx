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
    // Check active session
    const checkSession = async () => {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        } else {
             // Fallback for demo without Supabase keys
             const localAuth = localStorage.getItem('snavegar_auth');
             if (localAuth) setIsAuthenticated(true);
        }
        setLoading(false);
    };
    
    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase?.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session);
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (supabase) {
        await supabase.auth.signOut();
    } else {
        localStorage.removeItem('snavegar_auth');
    }
    setIsAuthenticated(false);
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary">Loading...</div>;
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