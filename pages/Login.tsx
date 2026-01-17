import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
        setError("Supabase não configurado.");
        return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        // Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;

        // Check if session was created immediately (means email confirmation is OFF)
        if (data.session) {
            onLogin();
            navigate('/');
        } else {
            // Session is null, meaning email confirmation is ON
            setMessage('Conta criada! Verifique seu e-mail para confirmar.');
            setIsSignUp(false);
            
            // Helper hint for the developer/user
            setError('Aviso: Para pular a confirmação de e-mail, desative "Confirm email" no seu Dashboard do Supabase > Authentication > Providers > Email.');
        }
      } else {
        // Login Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
        navigate('/');
      }
    } catch (err: any) {
      // Improve error message for email confirmation
      if (err.message.includes("Email not confirmed")) {
          setError("E-mail não confirmado. Verifique sua caixa de entrada ou configurações.");
      } else {
          setError(err.message || 'Falha na autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full mb-4 text-primary">
            <Truck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SNavegar</h1>
          <p className="text-gray-500 text-sm mt-1">Operações Diárias de Entrega</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white text-gray-900"
              placeholder="equipe@snavegar.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all bg-white text-gray-900"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
          )}
          
          {message && (
             <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
                {message}
             </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                className="text-sm text-primary hover:underline"
            >
                {isSignUp ? 'Já tem conta? Entrar' : 'Precisa de uma conta? Cadastre-se'}
            </button>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} SNavegar Operações
        </p>
      </div>
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Login;