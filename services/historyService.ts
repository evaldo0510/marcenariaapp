import type { ProjectHistoryItem, Client, Finish } from '../types';

const DB_NAME = 'MarcenAppDB';
const PROJECTS_STORE_NAME = 'projects';
const CLIENTS_STORE_NAME = 'clients';
const FAVORITE_FINISHES_STORE_NAME = 'favoriteFinishes';
const DB_VERSION = 4; // Incremented version

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
      if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
        db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CLIENTS_STORE_NAME)) {
        db.createObjectStore(CLIENTS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FAVORITE_FINISHES_STORE_NAME)) {
        db.createObjectStore(FAVORITE_FINISHES_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// --- PROJECT HISTORY FUNCTIONS ---

export const getHistory = async (): Promise<ProjectHistoryItem[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readonly');
    const store = tx.objectStore(PROJECTS_STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const projects: ProjectHistoryItem[] = request.result;
      resolve(projects.sort((a, b) => b.timestamp - a.timestamp));
    };
  });
};

export const addProjectToHistory = async (project: Omit<ProjectHistoryItem, 'id' | 'timestamp'>): Promise<ProjectHistoryItem[]> => {
    const newProject: ProjectHistoryItem = {
        ...project,
        id: `proj_${Date.now()}`,
        timestamp: Date.now(),
    };
    const db = await openDb();
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    tx.objectStore(PROJECTS_STORE_NAME).put(newProject);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getHistory();
};

export const removeProjectFromHistory = async (id: string): Promise<ProjectHistoryItem[]> => {
    const db = await openDb();
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    tx.objectStore(PROJECTS_STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getHistory();
};

export const updateProjectInHistory = async (id: string, updates: Partial<ProjectHistoryItem>): Promise<ProjectHistoryItem | null> => {
    const db = await openDb();
    const tx = db.transaction(PROJECTS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE_NAME);
    const project = await new Promise<ProjectHistoryItem | undefined>((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
    if (!project) return null;
    const updatedProject = { ...project, ...updates };
    store.put(updatedProject);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return updatedProject;
};


// --- CLIENT FUNCTIONS ---

export const getClients = async (): Promise<Client[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CLIENTS_STORE_NAME, 'readonly');
    const store = tx.objectStore(CLIENTS_STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const clients: Client[] = request.result;
      resolve(clients.sort((a, b) => b.timestamp - a.timestamp));
    };
  });
};

export const saveClient = async (client: Omit<Client, 'id' | 'timestamp'> & { id?: string }): Promise<Client[]> => {
    const clientToSave: Client = {
        ...client,
        id: client.id || `client_${Date.now()}`,
        timestamp: Date.now(),
    };
    const db = await openDb();
    const tx = db.transaction(CLIENTS_STORE_NAME, 'readwrite');
    tx.objectStore(CLIENTS_STORE_NAME).put(clientToSave);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getClients();
};

export const removeClient = async (id: string): Promise<Client[]> => {
    const db = await openDb();
    const tx = db.transaction(CLIENTS_STORE_NAME, 'readwrite');
    tx.objectStore(CLIENTS_STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getClients();
};

// --- FAVORITE FINISHES FUNCTIONS ---

export const getFavoriteFinishes = async (): Promise<Finish[]> => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(FAVORITE_FINISHES_STORE_NAME, 'readonly');
        const store = tx.objectStore(FAVORITE_FINISHES_STORE_NAME);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            resolve(request.result || []);
        };
    });
};

export const addFavoriteFinish = async (finish: Finish): Promise<Finish[]> => {
    const db = await openDb();
    const tx = db.transaction(FAVORITE_FINISHES_STORE_NAME, 'readwrite');
    tx.objectStore(FAVORITE_FINISHES_STORE_NAME).put(finish);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getFavoriteFinishes();
};

export const removeFavoriteFinish = async (id: string): Promise<Finish[]> => {
    const db = await openDb();
    const tx = db.transaction(FAVORITE_FINISHES_STORE_NAME, 'readwrite');
    tx.objectStore(FAVORITE_FINISHES_STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    return getFavoriteFinishes();
};