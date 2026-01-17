import { supabase } from './supabaseClient';
import { DailyRecord } from '../types';

const DB_NAME = 'SNavegarDB';
const DB_VERSION = 1;
const STORE_NAME = 'daily_records';
const BUCKET_NAME = 'app-images';
const OLD_STORAGE_KEY = 'snavegar_records'; // Para migração

// --- INDEXED DB HELPERS (O "Armazém Gigante") ---

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject("Erro ao abrir banco de dados local");

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Cria a "tabela" local usando 'id' como chave primária
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

// Salva um único registro no IndexedDB
const saveLocalRecord = async (record: DailyRecord) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record); 

    // IMPORTANTE: Aguarda a transação completar totalmente antes de resolver.
    // Isso garante que os dados estão no disco antes de a UI tentar lê-los.
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Erro na transação de salvamento local");
    request.onerror = () => reject("Erro na requisição de salvamento local");
  });
};

// Busca todos os registros locais
const getAllLocalRecords = async (): Promise<DailyRecord[]> => {
  const db = await openDB();
  return new Promise<DailyRecord[]>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const records = request.result as DailyRecord[];
        resolve(records || []);
    };
    request.onerror = () => reject("Erro ao ler registros locais");
  });
};

// Migração: Move dados do LocalStorage (Bolso) para IndexedDB (Mochila) e limpa o bolso
const migrateLegacyData = async () => {
  const legacyData = localStorage.getItem(OLD_STORAGE_KEY);
  if (legacyData) {
    try {
      console.log("Iniciando migração de armazenamento...");
      const parsedData: DailyRecord[] = JSON.parse(legacyData);
      
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      parsedData.forEach(record => {
        store.put(record);
      });

      transaction.oncomplete = () => {
        console.log("Migração concluída com sucesso!");
        localStorage.removeItem(OLD_STORAGE_KEY); // Libera o localStorage
      };
    } catch (e) {
      console.error("Erro na migração de dados:", e);
    }
  }
};

// --- HELPERS GERAIS ---

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const safeFloat = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Prepara o objeto para ser aceito pelo PostgreSQL sem erros
const preparePayload = (record: DailyRecord, userId: string, userEmail?: string) => {
  return {
    id: record.id,
    user_id: userId,
    created_by_email: userEmail || record.created_by_email,
    date: record.date,
    team: record.team || 'Equipe Indefinida',
    van_plate: record.van_plate || '',
    start_time: record.start_time || '00:00',
    km_start: safeFloat(record.km_start),
    km_end: safeFloat(record.km_end),
    km_total: safeFloat(record.km_total),
    articles_loaded: safeFloat(record.articles_loaded),
    articles_delivered: safeFloat(record.articles_delivered),
    articles_not_delivered: safeFloat(record.articles_not_delivered),
    reason_not_delivered: record.reason_not_delivered || '',
    fueling: !!record.fueling,
    fuel_amount: safeFloat(record.fuel_amount),
    toll_amount: safeFloat(record.toll_amount),
    attachments: record.attachments || [],
    notes: record.notes || '',
    status: record.status || 'draft',
    archived: !!record.archived,
    created_at: record.created_at || new Date().toISOString()
  };
};

// --- SERVICE ---

export const recordService = {
  async uploadImage(file: Blob): Promise<string | null> {
    if (!supabase) return null;
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, { 
        cacheControl: '3600', 
        upsert: false 
      });
      if (error) {
        console.error("Upload Error:", error);
        return null;
      }
      const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) { 
        console.error("Upload Exception:", err);
        return null; 
    }
  },

  async processAttachmentsForSync(attachments: string[]): Promise<string[]> {
    if (!attachments || !attachments.length) return [];
    
    const hasBase64 = attachments.some(a => a.startsWith('data:'));
    if (!hasBase64) return attachments;

    const processed = await Promise.all(attachments.map(async (att) => {
      if (att.startsWith('data:')) {
        try {
            const res = await fetch(att);
            const blob = await res.blob();
            const url = await this.uploadImage(blob);
            return url || att; 
        } catch (e) {
            console.error("Falha ao processar imagem para sync:", e);
            return att;
        }
      }
      return att;
    }));
    return processed;
  },

  async syncPendingRecords(): Promise<number> {
    if (!supabase) return 0;
    
    // Tenta migrar dados legados antes do sync, por segurança
    await migrateLegacyData();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return 0;

    const user = session.user;
    const localRecords = await getAllLocalRecords();
    const pending = localRecords.filter(r => r._isSynced === false);

    if (pending.length === 0) return 0;

    console.log(`Tentando sincronizar ${pending.length} registros...`);
    let syncedCount = 0;

    for (const record of pending) {
        try {
            if (record.attachments && record.attachments.length > 0) {
                const updatedAttachments = await this.processAttachmentsForSync(record.attachments);
                record.attachments = updatedAttachments;
            }

            const payload = preparePayload(record, user.id, user.email);
            const { error } = await supabase.from('daily_records').upsert(payload);
            
            if (!error) {
                // Atualiza localmente para marcar como sincronizado
                const syncedRecord = { ...record, _isSynced: true };
                await saveLocalRecord(syncedRecord);
                syncedCount++;
            } else {
                console.error("Sync Error Individual:", error.message);
            }
        } catch (err) {
            console.error("Sync Exception:", err);
        }
    }
    
    return syncedCount;
  },

  async getAll(): Promise<DailyRecord[]> {
    await migrateLegacyData();

    let serverRecords: DailyRecord[] = [];
    let isOffline = false;
    
    // 2. Busca do Servidor
    if (supabase) {
      try {
        const { data, error } = await supabase
            .from('daily_records')
            .select('*')
            .order('date', { ascending: false })
            .limit(100);
            
        if (error) {
            console.warn("Supabase GET Error (Offline?):", error.message);
            isOffline = true;
        } else if (data) {
          serverRecords = data.map(r => ({ ...r, _isSynced: true })) as DailyRecord[];
        }
      } catch (err) {
        isOffline = true;
      }
    }
    
    // 3. Busca Local
    const localRecords = await getAllLocalRecords();
    
    // 4. Merge Inteligente
    const finalMap = new Map<string, DailyRecord>();

    if (!isOffline) {
        // Servidor tem prioridade, mas salvamos o que vem dele no cache local
        for (const r of serverRecords) {
           finalMap.set(r.id, r);
           // Update cache in background without awaiting
           saveLocalRecord(r).catch(e => console.warn("Cache update failed", e));
        }
        
        // Adiciona locais que ainda não subiram
        localRecords.forEach(r => {
            if (!finalMap.has(r.id) || !r._isSynced) {
                finalMap.set(r.id, r);
            }
        });
    } else {
        // Offline: mostra tudo que tem local
        localRecords.forEach(r => finalMap.set(r.id, r));
    }

    const merged = Array.from(finalMap.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return merged;
  },

  async create(record: Omit<DailyRecord, 'id' | 'created_at' | 'archived'>): Promise<DailyRecord> {
    const newId = generateUUID();
    const newRecord = {
      ...record,
      id: newId,
      archived: false,
      created_at: new Date().toISOString(),
      _isSynced: false
    } as DailyRecord;

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Processa imagens se necessário
          if (newRecord.attachments && newRecord.attachments.some(a => a.startsWith('data:'))) {
             newRecord.attachments = await this.processAttachmentsForSync(newRecord.attachments);
          }

          const payload = preparePayload(newRecord, session.user.id, session.user.email);
          const { error } = await supabase.from('daily_records').insert(payload);
          
          if (!error) {
            newRecord._isSynced = true;
          } else {
            console.error("Supabase Create Error:", error.message);
            // Não damos throw aqui, deixamos salvar localmente com _isSynced=false
          }
        } else {
             // Sem sessão, apenas salva local (offline mode ou fallback)
             console.warn("User not logged in, saving locally only.");
        }
      } catch (err: any) {
        console.error("Create Exception:", err);
      }
    }

    // Salva Localmente Sempre e espera a transação completar
    await saveLocalRecord(newRecord);

    return newRecord;
  },

  async update(id: string, updates: Partial<DailyRecord>): Promise<DailyRecord | null> {
    let updatedRecord: DailyRecord | null = null;
    
    const localRecords = await getAllLocalRecords();
    const existing = localRecords.find(r => r.id === id);

    if (existing) {
        updatedRecord = { ...existing, ...updates, _isSynced: false };
    }

    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const cleanUpdates: any = { ...updates };
                delete cleanUpdates._isSynced;
                delete cleanUpdates.id;

                if (cleanUpdates.attachments && cleanUpdates.attachments.some((a:string) => a.startsWith('data:'))) {
                    cleanUpdates.attachments = await this.processAttachmentsForSync(cleanUpdates.attachments);
                    if (updatedRecord) updatedRecord.attachments = cleanUpdates.attachments;
                }

                ['km_start', 'km_end', 'km_total', 'articles_loaded', 
                 'articles_delivered', 'articles_not_delivered', 
                 'fuel_amount', 'toll_amount'].forEach(key => {
                    if (cleanUpdates[key] !== undefined) {
                        cleanUpdates[key] = safeFloat(cleanUpdates[key]);
                    }
                });

                const { error } = await supabase.from('daily_records').update(cleanUpdates).eq('id', id);
                if (!error && updatedRecord) {
                    updatedRecord._isSynced = true;
                }
            }
        } catch (e) {
            console.error("Update DB Error:", e);
        }
    }

    if (updatedRecord) {
        await saveLocalRecord(updatedRecord);
    }
    
    return updatedRecord;
  },

  async getById(id: string): Promise<DailyRecord | undefined> {
    // Tenta cache local primeiro para velocidade
    const localRecords = await getAllLocalRecords();
    const local = localRecords.find(r => r.id === id);

    if (supabase) {
        try {
            const { data } = await supabase.from('daily_records').select('*').eq('id', id).single();
            if (data) {
                const record = { ...data, _isSynced: true } as DailyRecord;
                await saveLocalRecord(record);
                return record;
            }
        } catch (e) {}
    }
    
    return local;
  }
};