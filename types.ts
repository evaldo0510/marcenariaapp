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
  imageUrl: string;
  manufacturer: string;
}

export interface AlertState {
  show: boolean;
  title: string;
  message: string;
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