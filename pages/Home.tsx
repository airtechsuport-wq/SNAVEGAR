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
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Welcome & Insight */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Olá, Equipe! 👋</h2>
        <div className="flex items-start space-x-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <TrendingUp className="text-yellow-300 shrink-0 mt-1" size={20} />
            <p className="text-sm md:text-base font-medium leading-relaxed opacity-95">
                {insight}
            </p>
        </div>
      </div>

      {/* Primary Action */}
      <button
        onClick={() => navigate('/create')}
        className="w-full bg-white border-2 border-dashed border-primary/50 hover:border-primary text-primary font-semibold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-blue-50"
      >
        <Plus size={24} />
        <span>Criar Registro Diário</span>
      </button>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Atividade Recente</h3>
          <button 
            onClick={() => navigate('/records')}
            className="text-sm text-primary font-medium hover:underline"
          >
            Ver Todos
          </button>
        </div>

        {loading && records.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : recentRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-100">
            <Package size={48} className="mx-auto mb-2 opacity-20" />
            <p>Nenhum registro encontrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRecords.map(record => (
              <div
                key={record.id}
                onClick={() => navigate(`/records/${record.id}`)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-gray-900">{record.team}</span>
                    <span className="text-xs text-gray-400">• {new Date(record.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Truck size={14} />
                      <span>{record.km_total} km</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package size={14} />
                      <span className="text-green-600">{record.articles_delivered}</span>
                      {record.articles_not_delivered > 0 && (
                        <span className="text-red-500 pl-1 flex items-center">
                            / {record.articles_not_delivered} <AlertCircle size={12} className="ml-0.5"/>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;