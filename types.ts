export interface DailyRecord {
  id: string;
  user_id?: string;
  created_by_email?: string; // Novo campo para identificar o autor
  date: string;
  team: string;
  van_plate: string;
  start_time: string;
  km_start: number;
  km_end: number;
  km_total: number;
  articles_loaded: number;
  articles_delivered: number;
  articles_not_delivered: number;
  reason_not_delivered: string;
  fueling: boolean;
  fuel_amount: number;
  toll_amount: number;
  attachments: string[]; // URLs now
  notes: string;
  status: 'draft' | 'finalized';
  archived: boolean;
  created_at: string;
  _isSynced?: boolean; // Helper visual para saber se está na nuvem
}

export interface User {
  id: string;
  email: string;
}

export type RecordFilter = {
  startDate?: string;
  endDate?: string;
  team?: string;
  vanPlate?: string;
};