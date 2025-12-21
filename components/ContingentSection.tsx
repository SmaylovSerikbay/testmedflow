import React, { useState, useCallback, useMemo } from 'react';
import { Employee, Contract } from '../types';
import { parseEmployeeData } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { 
  UsersIcon, PlusIcon, UploadIcon, LoaderIcon, FileTextIcon, TrashIcon, PenIcon
} from './Icons';
import EmployeeTableRow from './EmployeeTableRow';
import ConfirmDialog from './ConfirmDialog';

interface ContingentSectionProps {
  employees: Employee[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onToggleStatus: (employeeId: string) => void;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  contractId: string;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

const ContingentSection: React.FC<ContingentSectionProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onToggleStatus,
  updateContract,
  contractId,
  showToast
}) => {
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isContingentModalOpen, setIsContingentModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const handleProcessContingent = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsProcessing(true);
    try {
      const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
      const newEmployees: Employee[] = lines.map((line, index) => {
        const parts = line.split(/[;,|\t]/);
        const name = (parts[0] || '').trim();
        const position = (parts[1] || '').trim();
        const site = (parts[2] || '').trim();
        const harmfulFactor = (parts[3] || '').trim();
        
        return {
          id: `${Date.now()}_${index}`,
          name,
          dob: '',
          gender: 'М',
          site,
          position,
          harmfulFactor,
          status: 'pending',
        };
      }).filter(e => e.name);

      const existing = employees || [];
      const allEmployees = existing.concat(newEmployees);
      
      setIsProcessing(true);
      await updateContract(contractId, { 
        employees: allEmployees,
        status: 'negotiation'
      });
      setRawText('');
      showToast('success', `Добавлено ${newEmployees.length} сотрудников`);
    } catch (e) {
      showToast('error', 'Ошибка обработки списка сотрудников.');
    } finally {
      setIsProcessing(false);
    }
  }, [rawText, employees, contractId, updateContract, showToast]);

  // Умная функция для определения, является ли строка заголовком
  const isHeaderRow = useCallback((row: any[]): boolean => {
    if (!row || row.length === 0) return true;
    
    const rowText = row.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
    const firstCell = String(row[0] || '').trim();
    const nameCell = String(row[1] || '').trim(); // Обычно ФИО во второй колонке
    
    // Расширенный список служебных слов и заголовков
    const headerKeywords = [
      'фио', 'дата рождения', 'пол', 'участок', 'должность', 
      'общий стаж', 'стаж по должности', 'дата посл', 'медосмотр',
      'вредность', 'примечание', 'список', 'контингент',
      'руководителю', 'организации', 'клинике', 'согласовано',
      'санитарно-эпидемиологического', 'контроля', 'транспорте',
      'куатовой', 'приложение', 'договору', 'работников',
      '№', 'номер', 'n', 'no'
    ];
    
    // Если строка содержит много ключевых слов заголовков - это заголовок
    const headerMatches = headerKeywords.filter(keyword => rowText.includes(keyword)).length;
    if (headerMatches >= 2) return true;
    
    // Строгая проверка: если в строке есть слово "список" или "контингент" - это заголовок
    if (rowText.includes('список') || rowText.includes('контингент') || 
        nameCell.toLowerCase().includes('список') || nameCell.toLowerCase().includes('контингент')) {
      return true;
    }
    
    // Проверка на служебные фразы в начале строки
    const servicePhrases = [
      'согласовано', 'руководителю', 'организации', 'клинике',
      'санитарно-эпидемиологического', 'контроля на транспорте',
      'список', 'контингент работников', 'приложение'
    ];
    if (servicePhrases.some(phrase => rowText.startsWith(phrase.toLowerCase()) || 
        nameCell.toLowerCase().includes(phrase))) {
      return true;
    }
    
    // Если первая ячейка содержит только заглавные буквы и это одно слово длиннее 3 символов - заголовок
    if (firstCell && firstCell === firstCell.toUpperCase() && 
        firstCell.split(/\s+/).length === 1 && firstCell.length > 3) {
      // Исключаем только если это не похоже на ФИО
      if (!/[а-яё]/i.test(firstCell)) { // Если нет русских букв - точно заголовок
        return true;
      }
    }
    
    // Если строка содержит только пустые значения или дефисы
    const hasData = row.some(cell => {
      const val = String(cell || '').trim();
      return val && val !== '-' && val !== '—' && val.length > 1;
    });
    if (!hasData) return true;
    
    return false;
  }, []);

  // Функция для проверки, является ли строка валидными данными сотрудника
  const isValidEmployeeRow = useCallback((row: any[], colIndexes: { [key: string]: number }): boolean => {
    const name = String(row[colIndexes.name || 1] || '').trim();
    
    // Пропускаем пустые имена
    if (!name || name.length < 3) return false;
    
    const nameLower = name.toLowerCase();
    const nameUpper = name.toUpperCase();
    const nameNormalized = nameLower.replace(/\s+/g, ' ').trim();
    
    // Список служебных слов, которые точно не являются ФИО
    const exactInvalidWords = [
      'список', 'контингент', 'руководителю', 'организации', 'клинике',
      'согласовано', 'санитарно-эпидемиологического', 'контроля',
      'транспорте', 'куатовой', 'приложение', 'договору',
      'работников', 'фио', 'дата рождения', 'пол', 'участок',
      'должность', 'стаж', 'медосмотр', 'вредность', 'примечание',
      'согласовано:', 'руководителю:', 'организации:', 'клинике:',
      'list', 'contingent', 'fio', 'name'
    ];
    
    // СТРОГАЯ проверка на "СПИСОК" - в любом виде
    if (nameNormalized === 'список' || nameUpper === 'СПИСОК' || name === 'СПИСОК' || 
        nameNormalized === 'list' || nameUpper === 'LIST' || name === 'LIST' ||
        nameNormalized.startsWith('список') || nameLower.startsWith('list')) {
      return false;
    }
    
    // Проверка на точное совпадение (без учета регистра)
    if (exactInvalidWords.some(word => nameNormalized === word || nameUpper === word)) {
      return false;
    }
    
    // Проверка на включение служебных слов - ОЧЕНЬ строгая
    const invalidPatterns = [
      'список', 'контингент', 'руководителю', 'организации', 'клинике',
      'согласовано', 'приложение', 'договору', 'работников'
    ];
    if (invalidPatterns.some(pattern => nameLower.includes(pattern))) {
      return false;
    }
    
    // Если имя состоит только из заглавных букв и это одно слово - вероятно заголовок
    if (name === nameUpper && name.split(/\s+/).length === 1) {
      // Если это "СПИСОК" или "LIST" - точно пропускаем
      if (name === 'СПИСОК' || name === 'LIST') {
        return false;
      }
      // Для других слов - если длиннее 2 символов, пропускаем (вероятно заголовок)
      if (name.length > 2) {
        return false;
      }
    }
    
    // Проверяем, что имя выглядит как ФИО (содержит пробелы или несколько слов)
    const nameParts = name.split(/\s+/).filter(p => p.length > 0);
    
    // Если это одно слово - должно быть очень коротким (инициал или аббревиатура)
    if (nameParts.length === 1) {
      // Если одно слово длиннее 15 символов - вероятно служебный текст
      if (name.length > 15) {
        return false;
      }
      // Если одно слово и все заглавные длиннее 2 символов - пропускаем
      if (name === nameUpper && name.length > 2) {
        return false;
      }
      // Если одно слово начинается с одной буквы и точки (типа "A.") - пропускаем
      if (/^[А-ЯA-Z]\./.test(name) && name.length <= 3) {
        return false;
      }
    }
    
    // Если имя состоит из одного слова и содержит много дефисов/подчеркиваний - пропускаем
    if (nameParts.length === 1 && (name.match(/[-_]/g) || []).length > 2) {
      return false;
    }
    
    // Проверяем, что имя начинается с заглавной буквы (для кириллицы и латиницы)
    const firstChar = name[0];
    if (!/[А-ЯA-ZЁ]/.test(firstChar)) {
      // Если не начинается с заглавной, но содержит пробелы - возможно валидно
      if (nameParts.length < 2) return false;
    }
    
    // Дополнительная проверка: имя должно содержать хотя бы одну русскую или латинскую букву
    if (!/[а-яёa-z]/i.test(name)) {
      return false;
    }
    
    // Проверяем, что строка содержит реальные данные (не только имя)
    // Если все остальные поля пустые или содержат только дефисы - возможно это заголовок
    const hasOtherData = [
      colIndexes.dob || 2,
      colIndexes.site || 4,
      colIndexes.position || 5,
      colIndexes.totalExperience || 6,
      colIndexes.positionExperience || 7
    ].some(idx => {
      const val = String(row[idx] || '').trim();
      return val && val !== '-' && val !== '—' && val.length > 0;
    });
    
    // Если имя очень короткое (меньше 5 символов) и нет других данных - пропускаем
    if (name.length < 5 && !hasOtherData) {
      return false;
    }
    
    // Проверяем дату рождения, если она есть
    const dob = String(row[colIndexes.dob || 2] || '').trim();
    if (dob && dob !== '-' && dob !== '—') {
      // Дата должна быть в формате ДД.ММ.ГГГГ или похожем
      const datePattern = /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/;
      // Если это не дата и длиннее 15 символов - возможно служебный текст
      if (!datePattern.test(dob) && dob.length > 15) {
        return false;
      }
    }
    
    return true;
  }, []);

  // Умная функция для определения индекса колонок
  const findColumnIndexes = useCallback((rows: any[][]): { [key: string]: number } => {
    // Ищем строку с заголовками
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      if (isHeaderRow(rows[i])) {
        headerRowIndex = i;
        break;
      }
    }
    
    const indexes: { [key: string]: number } = {};
    
    if (headerRowIndex >= 0) {
      const headerRow = rows[headerRowIndex];
      headerRow.forEach((cell, idx) => {
        const cellText = String(cell || '').toLowerCase().trim();
        if (cellText.includes('фио') || cellText.includes('ф.и.о')) indexes.name = idx;
        else if (cellText.includes('дата') && cellText.includes('рожд')) indexes.dob = idx;
        else if (cellText === 'пол' || cellText.includes('пол')) indexes.gender = idx;
        else if (cellText.includes('участок') || cellText.includes('объект')) indexes.site = idx;
        else if (cellText.includes('должность')) indexes.position = idx;
        else if (cellText.includes('общий') && cellText.includes('стаж')) indexes.totalExperience = idx;
        else if (cellText.includes('стаж') && cellText.includes('должност')) indexes.positionExperience = idx;
        else if (cellText.includes('дата') && (cellText.includes('мо') || cellText.includes('мед'))) indexes.lastMedDate = idx;
        else if (cellText.includes('вредность') || cellText.includes('проф')) indexes.harmfulFactor = idx;
        else if (cellText.includes('примечание')) indexes.note = idx;
      });
    }
    
    // Если не нашли заголовки, используем стандартный порядок
    if (Object.keys(indexes).length === 0) {
      indexes.name = 1;
      indexes.dob = 2;
      indexes.gender = 3;
      indexes.site = 4;
      indexes.position = 5;
      indexes.totalExperience = 6;
      indexes.positionExperience = 7;
      indexes.lastMedDate = 8;
      indexes.harmfulFactor = 9;
      indexes.note = 10;
    }
    
    return indexes;
  }, [isHeaderRow]);

  const handleUploadCsv = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError('');
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      if (jsonData.length < 2) {
        setFileError('Файл должен содержать данные');
        return;
      }

      // Ищем строку с заголовками таблицы (ФИО, Дата рождения и т.д.)
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
        const row = jsonData[i];
        const rowText = row.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
        
        // Ищем строку, которая содержит ключевые слова заголовков
        const hasFio = rowText.includes('фио') || rowText.includes('ф.и.о');
        const hasDob = rowText.includes('дата') && (rowText.includes('рожд') || rowText.includes('рожден'));
        const hasPosition = rowText.includes('должность');
        
        // Если нашли строку с заголовками (минимум 2 ключевых слова)
        if ((hasFio && hasDob) || (hasFio && hasPosition) || (hasDob && hasPosition)) {
          headerRowIndex = i;
          break;
        }
      }

      // Если не нашли заголовки, используем первую строку как заголовки
      if (headerRowIndex === -1) {
        headerRowIndex = 0;
      }

      // Определяем индексы колонок из строки заголовков
      const headerRow = jsonData[headerRowIndex];
      const colIndexes: { [key: string]: number } = {};
      
      headerRow.forEach((cell, idx) => {
        const cellText = String(cell || '').toLowerCase().trim();
        if (cellText.includes('фио') || cellText.includes('ф.и.о')) colIndexes.name = idx;
        else if (cellText.includes('дата') && cellText.includes('рожд')) colIndexes.dob = idx;
        else if (cellText === 'пол' || cellText.includes('пол')) colIndexes.gender = idx;
        else if (cellText.includes('участок') || cellText.includes('объект')) colIndexes.site = idx;
        else if (cellText.includes('должность')) colIndexes.position = idx;
        else if (cellText.includes('общий') && cellText.includes('стаж')) colIndexes.totalExperience = idx;
        else if (cellText.includes('стаж') && cellText.includes('должност')) colIndexes.positionExperience = idx;
        else if (cellText.includes('дата') && (cellText.includes('мо') || cellText.includes('мед'))) colIndexes.lastMedDate = idx;
        else if (cellText.includes('вредность') || cellText.includes('проф')) colIndexes.harmfulFactor = idx;
        else if (cellText.includes('примечание')) colIndexes.note = idx;
      });

      // Если не нашли колонку с именем, используем стандартные индексы
      if (colIndexes.name === undefined) {
        colIndexes.name = 1;
        colIndexes.dob = 2;
        colIndexes.gender = 3;
        colIndexes.site = 4;
        colIndexes.position = 5;
        colIndexes.totalExperience = 6;
        colIndexes.positionExperience = 7;
        colIndexes.lastMedDate = 8;
        colIndexes.harmfulFactor = 9;
        colIndexes.note = 10;
      }

      // Берем все строки ПОСЛЕ строки заголовков
      const dataRows = jsonData.slice(headerRowIndex + 1);
      
      // Фильтруем строки - берем только реальные данные сотрудников
      // ОСТАНАВЛИВАЕМСЯ при встрече футера/подписи
      const rows: any[][] = [];
      
      for (const row of dataRows) {
        // Проверяем всю строку на наличие футера/подписи - это КОНЕЦ таблицы
        const rowText = row.map(cell => String(cell || '').toLowerCase().trim()).join(' ');
        const name = String(row[colIndexes.name || 1] || '').trim();
        const nameLower = name.toLowerCase();
        
        // СТРОГАЯ проверка на футер/подпись - только если это действительно футер
        // Футер обычно содержит должность в имени или в строке целиком
        const isFooter = 
          // Проверка на полные фразы футера (должны быть вместе)
          (rowText.includes('менеджер по персоналу') && rowText.includes('отдела')) ||
          (rowText.includes('менеджер по') && rowText.includes('персоналу') && rowText.includes('отдела')) ||
          (nameLower.includes('менеджер по персоналу') && nameLower.includes('отдела')) ||
          // Проверка на подпись/согласование (должны быть в начале или отдельно)
          (rowText.startsWith('согласовано') || rowText.startsWith('утверждено')) ||
          (rowText.includes('подпись') && rowText.length < 50) ||
          // Проверка на должность в имени (если имя содержит "менеджер по" и "отдела")
          (nameLower.includes('менеджер по') && nameLower.includes('отдела') && name.length > 30);
        
        // Если это точно футер - ОСТАНАВЛИВАЕМСЯ (это конец таблицы)
        if (isFooter) {
          break; // Прекращаем обработку, дальше идут подписи/футеры
        }
        
        // Пропускаем полностью пустые строки
        const hasAnyData = row.some(cell => {
          const val = String(cell || '').trim();
          return val && val !== '-' && val !== '—' && val.length > 0;
        });
        if (!hasAnyData) continue;
        
        // Пропускаем строки, где имя пустое или слишком короткое
        if (!name || name.length < 3) continue;
        
        const nameUpper = name.toUpperCase();
        const nameNormalized = nameLower.replace(/\s+/g, ' ').trim();
        
        // Список служебных слов, которые точно не являются ФИО
        const invalidNames = [
          'список', 'контингент', 'фио', 'list', 'contingent', 'fio',
          'руководителю', 'организации', 'клинике', 'согласовано',
          'приложение', 'договору', 'работников', 'дата рождения',
          'пол', 'участок', 'должность', 'стаж', 'медосмотр',
          'вредность', 'примечание', 'name', 'n', '№', 'номер',
          'менеджер', 'руководитель', 'директор', 'начальник'
        ];
        
        // СТРОГАЯ проверка на точное совпадение
        if (invalidNames.includes(nameNormalized) || invalidNames.includes(nameLower)) {
          continue;
        }
        
        // СТРОГАЯ проверка на включение служебных слов
        const invalidPatterns = ['список', 'контингент', 'фио', 'list', 'contingent', 'fio', 'менеджер', 'руководитель'];
        if (invalidPatterns.some(word => nameLower.includes(word) || nameNormalized.includes(word))) {
          continue;
        }
        
        // Если имя содержит слова "менеджер", "руководитель", "директор" - это подпись, пропускаем
        if (nameLower.includes('менеджер') || nameLower.includes('руководитель') || 
            nameLower.includes('директор') || nameLower.includes('начальник') ||
            nameLower.includes('manager') || nameLower.includes('director')) {
          continue;
        }
        
        // Если имя все заглавными и одно слово длиннее 2 символов - пропускаем
        if (name === nameUpper && name.split(/\s+/).length === 1 && name.length > 2) {
          continue;
        }
        
        // Если имя начинается с одной буквы и точки (типа "A.") - пропускаем
        if (/^[А-ЯA-Z]\./.test(name) && name.length <= 5) {
          continue;
        }
        
        // Проверяем, что имя содержит хотя бы одну букву
        if (!/[а-яёa-z]/i.test(name)) {
          continue;
        }
        
        // Проверяем всю строку на наличие служебных слов (не только в имени)
        const serviceWordsInRow = ['список', 'контингент', 'руководителю', 'организации', 'согласовано', 'приложение', 'менеджер по'];
        if (serviceWordsInRow.some(word => rowText.includes(word) && rowText.split(word).length > 1)) {
          // Если в строке есть служебное слово - пропускаем
          continue;
        }
        
        // Проверяем, что имя выглядит как ФИО (не одно короткое слово без других данных)
        const nameParts = name.split(/\s+/).filter(p => p.length > 0);
        if (nameParts.length === 1 && name.length < 5) {
          // Если одно короткое слово, проверяем наличие других данных
          const hasOtherData = [
            colIndexes.dob || 2,
            colIndexes.site || 4,
            colIndexes.position || 5
          ].some(idx => {
            const val = String(row[idx] || '').trim();
            return val && val !== '-' && val !== '—' && val.length > 0;
          });
          if (!hasOtherData) continue;
        }
        
        // Если все проверки пройдены - добавляем строку
        rows.push(row);
      }

      const newEmployees: Employee[] = rows.map((row, index) => {
        const name = String(row[colIndexes.name || 1] || '').trim();
        const dob = String(row[colIndexes.dob || 2] || '').trim();
        const genderStr = String(row[colIndexes.gender || 3] || 'М').trim();
        
        // Улучшенное определение пола - проверяем различные варианты
        const genderLower = genderStr.toLowerCase();
        let gender: 'М' | 'Ж' = 'М'; // По умолчанию мужской
        
        // Проверяем женский пол в различных вариантах
        if (
          genderStr === 'Ж' || 
          genderStr === 'ж' ||
          genderStr === 'Ж.' ||
          genderLower === 'ж' ||
          genderLower === 'женский' ||
          genderLower === 'жен' ||
          genderLower === 'f' ||
          genderLower === 'female' ||
          genderLower === 'ж.' ||
          genderStr.toUpperCase() === 'Ж'
        ) {
          gender = 'Ж';
        }
        // Если явно указан мужской пол, оставляем М
        else if (
          genderStr === 'М' ||
          genderStr === 'м' ||
          genderStr === 'М.' ||
          genderLower === 'м' ||
          genderLower === 'мужской' ||
          genderLower === 'муж' ||
          genderLower === 'm' ||
          genderLower === 'male' ||
          genderLower === 'м.' ||
          genderStr.toUpperCase() === 'М'
        ) {
          gender = 'М';
        }
        // Если не распознали - по умолчанию М
        
        return {
          id: `${Date.now()}_${index}`,
          name,
          dob,
          gender: gender as 'М' | 'Ж',
          site: String(row[colIndexes.site || 4] || '').trim(),
          position: String(row[colIndexes.position || 5] || '').trim(),
          totalExperience: String(row[colIndexes.totalExperience || 6] || '').trim(),
          positionExperience: String(row[colIndexes.positionExperience || 7] || '').trim(),
          lastMedDate: String(row[colIndexes.lastMedDate || 8] || '').trim(),
          harmfulFactor: String(row[colIndexes.harmfulFactor || 9] || '').trim(),
          note: String(row[colIndexes.note || 10] || '').trim(),
          status: 'pending' as const,
        };
      }).filter(e => {
        // Дополнительная фильтрация после создания объектов - ОЧЕНЬ строгая
        if (!e.name || e.name.length < 3) return false;
        const nameLower = e.name.toLowerCase();
        const nameUpper = e.name.toUpperCase();
        const nameNormalized = nameLower.replace(/\s+/g, ' ').trim();
        
        // СТРОГАЯ проверка на "СПИСОК" - в любом виде и регистре
        if (nameNormalized === 'список' || nameUpper === 'СПИСОК' || e.name === 'СПИСОК' || 
            nameNormalized === 'list' || nameUpper === 'LIST' || e.name === 'LIST' ||
            nameNormalized.startsWith('список') || nameLower.startsWith('list') ||
            nameNormalized.includes('список') || nameLower.includes('list')) {
          return false;
        }
        
        // Точные совпадения служебных слов
        const exactInvalidWords = [
          'список', 'контингент', 'руководителю', 'организации', 'клинике',
          'согласовано', 'санитарно-эпидемиологического', 'контроля',
          'транспорте', 'куатовой', 'приложение', 'договору', 'работников',
          'list', 'contingent', 'fio', 'name'
        ];
        
        // Проверка на точное совпадение
        if (exactInvalidWords.some(word => nameNormalized === word || nameUpper === word)) {
          return false;
        }
        
        // Проверка на включение служебных слов - ОЧЕНЬ строгая
        const invalidPatterns = [
          'список', 'контингент', 'руководителю', 'организации', 'клинике',
          'согласовано', 'приложение', 'договору', 'работников'
        ];
        if (invalidPatterns.some(pattern => nameLower.includes(pattern))) {
          return false;
        }
        
        // Если имя полностью заглавными буквами и одно слово - пропускаем
        if (e.name === nameUpper && e.name.split(/\s+/).length === 1) {
          if (e.name === 'СПИСОК' || e.name === 'LIST') {
            return false;
          }
          // Если одно слово все заглавными длиннее 2 символов - пропускаем
          if (e.name.length > 2) {
            return false;
          }
        }
        
        // Проверяем, что имя содержит хотя бы одну букву
        if (!/[а-яёa-z]/i.test(e.name)) {
          return false;
        }
        
        // Проверяем, что имя выглядит как реальное ФИО
        // Если имя очень короткое (меньше 5 символов) и нет других данных - пропускаем
        const hasOtherData = !!(e.dob && e.dob !== '-') || 
                            !!(e.site && e.site !== '-') || 
                            !!(e.position && e.position !== '-') ||
                            !!(e.totalExperience && e.totalExperience !== '-') ||
                            !!(e.positionExperience && e.positionExperience !== '-');
        
        if (e.name.length < 5 && !hasOtherData) {
          return false;
        }
        
        // Если имя начинается с одной буквы и точки (типа "A.") - пропускаем
        if (/^[А-ЯA-Z]\./.test(e.name) && e.name.length <= 5) {
          return false;
        }
        
        return true;
      });

      if (newEmployees.length === 0) {
        setFileError('В файле не найдено корректных данных сотрудников. Проверьте формат файла.');
        return;
      }

      // Объединяем с существующими сотрудниками
      const existing = employees || [];
      const allEmployees = existing.concat(newEmployees);
      
      await updateContract(contractId, { 
        employees: allEmployees,
        status: 'negotiation'
      });

      showToast('success', `Загружено ${newEmployees.length} сотрудников из файла`);
    } catch (error) {
      console.error('File processing error:', error);
      setFileError('Ошибка обработки файла. Проверьте формат.');
    } finally {
      setIsProcessing(false);
      // Сбрасываем input
      event.target.value = '';
    }
  }, [contractId, updateContract, showToast, findColumnIndexes, isHeaderRow, isValidEmployeeRow]);

  const handleDownloadTemplate = useCallback(() => {
    const header = '№;ФИО;Дата рождения;Пол;Участок;Должность;Общий стаж;Стаж по должности;Дата последнего медосмотра;Проф. вредность;Примечание';
    const example = '1;Иванов Иван Иванович;01.01.1980;М;Цех 1;Слесарь;10;5;;Шум, вибрация;';
    const csv = `${header}\r\n${example}\r\n`;
    
    // Добавляем BOM для корректного отображения в Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_contingent.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleClearEmployees = useCallback(() => {
    setConfirmDialog({
      isOpen: true,
      title: 'Очистить контингент?',
      message: 'Вы уверены, что хотите удалить всех сотрудников из контингента? Это действие нельзя отменить.',
      variant: 'danger',
      onConfirm: async () => {
        await updateContract(contractId, { employees: [] });
        showToast('success', 'Контингент очищен');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [contractId, updateContract, showToast]);

  // Вычисляем статистику
  const stats = useMemo(() => {
    const total = employees.length;
    const byStatus = {
      fit: employees.filter(e => e.status === 'fit').length,
      unfit: employees.filter(e => e.status === 'unfit').length,
      needs_observation: employees.filter(e => e.status === 'needs_observation').length,
      pending: employees.filter(e => e.status === 'pending' || !e.status).length,
    };
    const byGender = {
      male: employees.filter(e => e.gender === 'М').length,
      female: employees.filter(e => e.gender === 'Ж').length,
    };
    const withHarmfulFactor = employees.filter(e => e.harmfulFactor && e.harmfulFactor.trim()).length;
    
    return { total, byStatus, byGender, withHarmfulFactor };
  }, [employees]);

  return (
    <>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Заголовок */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-blue-500 rounded-xl shadow-lg">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              Контингент (Приложение 3)
            </h3>
            <div className="flex items-center gap-2">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-blue-200">
                <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                <span className="text-sm text-slate-600 ml-2">чел.</span>
              </div>
            </div>
          </div>

          {/* Визуальная статистика */}
          {employees.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Годен</p>
                    <p className="text-xl font-bold text-green-600">{stats.byStatus.fit}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-red-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Не годен</p>
                    <p className="text-xl font-bold text-red-600">{stats.byStatus.unfit}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-lg">✕</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Наблюдение</p>
                    <p className="text-xl font-bold text-amber-600">{stats.byStatus.needs_observation}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-lg">!</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Ожидание</p>
                    <p className="text-xl font-bold text-slate-600">{stats.byStatus.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-slate-600 text-lg">⏳</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Дополнительная статистика */}
          {employees.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 mb-1">Мужчины</p>
                <p className="text-sm font-bold text-blue-600">{stats.byGender.male}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 mb-1">Женщины</p>
                <p className="text-sm font-bold text-pink-600">{stats.byGender.female}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-2 rounded-lg border border-slate-200">
                <p className="text-[10px] text-slate-500 mb-1">С вредностью</p>
                <p className="text-sm font-bold text-amber-600">{stats.withHarmfulFactor}</p>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки быстрого доступа */}
        <div className="p-6">
          {employees.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Добавить сотрудника */}
              <button
                type="button"
                onClick={onAddEmployee}
                className="group relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <PlusIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Добавить</h4>
                  <p className="text-sm text-blue-100">Нового сотрудника</p>
                </div>
              </button>

              {/* Загрузить из файла */}
              <label className="group relative p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Загрузить</h4>
                  <p className="text-sm text-green-100">Из файла</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleUploadCsv}
                  className="hidden"
                />
              </label>

              {/* Скачать шаблон */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="group relative p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <FileTextIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Скачать</h4>
                  <p className="text-sm text-purple-100">Шаблон (CSV)</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Добавить сотрудника */}
              <button
                type="button"
                onClick={onAddEmployee}
                className="group relative p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <PlusIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Добавить</h4>
                  <p className="text-sm text-blue-100">Нового сотрудника</p>
                </div>
              </button>

              {/* Просмотр списка */}
              <button
                type="button"
                onClick={() => setIsContingentModalOpen(true)}
                className="group relative p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <FileTextIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Просмотр</h4>
                  <p className="text-sm text-purple-100">Весь список</p>
                </div>
              </button>

              {/* Загрузить из файла */}
              <label className="group relative p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <UploadIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Загрузить</h4>
                  <p className="text-sm text-green-100">Из файла</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleUploadCsv}
                  className="hidden"
                />
              </label>

              {/* Очистить */}
              <button
                type="button"
                onClick={handleClearEmployees}
                className="group relative p-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-white overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm">
                    <TrashIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-lg mb-1">Очистить</h4>
                  <p className="text-sm text-red-100">Весь список</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Модальное окно просмотра контингента */}
      {isContingentModalOpen && (
        <ContingentModal
          employees={employees}
          onClose={() => setIsContingentModalOpen(false)}
          onEditEmployee={(emp) => {
            setIsContingentModalOpen(false);
            onEditEmployee(emp);
          }}
          onDeleteEmployee={onDeleteEmployee}
          onToggleStatus={onToggleStatus}
          onAddEmployee={() => {
            setIsContingentModalOpen(false);
            onAddEmployee();
          }}
          rawText={rawText}
          setRawText={setRawText}
          isProcessing={isProcessing}
          fileError={fileError}
          onProcessContingent={handleProcessContingent}
          onUploadCsv={handleUploadCsv}
          onDownloadTemplate={handleDownloadTemplate}
        />
      )}

      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Очистить"
        cancelText="Отмена"
      />
    </>
  );
};

// --- EMPTY STATE ---
interface EmptyContingentStateProps {
  rawText: string;
  setRawText: (text: string) => void;
  isProcessing: boolean;
  fileError: string;
  onProcessContingent: () => void;
  onUploadCsv: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

const EmptyContingentState: React.FC<EmptyContingentStateProps> = ({
  rawText,
  setRawText,
  isProcessing,
  fileError,
  onProcessContingent,
  onUploadCsv,
  onDownloadTemplate
}) => (
  <div className="p-8 text-center">
    <div className="max-w-md mx-auto space-y-3">
      <textarea 
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        placeholder="Вставьте список сотрудников (ФИО, Должность...)"
        className="w-full h-32 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm mb-2"
      />
      <button
        onClick={onProcessContingent}
        disabled={isProcessing || !rawText.trim()}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isProcessing ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <UploadIcon className="w-4 h-4"/>}
        Загрузить и Распознать (текст)
      </button>

      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Скачать шаблон (CSV)
        </button>
        <label className="w-full sm:w-auto text-[11px] text-slate-500 flex items-center gap-2 cursor-pointer">
          <span className="px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-medium">
            Загрузить файл (CSV / Excel)
          </span>
          <input
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={onUploadCsv}
            className="hidden"
          />
        </label>
      </div>
      {fileError && (
        <p className="text-[11px] text-red-500">{fileError}</p>
      )}
      <p className="mt-1 text-[11px] text-slate-400">
        Загрузку контингента может выполнить как Организация, так и Клиника. При повторной загрузке список будет перезаписан.
      </p>
    </div>
  </div>
);

// --- CONTINGENT MODAL ---
interface ContingentModalProps {
  employees: Employee[];
  onClose: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onToggleStatus: (employeeId: string) => void;
  onAddEmployee: () => void;
  rawText: string;
  setRawText: (text: string) => void;
  isProcessing: boolean;
  fileError: string;
  onProcessContingent: () => void;
  onUploadCsv: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

const ContingentModal: React.FC<ContingentModalProps> = ({
  employees,
  onClose,
  onEditEmployee,
  onDeleteEmployee,
  onToggleStatus,
  onAddEmployee,
  rawText,
  setRawText,
  isProcessing,
  fileError,
  onProcessContingent,
  onUploadCsv,
  onDownloadTemplate
}) => {
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация сотрудников по поисковому запросу
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name?.toLowerCase().includes(query) ||
      emp.position?.toLowerCase().includes(query) ||
      emp.site?.toLowerCase().includes(query) ||
      emp.dob?.includes(query)
    );
  }, [employees, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full h-[95vh] max-w-[98vw] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-blue-500" />
              Контингент (Приложение 3)
            </h3>
            <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded">
              {filteredEmployees.length} {searchQuery ? `из ${employees.length}` : ''} чел.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUploadSection(!showUploadSection)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
              data-upload-trigger
            >
              {showUploadSection ? 'Скрыть загрузку' : 'Загрузить из файла'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddEmployee();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Добавить
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-2xl">✕</button>
          </div>
        </div>

        {/* Поиск */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ФИО, должности, участку..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showUploadSection && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="max-w-2xl mx-auto space-y-3">
              <textarea 
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Вставьте список сотрудников (ФИО, Должность...)"
                className="w-full h-32 p-3 bg-white rounded-xl border border-slate-200 text-sm"
              />
              <button
                onClick={onProcessContingent}
                disabled={isProcessing || !rawText.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {isProcessing ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <UploadIcon className="w-4 h-4"/>}
                Загрузить и Распознать (текст)
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Скачать шаблон (CSV)
                </button>
                <label className="text-xs text-slate-500 flex items-center gap-2 cursor-pointer">
                  <span className="px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:bg-slate-50 text-xs font-medium">
                    Загрузить файл (CSV / Excel)
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={onUploadCsv}
                    className="hidden"
                  />
                </label>
              </div>
              {fileError && (
                <p className="text-xs text-red-500">{fileError}</p>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full text-[11px] text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-[180px]" />
              <col className="w-24" />
              <col className="w-12" />
              <col className="w-[200px]" />
              <col className="w-[150px]" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-[180px]" />
              <col className="w-[120px]" />
              <col className="w-20" />
              <col className="w-28" />
            </colgroup>
            <thead className="bg-slate-700 text-white uppercase sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">№</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">ФИО</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Дата рожд.</th>
                <th className="px-1 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Пол</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Участок</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Должность</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Общ. стаж</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Стаж по должн.</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Дата МО</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Вредность</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Примечание</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Статус</th>
                <th className="px-2 py-2 text-left bg-slate-700 border-b border-slate-600 font-semibold text-white">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-slate-400">
                    {searchQuery ? 'Ничего не найдено' : 'Нет данных'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, idx) => {
                  // Находим реальный индекс в исходном массиве для нумерации
                  const realIndex = employees.findIndex(e => e.id === employee.id) + 1;
                  return (
                    <EmployeeTableRow
                      key={employee.id}
                      employee={employee}
                      index={realIndex}
                      showActionsColumn={true}
                      onToggleStatus={onToggleStatus}
                      onEdit={onEditEmployee}
                      onDelete={onDeleteEmployee}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- EMPLOYEES TABLE ---
interface EmployeesTableProps {
  employees: Employee[];
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onToggleStatus: (employeeId: string) => void;
}

const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  onEditEmployee,
  onDeleteEmployee,
  onToggleStatus
}) => (
  <div className="max-h-96 overflow-auto overflow-x-auto">
    <table className="w-full min-w-[1100px] text-xs text-left">
      <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0 z-10">
        <tr>
          <th className="px-6 py-3">ФИО</th>
          <th className="px-6 py-3">Дата рождения</th>
          <th className="px-2 py-3">Пол</th>
          <th className="px-4 py-3">Участок</th>
          <th className="px-6 py-3">Должность</th>
          <th className="px-4 py-3">Общий стаж</th>
          <th className="px-4 py-3">Стаж по должности</th>
          <th className="px-6 py-3">Дата посл. МО</th>
          <th className="px-6 py-3">Вредность</th>
          <th className="px-6 py-3">Примечание</th>
          <th className="px-6 py-3">Статус</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {employees.map(employee => (
          <EmployeeTableRow
            key={employee.id}
            employee={employee}
            onToggleStatus={onToggleStatus}
            onEdit={onEditEmployee}
            onDelete={onDeleteEmployee}
          />
        ))}
      </tbody>
    </table>
  </div>
  );
  
  export default ContingentSection;