export type UserRole = 'clinic' | 'organization' | 'doctor' | 'employee' | 'registration';

export interface UserProfile {
  uid: string;
  role: UserRole;
  bin?: string;
  companyName?: string;
  leaderName?: string;
  phone: string;
  createdAt?: string;
  // Для врачей и регистраторов
  doctorId?: string; // ID врача в клинике
  clinicId?: string; // ID клиники, к которой привязан врач/регистратор
  clinicBin?: string; // БИН клиники
  specialty?: string; // Специальность врача
  // Для сотрудников
  employeeId?: string; // ID сотрудника в контингенте
  contractId?: string; // ID договора, к которому привязан сотрудник
}

export interface Employee {
  id: string;
  name: string;
  dob: string;
  gender: 'М' | 'Ж';
  site: string;
  position: string;
  // Доп. поля Приложения 3
  totalExperience?: string;        // Общий стаж
  positionExperience?: string;     // Стаж по должности
  lastMedDate?: string;            // Дата последнего медосмотра
  note?: string;                   // Примечание (может содержать телефон для регистрации)
  harmfulFactor: string;
  status: 'pending' | 'fit' | 'unfit' | 'needs_observation' | 'fit_with_restrictions';
  healthGroup?: 'I' | 'II' | 'III' | 'IV' | 'V'; // Группа здоровья
  phone?: string;                  // Телефон сотрудника (извлекается из note)
  userId?: string;                  // UID пользователя, если зарегистрирован
}


export type ContractStatus = 'request' | 'negotiation' | 'planning' | 'execution' | 'completed';

export interface CalendarPlan {
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'rejected';
  rejectReason?: string;
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
  doctors?: Doctor[]; // Врачи клиники для маршрутных листов
  calendarPlan?: CalendarPlan;
  documents: ContractDocument[];

  // OTP-based signing (per side)
  clientSignOtp?: string | null;
  clinicSignOtp?: string | null;

  // Final Reports Content
  finalActContent?: string;
  healthPlanContent?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone?: string; // Номер телефона для создания аккаунта врача
  isChairman?: boolean;
  roomNumber?: string; // Номер кабинета (может меняться каждый день)
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