import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useRecords } from '../contexts/RecordContext';
import { Calendar, Filter, ChevronDown } from 'lucide-react';

const TEAMS = [
    "Loures 01",
    "Loures 02",
    "Barreiro 01",
    "Samora Correia 01"
];

const Analytics: React.FC = () => {
  const { records, loading } = useRecords();
  const [selectedTeam, setSelectedTeam] = useState<string>('All');
  
  // Estados para Filtro de Data
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Inicializa com "Este Mês" por padrão
  useEffect(() => {
    handleSetThisMonth();
  }, []);

  // --- HELPERS DE DATA ---
  const handleSetLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleSetThisMonth = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  const handleSetLastMonth = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  };

  if (loading && records.length === 0) return <div className="p-8 text-center text-gray-500">Carregando métricas...</div>;

  // --- LÓGICA DE FILTRAGEM ---
  
  // 1. Filtra arquivados
  const activeRecords = records.filter(r => !r.archived);

  // 2. Filtra por Data e Equipe
  const filteredRecords = activeRecords.filter(r => {
    // Filtro de Equipe
    if (selectedTeam !== 'All' && r.team !== selectedTeam) return false;
    
    // Filtro de Data (YYYY-MM-DD string comparison works alphabetically)
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    
    return true;
  });

  // Ordena cronologicamente (Antigo -> Novo) para o gráfico
  const sortedRecordsForChart = [...filteredRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Dados para os Gráficos
  const chartData = sortedRecordsForChart.map(r => ({
      date: new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), // Ex: 01/12
      fullDate: new Date(r.date).toLocaleDateString('pt-BR'),
      delivered: r.articles_delivered,
      failed: r.articles_not_delivered,
      km: r.km_total,
      team: r.team
  }));

  // Cálculos de Totais
  const totalDeliveries = filteredRecords.reduce((acc, r) => acc + r.articles_delivered, 0);
  const totalFailed = filteredRecords.reduce((acc, r) => acc + r.articles_not_delivered, 0);
  const totalKm = filteredRecords.reduce((acc, r) => acc + r.km_total, 0);
  const totalCost = filteredRecords.reduce((acc, r) => acc + (r.fuel_amount || 0) + (r.toll_amount || 0), 0);
  const totalScraps = filteredRecords.reduce((acc, r) => acc + (r.scraps_collected || 0), 0);

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-black/5">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Filter size={20} />
                </div>
                Filtros de Análise
            </h2>
        </div>

        <div className="flex flex-col gap-6">
            
            {/* Linha 1: Seleção de Datas */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-surface p-4 rounded-2xl border border-black/5">
                
                {/* Inputs de Data Customizada */}
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full lg:w-auto">
                    <div className="relative w-full md:w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Calendar size={16} /></span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white text-gray-900 pl-10 pr-3 py-2.5 rounded-xl border border-black/10 text-sm w-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest md:normal-case md:text-sm md:font-medium">até</span>
                    <div className="relative w-full md:w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Calendar size={16} /></span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white text-gray-900 pl-10 pr-3 py-2.5 rounded-xl border border-black/10 text-sm w-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Botões de Atalho */}
                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-1">
                    <button onClick={handleSetLast7Days} className="quick-filter-btn">7 Dias</button>
                    <button onClick={handleSetThisMonth} className="quick-filter-btn">Este Mês</button>
                    <button onClick={handleSetLastMonth} className="quick-filter-btn">Mês Passado</button>
                </div>
            </div>

            {/* Linha 2: Seleção de Equipe */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -mx-2 px-2">
                <button
                    onClick={() => setSelectedTeam('All')}
                    className={`team-filter-btn ${selectedTeam === 'All' ? 'active' : ''}`}
                >
                    Todas as Equipes
                </button>
                {TEAMS.map(team => (
                    <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        className={`team-filter-btn ${selectedTeam === team ? 'active' : ''}`}
                    >
                        {team.split(' - ')[0]}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-soft border border-black/5 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Filter size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum registro encontrado</h3>
              <p className="text-sm text-gray-500">Tente ajustar as datas ou selecione outro filtro.</p>
          </div>
      ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KPICard label="Entregas" value={totalDeliveries} color="text-emerald-600" bgColor="bg-emerald-50" />
                <KPICard label="Falhas" value={totalFailed} color="text-rose-600" bgColor="bg-rose-50" />
                <KPICard label="KM Total" value={`${totalKm}`} unit="km" color="text-blue-600" bgColor="bg-blue-50" />
                <KPICard label="Despesas" value={`€${totalCost.toFixed(0)}`} color="text-violet-600" bgColor="bg-violet-50" />
                <KPICard label="Sucatas" value={totalScraps} color="text-amber-600" bgColor="bg-amber-50" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-base">Volume de Entregas</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Entregues</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Falhas</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    fontSize={10} 
                                    fontWeight={600}
                                    tick={{fill: '#94a3b8'}}
                                    dy={10}
                                    interval={chartData.length > 12 ? 'preserveStartEnd' : 0}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(0,0,0,0.05)', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                    labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}
                                />
                                <Bar dataKey="delivered" fill="#10b981" radius={[6, 6, 0, 0]} name="Entregues" stackId="a" barSize={20} />
                                <Bar dataKey="failed" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Falhas" stackId="a" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-black/5">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-base">Evolução KM</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Quilômetros</span>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    fontSize={10} 
                                    fontWeight={600}
                                    tick={{fill: '#94a3b8'}}
                                    dy={10}
                                    interval={chartData.length > 12 ? 'preserveStartEnd' : 0}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(0,0,0,0.05)', 
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        padding: '12px'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                    labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', fontSize: '13px' }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="km" 
                                    stroke="#3b82f6" 
                                    strokeWidth={4} 
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                    name="Quilômetros" 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
          </>
      )}

      <style>{`
        .quick-filter-btn {
            padding: 0.5rem 1rem;
            background-color: #ffffff;
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            white-space: nowrap;
            transition: all 0.2s;
        }
        .quick-filter-btn:hover {
            background-color: #f8fafc;
            color: #0f172a;
            border-color: rgba(0,0,0,0.2);
        }
        .quick-filter-btn:active {
            transform: scale(0.95);
        }
        
        .team-filter-btn {
            padding: 0.625rem 1.25rem;
            border-radius: 1rem;
            font-size: 0.813rem;
            font-weight: 600;
            white-space: nowrap;
            transition: all 0.2s;
            color: #64748b;
            border: 1px solid transparent;
        }
        .team-filter-btn:hover {
            background-color: #f1f5f9;
            color: #334155;
        }
        .team-filter-btn.active {
            background-color: #000000;
            color: white;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .animate-fade-in {
            animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const KPICard = ({ label, value, unit, color, bgColor }: { label: string, value: string | number, unit?: string, color: string, bgColor: string }) => (
    <div className="bg-white p-5 rounded-3xl shadow-soft border border-black/5 flex flex-col items-center justify-center text-center hover:shadow-md transition-all active:scale-95 group">
        <div className={`w-8 h-8 ${bgColor} rounded-full mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}></div>
        </div>
        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-1">{label}</span>
        <div className="flex items-baseline gap-0.5">
            <span className={`text-xl md:text-2xl font-black tracking-tight ${color}`}>{value}</span>
            {unit && <span className="text-[10px] font-bold text-gray-400 uppercase">{unit}</span>}
        </div>
    </div>
);

export default Analytics;