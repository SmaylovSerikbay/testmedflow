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
  visitId?: number;                 // ID текущего визита
}

export interface EmployeeVisit {
  id: number;
  employeeId: string;
  contractId: number;
  clinicId: string;
  visitDate: string;
  status: 'registered' | 'in_progress' | 'completed' | 'cancelled';
  routeSheet: RouteSheetItem[];
  checkInTime?: string;
  checkOutTime?: string;
}

export interface RouteSheetItem {
  specialty: string;
  doctorId?: string;
  doctorName?: string;
  roomNumber?: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  notes?: string;
}

export interface AmbulatoryCard {
  id?: number;
  patientUid: string;
  iin: string;
  
  // 1. Паспортная часть (стр. 1-2)
  general: {
    fullName: string;
    dob: string;
    gender: 'male' | 'female';
    age: number;
    nationality?: string;
    residentType: 'city' | 'village';
    citizenship?: string;
    address: string;
    workPlace?: string;
    position?: string;
    education?: string;
    insuranceCompany?: string;
    insurancePolicyNumber?: string;
    compensationType?: string;
    socialStatus?: string;
    visitReason?: string;
  };

  // 2. Минимальные медицинские данные
  medical: {
    bloodGroup?: string;
    rhFactor?: string;
    allergies?: string;
    pregnancyStatus?: string;
    screeningResults?: string;
    badHabits?: string;
    vaccinations?: string;
    diseaseHistory?: string;
    currentProblems?: string;
    dynamicObservation?: string;
    disabilityGroup?: string;
    currentMedications?: string;
    anthropometry?: {
      height?: string;
      weight?: string;
      bmi?: string;
      pressure?: string;
      pulse?: string;
    };
    fallRisk?: string;
    painScore?: string;
  };

  // 3. Записи специалистов (стр. 3-20+)
  // Каждый врач пишет в свой раздел
  specialistEntries: {
    [specialty: string]: {
      doctorName: string;
      date: string;
      complaints: string;      // Жалобы
      anamnesis: string;       // Анамнез
      objective: string;       // Объективные данные (Status Praesens)
      diagnosis: string;       // Диагноз (МКБ-10)
      recommendations: string; // Рекомендации
      fitnessStatus: 'fit' | 'unfit' | 'needs_observation'; // Профпригодность
    };
  };

  // 4. Результаты лабораторных и функциональных исследований
  labResults: {
    [testName: string]: {
      date: string;
      value: string;
      norm?: string;
      fileUrl?: string;
    };
  };

  // 5. Итоговое заключение председателя комиссии (п. 115 Приказа)
  finalConclusion?: {
    chairmanName: string;
    date: string;
    healthGroup: 'I' | 'II' | 'III' | 'IV' | 'V';
    isFit: boolean;
    restrictions?: string;
    nextExamDate: string;
    // Классификация работника по п.21 Приказа
    workerCategory?: 'healthy' | 'practically_healthy' | 'initial_diseases' | 'expressed_diseases' | 'harmful_factors' | 'occupational_diseases';
  };

  communication?: {
    language?: string;
    livingConditions?: string;
  };
  
  patientInstruction?: string;
  createdAt?: string;
  updatedAt?: string;
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
  
  // Расширенный функционал
  namedLists?: NamedLists; // Поименные списки (п.15)
  summaryReport?: SummaryReport; // Сводный отчет (п.17)
  emergencyNotices?: EmergencyNotice[]; // Экстренные извещения (п.19)
}

// Поименные списки для заключительного акта (п.15 Приказа)
export interface NamedLists {
  transferToOtherWork: string[]; // Перевод на другую работу
  hospitalTreatment: string[]; // Стационарное лечение
  sanatoriumTreatment: string[]; // Санаторно-курортное лечение
  therapeuticNutrition: string[]; // Лечебно-профилактическое питание
  dynamicObservation: string[]; // Динамическое наблюдение
}

// Экстренное извещение (п.19 Приказа)
export interface EmergencyNotice {
  id: number;
  contractId: number;
  employeeId: string;
  employeeName: string;
  diseaseType: 'infectious' | 'parasitic' | 'carrier';
  diseaseName: string;
  sentDate: string;
  sentTo: string; // Территориальное подразделение
  status: 'sent' | 'pending';
}

// Сводный отчет (п.17 Приказа, Приложение 2)
export interface SummaryReport {
  contractId: number;
  reportDate: string;
  totalEmployees: number;
  examinedEmployees: number;
  fitEmployees: number;
  unfitEmployees: number;
  observationEmployees: number;
  categories: {
    healthy?: number; // Здоровые работники
    practicallyHealthy?: number; // Практически здоровые
    initialDiseases?: number; // Начальные формы заболеваний
    expressedDiseases?: number; // Выраженные формы заболеваний
    harmfulFactors?: number; // Признаки воздействия вредных факторов
    occupationalDiseases?: number; // Признаки профессиональных заболеваний
  };
  sentDate?: string;
  sentTo?: string;
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