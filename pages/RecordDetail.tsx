import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Calendar, Clock, Truck, MapPin, Package, AlertTriangle, DollarSign, Image as ImageIcon, User } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';

const RecordDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DailyRecord | null>(null);

  useEffect(() => {
    if (id) {
      recordService.getById(id).then(r => setRecord(r || null));
    }
  }, [id]);

  if (!record) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{new Date(record.date).toLocaleDateString('pt-BR')}</h1>
        <button 
            onClick={() => navigate(`/records/${id}/edit`)} 
            className="flex items-center space-x-1 text-primary hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
        >
            <Edit2 size={16} />
            <span className="font-medium">Editar</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{record.team}</h2>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                          <Truck size={16} />
                          <span className="uppercase tracking-wide font-medium">{record.van_plate}</span>
                      </div>
                      {/* Exibição do Autor */}
                      {record.created_by_email && (
                        <div className="flex items-center space-x-2 text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded w-fit mt-1">
                            <User size={14} />
                            <span>Criado por: {record.created_by_email}</span>
                        </div>
                      )}
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${record.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {record.status === 'finalized' ? 'Finalizado' : 'Rascunho'}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-xs text-gray-400 block mb-1">Hora Início</span>
                    <div className="flex items-center space-x-2 text-gray-800 font-medium">
                        <Clock size={16} />
                        <span>{record.start_time || '--:--'}</span>
                    </div>
                </div>
                 <div className="bg-gray-50 p-3 rounded-xl">
                    <span className="text-xs text-gray-400 block mb-1">Distância Total</span>
                    <div className="flex items-center space-x-2 text-primary font-bold">
                        <MapPin size={16} />
                        <span>{record.km_total} km</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Stats */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Package className="text-blue-500" size={20} />
                    <span>Desempenho de Entrega</span>
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Carregados</span>
                        <span className="font-medium text-lg">{record.articles_loaded}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Entregues</span>
                        <span className="font-bold text-lg text-green-600">{record.articles_delivered}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Não Entregues</span>
                        <span className={`font-bold text-lg ${record.articles_not_delivered > 0 ? 'text-red-500' : 'text-gray-400'}`}>{record.articles_not_delivered}</span>
                    </div>
                    {record.articles_not_delivered > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg mt-3 text-sm text-red-700 flex items-start space-x-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{record.reason_not_delivered}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Expenses */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <DollarSign className="text-green-500" size={20} />
                    <span>Despesas</span>
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                         <span className="text-gray-500">Abastecimento</span>
                         <span className="font-medium">{record.fueling ? `€${record.fuel_amount?.toFixed(2)}` : 'Não'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-gray-500">Pedágios</span>
                         <span className="font-medium">€{record.toll_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="font-bold text-gray-700">Custo Total</span>
                        <span className="font-bold text-xl text-gray-900">€{((record.fuel_amount || 0) + (record.toll_amount || 0)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Attachments */}
        {record.attachments && record.attachments.length > 0 && (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <ImageIcon className="text-purple-500" size={20} />
                    <span>Galeria</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {record.attachments.map((src, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img src={src} alt="Proof" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* Notes */}
        {record.notes && (
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-semibold text-gray-800 mb-2">Observações Diárias</h3>
                 <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{record.notes}</p>
             </div>
        )}

      </div>
    </div>
  );
};

export default RecordDetail;