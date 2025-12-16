export type UserRole = 'clinic' | 'organization';

export interface UserProfile {
  uid: string;
  role: UserRole;
  bin: string;
  companyName: string;
  leaderName: string;
  phone: string;
}

export interface Employee {
  id: string;
  name: string;
  dob: string;
  gender: 'М' | 'Ж';
  site: string;
  position: string;
  harmfulFactor: string;
  status: 'pending' | 'fit' | 'unfit' | 'needs_observation';
}

export type ContractStatus = 'request' | 'negotiation' | 'planning' | 'execution' | 'completed';

export interface CalendarPlan {
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved';
}

export interface ContractDocument {
  id: string;
  type: 'contract' | 'order' | 'route_sheet' | 'final_act' | 'health_plan';
  title: string;
  date: string;
  url?: string;
}

export interface Contract {
  id: string;
  number: string; // "D-2024/..." or "Draft"
  
  // Parties Info
  clientName: string; 
  clientBin: string;
  clientSigned: boolean;

  clinicName: string; 
  clinicBin: string;
  clinicSigned: boolean;
  
  date: string;
  status: ContractStatus;
  
  // Commercial Terms
  price: number;
  plannedHeadcount: number;
  
  // Workflow Data
  employees: Employee[]; // Contingent (App 3)
  calendarPlan?: CalendarPlan;
  documents: ContractDocument[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  isChairman?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface AnalysisResult {
  text: string;
  employees?: Employee[];
  groundingChunks?: GroundingChunk[];
}

export enum AppState {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
}