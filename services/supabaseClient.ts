import { createClient } from '@supabase/supabase-js';

// Credenciais configuradas para o projeto SNavegar
const supabaseUrl = 'https://trhbwhsirdqqqjxkzumj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyaGJ3aHNpcmRxcXFqeGt6dW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzk5MzEsImV4cCI6MjA4MzY1NTkzMX0.GelxCRiv2OFOUZu9oEB4RNAc_oo5R1HdzAdCoPxVr3k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);