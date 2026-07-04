import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, List, BarChart2, LogOut, Archive } from 'lucide-react';
import InstallPrompt from './InstallPrompt';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-surface text-gray-900 pb-20 md:pb-0 md:pl-64">
      
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-30 pt-safe">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent tracking-tight">SNavegar</h1>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-danger transition-colors rounded-full hover:bg-red-50">
          <LogOut size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 shadow-sm">
        <div className="p-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">SNavegar</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mt-1">Delivery Ops</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
            <NavButton icon={<Home size={20} />} label="Início" path="/" active={isActive('/')} onClick={() => navigate('/')} />
            <NavButton icon={<List size={20} />} label="Registros" path="/records" active={isActive('/records')} onClick={() => navigate('/records')} />
            <NavButton icon={<PlusCircle size={20} />} label="Criar" path="/create" active={isActive('/create')} onClick={() => navigate('/create')} />
            <NavButton icon={<BarChart2 size={20} />} label="Métricas" path="/analytics" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
            
            <div className="pt-6 mt-6 border-t border-gray-50">
              <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gerenciamento</span>
              <div className="mt-2">
                <NavButton icon={<Archive size={20} />} label="Arquivados" path="/archived" active={isActive('/archived')} onClick={() => navigate('/archived')} />
              </div>
            </div>
        </nav>
        <div className="p-6 border-t border-gray-50">
             <button onClick={onLogout} className="flex items-center space-x-3 text-gray-500 hover:text-danger w-full p-3 rounded-xl transition-all hover:bg-red-50 group">
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">Sair do App</span>
             </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center p-2 pb-safe z-40 shadow-soft">
        <NavItem icon={<Home size={22} />} label="Início" active={isActive('/')} onClick={() => navigate('/')} />
        <NavItem icon={<List size={22} />} label="Lista" active={isActive('/records')} onClick={() => navigate('/records')} />
        
        <div className="relative -top-6">
            <button 
                onClick={() => navigate('/create')}
                className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary-700 transition-all active:scale-90 flex items-center justify-center ring-4 ring-white"
            >
                <PlusCircle size={26} />
            </button>
        </div>

        <NavItem icon={<Archive size={22} />} label="Arquivo" active={isActive('/archived')} onClick={() => navigate('/archived')} />
        <NavItem icon={<BarChart2 size={22} />} label="Métricas" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-xl font-medium transition-all ${
      active 
        ? 'bg-primary-50 text-primary-600 shadow-sm' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
    }`}
  >
    <span className={`${active ? 'text-primary-600' : 'text-gray-400'}`}>{icon}</span>
    <span>{label}</span>
  </button>
);

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-12 transition-all ${
      active ? 'text-primary-600' : 'text-gray-400'
    }`}
  >
    <div className={`p-1 rounded-lg transition-all ${active ? 'bg-primary-50' : ''}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default Layout;