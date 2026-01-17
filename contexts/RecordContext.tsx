import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';

interface RecordContextType {
  records: DailyRecord[];
  loading: boolean;
  refreshRecords: () => Promise<void>;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const RecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRecords = useCallback(async () => {
    // Não seta loading=true aqui para evitar "piscar" a tela se já tiver dados
    try {
      const data = await recordService.getAll();
      setRecords(data);
    } catch (error) {
      console.error("Erro ao atualizar contexto:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Listener para recarregar quando a janela ganhar foco (útil ao voltar de outro app)
  useEffect(() => {
    const onFocus = () => refreshRecords();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshRecords]);

  return (
    <RecordContext.Provider value={{ records, loading, refreshRecords }}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecords = () => {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('useRecords deve ser usado dentro de um RecordProvider');
  }
  return context;
};