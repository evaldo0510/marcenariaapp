
import { createClient } from '@supabase/supabase-js';

// Tenta obter variáveis de ambiente do Vite ou process (para compatibilidade)
// @ts-ignore
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Helper para obter o email do usuário atual (simulado no sessionStorage)
export const getCurrentUserEmail = () => {
    return sessionStorage.getItem('userEmail') || 'anonymous';
};
