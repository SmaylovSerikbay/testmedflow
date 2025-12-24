import { LabTemplate } from '../types/medical-forms';

// Шаблоны лабораторных исследований
export const LAB_TEMPLATES: Record<string, LabTemplate> = {
  'general-blood': {
    id: 'general-blood',
    name: 'Общий анализ крови',
    parameters: [
      {
        id: 'hemoglobin',
        name: 'Гемоглобин',
        value: '',
        unit: 'г/л',
        refMin: 120,
        refMax: 160,
        isAbnormal: false
      },
      {
        id: 'erythrocytes',
        name: 'Эритроциты',
        value: '',
        unit: '×10¹²/л',
        refMin: 4.0,
        refMax: 5.5,
        isAbnormal: false
      },
      {
        id: 'leukocytes',
        name: 'Лейкоциты',
        value: '',
        unit: '×10⁹/л',
        refMin: 4.0,
        refMax: 9.0,
        isAbnormal: false
      },
      {
        id: 'platelets',
        name: 'Тромбоциты',
        value: '',
        unit: '×10⁹/л',
        refMin: 180,
        refMax: 320,
        isAbnormal: false
      },
      {
        id: 'esr',
        name: 'СОЭ',
        value: '',
        unit: 'мм/ч',
        refMin: 2,
        refMax: 15,
        isAbnormal: false
      }
    ]
  },
  'general-urine': {
    id: 'general-urine',
    name: 'Общий анализ мочи',
    parameters: [
      {
        id: 'color',
        name: 'Цвет',
        value: '',
        unit: '',
        refMin: 0,
        refMax: 0,
        isAbnormal: false
      },
      {
        id: 'transparency',
        name: 'Прозрачность',
        value: '',
        unit: '',
        refMin: 0,
        refMax: 0,
        isAbnormal: false
      },
      {
        id: 'protein',
        name: 'Белок',
        value: '',
        unit: 'г/л',
        refMin: 0,
        refMax: 0.033,
        isAbnormal: false
      },
      {
        id: 'glucose',
        name: 'Глюкоза',
        value: '',
        unit: 'ммоль/л',
        refMin: 0,
        refMax: 0.8,
        isAbnormal: false
      },
      {
        id: 'leukocytes-urine',
        name: 'Лейкоциты',
        value: '',
        unit: 'в поле зрения',
        refMin: 0,
        refMax: 3,
        isAbnormal: false
      },
      {
        id: 'erythrocytes-urine',
        name: 'Эритроциты',
        value: '',
        unit: 'в поле зрения',
        refMin: 0,
        refMax: 2,
        isAbnormal: false
      }
    ]
  },
  'biochemistry': {
    id: 'biochemistry',
    name: 'Биохимический анализ крови',
    parameters: [
      {
        id: 'glucose-blood',
        name: 'Глюкоза',
        value: '',
        unit: 'ммоль/л',
        refMin: 3.9,
        refMax: 6.1,
        isAbnormal: false
      },
      {
        id: 'total-cholesterol',
        name: 'Общий холестерин',
        value: '',
        unit: 'ммоль/л',
        refMin: 3.0,
        refMax: 6.0,
        isAbnormal: false
      },
      {
        id: 'alt',
        name: 'АЛТ',
        value: '',
        unit: 'Ед/л',
        refMin: 0,
        refMax: 40,
        isAbnormal: false
      },
      {
        id: 'ast',
        name: 'АСТ',
        value: '',
        unit: 'Ед/л',
        refMin: 0,
        refMax: 40,
        isAbnormal: false
      },
      {
        id: 'creatinine',
        name: 'Креатинин',
        value: '',
        unit: 'мкмоль/л',
        refMin: 62,
        refMax: 106,
        isAbnormal: false
      }
    ]
  }
};

