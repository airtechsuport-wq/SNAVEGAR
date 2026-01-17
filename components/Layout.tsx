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
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0 md:pl-64">
      
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-primary tracking-tight">SNavegar</h1>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-500">
          <LogOut size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
        <div className="p-6">
            <h1 className="text-2xl font-bold text-primary">SNavegar</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <NavButton icon={<Home size={20} />} label="Início" path="/" active={isActive('/')} onClick={() => navigate('/')} />
            <NavButton icon={<List size={20} />} label="Registros" path="/records" active={isActive('/records')} onClick={() => navigate('/records')} />
            <NavButton icon={<PlusCircle size={20} />} label="Criar" path="/create" active={isActive('/create')} onClick={() => navigate('/create')} />
            <NavButton icon={<BarChart2 size={20} />} label="Métricas" path="/analytics" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
            
            <div className="pt-4 mt-4 border-t border-gray-100">
              <span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gerenciamento</span>
              <NavButton icon={<Archive size={20} />} label="Arquivados" path="/archived" active={isActive('/archived')} onClick={() => navigate('/archived')} />
            </div>
        </nav>
        <div className="p-4 border-t">
             <button onClick={onLogout} className="flex items-center space-x-3 text-gray-600 hover:text-red-600 w-full p-2 rounded-lg transition-colors">
                <LogOut size={20} />
                <span>Sair</span>
             </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-3 pb-safe z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <NavItem icon={<Home size={24} />} label="Início" active={isActive('/')} onClick={() => navigate('/')} />
        <NavItem icon={<List size={24} />} label="Lista" active={isActive('/records')} onClick={() => navigate('/records')} />
        <div className="relative -top-5">
            <button 
                onClick={() => navigate('/create')}
                className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center"
            >
                <PlusCircle size={28} />
            </button>
        </div>
        <NavItem icon={<Archive size={24} />} label="Arquivados" active={isActive('/archived')} onClick={() => navigate('/archived')} />
        <NavItem icon={<BarChart2 size={24} />} label="Métricas" active={isActive('/analytics')} onClick={() => navigate('/analytics')} />
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg font-medium transition-colors ${
      active ? 'bg-blue-50 text-primary' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center space-y-1 ${
      active ? 'text-primary' : 'text-gray-400'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Layout;