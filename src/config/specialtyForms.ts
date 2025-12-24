// Конфигурация форм для специалистов (конфигурационно-ориентированный подход)
// Согласно Приложению 1 Приказа 131/2020

import { SpecialtyType, EyeExamData, EntExamData, NeuroExamData, SurgeonExamData, GynecologyData, TherapistExamData } from '../types/medical-forms';

// Типы полей формы
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'textarea' 
  | 'boolean' 
  | 'select' 
  | 'file' 
  | 'date';

// Конфигурация поля
export interface FieldConfig {
  key: string; // Ключ в объекте данных
  label: string; // Подпись поля
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  min?: number; // Для number
  max?: number; // Для number
  step?: number; // Для number
  options?: { value: string; label: string }[]; // Для select
  unit?: string; // Единица измерения (отображается рядом)
  helpText?: string; // Подсказка
  defaultValue?: any; // Значение по умолчанию
}

// Конфигурация формы для специальности
export interface SpecialtyFormConfig {
  specialty: SpecialtyType;
  title: string; // Название специальности
  fields: FieldConfig[];
  defaultValues: Record<string, any>; // Значения по умолчанию для "Заполнить нормой"
}

// Конфигурации для каждой специальности
export const SPECIALTY_FORM_CONFIGS: Record<SpecialtyType, SpecialtyFormConfig> = {
  OPHTHALMOLOGIST: {
    specialty: 'OPHTHALMOLOGIST',
    title: 'Офтальмолог',
    fields: [
      {
        key: 'visus_od',
        label: 'Острота зрения OD (правый глаз)',
        type: 'number',
        placeholder: '1.0',
        min: 0,
        max: 2.0,
        step: 0.1,
        unit: '',
        required: true,
        defaultValue: 1.0
      },
      {
        key: 'visus_os',
        label: 'Острота зрения OS (левый глаз)',
        type: 'number',
        placeholder: '1.0',
        min: 0,
        max: 2.0,
        step: 0.1,
        unit: '',
        required: true,
        defaultValue: 1.0
      },
      {
        key: 'correction',
        label: 'Коррекция (очки/линзы)',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'color_perception',
        label: 'Цветовосприятие',
        type: 'select',
        options: [
          { value: 'NORMAL', label: 'Нормальное' },
          { value: 'PROTAN', label: 'Протанопия' },
          { value: 'DEUTAN', label: 'Дейтеранопия' },
          { value: 'TRITAN', label: 'Тританопия' }
        ],
        defaultValue: 'NORMAL',
        required: true
      },
      {
        key: 'fundus',
        label: 'Глазное дно',
        type: 'textarea',
        placeholder: 'Без патологии',
        defaultValue: 'Без патологии'
      },
      {
        key: 'eye_movements',
        label: 'Движения глаз',
        type: 'text',
        placeholder: 'В полном объеме',
        defaultValue: 'В полном объеме'
      },
      {
        key: 'intraocular_pressure',
        label: 'ВГД (внутриглазное давление)',
        type: 'text',
        placeholder: 'В норме',
        defaultValue: 'В норме'
      }
    ],
    defaultValues: {
      visus_od: 1.0,
      visus_os: 1.0,
      correction: false,
      color_perception: 'NORMAL',
      fundus: 'Без патологии',
      eye_movements: 'В полном объеме',
      intraocular_pressure: 'В норме'
    } as Partial<EyeExamData>
  },

  ENT: {
    specialty: 'ENT',
    title: 'ЛОР',
    fields: [
      {
        key: 'whisper_right_m',
        label: 'Шепотная речь справа',
        type: 'number',
        placeholder: '6',
        min: 0,
        max: 20,
        step: 0.5,
        unit: 'м',
        required: true,
        defaultValue: 6,
        helpText: 'Расстояние в метрах, на котором слышит шепотную речь'
      },
      {
        key: 'whisper_left_m',
        label: 'Шепотная речь слева',
        type: 'number',
        placeholder: '6',
        min: 0,
        max: 20,
        step: 0.5,
        unit: 'м',
        required: true,
        defaultValue: 6
      },
      {
        key: 'audiometry_file_url',
        label: 'Файл аудиометрии',
        type: 'file',
        helpText: 'Обязательно для вредных факторов (шум)'
      },
      {
        key: 'vestibular_function',
        label: 'Вестибулярная функция',
        type: 'select',
        options: [
          { value: 'STABLE', label: 'Стабильная' },
          { value: 'UNSTABLE', label: 'Нестабильная' }
        ],
        defaultValue: 'STABLE',
        required: true
      },
      {
        key: 'ears',
        label: 'Уши',
        type: 'text',
        placeholder: 'Без особенностей',
        defaultValue: 'Без особенностей'
      },
      {
        key: 'nose_breathing',
        label: 'Носовое дыхание',
        type: 'text',
        placeholder: 'Свободное',
        defaultValue: 'Свободное'
      },
      {
        key: 'zeva',
        label: 'Зев',
        type: 'text',
        placeholder: 'Спокоен, розовый',
        defaultValue: 'Спокоен, розовый'
      },
      {
        key: 'tonsils',
        label: 'Миндалины',
        type: 'text',
        placeholder: 'Не увеличены',
        defaultValue: 'Не увеличены'
      },
      {
        key: 'larynx',
        label: 'Гортань',
        type: 'text',
        placeholder: 'Без особенностей',
        defaultValue: 'Без особенностей'
      }
    ],
    defaultValues: {
      whisper_right_m: 6,
      whisper_left_m: 6,
      vestibular_function: 'STABLE',
      ears: 'Без особенностей',
      nose_breathing: 'Свободное',
      zeva: 'Спокоен, розовый',
      tonsils: 'Не увеличены',
      larynx: 'Без особенностей'
    } as Partial<EntExamData>
  },

  NEUROLOGIST: {
    specialty: 'NEUROLOGIST',
    title: 'Невролог',
    fields: [
      {
        key: 'romberg_test',
        label: 'Проба Ромберга',
        type: 'select',
        options: [
          { value: 'STABLE', label: 'Стабильная' },
          { value: 'UNSTABLE', label: 'Нестабильная' }
        ],
        defaultValue: 'STABLE',
        required: true
      },
      {
        key: 'tremor',
        label: 'Тремор',
        type: 'boolean',
        defaultValue: false
      },
      {
        key: 'reflexes',
        label: 'Рефлексы',
        type: 'text',
        placeholder: 'Живые, симметричные',
        defaultValue: 'Живые, симметричные'
      },
      {
        key: 'coordination',
        label: 'Координация',
        type: 'text',
        placeholder: 'Не нарушена',
        defaultValue: 'Не нарушена'
      },
      {
        key: 'sensitivity',
        label: 'Чувствительность',
        type: 'text',
        placeholder: 'Сохранена',
        defaultValue: 'Сохранена'
      },
      {
        key: 'speech',
        label: 'Речь',
        type: 'text',
        placeholder: 'Внятная',
        defaultValue: 'Внятная'
      },
      {
        key: 'consciousness',
        label: 'Сознание',
        type: 'text',
        placeholder: 'Ясное',
        defaultValue: 'Ясное'
      }
    ],
    defaultValues: {
      romberg_test: 'STABLE',
      tremor: false,
      reflexes: 'Живые, симметричные',
      coordination: 'Не нарушена',
      sensitivity: 'Сохранена',
      speech: 'Внятная',
      consciousness: 'Ясное'
    } as Partial<NeuroExamData>
  },

  SURGEON: {
    specialty: 'SURGEON',
    title: 'Хирург',
    fields: [
      {
        key: 'varicose_veins',
        label: 'Варикозное расширение вен',
        type: 'boolean',
        defaultValue: false,
        required: true
      },
      {
        key: 'hernia_check',
        label: 'Грыжи',
        type: 'boolean',
        defaultValue: false,
        required: true,
        helpText: 'Критично для работы с тяжестями'
      },
      {
        key: 'skin_condition',
        label: 'Состояние кожи',
        type: 'text',
        placeholder: 'Чистые, без патологических изменений',
        defaultValue: 'Чистые, без патологических изменений',
        required: true
      },
      {
        key: 'abdomen',
        label: 'Живот',
        type: 'text',
        placeholder: 'Мягкий, безболезненный',
        defaultValue: 'Мягкий, безболезненный'
      },
      {
        key: 'joints',
        label: 'Суставы',
        type: 'text',
        placeholder: 'Подвижность сохранена',
        defaultValue: 'Подвижность сохранена'
      },
      {
        key: 'spine',
        label: 'Позвоночник',
        type: 'text',
        placeholder: 'Без патологии',
        defaultValue: 'Без патологии'
      }
    ],
    defaultValues: {
      varicose_veins: false,
      hernia_check: false,
      skin_condition: 'Чистые, без патологических изменений',
      abdomen: 'Мягкий, безболезненный',
      joints: 'Подвижность сохранена',
      spine: 'Без патологии'
    } as Partial<SurgeonExamData>
  },

  GYNECOLOGIST: {
    specialty: 'GYNECOLOGIST',
    title: 'Гинеколог',
    fields: [
      {
        key: 'smear_flora',
        label: 'Степень чистоты мазка',
        type: 'select',
        options: [
          { value: 'DEGREE_1', label: 'I степень' },
          { value: 'DEGREE_2', label: 'II степень' },
          { value: 'DEGREE_3', label: 'III степень' },
          { value: 'DEGREE_4', label: 'IV степень' }
        ],
        defaultValue: 'DEGREE_1',
        required: true
      },
      {
        key: 'cytology_result',
        label: 'Результат цитологии (онкоклетки)',
        type: 'textarea',
        placeholder: 'Онкоклетки не обнаружены',
        defaultValue: 'Онкоклетки не обнаружены',
        required: true
      },
      {
        key: 'pregnancy_status',
        label: 'Беременность',
        type: 'text',
        placeholder: 'Не беременна',
        defaultValue: 'Не беременна'
      },
      {
        key: 'menstrual_cycle',
        label: 'Менструальный цикл',
        type: 'text',
        placeholder: 'Регулярный',
        defaultValue: 'Регулярный'
      }
    ],
    defaultValues: {
      smear_flora: 'DEGREE_1',
      cytology_result: 'Онкоклетки не обнаружены',
      pregnancy_status: 'Не беременна',
      menstrual_cycle: 'Регулярный'
    } as Partial<GynecologyData>
  },

  THERAPIST: {
    specialty: 'THERAPIST',
    title: 'Терапевт',
    fields: [
      {
        key: 'general_condition',
        label: 'Общее состояние',
        type: 'text',
        placeholder: 'Удовлетворительное',
        defaultValue: 'Удовлетворительное'
      },
      {
        key: 'consciousness',
        label: 'Сознание',
        type: 'text',
        placeholder: 'Ясное',
        defaultValue: 'Ясное'
      },
      {
        key: 'skin',
        label: 'Кожные покровы',
        type: 'text',
        placeholder: 'Чистые, нормальной окраски',
        defaultValue: 'Чистые, нормальной окраски'
      },
      {
        key: 'lymph_nodes',
        label: 'Лимфоузлы',
        type: 'text',
        placeholder: 'Не увеличены',
        defaultValue: 'Не увеличены'
      },
      {
        key: 'respiratory_system',
        label: 'Органы дыхания',
        type: 'text',
        placeholder: 'Дыхание везикулярное, хрипов нет',
        defaultValue: 'Дыхание везикулярное, хрипов нет'
      },
      {
        key: 'cardiovascular_system',
        label: 'Сердечно-сосудистая система',
        type: 'text',
        placeholder: 'Тоны сердца ясные, ритмичные',
        defaultValue: 'Тоны сердца ясные, ритмичные'
      },
      {
        key: 'abdomen',
        label: 'Живот',
        type: 'text',
        placeholder: 'Мягкий, безболезненный',
        defaultValue: 'Мягкий, безболезненный'
      },
      {
        key: 'liver',
        label: 'Печень',
        type: 'text',
        placeholder: 'Не увеличена',
        defaultValue: 'Не увеличена'
      },
      {
        key: 'spleen',
        label: 'Селезенка',
        type: 'text',
        placeholder: 'Не увеличена',
        defaultValue: 'Не увеличена'
      }
    ],
    defaultValues: {
      general_condition: 'Удовлетворительное',
      consciousness: 'Ясное',
      skin: 'Чистые, нормальной окраски',
      lymph_nodes: 'Не увеличены',
      respiratory_system: 'Дыхание везикулярное, хрипов нет',
      cardiovascular_system: 'Тоны сердца ясные, ритмичные',
      abdomen: 'Мягкий, безболезненный',
      liver: 'Не увеличена',
      spleen: 'Не увеличена'
    } as Partial<TherapistExamData>
  },

  // Заглушки для остальных специальностей
  DERMATOLOGIST: {
    specialty: 'DERMATOLOGIST',
    title: 'Дерматолог',
    fields: [
      {
        key: 'general',
        label: 'Объективные данные',
        type: 'textarea',
        placeholder: 'Опишите объективные данные осмотра...',
        defaultValue: 'Кожные покровы чистые, без патологических изменений'
      }
    ],
    defaultValues: {
      general: 'Кожные покровы чистые, без патологических изменений'
    }
  },

  PSYCHIATRIST: {
    specialty: 'PSYCHIATRIST',
    title: 'Психиатр',
    fields: [
      {
        key: 'general',
        label: 'Объективные данные',
        type: 'textarea',
        placeholder: 'Опишите объективные данные осмотра...',
        defaultValue: 'Психический статус без особенностей'
      }
    ],
    defaultValues: {
      general: 'Психический статус без особенностей'
    }
  },

  NARCOLOGIST: {
    specialty: 'NARCOLOGIST',
    title: 'Нарколог',
    fields: [
      {
        key: 'general',
        label: 'Объективные данные',
        type: 'textarea',
        placeholder: 'Опишите объективные данные осмотра...',
        defaultValue: 'Признаков употребления ПАВ не выявлено'
      }
    ],
    defaultValues: {
      general: 'Признаков употребления ПАВ не выявлено'
    }
  }
};

// Получить конфигурацию формы для специальности
export function getFormConfig(specialty: SpecialtyType): SpecialtyFormConfig {
  return SPECIALTY_FORM_CONFIGS[specialty] || SPECIALTY_FORM_CONFIGS.THERAPIST;
}

