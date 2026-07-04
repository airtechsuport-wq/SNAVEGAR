import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Projeto: supabase-snavegar

let url = 'https://dbptkrgbjqkgrllsflcq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicHRrcmdianFrZ3JsbHNmbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTM2MzUsImV4cCI6MjA4NDIyOTYzNX0.D8q8WbD-QeH5KB5BG40OmlHgrRFWoMfZcEf7ejvp1Ps';

const supabaseUrl = url;

console.log('--- SUPABASE CONNECTIVITY ---');
console.log('Connecting to:', supabaseUrl);

// Inicializa o cliente Supabase de forma direta
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});