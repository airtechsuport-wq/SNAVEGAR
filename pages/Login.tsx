import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Loader2, AlertCircle, WifiOff } from 'lucide-react';
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

        if (data.session) {
            onLogin();
            navigate('/');
        } else {
            setMessage('Conta criada! Verifique seu e-mail para confirmar.');
            setIsSignUp(false);
            setError('Aviso: Para pular a confirmação, desative "Confirm email" no painel do Supabase.');
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
      console.error("Erro de Autenticação Completo:", err);
      
      if (err.message === "Failed to fetch" || err.message.includes("fetch")) {
          setError("Falha de Conexão: Não foi possível alcançar o Supabase. Verifique se o seu projeto está ativo ou se o URL está correto. Se estiver usando Ad-Blocker, VPN ou rede corporativa, tente desativar.");
      } else if (err.message.includes("Email not confirmed")) {
          setError("E-mail não confirmado. Verifique sua caixa de entrada.");
      } else {
          setError(err.message || 'Falha na autenticação');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-soft w-full max-w-md animate-fade-in border border-gray-50">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary-50 p-6 rounded-3xl mb-6 text-primary-600 shadow-inner-soft">
            <Truck size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">SNavegar</h1>
          <p className="text-gray-400 text-sm font-medium mt-2 uppercase tracking-widest">Operações de Entrega</p>
        </div>

        {/* Aviso visual se estiver sem configuração */}
        {/* Supabase está sempre instanciado agora */}

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-300 focus:outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300"
              placeholder="equipe@snavegar.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-100 focus:border-primary-300 focus:outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-danger text-xs font-bold bg-red-50 p-4 rounded-2xl flex items-start space-x-3 border border-red-100 animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
            </div>
          )}
          
          {message && (
             <div className="text-success text-xs font-bold text-center bg-green-50 p-4 rounded-2xl border border-green-100">
                {message}
             </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center active:scale-[0.98] bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200`}
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Criar Minha Conta' : 'Entrar no Sistema')}
          </button>
        </form>
        
        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors"
                type="button"
            >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Ainda não tem conta? Cadastre-se'}
            </button>
        </div>
        
        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} SNavegar Operações
          </p>
        </div>
      </div>
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default Login;