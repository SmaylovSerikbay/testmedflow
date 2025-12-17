import fs from 'fs';
import path from 'path';

// Генерация ключевых слов из названия фактора
function makeKeywords(title) {
  if (!title) return [];
  const lower = title.toLowerCase();
  const rawWords = lower
    .replace(/[^a-zа-яё0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    'и', 'или', 'а', 'в', 'на', 'с', 'со', 'над', 'под', 'из', 'для', 'по', 'при', 'от', 'до',
    'их', 'его', 'ее', 'производства', 'соединения', 'соединенияа', 'соединенияк',
    'другие', 'другое', 'иные', 'прочие', 'работы', 'профессии', 'факторы', 'вредные', 'опасные',
  ]);

  const filtered = rawWords.filter((w) => w.length >= 3 && !stopWords.has(w));
  return Array.from(new Set(filtered)).slice(0, 6);
}

function main() {
  const rootDir = process.cwd();
  const jsonPath = path.join(rootDir, 'tableConvert.com_mq2frl.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('Не найден файл "tableConvert.com_mq2frl.json" в корне проекта');
    process.exit(1);
  }

  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rules = [];
  let currentSection = '';
  let globalId = 1; // Глобальный счетчик для уникальных ID

  jsonData.forEach((row, index) => {
    const number = row['№']?.trim();
    const factor = row['Опасные и вредные производственные факторы, профессии и работы']?.trim();
    // Врачи могут быть в колонке "Участие врачей, специалистов" или в пустой колонке ""
    let doctors = row['Участие врачей, специалистов']?.trim() || row['']?.trim() || '';
    const research = row['Лабораторные и функциональные исследования']?.trim();
    const contraindications = row['Медицинские противопоказания']?.trim();

    // Определяем раздел (заголовки разделов)
    if (number && (number.includes('Химические') || number.includes('Профессии') || 
        number.includes('Физические') || number.includes('Биологические'))) {
      currentSection = number;
      return; // Пропускаем заголовки разделов
    }

    // Пропускаем пустые строки и заголовки
    if (!number || !factor || !doctors) {
      return;
    }

    // Парсим номер пункта
    const pointId = parseInt(number, 10);
    if (!Number.isFinite(pointId) || pointId <= 0) {
      return;
    }

    // Словарь правильных названий врачей (с заглавной буквы)
    const doctorNamesMap = {
      'профпатолог': 'Профпатолог',
      'терапевт': 'Терапевт',
      'невропатолог': 'Невропатолог',
      'невролог': 'Невролог',
      'дерматовенеролог': 'Дерматовенеролог',
      'аллерголог': 'Аллерголог',
      'оториноларинголог': 'Оториноларинголог',
      'отоларинголог': 'Отоларинголог',
      'офтальмолог': 'Офтальмолог',
      'эндокринолог': 'Эндокринолог',
      'гинеколог': 'Гинеколог',
      'уролог': 'Уролог',
      'онколог': 'Онколог',
      'рентгенолог': 'Рентгенолог',
      'кардиолог': 'Кардиолог',
      'психиатр': 'Психиатр',
      'психиатр (медицинский психолог)': 'Психиатр (медицинский психолог)',
      'нарколог': 'Нарколог',
      'гематолог': 'Гематолог',
      'хирург': 'Хирург',
      'стоматолог': 'Стоматолог'
    };
    
    // Разделяем врачей по запятым и точкам с запятой
    let specialties = doctors
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    // Если после разделения по запятым получили мало элементов, 
    // но строка длинная - возможно врачи указаны через пробелы
    if (specialties.length === 1 && specialties[0].length > 30) {
      // Пытаемся найти названия врачей в строке по словарю
      const foundDoctors = [];
      const lowerDoctors = doctors.toLowerCase();
      
      Object.keys(doctorNamesMap).forEach(doctorKey => {
        if (lowerDoctors.includes(doctorKey.toLowerCase())) {
          foundDoctors.push(doctorNamesMap[doctorKey]);
        }
      });
      
      if (foundDoctors.length > 0) {
        specialties = foundDoctors;
      }
    }
    
    // Нормализуем названия врачей (приводим к правильному виду из словаря)
    specialties = specialties
      .map(s => {
        const lower = s.toLowerCase().trim();
        // Ищем точное совпадение
        const exactMatch = Object.keys(doctorNamesMap).find(key => key.toLowerCase() === lower);
        if (exactMatch) {
          return doctorNamesMap[exactMatch];
        }
        // Ищем частичное совпадение
        const partialMatch = Object.keys(doctorNamesMap).find(key => 
          lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)
        );
        if (partialMatch) {
          return doctorNamesMap[partialMatch];
        }
        return s; // Если не нашли - возвращаем как есть
      })
      .filter(Boolean);

    if (specialties.length === 0) {
      return;
    }

    const keywords = makeKeywords(factor);

    rules.push({
      id: pointId, // Используем номер пункта из таблицы
      title: factor,
      keywords,
      specialties, // Врачи из колонки "Участие врачей, специалистов"
      research: research || '', // Исследования (для справки)
      contraindications: contraindications || '', // Противопоказания (для справки)
      section: currentSection, // Раздел для отладки
    });
  });

  const outPath = path.join(rootDir, 'factorRules.generated.ts');

  const fileContent =
    `// AUTO-GENERATED FROM "tableConvert.com_mq2frl.json". НЕ РЕДАКТИРУЙТЕ ВРУЧНУЮ.\n` +
    `// Для обновления запустите: node scripts/generateFactorRulesFromJSON.js\n\n` +
    `export const FACTOR_RULES = ${JSON.stringify(rules, null, 2)} as const;\n`;

  fs.writeFileSync(outPath, fileContent, 'utf8');
  console.log(`Сгенерирован файл: ${outPath}, всего правил: ${rules.length}`);
  
  // Проверяем пункт 12
  const rule12 = rules.find(r => r.id === 12 && r.title.includes('зрительнонапряженными'));
  if (rule12) {
    console.log('\nПроверка пункта 12 (зрительнонапряженные работы):');
    console.log('Врачи:', rule12.specialties.join(', '));
  }
}

main();

