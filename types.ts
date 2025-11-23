
// ... existing imports ...

// --- ARCVISION TYPES ---

export interface MaterialCollection {
  label: string;
  desc: string;
  colors: string[];
}

export interface ProjectLevel {
  label: string;
  desc: string;
  searchTerm: string;
}

// ... existing types ...

export interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

export interface Finish {
  id: string;
  name: string;
  description: string;
  type: 'wood' | 'solid' | 'metal' | 'stone' | 'concrete' | 'ceramic' | 'fabric' | 'glass' | 'laminate' | 'veneer';
  imageUrl: string | null;
  manufacturer: string;
  hexCode?: string;
}

export interface AlertState {
  show: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export interface ImageModalState {
  show: boolean;
  src: string;
}

export interface Client {
  id: string;
  timestamp: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: 'lead' | 'active' | 'completed' | 'on-hold';
}

export type ProjectStatus = 'orcamento' | 'aprovado' | 'producao' | 'montagem' | 'finalizado';

export interface ProjectHistoryItem {
  id:string;
  timestamp: number;
  name: string;
  description: string;
  details?: string;
  assemblyDetails?: string; 
  views3d: string[];
  image2d: string | null;
  crossSectionImage?: string | null;
  style: string;
  withLedLighting?: boolean;
  selectedFinish?: {
    manufacturer: string;
    finish: Finish;
    handleDetails?: string;
  } | null;
  bom: string | null;
  cuttingPlan?: string | null;
  cuttingPlanImage?: string | null;
  cuttingPlanOptimization?: string | null;
  clientId?: string;
  clientName?: string;
  materialCost?: number;
  laborCost?: number;
  projectValue?: number; // Custo para o cliente final
  timeTracked?: number; // Tempo em milissegundos
  comments?: Comment[];
  status?: ProjectStatus; // New field for Kanban
  dueDate?: number; // New field for deadline
  // Fields for draft projects
  uploadedReferenceImageUrls?: string[] | null;
  uploadedFloorPlanUrl?: string | null;
  // Deprecated fields, kept for history compatibility but not used for new generations
  lightingStyle?: string;
  shadowStyle?: string;
  textureStyle?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: any[];
}

export interface Distributor {
  title: string;
  uri: string;
}

export type LocationState = { latitude: number; longitude: number } | null;

export interface PricedBomItem {
  item: string;
  qty: string;
  dimensions: string;
  price?: number;
  supplier?: string;
  url?: string;
  isSearching: boolean;
}

export interface Marceneiro {
  id: number;
  nome: string;
  cidade: string;
  especialidade: string[];
  anosExperiencia: number;
  notaMedia: number;
  email: string;
}

export interface ProjectLead {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: string;
}

// --- NEW TYPES FOR MANAGEMENT MODULES ---

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: number;
  status: 'paid' | 'pending';
  projectId?: string; // Link to project
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string; // un, m², m, kg
  minStock: number;
  unitPrice: number;
  supplier?: string;
  lastUpdated: number;
}

// --- DISTRIBUTOR SYSTEM TYPES ---

export interface DistributorProfile {
    id?: string;
    name: string;
    email: string;
    region: string;
    level: 'bronze' | 'prata' | 'ouro' | 'platinum';
    totalSales: number;
    commissionRate: number;
    joinDate: number;
    status: 'active' | 'pending' | 'suspended';
}

export interface Notification {
    id: string;
    type: 'sale' | 'system' | 'commission' | 'alert';
    title: string;
    message: string;
    date: number;
    read: boolean;
}

export interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit'; // credit = commission, debit = withdrawal
    amount: number;
    description: string;
    date: number;
    status: 'completed' | 'pending' | 'processing';
    referenceId?: string; // ID of sale or withdrawal request
}
