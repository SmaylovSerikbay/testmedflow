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
  status: 'pending' | 'fit' | 'unfit' | 'needs_observation';
  phone?: string;                  // Телефон сотрудника (извлекается из note)
  userId?: string;                  // UID пользователя, если зарегистрирован
}

// Регистрация посещения сотрудника в клинике
export interface EmployeeVisit {
  id: string;
  employeeId: string;
  contractId: string;
  visitDate: string; // Дата посещения
  checkInTime?: string; // Время регистрации входа
  checkOutTime?: string; // Время регистрации выхода
  status: 'registered' | 'in_progress' | 'completed' | 'cancelled'; // Статус прохождения осмотра
  documentsIssued?: string[]; // Выданные документы (список названий)
  registeredBy?: string; // ID сотрудника регистратуры
  notes?: string; // Примечания регистратуры
}

// Маршрут сотрудника (какие кабинеты он должен посетить)
export interface EmployeeRoute {
  employeeId: string;
  contractId: string;
  visitId?: string; // ID посещения, если сотрудник зарегистрирован
  routeItems: Array<{
    specialty: string; // Специальность врача
    doctorId?: string; // ID врача (если назначен)
    doctorName?: string; // Имя врача
    roomNumber?: string; // Номер кабинета
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    examinationDate?: string; // Дата и время осмотра
    order: number; // Порядок посещения
  }>;
}

// Амбулаторная карта сотрудника (Форма 052у)
export interface AmbulatoryCard {
  employeeId: string;
  contractId: string;
  cardNumber?: string; // Номер карты
  
  // Паспортная часть
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: 'М' | 'Ж';
    address?: string;
    phone?: string;
    workplace: string;
    position: string;
    harmfulFactors: string;
    // Дополнительные данные
    passportData?: string;
    snils?: string;
    bloodType?: string;
    rhFactor?: string;
    emergencyContact?: string;
  };
  
  // Анамнез
  anamnesis?: {
    chronicDiseases?: string; // Хронические заболевания
    pastDiseases?: string; // Перенесенные заболевания
    allergies?: string; // Аллергии
    badHabits?: string; // Вредные привычки
    heredity?: string; // Наследственность
    occupationalHistory?: string; // Профессиональный маршрут
  };
  
  // Антропометрия и витальные показатели
  vitals?: {
    height?: number; // см
    weight?: number; // кг
    bmi?: number; // ИМТ
    bloodPressure?: string; // АД
    pulse?: number; // Пульс
    measuredAt?: string; // Дата измерения
  };
  
  // Лабораторные и функциональные исследования
  labTests?: {
    bloodTest?: LabTestResult; // Общий анализ крови
    biochemistry?: LabTestResult; // Биохимия
    urineTest?: LabTestResult; // Общий анализ мочи
    ecg?: LabTestResult; // ЭКГ
    fluorography?: LabTestResult; // Флюорография
    other?: LabTestResult[]; // Другие исследования
  };
  
  // Данные осмотра по врачам
  examinations: Record<string, DoctorExamination>; // Ключ - specialty врача
  
  // Общее заключение комиссии
  finalConclusion?: {
    status: 'fit' | 'unfit' | 'needs_observation';
    date: string;
    doctorId: string; // ID председателя комиссии
    doctorName?: string;
    diagnosis?: string; // Диагноз
    recommendations?: string; // Рекомендации
    nextExamDate?: string; // Дата следующего осмотра
    restrictions?: string; // Ограничения к работе
    notes?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

// Результат лабораторного исследования
export interface LabTestResult {
  testName: string;
  date: string;
  result: string;
  norm?: string;
  conclusion?: string;
  doctorId?: string;
  attachmentUrl?: string; // Ссылка на файл с результатами
}

// Осмотр конкретного врача
export interface DoctorExamination {
  doctorId: string;
  doctorName?: string;
  specialty: string;
  date: string;
  status: 'pending' | 'completed';
  
  // Жалобы и объективный осмотр
  complaints?: string; // Жалобы
  objectiveExamination?: string; // Объективный осмотр
  
  // Заключение
  diagnosis?: string; // Диагноз
  conclusion?: string; // Заключение врача
  recommendations?: string; // Рекомендации
  isFit?: boolean; // Годен к работе по специальности
  
  attachments?: string[]; // Ссылки на файлы (если нужны)
}

// Маршрутный лист для врача
export interface DoctorRouteSheet {
  id?: string; // ID из базы данных (для Go API)
  doctorId: string;
  contractId: string;
  specialty?: string; // Специализация (для виртуальных врачей)
  virtualDoctor?: boolean; // Флаг виртуального врача (врач еще не назначен)
  employees: Array<{
    employeeId: string;
    name: string;
    position: string;
    harmfulFactor: string;
    status: 'pending' | 'examined' | 'completed';
    examinationDate?: string;
  }>;
  createdAt: string;
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
  DOCTOR_WORKSPACE = 'DOCTOR_WORKSPACE',
  EMPLOYEE_PORTAL = 'EMPLOYEE_PORTAL',
  REGISTRATION_DESK = 'REGISTRATION_DESK',
}