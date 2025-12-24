// Типы документов согласно Приказам МЗ РК № 175/2020 (форма 075/у) и № 131/2020 (Паспорт здоровья)

// Общий тип для вердикта врача
export type DoctorVerdict = {
  specialty: string; // например, "Офтальмолог"
  doctorName: string;
  verdictShort: string; // например, "Здоров", "Visus OD/OS=1.0"
  signatureUrl?: string;
};

// Заключение специалиста для формы 075/у
export interface SpecialistConclusion075 {
  doctorName: string;
  date: string;
  diagnosis?: string; // МКБ-10 код
  conclusion: string; // Текст заключения
}

// --- ДОКУМЕНТ 1: Форма 075/у (Медицинская справка) ---
export interface Form075Data {
  docNumber: string; // Уникальный номер документа
  issueDate: string; // Дата выдачи
  clinic: { 
    name: string; 
    address: string; 
    bin: string;
    directorName?: string; // ФИО руководителя
  };
  patient: { 
    fullName: string; 
    iin: string; 
    dob: string; 
    gender: 'male' | 'female';
    address: string; 
    registrationAddress?: string; // Адрес регистрации
    jobLocation: string; // Место работы
    position: string; // Должность
  };
  lastExamDate?: string; // Дата последнего медосмотра
  diseasesSinceLastExam?: string; // Заболевания с момента последнего медосмотра
  
  // Заключения специалистов
  therapistConclusion?: SpecialistConclusion075; // Терапевт/ВОП
  narcologistConclusion?: SpecialistConclusion075; // Нарколог
  psychiatristConclusion?: SpecialistConclusion075; // Психиатр
  
  // Исследования
  drugTest?: {
    date: string;
    result: string;
  };
  psychologicalTest?: {
    date: string;
    result: string;
  };
  fluorography?: {
    date: string;
    result: string;
  };
  labResults?: string; // Данные лабораторных исследований
  
  // Итоговое заключение
  finalConclusion: {
    status: 'FIT' | 'UNFIT'; // Годен / Не годен
    fullText: string; // "Годен к работе водителем"
    chairmanName: string;
  };
}

// --- ДОКУМЕНТ 2: Паспорт здоровья (Для работы с вредными факторами) ---
export interface HealthPassportData {
  employeePhoto: string; // URL фотографии
  baseInfo: {
    bloodType: string; // Группа крови
    allergies: string; // Непереносимость лекарств
  };
  workConditions: {
    companyName: string; // Название организации
    department: string; // Отдел
    profession: string; // Профессия
    // КРИТИЧЕСКОЕ ПОЛЕ ДЛЯ СТАРТАПА:
    harmfulFactors: string[]; // например, ["3.1 Шум", "Высота"]
    hazardExperienceYears: number; // Стаж работы во вредных условиях
  };
  currentCheckup: {
    year: number; // Год осмотра
    doctors: DoctorVerdict[]; // Детальные заключения врачей
    profpathologistConclusion: string; // "Противопоказаний не выявлено"
    recommendations: string[]; // "Санитарно-курортное лечение", "Наблюдение"
  };
}

