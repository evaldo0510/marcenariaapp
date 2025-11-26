import { createClient } from '@supabase/supabase-js';

// Função segura para obter variáveis de ambiente em diferentes contextos (Vite/Node/Browser)
const getEnvVar = (key: string): string | undefined => {
    // Tenta import.meta.env (Vite)
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) {}

    // Tenta process.env (Node/Next.js/Fallback)
    try {
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {}

    return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Helper para obter o email do usuário atual (simulado no sessionStorage)
export const getCurrentUserEmail = () => {
    return sessionStorage.getItem('userEmail') || 'anonymous';
};