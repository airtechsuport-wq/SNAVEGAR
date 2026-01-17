import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Archive, RefreshCcw, FolderOpen, AlertCircle, User, Truck, Package, DollarSign, Cloud, WifiOff, RefreshCw, ChevronRight } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';
import { useRecords } from '../contexts/RecordContext';

interface RecordListProps {
  viewMode?: 'active' | 'archived';
}

const RecordList: React.FC<RecordListProps> = ({ viewMode = 'active' }) => {
  const navigate = useNavigate();
  const { records, loading, refreshRecords } = useRecords(); // Usa o contexto global
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [filterTeam, setFilterTeam] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualSync = async () => {
    setSyncing(true);
    setErrorMsg('');
    try {
        await recordService.syncPendingRecords();
        await refreshRecords(); 
    } catch (e) {
        console.error("Sync error", e);
        setErrorMsg("Falha na sincronização.");
    } finally {
        setSyncing(false);
    }
  };

  useEffect(() => {
    // Filtra instantaneamente baseado nos dados em memória do Context
    let result = records.filter(r => {
        const isArchived = !!r.archived;
        if (viewMode === 'archived') {
            return isArchived === true;
        } else {
            return isArchived === false;
        }
    });

    if (filterTeam) {
      result = result.filter(r => r.team.toLowerCase().includes(filterTeam.toLowerCase()));
    }
    setFilteredRecords(result);
  }, [filterTeam, records, viewMode]);

  const handleToggleArchive = async (e: React.MouseEvent, record: DailyRecord) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setErrorMsg('');
    const willArchive = !record.archived;
    
    // Atualização otimista via Context não é possível diretamente sem expor setState, 
    // então chamamos refresh após o update do serviço.
    try {
        await recordService.update(record.id, { archived: willArchive });
        await refreshRecords();
    } catch (error: any) {
        setErrorMsg(`Falha ao atualizar: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const pendingCount = records.filter(r => !r._isSynced).length;

  return (
    <div className="min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
            {viewMode === 'archived' && <div className="bg-gray-200 p-2 rounded-lg text-gray-600"><Archive size={24} /></div>}
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{viewMode === 'archived' ? 'Serviços Arquivados' : 'Registros Diários'}</h2>
                <p className="text-sm text-gray-500">{viewMode === 'archived' ? 'Estes registros não aparecem nas métricas.' : 'Visão geral de todas as equipes.'}</p>
            </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
             <button 
                onClick={handleManualSync} 
                disabled={syncing}
                className={`p-2 rounded-lg border flex items-center justify-center transition-all ${pendingCount > 0 ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse' : 'bg-white border-gray-300 text-gray-600'}`}
                title={pendingCount > 0 ? "Clique para enviar dados pendentes" : "Recarregar lista"}
             >
                <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
                {pendingCount > 0 && <span className="ml-2 text-sm font-bold">{pendingCount}</span>}
             </button>

            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por equipe..." 
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
                />
            </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg flex items-center space-x-2 text-sm">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
        </div>
      )}

      {loading && records.length === 0 ? (
        <div className="space-y-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"/>)}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm px-4">
            <div className="text-gray-300 mb-3 flex justify-center"><FolderOpen size={48} /></div>
            <p className="text-gray-500 font-medium">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map(record => (
            <div 
              key={record.id}
              onClick={() => navigate(`/records/${record.id}`)}
              className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group relative ${record.archived ? 'bg-gray-50 border-gray-200 opacity-90' : 'bg-white border-gray-100'}`}
            >
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3 mb-2">
                    <div className="flex items-center space-x-2 mb-1 md:mb-0">
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${record.archived ? 'bg-gray-200 text-gray-600' : 'bg-blue-50 text-primary'}`}>
                            {new Date(record.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                        </div>
                        <span className={`font-bold ${record.archived ? 'text-gray-500' : 'text-gray-900'}`}>{record.team}</span>
                    </div>
                    
                    {record.created_by_email && (
                        <div className="flex items-center space-x-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full w-fit">
                            <User size={10} />
                            <span>{record.created_by_email.split('@')[0]}</span>
                        </div>
                    )}

                    <div className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full w-fit">
                        {record._isSynced ? (
                            <span className="text-green-500 flex items-center space-x-1" title="Salvo na nuvem">
                                <Cloud size={12} />
                                <span className="hidden md:inline">Sincronizado</span>
                            </span>
                        ) : (
                            <span className="text-orange-500 bg-orange-50 flex items-center space-x-1 px-1 rounded" title="Salvo apenas no celular">
                                <WifiOff size={12} />
                                <span>Offline</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3 md:mt-1">
                    <div className="flex items-center space-x-1" title="Quilometragem Total">
                      <Truck size={14} />
                      <span>{record.km_total} km</span>
                    </div>
                    <div className="flex items-center space-x-1" title="Entregas Realizadas">
                      <Package size={14} />
                      <span className="text-green-600 font-medium">{record.articles_delivered}</span>
                      {record.articles_not_delivered > 0 && (
                          <span className="text-red-500 font-medium ml-1">
                            ({record.articles_not_delivered})
                          </span>
                      )}
                    </div>
                    {(record.fuel_amount > 0 || record.toll_amount > 0) && (
                        <div className="flex items-center space-x-1 text-gray-500" title="Custo Total">
                            <DollarSign size={14} />
                            <span>€{((record.fuel_amount || 0) + (record.toll_amount || 0)).toFixed(0)}</span>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2 ml-4">
                 <button 
                    onClick={(e) => handleToggleArchive(e, record)}
                    className={`p-2 rounded-full transition-colors ${record.archived ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                    title={record.archived ? "Desarquivar" : "Arquivar"}
                 >
                    {record.archived ? <RefreshCcw size={18} /> : <Archive size={18} />}
                 </button>
                 <ChevronRight className="text-gray-300" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordList;