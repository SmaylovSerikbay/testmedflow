import jsPDF from 'jspdf';
import { Contract, Employee, Doctor, HealthGroup } from '../types';
import { FACTOR_RULES, FactorRule } from '../factorRules';

// Функция определения правил по вредным факторам
const resolveFactorRules = (text: string): FactorRule[] => {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase();
  const foundRules: FactorRule[] = [];
  const foundKeys = new Set<string>();
  
  const pointRegex = /п\.?\s*(\d+)|пункт\s*(\d+)/gi;
  let match: RegExpExecArray | null;
  const matches: Array<{ id: number; context: string }> = [];
  
  while ((match = pointRegex.exec(text)) !== null) {
    const pointId = parseInt(match[1] || match[2], 10);
    if (pointId && !isNaN(pointId)) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.slice(start, end).toLowerCase();
      matches.push({ id: pointId, context });
    }
  }
  
  matches.forEach(({ id, context }) => {
    const rulesWithId = FACTOR_RULES.filter(r => r.id === id);
    
    if (rulesWithId.length === 0) return;
    
    if (rulesWithId.length === 1) {
      const rule = rulesWithId[0];
      const key = rule.uniqueKey;
      if (!foundKeys.has(key)) {
        foundRules.push(rule);
        foundKeys.add(key);
      }
      return;
    }
    
    // Если найдено несколько правил с одинаковым ID, выбираем наиболее подходящее по контексту
    let selectedRule = rulesWithId[0]; // По умолчанию первое
    
    // Ищем правило, которое лучше соответствует контексту
    for (const rule of rulesWithId) {
      const titleWords = rule.title.toLowerCase().split(/\s+/);
      const contextWords = context.toLowerCase().split(/\s+/);
      
      // Подсчитываем совпадения слов между заголовком правила и контекстом
      const matches = titleWords.filter(word => 
        word.length > 3 && contextWords.some(cw => cw.includes(word) || word.includes(cw))
      ).length;
      
      // Если найдено больше совпадений, выбираем это правило
      if (matches > 0) {
        const currentMatches = selectedRule.title.toLowerCase().split(/\s+/)
          .filter(word => word.length > 3 && contextWords.some(cw => cw.includes(word) || word.includes(cw)))
          .length;
        
        if (matches > currentMatches) {
          selectedRule = rule;
        }
      }
    }
    
    console.log(`Найдено ${rulesWithId.length} правил для пункта ${id}:`, 
      rulesWithId.map(r => r.title.substring(0, 50) + '...'));
    console.log(`Выбрано правило: ${selectedRule.title.substring(0, 50)}...`);
    
    const key = selectedRule.uniqueKey;
    if (!foundKeys.has(key)) {
      foundRules.push(selectedRule);
      foundKeys.add(key);
    }
  });
  
  if (foundRules.length > 0) {
    return foundRules;
  }
  
  const matchingRules = FACTOR_RULES.map(rule => {
    const matchingKeywords = rule.keywords.filter(kw => 
      kw && normalized.includes(kw.toLowerCase())
    );
    return { rule, matchCount: matchingKeywords.length };
  }).filter(item => item.matchCount > 0);
  
  if (matchingRules.length === 0) return [];
  
  const maxMatch = Math.max(...matchingRules.map(m => m.matchCount));
  const bestMatches = matchingRules
    .filter(m => m.matchCount === maxMatch)
    .map(m => m.rule);
  
  return bestMatches.sort((a, b) => a.id - b.id).slice(0, 1);
};

// Настройка шрифтов для поддержки кириллицы
// ВАЖНО: jsPDF по умолчанию не поддерживает кириллицу
// Для правильной работы нужно использовать специальные шрифты или html2canvas
const setupPDFFont = (doc: jsPDF) => {
  // Используем стандартный шрифт (кириллица будет отображаться некорректно)
  // Для правильной поддержки кириллицы нужно использовать html2canvas
  doc.setFont('helvetica');
};

// Утилита для добавления текста с переносом строк
const addTextWithWrap = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  let currentY = y;
  
  lines.forEach((line: string) => {
    doc.text(line, x, currentY);
    currentY += lineHeight;
  });
  
  return currentY;
};

// Обязательные специалисты для комиссии согласно п. 14 Приказа
const MANDATORY_SPECIALISTS = [
  'Терапевт',
  'Хирург',
  'Невропатолог',
  'Оториноларинголог',
  'Офтальмолог',
  'Дерматовенеролог',
  'Гинеколог',
  'Рентгенолог',
  'Врач по функциональной диагностике',
  'Врач-лаборант'
];

// Автоматическое определение необходимых специалистов на основе вредных факторов
const getRequiredSpecialtiesFromContract = (contract: Contract): string[] => {
  const allSpecialties = new Set<string>();
  
  // Профпатолог всегда нужен как председатель комиссии
  allSpecialties.add('Профпатолог');

  // Добавляем обязательных специалистов (согласно п. 14)
  // В некоторых случаях можно сокращать, но для надежности добавляем всех
  MANDATORY_SPECIALISTS.forEach(s => allSpecialties.add(s));
  
  if (contract.employees && contract.employees.length > 0) {
    contract.employees.forEach(employee => {
      if (employee.harmfulFactor) {
        const rules = resolveFactorRules(employee.harmfulFactor);
        rules.forEach(rule => {
          rule.specialties.forEach(specialty => {
            allSpecialties.add(specialty);
          });
        });
      }
    });
  }
  
  return Array.from(allSpecialties).sort();
};

// Автоматическое определение необходимых лабораторных исследований
const getRequiredResearchFromContract = (contract: Contract): string[] => {
  if (!contract.employees || contract.employees.length === 0) return [];
  
  const allResearch = new Set<string>();
  
  contract.employees.forEach(employee => {
    if (employee.harmfulFactor) {
      const rules = resolveFactorRules(employee.harmfulFactor);
      rules.forEach(rule => {
        if (rule.research && rule.research.trim()) {
          // Разбиваем исследования по запятым и добавляем каждое
          const researches = rule.research.split(/[,;]/).map(r => r.trim()).filter(r => r.length > 0);
          researches.forEach(research => allResearch.add(research));
        }
      });
    }
  });
  
  return Array.from(allResearch).sort();
};

// Генерация маршрутного листа для клиники
export const generateClinicRouteSheetPDF = (contract: Contract, doctors: Doctor[] = []) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('МАРШРУТНЫЙ ЛИСТ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(14);
  doc.text('(для медицинской организации)', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Информация о договоре
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Договор: ${contract.number}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Организация: ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Клиника: ${contract.clinicName}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Период: ${contract.calendarPlan?.startDate} - ${contract.calendarPlan?.endDate}`, 20, yPosition);
  yPosition += 15;
  
  // Автоматически определяем необходимые специализации
  const requiredSpecialties = getRequiredSpecialtiesFromContract(contract);
  const requiredResearch = getRequiredResearchFromContract(contract);
  
  // Необходимые специалисты на основе вредных факторов
  if (requiredSpecialties.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('НЕОБХОДИМЫЕ СПЕЦИАЛИСТЫ:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    // Разбиваем на 2 колонки если много
    const midPoint = Math.ceil(requiredSpecialties.length / 2);
    requiredSpecialties.forEach((specialty, index) => {
        const xPos = index < midPoint ? 20 : 110;
        const yPos = yPosition + ((index % midPoint) * 7);
      doc.text(`• ${specialty}`, xPos, yPos);
    });
    
    yPosition += (midPoint * 7) + 10;
  }
  
  // Необходимые лабораторные исследования
  if (requiredResearch.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('НЕОБХОДИМЫЕ ИССЛЕДОВАНИЯ:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    requiredResearch.forEach(research => {
      const lines = doc.splitTextToSize(`• ${research}`, 170);
      lines.forEach((line: string) => {
        doc.text(line, 20, yPosition);
        yPosition += 6;
      });
    });
    
    yPosition += 10;
  }
  
  // Порядок проведения медосмотра
  doc.setFont('helvetica', 'bold');
  doc.text('ПОРЯДОК ПРОВЕДЕНИЯ МЕДИЦИНСКОГО ОСМОТРА:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const procedures = [
    '1. Регистрация работников и проверка документов',
    '2. Предварительный осмотр врача-терапевта',
    '3. Осмотры врачей-специалистов согласно вредным факторам',
    '4. Лабораторные исследования (по показаниям)',
    '5. Функциональная диагностика (по показаниям)',
    '6. Заключительный осмотр председателя врачебной комиссии',
    '7. Оформление и выдача заключений о пригодности'
  ];
  
  procedures.forEach(procedure => {
    doc.text(procedure, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Состав врачебной комиссии
  if (doctors.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('СОСТАВ ВРАЧЕБНОЙ КОМИССИИ:', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    doctors.forEach(doctor => {
      const role = doctor.isChairman ? ' (Председатель)' : '';
      doc.text(`${doctor.specialty}: ${doctor.name}${role}`, 20, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
  }
  
  // Контактная информация
  doc.setFont('helvetica', 'bold');
  doc.text('КОНТАКТНАЯ ИНФОРМАЦИЯ:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Ответственный от клиники: _________________________', 20, yPosition);
  yPosition += 8;
  doc.text('Телефон: _________________________', 20, yPosition);
  yPosition += 8;
  doc.text('Email: _________________________', 20, yPosition);
  yPosition += 15;
  
  // Подпись и дата
  doc.text(`Дата составления: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  yPosition += 15;
  
  doc.text('Главный врач: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text('М.П.', 20, yPosition);
  
  return doc;
};

// Генерация маршрутного листа для организации
export const generateOrganizationRouteSheetPDF = (contract: Contract) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('МАРШРУТНЫЙ ЛИСТ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(14);
  doc.text('(для организации-работодателя)', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Информация о договоре
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Договор: ${contract.number}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Организация: ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Клиника: ${contract.clinicName}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Период: ${contract.calendarPlan?.startDate} - ${contract.calendarPlan?.endDate}`, 20, yPosition);
  yPosition += 15;
  
  // Обязанности организации
  doc.setFont('helvetica', 'bold');
  doc.text('ОБЯЗАННОСТИ ОРГАНИЗАЦИИ:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const obligations = [
    '1. Предоставить список работников (Приложение 3 к договору)',
    '2. Обеспечить явку работников в назначенное время',
    '3. Предоставить характеристики условий труда на рабочих местах',
    '4. Организовать транспорт для доставки работников (при необходимости)',
    '5. Получить результаты медицинского осмотра',
    '6. Обеспечить выполнение рекомендаций врачебной комиссии'
  ];
  
  obligations.forEach(obligation => {
    yPosition = addTextWithWrap(doc, obligation, 20, yPosition, 170);
    yPosition += 3;
  });
  
  yPosition += 10;
  
  // Документы для предоставления
  doc.setFont('helvetica', 'bold');
  doc.text('ДОКУМЕНТЫ ДЛЯ ПРЕДОСТАВЛЕНИЯ:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  const documents = [
    '• Список работников с указанием вредных факторов',
    '• Копии трудовых договоров (при необходимости)',
    '• Характеристики условий труда',
    '• Результаты предыдущих медосмотров (при наличии)'
  ];
  
  documents.forEach(document => {
    doc.text(document, 20, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Контактная информация
  doc.setFont('helvetica', 'bold');
  doc.text('КОНТАКТНАЯ ИНФОРМАЦИЯ:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Ответственный от организации: _________________________', 20, yPosition);
  yPosition += 8;
  doc.text('Телефон: _________________________', 20, yPosition);
  yPosition += 8;
  doc.text('Email: _________________________', 20, yPosition);
  yPosition += 15;
  
  // Подпись и дата
  doc.text(`Дата составления: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  yPosition += 15;
  
  doc.text('Руководитель организации: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text('М.П.', 20, yPosition);
  
  return doc;
};

// Генерация приказа о составе врачебной комиссии
export const generateCommissionOrderPDF = (contract: Contract, doctors: Doctor[] = []) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ПРИКАЗ', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPosition = addTextWithWrap(doc, 'О составе врачебной комиссии для проведения периодического медицинского осмотра', 20, yPosition, 170);
  yPosition += 15;
  
  // Информация о договоре
  doc.text(`Договор: ${contract.number}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Организация: ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Период: ${contract.calendarPlan?.startDate} - ${contract.calendarPlan?.endDate}`, 20, yPosition);
  yPosition += 15;
  
  // Автоматически определяем необходимые специализации
  const requiredSpecialties = getRequiredSpecialtiesFromContract(contract);
  
  // Преамбула
  yPosition = addTextWithWrap(doc, 'В соответствии с требованиями законодательства Республики Казахстан о проведении периодических медицинских осмотров работников, занятых на работах с вредными и (или) опасными производственными факторами:', 20, yPosition, 170);
  yPosition += 15;
  
  // Приказываю
  doc.setFont('helvetica', 'bold');
  doc.text('ПРИКАЗЫВАЮ:', 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  
  // Пункт 1 - состав комиссии
  doc.text('1. Создать врачебную комиссию в следующем составе:', 20, yPosition);
  yPosition += 10;
  
  if (doctors.length > 0) {
    const chairman = doctors.find(d => d.isChairman);
    if (chairman) {
      doc.text(`Председатель комиссии:`, 25, yPosition);
      yPosition += 7;
      doc.text(`${chairman.specialty}: ${chairman.name}`, 30, yPosition);
      yPosition += 10;
    }
    
    doc.text('Члены комиссии:', 25, yPosition);
    yPosition += 7;
    
    doctors.filter(d => !d.isChairman).forEach(doctor => {
      doc.text(`${doctor.specialty}: ${doctor.name}`, 30, yPosition);
      yPosition += 7;
    });
  } else {
    // Если врачи не переданы, используем список необходимых специализаций
    doc.text('Председатель комиссии:', 25, yPosition);
    yPosition += 7;
    doc.text('Врач-профпатолог: _________________________', 30, yPosition);
    yPosition += 10;
    
    doc.text('Члены комиссии:', 25, yPosition);
    yPosition += 7;
    
    // Показываем всех специалистов
    const otherSpecialties = requiredSpecialties.filter(s => s !== 'Профпатолог');
    if (otherSpecialties.length > 0) {
      otherSpecialties.forEach(specialty => {
        doc.text(`${specialty}: _________________________`, 30, yPosition);
        yPosition += 7;
      });
    } else {
        // Fallback если список пуст
        MANDATORY_SPECIALISTS.filter(s => s !== 'Профпатолог').forEach(specialty => {
            doc.text(`${specialty}: _________________________`, 30, yPosition);
            yPosition += 7;
        });
    }
  }
  
  yPosition += 10;
  
  // Пункт 2
  yPosition = addTextWithWrap(doc, `2. Комиссии провести медицинский осмотр работников ${contract.clientName} в период с ${contract.calendarPlan?.startDate} по ${contract.calendarPlan?.endDate}.`, 20, yPosition, 170);
  yPosition += 10;
  
  // Пункт 3
  yPosition = addTextWithWrap(doc, '3. По результатам осмотра составить заключительный акт и план оздоровительных мероприятий.', 20, yPosition, 170);
  yPosition += 10;
  
  // Пункт 4
  yPosition = addTextWithWrap(doc, '4. Контроль за исполнением приказа возложить на заместителя главного врача по медицинской части.', 20, yPosition, 170);
  yPosition += 20;
  
  // Подпись
  doc.text('Главный врач: _________________________', 20, yPosition);
  yPosition += 15;
  
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  yPosition += 10;
  doc.text('М.П.', 20, yPosition);
  
  return doc;
};

// Генерация заключительного акта
export const generateFinalActPDF = (contract: Contract, employees: Employee[], ambulatoryCards: any[] = []) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ЗАКЛЮЧИТЕЛЬНЫЙ АКТ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  yPosition = addTextWithWrap(doc, `по результатам проведенного периодического медицинского осмотра работников ${contract.clientName}`, 20, yPosition, 170);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  
  // Основная информация
  doc.text(`1. Медицинская организация: ${contract.clinicName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`2. Организация (Заказчик): ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`3. Договор: ${contract.number} от ${contract.date}`, 20, yPosition);
  yPosition += 15;
  
  // Статистика
  const total = employees.length;
  // Считаем статусы из ambulatoryCards, если они есть, иначе из employees
  // Это важно для более точного учета healthGroup
  
  const pending = employees.filter(e => e.status === 'pending').length;
  const inspected = total - pending;
  
  const fit = employees.filter(e => e.status === 'fit').length;
  const unfit = employees.filter(e => e.status === 'unfit').length;
  const observation = employees.filter(e => e.status === 'needs_observation').length;
  
  doc.text(`4. Всего работников, подлежащих осмотру: ${total}`, 20, yPosition);
  yPosition += 8;
  doc.text(`5. Всего осмотрено: ${inspected} (% охвата: ${total > 0 ? Math.round((inspected / total) * 100) : 0}%)`, 20, yPosition);
  yPosition += 10;
  
  doc.text(`   - Признаны годными к работе: ${fit}`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Выявлено лиц с подозрением на профзаболевание: 0`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Нуждаются в дообследовании: ${observation}`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Имеют противопоказания к работе (не годны): ${unfit}`, 25, yPosition);
  yPosition += 15;
  
  // Рекомендации
  doc.text('6. Рекомендации по оздоровлению условий труда:', 20, yPosition);
  yPosition += 10;
  
  const recommendations = [
    '- Соблюдение режимов труда и отдыха',
    '- Использование средств индивидуальной защиты',
    '- Проведение производственного контроля',
    '- Организация лечебно-профилактического питания (по показаниям)'
  ];
  
  recommendations.forEach(rec => {
    doc.text(rec, 25, yPosition);
    yPosition += 7;
  });
  
  yPosition += 15;
  
  // Подписи
  doc.text('Председатель врачебной комиссии: _________________________', 20, yPosition);
  yPosition += 15;
  
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  yPosition += 10;
  doc.text('М.П.', 20, yPosition);

  // --- ПРИЛОЖЕНИЕ: ПОИМЕННЫЙ СПИСОК ---
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Приложение к заключительному акту', 105, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text('Поименный список лиц, нуждающихся в оздоровлении', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Header Table
  const headers = ['№', 'ФИО', 'Должность', 'Заключение/Рекомендация'];
  let xPos = 20;
  headers.forEach((h, i) => {
      const w = i === 1 ? 60 : i === 3 ? 60 : 25;
      doc.rect(xPos, yPosition, w, 10);
      doc.text(h, xPos + 2, yPosition + 6);
      xPos += w;
  });
  yPosition += 10;
  
  // Rows
  const list = employees.filter(e => e.status !== 'fit' && e.status !== 'pending');
  
  if (list.length === 0) {
      doc.rect(20, yPosition, 170, 10);
      doc.text('Нет сотрудников, нуждающихся в оздоровлении', 25, yPosition + 6);
  } else {
      list.forEach((emp, i) => {
          const rec = emp.status === 'unfit' ? 'Перевод на другую работу / Лечение' : 'Диспансерное наблюдение';
          
          let rowY = yPosition;
          const h = 10; // row height
          
          // №
          doc.rect(20, rowY, 25, h);
          doc.text((i + 1).toString(), 22, rowY + 6);
          
          // ФИО
          doc.rect(45, rowY, 60, h);
          doc.text(emp.name, 47, rowY + 6);
          
          // Должность
          doc.rect(105, rowY, 25, h);
          doc.text(emp.position || '', 107, rowY + 6);
          
          // Заключение
          doc.rect(130, rowY, 60, h);
          doc.text(rec, 132, rowY + 6);
          
          yPosition += h;
          
          // Page break check (simple)
          if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
          }
      });
  }
  
  return doc;
};

// Генерация Сводного отчета (Приложение 2)
export const generateSummaryReportPDF = (contract: Contract, employees: Employee[], ambulatoryCards: any[] = []) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('СВОДНЫЙ ОТЧЕТ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  doc.setFontSize(12);
  doc.text('о результатах проведенного периодического медицинского осмотра', 105, yPosition, { align: 'center' });
  yPosition += 10;
  doc.setFontSize(10);
  doc.text('(Приложение 2 к Правилам проведения обязательных медицинских осмотров)', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Данные для отчета
  const total = employees.length;
  const inspected = employees.filter(e => e.status !== 'pending').length;
  
  // Подсчет по группам здоровья
  const healthGroups: Record<string, number> = {
      '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0
  };
  
  // Для простоты, если нет детальных карт, мапим статусы
  if (ambulatoryCards.length > 0) {
      ambulatoryCards.forEach((card: any) => {
          const g = card.finalConclusion?.healthGroup;
          if (g && healthGroups[g] !== undefined) {
              healthGroups[g]++;
          }
      });
  } else {
      // Fallback mapping from status
      employees.forEach(e => {
          if (e.status === 'fit') healthGroups['1']++; // Assumed
          else if (e.status === 'needs_observation') healthGroups['3']++; // Assumed
          else if (e.status === 'unfit') healthGroups['4']++; // Assumed
      });
  }
  
  // I. Общие сведения
  doc.setFont('helvetica', 'bold');
  doc.text('I. Общие сведения', 20, yPosition);
  yPosition += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`1. Наименование медицинской организации: ${contract.clinicName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`2. Наименование организации (предприятия): ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`3. Количество цехов (участков): -`, 20, yPosition);
  yPosition += 8;
  doc.text(`4. Количество работников, занятых во вредных условиях труда: ${employees.filter(e => !!e.harmfulFactor).length}`, 20, yPosition);
  yPosition += 15;
  
  // II-IX Sections (simplified table-like layout)
  const items = [
      `II. Подлежит осмотру всего: ${total}`,
      `III. Осмотрено всего: ${inspected} (% выполнения: ${total > 0 ? Math.round(inspected/total*100) : 0}%)`,
      `IV. Выявлено лиц с общими соматическими заболеваниями: ${healthGroups['3'] + healthGroups['4']}`,
      `   из них впервые: -`,
      `V. Выявлено лиц с профессиональными заболеваниями: ${healthGroups['6']}`,
      `   из них женщин: -`,
      `VI. Выявлено лиц с подозрением на профзаболевание: ${healthGroups['5']}`,
      `VII. Распределение осмотренных по группам здоровья (п. 21):`,
      `   1) Здоровые: ${healthGroups['1']}`,
      `   2) Практически здоровые: ${healthGroups['2']}`,
      `   3) Начальные формы общих заболеваний: ${healthGroups['3']}`,
      `   4) Выраженные формы общих заболеваний: ${healthGroups['4']}`,
      `   5) Признаки воздействия вредных факторов: ${healthGroups['5']}`,
      `   6) Признаки профзаболеваний: ${healthGroups['6']}`,
      `VIII. Результаты осмотра женщин:`,
      `   Осмотрено гинекологом: -`,
      `   Выявлено заболеваний: -`,
      `IX. Результаты выполнения плана оздоровления за прошлый год:`,
      `   Процент выполнения: -`
  ];
  
  items.forEach(item => {
      doc.text(item, 20, yPosition);
      yPosition += 8;
      
      if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
      }
  });
  
  yPosition += 15;
  doc.text('Руководитель медицинской организации: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  
  return doc;
};

// Экстренное извещение (Item 19)
export const generateEmergencyNotificationPDF = (employee: Employee, diagnosis: string) => {
    const doc = new jsPDF();
    setupPDFFont(doc);
    let y = 20;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ЭКСТРЕННОЕ ИЗВЕЩЕНИЕ', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text('об инфекционном заболевании, пищевом, остром профессиональном отравлении', 105, y, { align: 'center' });
    y += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    const fields = [
        `1. Диагноз: ${diagnosis}`,
        `2. Фамилия, имя, отчество: ${employee.name}`,
        `3. Дата рождения: ${employee.dob}`,
        `4. Адрес проживания: (из амбулаторной карты)`,
        `5. Место работы, должность: ${employee.position}`,
        `6. Даты заболевания: ${new Date().toLocaleDateString('ru-RU')}`,
        `7. Дата первичного обращения: ${new Date().toLocaleDateString('ru-RU')}`,
        `8. Дата установления диагноза: ${new Date().toLocaleDateString('ru-RU')}`,
        `9. Дата госпитализации: -`,
        `10. Место госпитализации: -`,
        `11. Проведенные первичные противоэпидемические мероприятия: -`
    ];
    
    fields.forEach(f => {
        y = addTextWithWrap(doc, f, 20, y, 170);
        y += 10;
    });
    
    y += 20;
    doc.text('Врач, пославший извещение: ____________________', 20, y);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 140, y);
    
    return doc;
};

// Генерация плана оздоровления
export const generateHealthPlanPDF = (contract: Contract, employees: Employee[]) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ПЛАН ОЗДОРОВЛЕНИЯ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  yPosition = addTextWithWrap(doc, `работников ${contract.clientName} по результатам периодического медицинского осмотра`, 20, yPosition, 170);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  
  // Список сотрудников для оздоровления
  const needsAttention = employees.filter(e => e.status === 'needs_observation' || e.status === 'unfit');
  
  doc.text('Список сотрудников, подлежащих оздоровлению:', 20, yPosition);
  yPosition += 10;
  
  if (needsAttention.length > 0) {
    needsAttention.forEach((employee, index) => {
      const status = employee.status === 'unfit' ? 'Противопоказан к работе' : 'Нуждается в наблюдении';
      doc.text(`${index + 1}. ${employee.name} (${employee.position}) - ${status}`, 20, yPosition);
      yPosition += 7;
    });
  } else {
    doc.text('Нет сотрудников, требующих оздоровительных мероприятий.', 20, yPosition);
    yPosition += 7;
  }
  
  yPosition += 15;
  
  // Виды оздоровления
  doc.setFont('helvetica', 'bold');
  doc.text('РАСПРЕДЕЛЕНИЕ ПО ВИДАМ ОЗДОРОВЛЕНИЯ:', 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  
  const healthTypes = [
    '1. Стационарное обследование и лечение:',
    '2. Амбулаторное обследование и лечение:',
    '3. Санаторно-курортное лечение:',
    '4. Лечебно-профилактическое питание:',
    '5. Временный перевод на другую работу:'
  ];
  
  healthTypes.forEach(type => {
    doc.text(type, 20, yPosition);
    yPosition += 7;
    doc.text('_________________________________________________', 25, yPosition);
    yPosition += 10;
  });
  
  yPosition += 15;
  
  // Подписи
  doc.text('Врач-профпатолог: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text('Представитель работодателя: _________________________', 20, yPosition);
  yPosition += 15;
  
  doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, yPosition);
  
  return doc;
};