
import type { ProjectHistoryItem, Client, Finish, Transaction, InventoryItem, DistributorProfile } from '../types';
import { supabase, isSupabaseConfigured, getCurrentUserEmail } from './supabaseClient';

const DB_NAME = 'MarcenAppDB';
const PROJECTS_STORE_NAME = 'projects';
const CLIENTS_STORE_NAME = 'clients';
const FAVORITE_FINISHES_STORE_NAME = 'favoriteFinishes';
const TRANSACTIONS_STORE_NAME = 'transactions';
const INVENTORY_STORE_NAME = 'inventory';
const DISTRIBUTOR_PROFILE_STORE_NAME = 'distributorProfile';
const DB_VERSION = 6;

// --- INDEXED DB HELPERS (FALLBACK) ---

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(CLIENTS_STORE_NAME)) db.createObjectStore(CLIENTS_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(FAVORITE_FINISHES_STORE_NAME)) db.createObjectStore(FAVORITE_FINISHES_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(TRANSACTIONS_STORE_NAME)) db.createObjectStore(TRANSACTIONS_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(INVENTORY_STORE_NAME)) db.createObjectStore(INVENTORY_STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(DISTRIBUTOR_PROFILE_STORE_NAME)) db.createObjectStore(DISTRIBUTOR_PROFILE_STORE_NAME, { keyPath: 'id' });
    };
  });
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function idbPut<T>(storeName: string, item: T): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbDelete(storeName: string, id: string): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// --- PROJECT HISTORY FUNCTIONS ---

export const getHistory = async (): Promise<ProjectHistoryItem[]> => {
  // CLOUD FIRST
  if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_email', getCurrentUserEmail())
          .order('timestamp', { ascending: false });
      
      if (!error && data) return data as ProjectHistoryItem[];
  }

  // LOCAL FALLBACK
  const projects = await idbGetAll<ProjectHistoryItem>(PROJECTS_STORE_NAME);
  return projects.sort((a, b) => b.timestamp - a.timestamp);
};

export const addProjectToHistory = async (project: Omit<ProjectHistoryItem, 'id' | 'timestamp'>): Promise<ProjectHistoryItem[]> => {
    const newProject: ProjectHistoryItem = {
        ...project,
        id: `proj_${Date.now()}`,
        timestamp: Date.now(),
        status: project.status || 'orcamento'
    };

    if (isSupabaseConfigured() && supabase) {
        await supabase.from('projects').insert([{ ...newProject, user_email: getCurrentUserEmail() }]);
    } else {
        await idbPut(PROJECTS_STORE_NAME, newProject);
    }
    
    return getHistory();
};

export const removeProjectFromHistory = async (id: string): Promise<ProjectHistoryItem[]> => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('projects').delete().eq('id', id);
    } else {
        await idbDelete(PROJECTS_STORE_NAME, id);
    }
    return getHistory();
};

export const updateProjectInHistory = async (id: string, updates: Partial<ProjectHistoryItem>): Promise<ProjectHistoryItem | null> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (!error) return data;
        return null;
    } else {
        const db = await openDb();
        const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE_NAME);
        
        const project = await new Promise<ProjectHistoryItem | undefined>((resolve, reject) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        if (!project) return null;
        const updatedProject = { ...project, ...updates };
        store.put(updatedProject);
        
        await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
        return updatedProject;
    }
};


// --- CLIENT FUNCTIONS ---

export const getClients = async (): Promise<Client[]> => {
  if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('clients').select('*').eq('user_email', getCurrentUserEmail());
      if (!error && data) return data as Client[];
  }
  const clients = await idbGetAll<Client>(CLIENTS_STORE_NAME);
  return clients.sort((a, b) => b.timestamp - a.timestamp);
};

export const saveClient = async (client: Omit<Client, 'id' | 'timestamp'> & { id?: string }): Promise<Client[]> => {
    const clientToSave: Client = {
        ...client,
        id: client.id || `client_${Date.now()}`,
        timestamp: Date.now(),
    };

    if (isSupabaseConfigured() && supabase) {
        // Upsert handles both insert and update based on ID
        await supabase.from('clients').upsert([{ ...clientToSave, user_email: getCurrentUserEmail() }]);
    } else {
        await idbPut(CLIENTS_STORE_NAME, clientToSave);
    }
    return getClients();
};

export const removeClient = async (id: string): Promise<Client[]> => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('clients').delete().eq('id', id);
    } else {
        await idbDelete(CLIENTS_STORE_NAME, id);
    }
    return getClients();
};

// --- INVENTORY FUNCTIONS ---

export const getInventory = async (): Promise<InventoryItem[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('inventory').select('*').eq('user_email', getCurrentUserEmail());
        if (!error && data) return data as InventoryItem[];
    }
    const items = await idbGetAll<InventoryItem>(INVENTORY_STORE_NAME);
    return items.sort((a, b) => a.name.localeCompare(b.name));
};

export const saveInventoryItem = async (item: InventoryItem): Promise<InventoryItem[]> => {
    const itemToSave = { ...item, lastUpdated: Date.now() };
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('inventory').upsert([{ ...itemToSave, user_email: getCurrentUserEmail() }]);
    } else {
        await idbPut(INVENTORY_STORE_NAME, itemToSave);
    }
    return getInventory();
};

export const deleteInventoryItem = async (id: string): Promise<InventoryItem[]> => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('inventory').delete().eq('id', id);
    } else {
        await idbDelete(INVENTORY_STORE_NAME, id);
    }
    return getInventory();
};

// --- FINANCIAL TRANSACTIONS FUNCTIONS ---

export const getTransactions = async (): Promise<Transaction[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('transactions').select('*').eq('user_email', getCurrentUserEmail());
        if (!error && data) return data as Transaction[];
    }
    const transactions = await idbGetAll<Transaction>(TRANSACTIONS_STORE_NAME);
    return transactions.sort((a, b) => b.date - a.date);
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction[]> => {
    const newTx: Transaction = {
        ...transaction,
        id: `tx_${Date.now()}`,
    };
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('transactions').insert([{ ...newTx, user_email: getCurrentUserEmail() }]);
    } else {
        await idbPut(TRANSACTIONS_STORE_NAME, newTx);
    }
    return getTransactions();
};

export const deleteTransaction = async (id: string): Promise<Transaction[]> => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('transactions').delete().eq('id', id);
    } else {
        await idbDelete(TRANSACTIONS_STORE_NAME, id);
    }
    return getTransactions();
};

// --- LOCAL ONLY (Favorite Finishes & Distributor Profile) ---
// These remain local for now as they are user preferences/session specific

export const getFavoriteFinishes = async (): Promise<Finish[]> => {
    return idbGetAll<Finish>(FAVORITE_FINISHES_STORE_NAME);
};

export const addFavoriteFinish = async (finish: Finish): Promise<Finish[]> => {
    await idbPut(FAVORITE_FINISHES_STORE_NAME, finish);
    return getFavoriteFinishes();
};

export const removeFavoriteFinish = async (id: string): Promise<Finish[]> => {
    await idbDelete(FAVORITE_FINISHES_STORE_NAME, id);
    return getFavoriteFinishes();
};

export const getDistributorProfile = async (): Promise<DistributorProfile | undefined> => {
    const profiles = await idbGetAll<DistributorProfile>(DISTRIBUTOR_PROFILE_STORE_NAME);
    return profiles[0];
};

export const createDistributorProfile = async (profile: Omit<DistributorProfile, 'id'>): Promise<DistributorProfile> => {
    const newProfile: DistributorProfile = { ...profile, id: 'current_user' };
    await idbPut(DISTRIBUTOR_PROFILE_STORE_NAME, newProfile);
    return newProfile;
};
