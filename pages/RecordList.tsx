import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Archive, RefreshCcw, FolderOpen, AlertCircle, User, Truck, Package, Cloud, WifiOff, RefreshCw, ChevronRight, Trash2, CheckSquare, Square, X, CloudUpload, Terminal, Copy, Check } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';
import { useRecords } from '../contexts/RecordContext';
import { supabase } from '../services/supabaseClient';

interface RecordListProps {
  viewMode?: 'active' | 'archived';
}

const RecordList: React.FC<RecordListProps> = ({ viewMode = 'active' }) => {
  const navigate = useNavigate();
  const { records, loading, refreshRecords } = useRecords();
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [filterTeam, setFilterTeam] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [sqlFix, setSqlFix] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Estados para Seleção Múltipla
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pendingCount = records.filter(r => !r._isSynced).length;

  // Tenta sincronizar automaticamente ao entrar na tela se houver pendências
  useEffect(() => {
    if (pendingCount > 0 && !syncing && supabase) {
        handleManualSync(true); // true = silent/auto mode
    }
  }, [pendingCount]); 

  const handleManualSync = async (isAuto = false) => {
    if (syncing) return;
    setSyncing(true);
    setErrorMsg('');
    setSyncSuccessMsg('');
    setSqlFix(null);
    
    try {
        // 1. Tenta enviar pendentes
        const result = await recordService.syncPendingRecords();
        
        // 2. Diagnóstico de Conexão com Servidor
        let serverError = null;
        if (supabase) {
            const { error } = await supabase
                .from('daily_records')
                .select('id', { count: 'exact', head: true });
            serverError = error;
        }

        // 3. Atualiza a UI
        await refreshRecords(); 
        
        if (!isAuto) {
            if (result.error) {
                 // ANÁLISE DE ERRO INTELIGENTE
                 if (result.error.includes("column") && result.error.includes("daily_records")) {
                    setSqlFix(`alter table daily_records add column if not exists scraps_collected numeric default 0;\nalter table daily_records add column if not exists scrap_client_names text default '';`);
                    setErrorMsg("O banco de dados está desatualizado. Novas colunas são necessárias.");
                 } else {
                    setErrorMsg(result.error);
                 }
                 
                 // Se não for o erro de coluna, mostra alerta padrão
                 if (!result.error.includes("column")) {
                     alert(`FALHA NA SINCRONIZAÇÃO:\n\n${result.error}\n\nDica: Se o erro for sobre "bucket", crie 'app-images' no Storage.`);
                 }

            } else if (serverError) {
                 console.error("Erro Supabase Check:", serverError);
                 setErrorMsg("Falha na conexão com o banco de dados.");
            } else if (result.count > 0) {
                 setSyncSuccessMsg(`${result.count} registros enviados com sucesso!`);
                 setTimeout(() => setSyncSuccessMsg(''), 5000);
            } else if (pendingCount === 0) {
                 setSyncSuccessMsg("Tudo atualizado!");
                 setTimeout(() => setSyncSuccessMsg(''), 3000);
            }
        }

    } catch (e: any) {
        console.error("Sync error", e);
        if(!isAuto) alert("Erro desconhecido: " + e.message);
    } finally {
        setSyncing(false);
    }
  };

  const copySqlToClipboard = () => {
    if (sqlFix) {
        navigator.clipboard.writeText(sqlFix);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  useEffect(() => {
    // Sai do modo de seleção se mudar de aba
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    
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
    
    try {
        await recordService.update(record.id, { archived: willArchive });
        await refreshRecords();
    } catch (error: any) {
        setErrorMsg(`Falha ao atualizar: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteRecord = async (e: React.MouseEvent, recordId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("ATENÇÃO: Isso apagará PERMANENTEMENTE o registro e todas as fotos associadas. Não há como desfazer.\n\nTem certeza?")) {
        try {
            await recordService.delete(recordId);
            await refreshRecords();
        } catch (error: any) {
            alert("Erro ao excluir: " + error.message);
        }
    }
  };

  // --- LÓGICA DE SELEÇÃO EM LOTE ---

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectRecord = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
        newSelection.delete(id);
    } else {
        newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
        setSelectedIds(new Set());
    } else {
        const allIds = new Set(filteredRecords.map(r => r.id));
        setSelectedIds(allIds);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (window.confirm(`ATENÇÃO: Você está prestes a apagar ${count} registros PERMANENTEMENTE e todas as fotos associadas a eles.\n\nEsta ação liberará espaço, mas não pode ser desfeita.\n\nConfirmar exclusão em massa?`)) {
        setSyncing(true); // Reusa o loading state
        try {
            await recordService.deleteMultiple(Array.from(selectedIds));
            await refreshRecords();
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (e: any) {
            alert("Erro na exclusão em massa: " + e.message);
        } finally {
            setSyncing(false);
        }
    }
  };

  return (
    <div className="min-h-screen pb-24">
      
      {/* BANNER DE SINCRONIZAÇÃO PENDENTE */}
      {pendingCount > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 mb-8 rounded-3xl shadow-lg shadow-orange-200 animate-fade-in text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      {syncing ? <RefreshCw className="animate-spin" size={24} /> : <CloudUpload size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">
                            {syncing ? 'Sincronizando...' : `${pendingCount} pendentes`}
                        </h3>
                        <p className="text-orange-100 text-xs font-medium mt-0.5 opacity-90">
                            {syncing 
                                ? 'Enviando dados para a nuvem...' 
                                : 'Toque para atualizar o servidor.'}
                        </p>
                    </div>
                </div>
                {!syncing && (
                    <button 
                        onClick={() => handleManualSync(false)}
                        className="bg-white text-orange-600 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-soft hover:bg-orange-50 transition-all active:scale-95"
                    >
                        Sincronizar
                    </button>
                )}
            </div>
          </div>
      )}

      {syncSuccessMsg && (
        <div className="bg-success/10 border border-success/20 text-success text-sm font-bold px-5 py-4 rounded-2xl mb-6 flex items-center shadow-sm animate-fade-in">
            <div className="bg-success text-white p-1 rounded-md mr-3">
              <CheckSquare size={14}/>
            </div>
            {syncSuccessMsg}
        </div>
      )}

      {/* PAINEL DE CORREÇÃO SQL */}
      {sqlFix && (
        <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6 mb-8 shadow-soft animate-fade-in">
            <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                  <Terminal size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-primary-900">Atualização Necessária</h3>
                    <p className="text-xs text-primary-700 mb-4 mt-1 leading-relaxed">
                        O banco de dados precisa de novas colunas para a função de <b>Sucata</b>.
                        Copie e execute o comando abaixo no SQL Editor do Supabase.
                    </p>
                    <div className="bg-gray-900 rounded-2xl p-4 relative group border border-gray-800">
                        <code className="text-green-400 font-mono text-[11px] block whitespace-pre-wrap leading-relaxed">
                            {sqlFix}
                        </code>
                        <button 
                            onClick={copySqlToClipboard}
                            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
                        >
                            {copiedSql ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                            <span className="text-[10px] font-bold uppercase tracking-wider">{copiedSql ? 'Copiado' : 'Copiar'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 px-1">
        <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${viewMode === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-primary-50 text-primary-600'}`}>
                {viewMode === 'archived' ? <Archive size={24} /> : <FolderOpen size={24} />}
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {viewMode === 'archived' ? 'Arquivo' : 'Registros'}
              </h2>
            </div>
            <p className="text-sm text-gray-400 font-medium ml-11">
              {viewMode === 'archived' ? 'Histórico de registros antigos' : 'Lista de operações diárias'}
            </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
            {viewMode === 'archived' && filteredRecords.length > 0 && (
                <button 
                    onClick={toggleSelectionMode}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-center shadow-sm ${isSelectionMode ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-primary-600'}`}
                >
                    {isSelectionMode ? <X size={20} /> : <CheckSquare size={20} />}
                </button>
            )}

            {!isSelectionMode && (
                <>
                    <button 
                        onClick={() => handleManualSync(false)} 
                        disabled={syncing}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-center shadow-sm ${pendingCount > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-white border-gray-100 text-gray-400 active:bg-gray-50'}`}
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin text-primary-600" : ""} />
                    </button>

                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar equipe..." 
                            value={filterTeam}
                            onChange={(e) => setFilterTeam(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl w-full md:w-64 focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-200 shadow-soft transition-all text-sm font-medium placeholder:text-gray-300"
                        />
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Barra de Ferramentas de Seleção */}
      {isSelectionMode && (
        <div className="bg-primary-600 p-4 rounded-3xl mb-6 flex justify-between items-center animate-fade-in shadow-lg shadow-primary-200 sticky top-20 z-20 mx-1">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2 text-white font-bold bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
                >
                    {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
                    <span className="text-sm uppercase tracking-wider">{selectedIds.size === filteredRecords.length ? "Nenhum" : "Todos"}</span>
                </button>
                <span className="text-xs text-primary-100 font-bold uppercase tracking-widest border-l border-white/10 pl-4">
                    {selectedIds.size} selecionados
                </span>
            </div>

            <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || syncing}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md ${
                    selectedIds.size > 0 && !syncing
                        ? 'bg-white text-danger hover:bg-red-50' 
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                }`}
            >
                {syncing ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>Apagar</span>
            </button>
        </div>
      )}

      {errorMsg && !sqlFix && (
        <div className="mb-6 bg-danger/10 text-danger p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold border border-danger/10 animate-pulse">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
        </div>
      )}

      {loading && records.length === 0 ? (
        <div className="space-y-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-3xl animate-pulse"/>)}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-50 shadow-soft px-8">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen size={40} className="text-gray-200" />
            </div>
            <p className="text-gray-900 font-bold text-lg">Nenhum registro</p>
            <p className="text-gray-400 text-sm mt-1">Não encontramos nada por aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map(record => (
            <div 
              key={record.id}
              onClick={() => {
                if (isSelectionMode) {
                    toggleSelectRecord(record.id);
                } else {
                    navigate(`/records/${record.id}`);
                }
              }}
              className={`group p-5 rounded-3xl shadow-soft border transition-all cursor-pointer flex justify-between items-center relative active:scale-[0.99]
                ${record.archived ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-50'}
                ${isSelectionMode && selectedIds.has(record.id) ? 'ring-4 ring-primary-100 border-primary-300 bg-primary-50/30' : ''}
              `}
            >
              {/* Checkbox de Seleção */}
              {isSelectionMode && (
                <div className="mr-4 transition-all">
                    {selectedIds.has(record.id) 
                      ? <CheckSquare size={26} className="text-primary-600 fill-primary-600 text-white" /> 
                      : <Square size={26} className="text-gray-200" />}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${record.archived ? 'bg-gray-200 text-gray-500' : 'bg-primary-50 text-primary-700'}`}>
                        {new Date(record.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                    </div>
                    <span className={`font-bold truncate text-base ${record.archived ? 'text-gray-400' : 'text-gray-900 group-hover:text-primary-600 transition-colors'}`}>
                      {record.team}
                    </span>
                    
                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      {record.created_by_email && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                              <User size={10} />
                              <span>{record.created_by_email.split('@')[0]}</span>
                          </div>
                      )}

                      <div className="flex items-center">
                          {record._isSynced ? (
                              <div className="bg-success/10 p-1 rounded-lg text-success" title="Sincronizado">
                                  <Cloud size={14} />
                              </div>
                          ) : (
                              <div className="bg-orange-500 p-1 rounded-lg text-white animate-pulse" title="Offline">
                                  <WifiOff size={14} />
                              </div>
                          )}
                      </div>
                    </div>
                </div>

                <div className="flex items-center space-x-6 text-gray-500">
                    <div className="flex items-center space-x-2">
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

              {/* Controles da Direita */}
              {!isSelectionMode && (
                  <div className="flex items-center space-x-1 ml-4">
                     {viewMode === 'archived' && (
                         <button 
                            onClick={(e) => handleDeleteRecord(e, record.id)}
                            className="p-2.5 rounded-xl text-gray-300 hover:text-danger hover:bg-red-50 transition-all"
                         >
                            <Trash2 size={18} />
                         </button>
                     )}

                     <button 
                        onClick={(e) => handleToggleArchive(e, record)}
                        className={`p-2.5 rounded-xl transition-all ${record.archived ? 'text-success hover:bg-green-50' : 'text-gray-300 hover:text-danger hover:bg-red-50'}`}
                     >
                        {record.archived ? <RefreshCcw size={18} /> : <Archive size={18} />}
                     </button>
                     
                     {viewMode !== 'archived' && (
                        <div className="bg-gray-50 p-2 rounded-xl text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all ml-1">
                          <ChevronRight size={20} />
                        </div>
                     )}
                  </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RecordList;