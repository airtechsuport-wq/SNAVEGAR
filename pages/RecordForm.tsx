import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, CheckCircle, Camera, X, Loader2, AlertTriangle, LogIn, Recycle, WifiOff, Truck, TrendingUp, Package } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';
import { supabase } from '../services/supabaseClient';
import { useRecords } from '../contexts/RecordContext';
// @ts-ignore
import imageCompression from 'browser-image-compression';

const TEAMS = [
  "Loures 01",
  "Loures 02",
  "Barreiro 01",
  "Samora Correia 01"
];

const RecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refreshRecords } = useRecords();
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [formData, setFormData] = useState<Partial<DailyRecord>>({
    date: new Date().toISOString().split('T')[0],
    team: '',
    van_plate: '',
    start_time: '08:00',
    km_start: 0,
    km_end: 0,
    km_total: 0,
    articles_loaded: 0,
    articles_delivered: 0,
    articles_not_delivered: 0,
    reason_not_delivered: '',
    scraps_collected: 0,
    scrap_client_names: '',
    fueling: false,
    fuel_amount: 0,
    toll_amount: 0,
    attachments: [],
    notes: '',
    status: 'draft'
  });

  // Check Auth on Mount
  useEffect(() => {
    const checkUser = async () => {
        // MODO OFFLINE: Simula usuário se não houver Supabase configurado
        if (!supabase) {
            setUserEmail('offline@snavegar.local');
            setAuthChecking(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUserEmail(session.user.email || 'Usuário');
        } else {
            setUserEmail(null);
        }
        setAuthChecking(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      const loadRecord = async () => {
        const record = await recordService.getById(id);
        if (record) setFormData(record);
      };
      loadRecord();
    }
  }, [id]);

  useEffect(() => {
    const start = Number(formData.km_start) || 0;
    const end = Number(formData.km_end) || 0;
    if (end >= start) {
      setFormData(prev => ({ ...prev, km_total: end - start }));
    }
  }, [formData.km_start, formData.km_end]);

  const handleChange = (field: keyof DailyRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProcessingImage(true);
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/jpeg"
        };
        
        const compressedFile = await imageCompression(file, options);
        const publicUrl = await recordService.uploadImage(compressedFile);
        
        if (publicUrl) {
           setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), publicUrl]
          }));
        } else {
            // Fallback para Base64 em modo offline
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                 setFormData(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), reader.result as string]
                  }));
            };
        }
      } catch (err) {
        console.error("Erro na compressão:", err);
        alert("Erro ao processar imagem. Tente uma imagem menor.");
      } finally {
        setProcessingImage(false);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
        ...prev,
        attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (status: 'draft' | 'finalized') => {
    if (!userEmail) {
        alert("ERRO: Você está desconectado. Faça login novamente para salvar.");
        navigate('/login');
        return;
    }

    if (!formData.team || !formData.van_plate) {
        alert("Selecione uma Equipe e preencha a Placa.");
        return;
    }

    setLoading(true);
    const dataToSave = { ...formData, status } as DailyRecord; 
    
    try {
        if (id) {
            await recordService.update(id, dataToSave);
        } else {
            await recordService.create(dataToSave);
        }
        await refreshRecords();
        navigate('/');
    } catch (error: any) {
        console.error(error);
        if (error.message === "LOGIN_REQUIRED") {
            alert("Sua sessão expirou.");
            navigate('/login');
        } else {
            alert("Erro ao salvar. Verifique sua conexão.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="pb-24 animate-fade-in">
      {/* Auth Status Warning */}
      {!authChecking && !userEmail && (
        <div className="bg-danger/10 border border-danger/20 p-6 mb-8 rounded-3xl shadow-soft">
            <div className="flex items-start">
                <div className="bg-danger text-white p-2 rounded-xl mr-4">
                  <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-danger font-bold text-lg">Você está desconectado!</h3>
                    <p className="text-danger/70 text-sm mt-1 leading-relaxed">Seus registros não serão sincronizados com a equipe até que você faça login.</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="mt-4 bg-danger text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-danger/20 active:scale-95 transition-all"
                    >
                        <LogIn size={18} />
                        <span>Fazer Login Agora</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-8 px-1">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{id ? 'Editar' : 'Novo'} Registro</h2>
            <p className="text-sm text-gray-400 font-medium">Preencha os dados da operação</p>
          </div>
          
          {userEmail && (
             <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-soft border border-gray-50">
                {!supabase && <WifiOff size={16} className="text-orange-500 ml-1" />}
                <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${!supabase ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-primary-50 text-primary-700 border-primary-100'}`}>
                    {userEmail.split('@')[0]}
                </div>
             </div>
          )}
      </div>
      
      <div className="space-y-8">
        {/* Section 1: General */}
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
              <CheckCircle size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Informações Gerais</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Data da Operação</label>
              <input type="date" className="input-field" value={formData.date} onChange={e => handleChange('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Hora de Início</label>
              <input type="time" className="input-field" value={formData.start_time} onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Equipe Responsável</label>
              <select 
                className="input-field appearance-none" 
                value={formData.team} 
                onChange={e => handleChange('team', e.target.value)}
              >
                <option value="" disabled>Selecione a Equipe</option>
                {TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Placa do Veículo</label>
              <input type="text" placeholder="Ex: AA-00-BB" className="input-field uppercase placeholder:text-gray-200" value={formData.van_plate} onChange={e => handleChange('van_plate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: Kilometers */}
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
              <Truck size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Quilometragem</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">KM Inicial</label>
              <input 
                type="text" 
                inputMode="decimal"
                className="input-field text-center font-bold text-lg" 
                value={formData.km_start} 
                onChange={e => handleChange('km_start', e.target.value)} 
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">KM Final</label>
              <input 
                type="text" 
                inputMode="decimal"
                className="input-field text-center font-bold text-lg" 
                value={formData.km_end} 
                onChange={e => handleChange('km_end', e.target.value)} 
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="mt-8 bg-primary-600 rounded-2xl p-5 flex justify-between items-center shadow-lg shadow-primary-100">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <TrendingUp className="text-white" size={20} />
              </div>
              <span className="font-bold text-white uppercase tracking-widest text-xs">Total Percorrido</span>
            </div>
            <span className="font-black text-2xl text-white">{formData.km_total} <span className="text-sm font-bold opacity-60">km</span></span>
          </div>
        </div>

        {/* Section 3: Articles & Scrap */}
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
              <Package size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Carga e Entregas</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="col-span-3 md:col-span-1 space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Carregados</label>
                <input type="number" inputMode="numeric" className="input-field text-center font-bold" value={formData.articles_loaded} onChange={e => handleChange('articles_loaded', parseInt(e.target.value))} />
             </div>
             <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Entregues</label>
                <input type="number" inputMode="numeric" className="input-field text-center font-bold text-success bg-green-50/30 border-green-100" value={formData.articles_delivered} onChange={e => handleChange('articles_delivered', parseInt(e.target.value))} />
             </div>
             <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Falhas</label>
                <input type="number" inputMode="numeric" className="input-field text-center font-bold text-danger bg-red-50/30 border-red-100" value={formData.articles_not_delivered} onChange={e => handleChange('articles_not_delivered', parseInt(e.target.value))} />
             </div>
          </div>
          
          {(formData.articles_not_delivered || 0) > 0 && (
            <div className="mb-8 animate-fade-in space-y-1.5">
                <label className="block text-xs font-bold text-danger uppercase tracking-wider ml-1">Motivo das Falhas</label>
                <textarea 
                    className="input-field min-h-[80px] border-red-100 focus:ring-red-50 focus:border-red-200" 
                    placeholder="Descreva o que aconteceu..." 
                    value={formData.reason_not_delivered}
                    onChange={e => handleChange('reason_not_delivered', e.target.value)}
                />
            </div>
          )}

          {/* New Scrap Collection Section */}
          <div className="border-t border-gray-50 pt-8">
            <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                  <Recycle size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Recolha de Sucata</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Quantidade</label>
                     <input 
                        type="number" 
                        inputMode="numeric"
                        placeholder="0"
                        className="input-field border-orange-100 focus:border-orange-300 focus:ring-orange-50 text-orange-700 font-bold" 
                        value={formData.scraps_collected} 
                        onChange={e => handleChange('scraps_collected', parseInt(e.target.value))} 
                     />
                </div>
                
                {(formData.scraps_collected || 0) > 0 && (
                     <div className="animate-fade-in space-y-1.5">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nomes dos Clientes</label>
                        <textarea 
                            className="input-field min-h-[80px] border-orange-100 focus:border-orange-300 focus:ring-orange-50" 
                            placeholder="Ex: Sr. João, Loja ABC..." 
                            value={formData.scrap_client_names}
                            onChange={e => handleChange('scrap_client_names', e.target.value)}
                        />
                     </div>
                )}
            </div>
          </div>
        </div>

        {/* Section 4: Expenses */}
        <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Despesas e Custos</h3>
          </div>
          
          <div className="flex items-center mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
            <div className="relative flex items-center cursor-pointer">
              <input 
                  type="checkbox" 
                  id="fueling" 
                  checked={formData.fueling} 
                  onChange={e => handleChange('fueling', e.target.checked)}
                  className="w-6 h-6 text-primary-600 rounded-lg focus:ring-primary-100 bg-white border-gray-200 transition-all cursor-pointer"
              />
              <label htmlFor="fueling" className="ml-3 text-gray-700 font-bold cursor-pointer">Abastecimento realizado?</label>
            </div>
          </div>

          {formData.fueling && (
            <div className="mb-6 animate-fade-in space-y-1.5">
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Valor do Combustível (€)</label>
                 <input 
                    type="text" 
                    inputMode="decimal"
                    className="input-field font-bold text-primary-700" 
                    placeholder="0.00"
                    value={formData.fuel_amount} 
                    onChange={e => handleChange('fuel_amount', e.target.value)}
                 />
            </div>
          )}

          <div className="space-y-1.5">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Pedágios / Portagens (€)</label>
             <input 
                type="text" 
                inputMode="decimal"
                className="input-field font-bold text-primary-700" 
                placeholder="0.00"
                value={formData.toll_amount} 
                onChange={e => handleChange('toll_amount', e.target.value)}
            />
          </div>
        </div>

         {/* Section 5: Attachments */}
         <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                <Camera size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Fotos e Comprovantes</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {formData.attachments?.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm animate-fade-in">
                        <img src={src} alt="attachment" className="w-full h-full object-cover" />
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute top-2 right-2 bg-danger text-white rounded-xl p-2 shadow-lg active:scale-90 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
                
                <label className={`aspect-square rounded-[1.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30 cursor-pointer transition-all bg-gray-50/30 ${processingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {processingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-3">Processando</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-3 rounded-2xl shadow-sm mb-2">
                          <Save size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar</span>
                      </>
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        disabled={processingImage}
                    />
                </label>
            </div>
         </div>

         {/* Section 6: Notes */}
         <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-gray-50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-primary-50 p-2 rounded-xl text-primary-600">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Observações</h3>
            </div>
            <textarea 
                className="input-field min-h-[120px] leading-relaxed" 
                placeholder="Algum incidente ou observação importante?"
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
            />
         </div>

         {/* Actions */}
         <div className="flex flex-col sm:flex-row gap-4 pt-6">
             <button 
                onClick={() => handleSubmit('draft')}
                disabled={loading || processingImage}
                className="flex-1 py-5 rounded-2xl bg-white border border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all flex items-center justify-center space-x-3 shadow-soft active:scale-[0.98]"
            >
                <Save size={22} />
                <span>Salvar Rascunho</span>
             </button>
             <button 
                onClick={() => handleSubmit('finalized')}
                disabled={loading || processingImage}
                className="flex-[1.5] py-5 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center justify-center space-x-3 active:scale-[0.98]"
            >
                {loading ? <Loader2 className="animate-spin" size={22}/> : <CheckCircle size={22} />}
                <span>Finalizar Operação</span>
            </button>
         </div>
      </div>
      <style>{`
        .input-field {
            width: 100%;
            padding: 1rem;
            border-radius: 1.25rem;
            border: 1px solid #f1f5f9;
            outline: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 1rem;
            background-color: #f8fafc;
            color: #1e293b;
            font-weight: 500;
        }
        .input-field:focus {
            background-color: #ffffff;
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
        }
        .animate-fade-in {
            animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RecordForm;