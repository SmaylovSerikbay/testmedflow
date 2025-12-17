export interface FactorRule {
  /** Номер строки из Перечня (для отладки и ссылок) */
  id: number;
  /** Формулировка фактора / группы факторов из Перечня */
  title: string;
  /** Ключевые слова, по которым мы определяем, что сотрудник подпадает под этот фактор */
  keywords: string[];
  /** Врачи, которые должны участвовать в осмотре по этому фактору (как в Перечне, колонка 3) */
  specialties: string[];
  /** Категория фактора для группировки */
  category: 'chemical' | 'profession' | 'physical' | 'biological' | 'other';
  /** Уникальный ключ для идентификации (id + title) */
  uniqueKey: string;
}

// Сырые данные, сгенерированные из Excel (включают факторы + исследования)
import { FACTOR_RULES as RAW_RULES } from './factorRules.generated';

const DOCTOR_MARKERS = [
  'Профпатолог',
  'Терапевт',
  'Невропатолог',
  'Невролог',
  'Дерматовенеролог',
  'Аллерголог',
  'Оториноларинголог',
  'Отоларинголог',
  'Офтальмолог',
  'Эндокринолог',
  'Гинеколог',
  'Уролог',
  'Онколог',
  'Рентгенолог',
  'Кардиолог',
  'Психиатр',
  'Психиатр (медицинский психолог)',
  'Нарколог',
  'Гематолог',
  'Хирург',
  'Стоматолог',
];

// Определение категории на основе названия
function determineCategory(title: string): FactorRule['category'] {
  const lowerTitle = title.toLowerCase();
  
  // Проверяем категорию "Профессии и работы" - должна быть в начале строки
  if (lowerTitle.startsWith('профессии и работы') || 
      lowerTitle.startsWith('профессия') ||
      (lowerTitle.includes('работы, связанные') && !lowerTitle.includes('химические')) ||
      lowerTitle.includes('военизированной охраны') ||
      lowerTitle.includes('охранных структур')) {
    return 'profession';
  }
  
  if (lowerTitle.includes('шум') || 
      lowerTitle.includes('вибрация') ||
      lowerTitle.includes('ультразвук') ||
      lowerTitle.includes('инфразвук') ||
      lowerTitle.includes('электромагнитное') ||
      lowerTitle.includes('ионизирующее') ||
      lowerTitle.includes('лазерное') ||
      lowerTitle.includes('ультрафиолетовое') ||
      lowerTitle.includes('инфракрасное') ||
      lowerTitle.includes('температура') ||
      lowerTitle.includes('освещение')) {
    return 'physical';
  }
  
  if (lowerTitle.includes('микроорганизмы') ||
      lowerTitle.includes('бактерии') ||
      lowerTitle.includes('вирусы') ||
      lowerTitle.includes('грибы') ||
      lowerTitle.includes('биологические')) {
    return 'biological';
  }
  
  // По умолчанию - химические вещества
  return 'chemical';
}

// Нормализованный, очищенный список правил для фронта
export const FACTOR_RULES: FactorRule[] = (RAW_RULES as unknown as any[])
  .map((raw) => {
    const fullTitle: string = raw.title || '';
    
    // Пропускаем некорректные записи
    if (!fullTitle || fullTitle.length < 3 || /^\d+\s*$/.test(fullTitle.trim())) {
      return null;
    }
    
    // В новом формате JSON врачи уже в отдельном поле specialties и нормализованы
    let specialties: string[] = [];
    
    if (raw.specialties && Array.isArray(raw.specialties) && raw.specialties.length > 0) {
      // Фильтруем только валидные названия врачей (исключаем исследования)
      specialties = raw.specialties
        .map((s: string) => {
          const trimmed = s.trim();
          if (!trimmed) return null;
          
          // Проверяем, что это название врача из нашего словаря
          const matchedDoctor = DOCTOR_MARKERS.find(marker => 
            trimmed.toLowerCase() === marker.toLowerCase()
          );
          
          if (matchedDoctor) {
            return matchedDoctor; // Используем правильное название из словаря
          }
          
          // Если не нашли точное совпадение, проверяем частичное вхождение
          const partialMatch = DOCTOR_MARKERS.find(marker => {
            const markerLower = marker.toLowerCase();
            const trimmedLower = trimmed.toLowerCase();
            return trimmedLower.includes(markerLower) || markerLower.includes(trimmedLower);
          });
          
          if (partialMatch) {
            return partialMatch;
          }
          
          // Если не нашли - возможно это исследование, пропускаем
          return null;
        })
        .filter((s): s is string => s !== null);
    }
    
    // Если не нашли врачей в specialties, пытаемся извлечь из title (fallback для старого формата)
    if (specialties.length === 0) {
      const markerRegex = new RegExp(DOCTOR_MARKERS.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
      const idx = fullTitle.search(markerRegex);
      
      if (idx !== -1) {
        const doctorsText = fullTitle.slice(idx).trim();
        specialties = DOCTOR_MARKERS.filter((marker) => {
          const markerLower = marker.toLowerCase();
          const regex = new RegExp(`(^|[,\\s])${markerLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([,\\s]|$)`, 'i');
          return regex.test(doctorsText);
        });
      }
    }

    // Если нет врачей — пропускаем
    if (specialties.length === 0) {
      return null;
    }

    // Убираем врачей из title, если они там есть
    let factorText = fullTitle;
    const markerRegex = new RegExp(DOCTOR_MARKERS.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
    const idx = fullTitle.search(markerRegex);
    if (idx !== -1) {
      factorText = fullTitle.slice(0, idx).trim();
    }

    const category = determineCategory(factorText);
    const uniqueKey = `${raw.id}_${factorText}`;

    return {
      id: raw.id as number,
      title: factorText,
      keywords: raw.keywords || [],
      specialties, // Список врачей из JSON или извлеченный из title
      category,
      uniqueKey,
    } as FactorRule;
  })
  .filter((x): x is FactorRule => x !== null)
  // Убираем дубликаты по uniqueKey
  .filter((rule, index, self) => 
    index === self.findIndex(r => r.uniqueKey === rule.uniqueKey)
  )
  // Сортируем по категории, затем по id
  .sort((a, b) => {
    const categoryOrder = { 'chemical': 1, 'physical': 2, 'biological': 3, 'profession': 4, 'other': 5 };
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    return a.id - b.id;
  });

// Категории для отображения
export const CATEGORY_LABELS: Record<FactorRule['category'], string> = {
  chemical: 'Химические вещества',
  profession: 'Профессии и работы',
  physical: 'Физические факторы',
  biological: 'Биологические факторы',
  other: 'Прочие факторы',
};


