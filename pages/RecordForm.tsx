import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, CheckCircle, Camera, X, Loader2, AlertTriangle, LogIn } from 'lucide-react';
import { DailyRecord } from '../types';
import { recordService } from '../services/recordService';
import { supabase } from '../services/supabaseClient';
import { useRecords } from '../contexts/RecordContext';

const TEAMS = [
  "Equipe 1 - Luiz e Luigi",
  "Equipe 2 - David e Ruben"
];

const RecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { refreshRecords } = useRecords(); // Pegar função de atualizar contexto
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
        if (!supabase) return;
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

  const compressImageToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleFactor = 1024 / img.width;
                const newWidth = scaleFactor < 1 ? 1024 : img.width;
                const newHeight = scaleFactor < 1 ? img.height * scaleFactor : img.height;
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, newWidth, newHeight);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error("Conversion failed"));
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProcessingImage(true);
      
      try {
        const compressedBlob = await compressImageToBlob(file);
        const publicUrl = await recordService.uploadImage(compressedBlob);
        
        if (publicUrl) {
           setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), publicUrl]
          }));
        } else {
            alert("Upload falhou (Modo Offline). A foto será salva apenas neste dispositivo.");
            const reader = new FileReader();
            reader.readAsDataURL(compressedBlob);
            reader.onloadend = () => {
                 setFormData(prev => ({
                    ...prev,
                    attachments: [...(prev.attachments || []), reader.result as string]
                  }));
            };
        }
      } catch (err) {
        alert("Erro ao processar imagem.");
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
        await refreshRecords(); // Atualiza a memória global para que a lista esteja pronta
        navigate('/');
    } catch (error: any) {
        console.error(error);
        if (error.message === "LOGIN_REQUIRED") {
            alert("Sua sessão expirou. O registro foi salvo localmente, mas você precisa fazer login novamente para enviar para a equipe.");
            navigate('/login');
        } else {
            alert("Erro ao salvar. Verifique sua conexão.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="pb-10">
      {/* Auth Status Warning */}
      {!authChecking && !userEmail && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
                <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
                <div>
                    <h3 className="text-red-800 font-bold">Você está desconectado!</h3>
                    <p className="text-red-700 text-sm mt-1">Seus registros não aparecerão para a equipe se você não estiver logado.</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2"
                    >
                        <LogIn size={16} />
                        <span>Fazer Login Agora</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{id ? 'Editar Registro' : 'Novo Registro'}</h2>
          {userEmail && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200">
                  Logado: {userEmail.split('@')[0]}
              </span>
          )}
      </div>
      
      <div className="space-y-6">
        {/* Section 1: General */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Informações Gerais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Data</label>
              <input type="date" className="input-field" value={formData.date} onChange={e => handleChange('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora de Início</label>
              <input type="time" className="input-field" value={formData.start_time} onChange={e => handleChange('start_time', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome da Equipe</label>
              <select 
                className="input-field" 
                value={formData.team} 
                onChange={e => handleChange('team', e.target.value)}
              >
                <option value="" disabled>Selecione a Equipe</option>
                {TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Placa da Van</label>
              <input type="text" placeholder="AA-00-BB" className="input-field uppercase" value={formData.van_plate} onChange={e => handleChange('van_plate', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 2: Kilometers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Quilometragem</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">KM Inicial</label>
              <input 
                type="text" 
                inputMode="decimal"
                className="input-field" 
                value={formData.km_start} 
                onChange={e => handleChange('km_start', e.target.value)} 
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">KM Final</label>
              <input 
                type="text" 
                inputMode="decimal"
                className="input-field" 
                value={formData.km_end} 
                onChange={e => handleChange('km_end', e.target.value)} 
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-4 bg-gray-50 p-3 rounded-lg flex justify-between items-center">
            <span className="font-medium text-gray-700">Distância Total:</span>
            <span className="font-bold text-xl text-primary">{formData.km_total} km</span>
          </div>
        </div>

        {/* Section 3: Articles */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Artigos</h3>
          <div className="grid grid-cols-3 gap-3">
             <div className="col-span-3 md:col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Carregados</label>
                <input type="number" inputMode="numeric" className="input-field" value={formData.articles_loaded} onChange={e => handleChange('articles_loaded', parseInt(e.target.value))} />
             </div>
             <div>
                <label className="block text-sm text-gray-600 mb-1">Entregues</label>
                <input type="number" inputMode="numeric" className="input-field text-green-600 font-medium" value={formData.articles_delivered} onChange={e => handleChange('articles_delivered', parseInt(e.target.value))} />
             </div>
             <div>
                <label className="block text-sm text-gray-600 mb-1">Falhas</label>
                <input type="number" inputMode="numeric" className="input-field text-red-500 font-medium" value={formData.articles_not_delivered} onChange={e => handleChange('articles_not_delivered', parseInt(e.target.value))} />
             </div>
          </div>
          
          {(formData.articles_not_delivered || 0) > 0 && (
            <div className="mt-4">
                <label className="block text-sm text-red-600 font-medium mb-1">Motivo das falhas</label>
                <textarea 
                    className="input-field min-h-[80px]" 
                    placeholder="Ex: Cliente ausente, endereço errado..." 
                    value={formData.reason_not_delivered}
                    onChange={e => handleChange('reason_not_delivered', e.target.value)}
                />
            </div>
          )}
        </div>

        {/* Section 4: Expenses */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Despesas</h3>
          
          <div className="flex items-center mb-4">
            <input 
                type="checkbox" 
                id="fueling" 
                checked={formData.fueling} 
                onChange={e => handleChange('fueling', e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-primary bg-white border-gray-300"
            />
            <label htmlFor="fueling" className="ml-2 text-gray-700 font-medium">Abasteceu hoje?</label>
          </div>

          {formData.fueling && (
            <div className="mb-4 pl-7">
                 <label className="block text-sm text-gray-600 mb-1">Valor do Combustível (€)</label>
                 <input 
                    type="text" 
                    inputMode="decimal"
                    className="input-field" 
                    placeholder="0.00"
                    value={formData.fuel_amount} 
                    onChange={e => handleChange('fuel_amount', e.target.value)}
                 />
            </div>
          )}

          <div className="mt-4 border-t pt-4">
             <label className="block text-sm text-gray-600 mb-1">Pedágios (€)</label>
             <input 
                type="text" 
                inputMode="decimal"
                className="input-field" 
                placeholder="0.00"
                value={formData.toll_amount} 
                onChange={e => handleChange('toll_amount', e.target.value)}
            />
          </div>
        </div>

         {/* Section 5: Attachments */}
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Fotos</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {formData.attachments?.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <img src={src} alt="attachment" className="w-full h-full object-cover" />
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                
                <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary cursor-pointer transition-colors bg-white ${processingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {processingImage ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                    <span className="text-xs mt-1">{processingImage ? 'Enviando...' : 'Adicionar Foto'}</span>
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
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-primary mb-4 border-b pb-2">Observações</h3>
            <textarea 
                className="input-field min-h-[100px]" 
                placeholder="Incidentes, observações ou comentários..."
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
            />
         </div>

         {/* Actions */}
         <div className="flex space-x-4 pt-4">
             <button 
                onClick={() => handleSubmit('draft')}
                disabled={loading || processingImage}
                className="flex-1 py-4 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
            >
                <Save size={20} />
                <span>Salvar Rascunho</span>
             </button>
             <button 
                onClick={() => handleSubmit('finalized')}
                disabled={loading || processingImage}
                className="flex-1 py-4 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20} />}
                <span>Finalizar Dia</span>
            </button>
         </div>
      </div>

      <style>{`
        .input-field {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
            outline: none;
            transition: all;
            font-size: 1rem;
            background-color: #ffffff;
            color: #1f2937;
        }
        .input-field:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RecordForm;