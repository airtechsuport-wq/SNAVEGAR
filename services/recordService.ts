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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

const saveLocalRecord = async (record: DailyRecord) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record); 
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Erro na transação de salvamento local");
    request.onerror = () => reject("Erro na requisição de salvamento local");
  });
};

const deleteLocalRecord = async (id: string) => {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject("Erro ao apagar registro local");
  });
};

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

const migrateLegacyData = async () => {
  const legacyData = localStorage.getItem(OLD_STORAGE_KEY);
  if (legacyData) {
    try {
      console.log("Iniciando migração de armazenamento...");
      const parsedData: DailyRecord[] = JSON.parse(legacyData);
      const db = await openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      parsedData.forEach(record => store.put(record));
      transaction.oncomplete = () => {
        console.log("Migração concluída com sucesso!");
        localStorage.removeItem(OLD_STORAGE_KEY);
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
    scraps_collected: safeFloat(record.scraps_collected),
    scrap_client_names: record.scrap_client_names || '',
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
        console.error("Upload Error (Check bucket exists!):", error);
        throw error; // Lança erro para ser tratado no nível acima
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
            
            if (url) return url;

            // FAILSAFE IMPORTANTE: 
            // Se o upload falhar (ex: bucket não existe), NÃO retorne o base64 original.
            // Isso faria o payload estourar o limite do banco de dados.
            // Retornamos um placeholder para garantir que o texto seja salvo.
            console.warn("Imagem falhou no upload. Salvando placeholder para não perder dados.");
            return "https://placehold.co/600x400?text=Erro+Upload+Imagem+(Verifique+Storage)";

        } catch (e) {
            console.error("Falha fatal ao processar imagem:", e);
            return "https://placehold.co/600x400?text=Erro+Processamento";
        }
      }
      return att;
    }));
    return processed;
  },

  // RETORNA UM OBJETO AGORA PARA DEBUG
  async syncPendingRecords(): Promise<{count: number, error?: string}> {
    if (!supabase) return { count: 0, error: "Supabase não configurado" };
    
    await migrateLegacyData();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { count: 0, error: "Usuário não logado" };

    const user = session.user;
    const localRecords = await getAllLocalRecords();
    const pending = localRecords.filter(r => r._isSynced === false);

    if (pending.length === 0) return { count: 0 };

    console.log(`Tentando sincronizar ${pending.length} registros...`);
    let syncedCount = 0;
    let lastError = "";

    for (const record of pending) {
        try {
            // Processa imagens (com failsafe agora)
            if (record.attachments && record.attachments.length > 0) {
                const updatedAttachments = await this.processAttachmentsForSync(record.attachments);
                record.attachments = updatedAttachments;
            }

            // Garante que o ID do usuário é o atual (corrige registros offline antigos)
            const payload = preparePayload(record, user.id, user.email);
            
            const { error } = await supabase.from('daily_records').upsert(payload);
            
            if (!error) {
                const syncedRecord = { ...record, _isSynced: true };
                await saveLocalRecord(syncedRecord);
                syncedCount++;
            } else {
                console.error("Sync Error Individual:", error.message);
                lastError = `Erro no banco: ${error.message}`;
            }
        } catch (err: any) {
            console.error("Sync Exception:", err);
            lastError = `Erro crítico: ${err.message || err}`;
        }
    }
    
    return { count: syncedCount, error: syncedCount === 0 ? lastError : undefined };
  },

  async getAll(): Promise<DailyRecord[]> {
    await migrateLegacyData();

    let serverRecords: DailyRecord[] = [];
    let isOffline = false;
    
    if (supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
             console.warn("Sem sessão ativa.");
             isOffline = true;
        } else {
            const { data, error } = await supabase
                .from('daily_records')
                .select(`
                    id, 
                    date, 
                    team, 
                    van_plate, 
                    created_by_email,
                    km_total, 
                    articles_delivered, 
                    articles_not_delivered, 
                    archived,
                    scraps_collected,
                    _isSynced: id
                `) 
                .order('date', { ascending: false })
                .limit(100); 
                
            if (error) {
                console.warn("Supabase GET Error:", error.message);
                isOffline = true;
            } else if (data) {
                serverRecords = data.map(r => ({ ...r, _isSynced: true })) as unknown as DailyRecord[];
            }
        }
      } catch (err) {
        console.error("Exceção na busca do servidor:", err);
        isOffline = true;
      }
    }
    
    const localRecords = await getAllLocalRecords();
    
    const finalMap = new Map<string, DailyRecord>();
    localRecords.forEach(r => finalMap.set(r.id, r));

    if (!isOffline && serverRecords.length > 0) {
        for (const serverRecord of serverRecords) {
           const localMatch = finalMap.get(serverRecord.id);
           
           if (localMatch) {
               const merged = { ...localMatch, ...serverRecord, attachments: localMatch.attachments || [] };
               finalMap.set(serverRecord.id, merged);
           } else {
               finalMap.set(serverRecord.id, serverRecord);
               saveLocalRecord(serverRecord).catch(e => console.warn(e));
           }
        }
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
          if (newRecord.attachments && newRecord.attachments.some(a => a.startsWith('data:'))) {
             newRecord.attachments = await this.processAttachmentsForSync(newRecord.attachments);
          }
          const payload = preparePayload(newRecord, session.user.id, session.user.email);
          const { error } = await supabase.from('daily_records').insert(payload);
          if (!error) newRecord._isSynced = true;
        }
      } catch (err: any) {
        console.error("Create Exception:", err);
      }
    }
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
                 'fuel_amount', 'toll_amount', 'scraps_collected'].forEach(key => {
                    if (cleanUpdates[key] !== undefined) cleanUpdates[key] = safeFloat(cleanUpdates[key]);
                });

                const { error } = await supabase.from('daily_records').update(cleanUpdates).eq('id', id);
                if (!error && updatedRecord) updatedRecord._isSynced = true;
            }
        } catch (e) { console.error(e); }
    }

    if (updatedRecord) await saveLocalRecord(updatedRecord);
    return updatedRecord;
  },

  async delete(id: string): Promise<void> {
    return this.deleteMultiple([id]);
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    let allImagesToDelete: string[] = [];
    const localRecords = await getAllLocalRecords();
    
    for (const id of ids) {
        const record = localRecords.find(r => r.id === id);
        if (record?.attachments?.length) {
            record.attachments.forEach(url => {
                 if (url.includes(BUCKET_NAME)) {
                    const fileName = url.split(`${BUCKET_NAME}/`).pop();
                    if (fileName) allImagesToDelete.push(fileName);
                 }
            });
        }
    }

    if (supabase) {
        try {
            if (allImagesToDelete.length > 0) {
                await supabase.storage.from(BUCKET_NAME).remove(allImagesToDelete);
            }
            await supabase.from('daily_records').delete().in('id', ids);
        } catch (e) { console.error(e); }
    }
    for (const id of ids) await deleteLocalRecord(id);
  },

  async getById(id: string): Promise<DailyRecord | undefined> {
    const localRecords = await getAllLocalRecords();
    let local = localRecords.find(r => r.id === id);

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