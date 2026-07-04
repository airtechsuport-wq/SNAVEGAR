import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Package, Truck, AlertCircle, TrendingUp } from 'lucide-react';
import { useRecords } from '../contexts/RecordContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { records, loading } = useRecords();
  
  // Deriva os dados da memória instantaneamente
  const recentRecords = records.slice(0, 5); 
  const insight = "Organização hoje, resultados amanhã.";

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Welcome & Insight */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Olá, Equipe! 👋</h2>
          <p className="text-primary-100 text-sm font-medium mb-6 opacity-80">Pronto para mais um dia de entregas?</p>
          
          <div className="flex items-start space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="bg-yellow-400/20 p-2 rounded-xl">
                <TrendingUp className="text-yellow-300 shrink-0" size={20} />
              </div>
              <p className="text-sm font-semibold leading-relaxed text-white/90">
                  "{insight}"
              </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Primary Action */}
      <button
        onClick={() => navigate('/create')}
        className="group w-full bg-white border border-gray-100 hover:border-primary-200 text-primary-600 font-bold py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all hover:shadow-soft active:scale-[0.98]"
      >
        <div className="bg-primary-50 p-2 rounded-xl group-hover:bg-primary-100 transition-colors">
          <Plus size={24} />
        </div>
        <span className="text-lg">Novo Registro Diário</span>
      </button>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Atividade Recente</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Últimos registros realizados</p>
          </div>
          <button 
            onClick={() => navigate('/records')}
            className="text-sm text-primary-600 font-bold hover:text-primary-700 transition-colors px-3 py-1 rounded-lg hover:bg-primary-50"
          >
            Ver Todos
          </button>
        </div>

        {loading && records.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : recentRecords.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-3xl shadow-soft border border-gray-50">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="opacity-20" />
            </div>
            <p className="font-medium">Nenhum registro encontrado ainda.</p>
            <p className="text-xs mt-1 opacity-60">Comece criando seu primeiro registro!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recentRecords.map(record => (
              <div
                key={record.id}
                onClick={() => navigate(`/records/${record.id}`)}
                className="group bg-white p-5 rounded-2xl shadow-soft border border-gray-50 flex justify-between items-center hover:border-primary-100 transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-primary-50 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                      {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{record.team}</span>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="bg-gray-50 p-1.5 rounded-lg">
                        <Truck size={14} className="text-gray-400" />
                      </div>
                      <span className="text-xs font-bold">{record.km_total} <span className="font-medium opacity-60">km</span></span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="bg-success/10 p-1.5 rounded-lg">
                        <Package size={14} className="text-success" />
                      </div>
                      <span className="text-xs font-bold text-success">{record.articles_delivered}</span>
                      
                      {record.articles_not_delivered > 0 && (
                        <div className="flex items-center space-x-1 ml-1 bg-danger/10 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-danger">{record.articles_not_delivered}</span>
                            <AlertCircle size={10} className="text-danger"/>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-all text-gray-300">
                  <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;