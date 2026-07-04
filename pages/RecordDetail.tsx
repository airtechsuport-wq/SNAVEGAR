import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Calendar, Clock, Truck, MapPin, Package, AlertTriangle, DollarSign, Image as ImageIcon, User, X, ZoomIn, Recycle } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';

const RecordDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      recordService.getById(id).then(r => setRecord(r || null));
    }
  }, [id]);

  if (!record) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;

  return (
    <div className="pb-24 animate-fade-in">
      {/* Lightbox Modal (Full Screen Image) */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fade-in backdrop-blur-md"
            onClick={() => setSelectedImage(null)}
        >
            <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 p-3 rounded-2xl transition-all active:scale-90"
            >
                <X size={32} />
            </button>
            <img 
                src={selectedImage} 
                alt="Detalhe em Tela Cheia" 
                className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}

      <div className="flex items-center justify-between mb-8 px-1">
        <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white hover:bg-gray-50 rounded-2xl text-gray-600 shadow-soft border border-gray-50 active:scale-90 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Detalhes</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
        </div>
        <button 
            onClick={() => navigate(`/records/${id}/edit`)} 
            className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-100 active:scale-90 transition-all"
        >
            <Edit2 size={20} />
        </button>
      </div>

      <div className="space-y-8">
        {/* Header Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                        <div className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${record.status === 'finalized' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{record.team}</h2>
                        <div className="flex items-center space-x-2 text-gray-400 font-bold text-sm">
                            <Truck size={16} className="text-primary-500" />
                            <span className="uppercase tracking-widest">{record.van_plate}</span>
                        </div>
                    </div>
                </div>
                
                {record.created_by_email && (
                    <div className="flex items-center space-x-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-50 mb-8">
                        <div className="bg-white p-2 rounded-xl shadow-sm text-primary-600">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Responsável</span>
                            <span className="text-sm font-bold text-gray-700">{record.created_by_email}</span>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50/50 p-4 rounded-3xl border border-primary-100/50">
                        <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest block mb-1">Início</span>
                        <div className="flex items-center space-x-2 text-primary-700 font-black text-xl">
                            <Clock size={20} />
                            <span>{record.start_time || '--:--'}</span>
                        </div>
                    </div>
                     <div className="bg-primary-600 p-4 rounded-3xl shadow-lg shadow-primary-100">
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Distância</span>
                        <div className="flex items-center space-x-2 text-white font-black text-xl">
                            <MapPin size={20} />
                            <span>{record.km_total} <span className="text-xs font-bold opacity-60">km</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Delivery Stats */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="bg-primary-50 p-2.5 rounded-2xl text-primary-600">
                        <Package size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Entregas</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Carregados</span>
                        <span className="font-black text-2xl text-gray-900">{record.articles_loaded}</span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50/30 p-4 rounded-2xl border border-green-50">
                        <span className="text-sm font-bold text-green-600 uppercase tracking-widest">Entregues</span>
                        <span className="font-black text-2xl text-green-600">{record.articles_delivered}</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-50/30 p-4 rounded-2xl border border-red-50">
                        <span className="text-sm font-bold text-red-500 uppercase tracking-widest">Falhas</span>
                        <span className={`font-black text-2xl ${record.articles_not_delivered > 0 ? 'text-red-500' : 'text-gray-300'}`}>{record.articles_not_delivered}</span>
                    </div>
                    
                    {record.articles_not_delivered > 0 && (
                        <div className="bg-red-50 p-5 rounded-3xl text-sm text-red-700 flex items-start space-x-3 border border-red-100 animate-fade-in">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <p className="font-medium leading-relaxed">{record.reason_not_delivered}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Expenses & Extras */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="bg-primary-50 p-2.5 rounded-2xl text-primary-600">
                        <DollarSign size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Custos</h3>
                </div>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                         <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Abastecimento</span>
                         <span className="font-black text-lg text-gray-700">{record.fueling ? `€${record.fuel_amount?.toFixed(2)}` : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center px-2">
                         <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Pedágios</span>
                         <span className="font-black text-lg text-gray-700">€{record.toll_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {/* Exibição de Sucata se houver */}
                    {(record.scraps_collected || 0) > 0 && (
                        <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 animate-fade-in">
                             <div className="flex items-center justify-between text-orange-800 mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                        <Recycle size={20} className="text-orange-600" />
                                    </div>
                                    <span className="font-black uppercase tracking-widest text-xs">Sucata</span>
                                </div>
                                <span className="font-black text-2xl">{record.scraps_collected}</span>
                             </div>
                             {record.scrap_client_names && (
                                <div className="bg-white/50 p-3 rounded-2xl">
                                    <p className="text-xs font-bold text-orange-700 leading-relaxed">
                                        {record.scrap_client_names}
                                    </p>
                                </div>
                             )}
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                        <span className="font-black text-gray-400 uppercase tracking-widest text-xs">Total do Dia</span>
                        <span className="font-black text-3xl text-gray-900">€{((record.fuel_amount || 0) + (record.toll_amount || 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Attachments */}
        {record.attachments && record.attachments.length > 0 && (
             <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary-50 p-2.5 rounded-2xl text-primary-600">
                            <ImageIcon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Galeria</h3>
                    </div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Toque para ampliar</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {record.attachments.map((src, i) => (
                        <div 
                            key={i} 
                            className="aspect-square rounded-3xl overflow-hidden border border-gray-50 cursor-zoom-in relative group shadow-sm"
                            onClick={() => setSelectedImage(src)}
                        >
                            <img src={src} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                    <ZoomIn className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* Notes */}
        {record.notes && (
             <div className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-gray-50">
                 <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-primary-50 p-2.5 rounded-2xl text-primary-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Observações</h3>
                 </div>
                 <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                    <p className="text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{record.notes}</p>
                 </div>
             </div>
        )}

      </div>
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RecordDetail;