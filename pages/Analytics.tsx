import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useRecords } from '../contexts/RecordContext';

const TEAMS = [
    "Equipe 1 - Luiz e Luigi",
    "Equipe 2 - David e Ruben"
];

const Analytics: React.FC = () => {
  const { records, loading } = useRecords(); // Dados instantâneos
  const [selectedTeam, setSelectedTeam] = useState<string>('All');

  if (loading && records.length === 0) return <div className="p-8 text-center text-gray-500">Carregando métricas...</div>;

  // 1. Filter out archived records FIRST
  const activeRecords = records.filter(r => !r.archived);

  // 2. Filter records based on team selection
  const filteredRecords = selectedTeam === 'All' 
    ? activeRecords 
    : activeRecords.filter(r => r.team === selectedTeam);

  // Simple aggregation for last 7 records
  const chartData = [...filteredRecords].reverse().slice(-7).map(r => ({
      date: new Date(r.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      delivered: r.articles_delivered,
      failed: r.articles_not_delivered,
      km: r.km_total
  }));

  const totalDeliveries = filteredRecords.reduce((acc, r) => acc + r.articles_delivered, 0);
  const totalFailed = filteredRecords.reduce((acc, r) => acc + r.articles_not_delivered, 0);
  const totalKm = filteredRecords.reduce((acc, r) => acc + r.km_total, 0);
  const totalCost = filteredRecords.reduce((acc, r) => acc + (r.fuel_amount || 0) + (r.toll_amount || 0), 0);

  return (
    <div className="pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Métricas de Desempenho</h2>
            <p className="text-xs text-gray-500 mt-1">Exclui registros arquivados</p>
        </div>
        
        {/* Team Filter */}
        <div className="bg-white p-1.5 rounded-xl border border-gray-200 flex overflow-x-auto no-scrollbar shadow-sm">
            <button
                onClick={() => setSelectedTeam('All')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedTeam === 'All' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                Todas as Equipes
            </button>
            {TEAMS.map(team => (
                <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ml-1 ${
                        selectedTeam === team 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {/* Shorten name for display: "Equipe 1..." */}
                    {team.split(' - ')[0]}
                </button>
            ))}
        </div>
      </div>

      {filteredRecords.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="text-gray-400 mb-2">Nenhum registro ativo encontrado para {selectedTeam === 'All' ? 'qualquer equipe' : selectedTeam}.</div>
              {selectedTeam !== 'All' && <p className="text-sm text-gray-500">Tente criar um novo registro diário para esta equipe.</p>}
          </div>
      ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                <KPICard label="Entregas" value={totalDeliveries} color="text-green-600" />
                <KPICard label="Falhas" value={totalFailed} color="text-red-500" />
                <KPICard label="KM Total" value={`${totalKm} km`} color="text-blue-600" />
                <KPICard label="Despesas" value={`€${totalCost.toFixed(0)}`} color="text-purple-600" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Entregas (Recentes)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                />
                                <Bar dataKey="delivered" fill="#22c55e" radius={[4, 4, 0, 0]} name="Entregues" />
                                <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Falhas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-700 mb-4">Distância Percorrida (Recente)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Line type="monotone" dataKey="km" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 0}} name="Quilômetros" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
          </>
      )}

      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const KPICard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</span>
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
);

export default Analytics;