// Типы для медицинских форм согласно Приказу № ҚР ДСМ-131/2020 и форме 052/у

// 1. Результат конкретного лабораторного анализа (например, Гемоглобин)
export interface LabParameter {
  id: string;
  name: string; // например, "Гемоглобин"
  value: string;
  unit: string; // например, "г/л"
  refMin: number;
  refMax: number;
  isAbnormal: boolean; // Автоматически вычисляется
}

// 2. Типы специальностей
export type SpecialtyType = 'THERAPIST' | 'ENT' | 'OPHTHALMOLOGIST' | 'NEUROLOGIST' | 'SURGEON' | 'GYNECOLOGIST' | 'DERMATOLOGIST' | 'PSYCHIATRIST' | 'NARCOLOGIST';

// 3. Специфичные схемы данных для каждого специалиста (согласно Приложению 1 Приказа 131/2020)

// Офтальмолог
export interface EyeExamData {
  visus_od: number; // Острота зрения правого глаза (например, 1.0)
  visus_os: number; // Острота зрения левого глаза (например, 1.0)
  correction: boolean; // Коррекция (очки/линзы)
  color_perception: 'NORMAL' | 'PROTAN' | 'DEUTAN' | 'TRITAN'; // Цветовосприятие
  fundus: string; // Описание глазного дна
  eye_movements?: string; // Движения глаз
  intraocular_pressure?: string; // ВГД
}

// ЛОР
export interface EntExamData {
  whisper_right_m: number; // Шепотная речь справа (метры, например 6)
  whisper_left_m: number; // Шепотная речь слева (метры)
  audiometry_file_url?: string; // URL файла аудиометрии (для вредных факторов - шум)
  vestibular_function: 'STABLE' | 'UNSTABLE'; // Вестибулярная функция
  ears?: string; // Состояние ушей
  nose_breathing?: string; // Носовое дыхание
  zeva?: string; // Зев
  tonsils?: string; // Миндалины
  larynx?: string; // Гортань
}

// Невролог
export interface NeuroExamData {
  romberg_test: 'STABLE' | 'UNSTABLE'; // Проба Ромберга
  tremor: boolean; // Тремор
  reflexes: string; // Рефлексы
  coordination?: string; // Координация
  sensitivity?: string; // Чувствительность
  speech?: string; // Речь
  consciousness?: string; // Сознание
}

// Хирург
export interface SurgeonExamData {
  varicose_veins: boolean; // Варикозное расширение вен
  hernia_check: boolean; // Проверка на грыжи (критично для тяжелого труда)
  skin_condition: string; // Состояние кожи
  abdomen?: string; // Живот
  joints?: string; // Суставы
  spine?: string; // Позвоночник
}

// Гинеколог
export interface GynecologyData {
  smear_flora: 'DEGREE_1' | 'DEGREE_2' | 'DEGREE_3' | 'DEGREE_4'; // Степень чистоты мазка
  cytology_result: string; // Результат цитологии (проверка на онкоклетки)
  pregnancy_status?: string; // Беременность
  menstrual_cycle?: string; // Менструальный цикл
}

// Терапевт (общие данные)
export interface TherapistExamData {
  general_condition: string; // Общее состояние
  consciousness: string; // Сознание
  skin: string; // Кожные покровы
  lymph_nodes: string; // Лимфоузлы
  respiratory_system: string; // Органы дыхания
  cardiovascular_system: string; // Сердечно-сосудистая система
  abdomen: string; // Живот
  liver: string; // Печень
  spleen: string; // Селезенка
}

// Объединенный тип для объективных данных (хранится в JSON колонке)
export type ObjectiveDataPayload = 
  | EyeExamData 
  | EntExamData 
  | NeuroExamData 
  | SurgeonExamData 
  | GynecologyData 
  | TherapistExamData
  | Record<string, any>; // Fallback для других специальностей

// 4. Упрощенная запись визита врача (Mini-052/u)
export interface DoctorVisit {
  patientId: string;
  doctorId: string;
  specialty: SpecialtyType;
  
  // СЕКЦИЯ A: Субъективные данные (из формы 052)
  complaints: string; // Жалобы
  anamnesis: string;  // Анамнез
  
  // СЕКЦИЯ B: Объективные данные (типизированный JSON)
  // Для каждого специалиста используется соответствующий тип данных
  objectiveData: ObjectiveDataPayload;
  
  // СЕКЦИЯ C: Заключение
  icd10Code: string; // Основной диагноз
  conclusion: 'FIT' | 'UNFIT' | 'REQUIRES_EXAM'; // Годен / Не годен / Требует обследования
  recommendations: string;
  
  // Метаданные
  visitDate: string;
  doctorName?: string;
}

// 3. Шаблон лабораторного исследования
export interface LabTemplate {
  id: string;
  name: string; // "Общий анализ крови", "Общий анализ мочи"
  parameters: LabParameter[];
}

// 4. Инструментальное исследование (ЭКГ, Рентген и т.д.)
export interface InstrumentalStudy {
  id: string;
  type: 'ECG' | 'XRAY' | 'ULTRASOUND' | 'OTHER';
  date: string;
  number: string; // Номер исследования
  resultText: string; // Текст результата
  fileUrl?: string; // URL загруженного файла
  fileName?: string;
}

// 5. Нормативные значения для "One-Click Norm"
export interface NormalValues {
  [specialty: string]: Record<string, string>;
}

// Стандартные нормативные значения для быстрого заполнения
// Используются вместе с конфигурацией из specialtyForms.ts
export const DEFAULT_NORMAL_VALUES: NormalValues = {
  THERAPIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      general_condition: "удовлетворительное",
      consciousness: "ясное",
      skin: "чистые, нормальной окраски",
      lymph_nodes: "не увеличены",
      respiratory_system: "дыхание везикулярное, хрипов нет",
      cardiovascular_system: "тоны сердца ясные, ритмичные",
      abdomen: "мягкий, безболезненный",
      liver: "не увеличена",
      spleen: "не увеличена"
    })
  },
  ENT: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      whisper_right_m: 6,
      whisper_left_m: 6,
      vestibular_function: "STABLE",
      ears: "без особенностей",
      nose_breathing: "свободное",
      zeva: "спокоен, розовый",
      tonsils: "не увеличены",
      larynx: "без особенностей"
    })
  },
  SURGEON: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      varicose_veins: false,
      hernia_check: false,
      skin_condition: "чистые, без патологических изменений",
      abdomen: "мягкий, безболезненный",
      joints: "подвижность сохранена",
      spine: "без патологии"
    })
  },
  NEUROLOGIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      romberg_test: "STABLE",
      tremor: false,
      reflexes: "живые, симметричные",
      coordination: "не нарушена",
      sensitivity: "сохранена",
      speech: "внятная",
      consciousness: "ясное"
    })
  },
  OPHTHALMOLOGIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      visus_od: 1.0,
      visus_os: 1.0,
      correction: false,
      color_perception: "NORMAL",
      fundus: "без патологии",
      eye_movements: "в полном объеме",
      intraocular_pressure: "в норме"
    })
  },
  GYNECOLOGIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      smear_flora: "DEGREE_1",
      cytology_result: "Онкоклетки не обнаружены",
      pregnancy_status: "Не беременна",
      menstrual_cycle: "Регулярный"
    })
  },
  DERMATOLOGIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      general: "Кожные покровы чистые, без патологических изменений"
    })
  },
  PSYCHIATRIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      general: "Психический статус без особенностей"
    })
  },
  NARCOLOGIST: {
    complaints: "Жалоб нет",
    anamnesis: "Анамнез не отягощен",
    objectiveData: JSON.stringify({
      general: "Признаков употребления ПАВ не выявлено"
    })
  }
};

