import jsPDF from 'jspdf';
import { Contract, Employee, Doctor } from '../types';
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

// Автоматическое определение необходимых специалистов на основе вредных факторов
const getRequiredSpecialtiesFromContract = (contract: Contract): string[] => {
  if (!contract.employees || contract.employees.length === 0) return [];
  
  const allSpecialties = new Set<string>();
  
  // Обязательный состав комиссии согласно п. 14 приказа № ҚР ДСМ-131/2020
  const mandatorySpecialists = [
    'Профпатолог', // Председатель
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
  
  mandatorySpecialists.forEach(s => allSpecialties.add(s));
  
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
    doc.text('НЕОБХОДИМЫЕ СПЕЦИАЛИСТЫ (по вредным факторам):', 20, yPosition);
    yPosition += 10;
    
    doc.setFont('helvetica', 'normal');
    requiredSpecialties.forEach(specialty => {
      doc.text(`• ${specialty}`, 20, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
  }
  
  // Необходимые лабораторные исследования
  if (requiredResearch.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('НЕОБХОДИМЫЕ ИССЛЕДОВАНИЯ (по вредным факторам):', 20, yPosition);
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
    // Если врачи не переданы, используем автоматически определенные специализации
    doc.text('Председатель комиссии:', 25, yPosition);
    yPosition += 7;
    doc.text('Врач-профпатолог: _________________________', 30, yPosition);
    yPosition += 10;
    
    doc.text('Члены комиссии:', 25, yPosition);
    yPosition += 7;
    
    // Показываем все необходимые специализации кроме профпатолога
    const otherSpecialties = requiredSpecialties.filter(s => s !== 'Профпатолог');
    if (otherSpecialties.length > 0) {
      otherSpecialties.forEach(specialty => {
        doc.text(`${specialty}: _________________________`, 30, yPosition);
        yPosition += 7;
      });
    } else {
      doc.text('Терапевт: _________________________', 30, yPosition);
      yPosition += 7;
    }
  }
  
  // Добавляем информацию о необходимых специалистах
  if (requiredSpecialties.length > 0) {
    yPosition += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Необходимые специалисты согласно вредным факторам:', 25, yPosition);
    yPosition += 7;
    
    doc.setFont('helvetica', 'normal');
    requiredSpecialties.forEach(specialty => {
      doc.text(`• ${specialty}`, 30, yPosition);
      yPosition += 6;
    });
  }
  
  yPosition += 15;
  
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
export const generateFinalActPDF = (contract: Contract, employees: Employee[]) => {
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
  const fit = employees.filter(e => e.status === 'fit').length;
  const unfit = employees.filter(e => e.status === 'unfit').length;
  const observation = employees.filter(e => e.status === 'needs_observation').length;
  const pending = employees.filter(e => e.status === 'pending').length;
  
  doc.text(`4. Всего работников, подлежащих осмотру: ${total}`, 20, yPosition);
  yPosition += 8;
  doc.text(`5. Всего осмотрено: ${total - pending} (% охвата: ${total > 0 ? Math.round(((total - pending) / total) * 100) : 0}%)`, 20, yPosition);
  yPosition += 10;
  
  doc.text(`   - Признаны годными к работе: ${fit}`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Выявлено лиц с подозрением на профзаболевание: 0`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Нуждаются в дообследовании: ${observation}`, 25, yPosition);
  yPosition += 7;
  doc.text(`   - Имеют противопоказания к работе: ${unfit}`, 25, yPosition);
  yPosition += 15;
  
  // Приложение: Поименный список (п. 15)
  const listForTransfer = employees.filter(e => e.status === 'unfit' || e.status === 'needs_observation');
  if (listForTransfer.length > 0) {
    doc.addPage();
    yPosition = 20;
    doc.setFont('helvetica', 'bold');
    doc.text('ПРИЛОЖЕНИЕ К ЗАКЛЮЧИТЕЛЬНОМУ АКТУ', 105, yPosition, { align: 'center' });
    yPosition += 10;
    doc.text('Поименный список лиц, нуждающихся в переводе, лечении или наблюдении', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Заголовки таблицы
    doc.text('№', 20, yPosition);
    doc.text('Ф.И.О.', 30, yPosition);
    doc.text('Должность', 80, yPosition);
    doc.text('Рекомендация', 130, yPosition);
    yPosition += 5;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 7;
    
    listForTransfer.forEach((e, i) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text((i + 1).toString(), 20, yPosition);
      doc.text(e.name.substring(0, 25), 30, yPosition);
      doc.text(e.position.substring(0, 25), 80, yPosition);
      const rec = e.status === 'unfit' ? 'Перевод / Лечение' : 'Динам. наблюдение';
      doc.text(rec, 130, yPosition);
      yPosition += 7;
    });
  }

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

// Генерация списка контингента (Приложение 3)
export function generateContingentPDF(contract: Contract, employees: Employee[]) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Альбомная ориентация
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  // Заголовок
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ПРИЛОЖЕНИЕ №3 К ДОГОВОРУ № ' + (contract.number || ''), 280, yPosition, { align: 'right' });
  yPosition += 10;
  
  doc.setFontSize(16);
  doc.text('СПИСОК КОНТИНЕНТА РАБОТНИКОВ, ПОДЛЕЖАЩИХ ПЕРИОДИЧЕСКОМУ МЕДИЦИНСКОМУ ОСМОТРУ', 148, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.text(`Организация: ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  
  doc.text(`Медицинская организация: ${contract.clinicName}`, 20, yPosition);
  yPosition += 15;
  
  // Таблица
  doc.setFontSize(8);
  const headers = ['№', 'ФИО', 'Дата рожд.', 'Пол', 'Участок', 'Должность', 'Общий стаж', 'Стаж в доп.', 'Дата МО', 'Вредные факторы'];
  const columnWidths = [10, 50, 25, 10, 40, 40, 20, 20, 25, 47];
  
  let xPos = 20;
  headers.forEach((header, i) => {
    doc.rect(xPos, yPosition, columnWidths[i], 10);
    doc.text(header, xPos + 2, yPosition + 6);
    xPos += columnWidths[i];
  });
  
  yPosition += 10;
  
  employees.forEach((e, index) => {
    if (yPosition > 180) {
      doc.addPage('l');
      yPosition = 20;
      xPos = 20;
      headers.forEach((header, i) => {
        doc.rect(xPos, yPosition, columnWidths[i], 10);
        doc.text(header, xPos + 2, yPosition + 6);
        xPos += columnWidths[i];
      });
      yPosition += 10;
    }
    
    xPos = 20;
    const rowData = [
      (index + 1).toString(),
      e.name.substring(0, 30),
      e.dob || '-',
      e.gender || '-',
      (e.site || '-').substring(0, 25),
      (e.position || '-').substring(0, 25),
      e.totalExperience || '-',
      e.positionExperience || '-',
      e.lastMedDate || '-',
      (e.harmfulFactor || '-').substring(0, 30)
    ];
    
    rowData.forEach((data, i) => {
      doc.rect(xPos, yPosition, columnWidths[i], 8);
      doc.text(data, xPos + 2, yPosition + 5);
      xPos += columnWidths[i];
    });
    
    yPosition += 8;
  });
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.text('Согласовано: _________________________', 20, yPosition);
  doc.text('Утверждено: _________________________', 160, yPosition);
  yPosition += 10;
  doc.text('Дата: ' + new Date().toLocaleDateString('ru-RU'), 20, yPosition);
  
  return doc;
};

// Генерация сводного отчета (Приложение 2)
export function generateSummaryReportPDF(contract: Contract, employees: Employee[]) {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('СВОДНЫЙ ОТЧЕТ', 105, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.text(`по результатам медицинского осмотра работников ${contract.clientName}`, 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFont('helvetica', 'normal');
  const total = employees.length;
  const group1 = employees.filter(e => e.status === 'fit').length;
  const group2 = employees.filter(e => e.status === 'practically_fit').length;
  const group3 = employees.filter(e => e.status === 'early_illness').length;
  const group4 = employees.filter(e => e.status === 'expressed_illness').length;
  const group5 = employees.filter(e => e.status === 'factor_effect').length;
  const group6 = employees.filter(e => e.status === 'prof_disease').length;
  const unfit = employees.filter(e => e.status === 'unfit').length;
  
  doc.text(`1. Всего подлежало осмотру: ${total} чел.`, 20, yPosition);
  yPosition += 8;
  doc.text(`2. Всего осмотрено: ${total} чел.`, 20, yPosition);
  yPosition += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Распределение по группам здоровья:', 20, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`- Группа 1 (Здоровые): ${group1} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Группа 2 (Практически здоровые): ${group2} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Группа 3 (Начальные формы общих заболеваний): ${group3} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Группа 4 (Выраженные формы общих заболеваний): ${group4} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Группа 5 (Признаки воздействия вредных факторов): ${group5} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Группа 6 (Признаки профессиональных заболеваний): ${group6} чел.`, 30, yPosition);
  yPosition += 7;
  doc.text(`- Не годен к работе: ${unfit} чел.`, 30, yPosition);
  yPosition += 15;
  
  doc.text('Председатель комиссии: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text('Дата: ' + new Date().toLocaleDateString('ru-RU'), 20, yPosition);
  
  return doc;
};

// Генерация экстренного извещения
export const generateEmergencyNotificationPDF = (contract: Contract, employee: Employee, diagnosis: string) => {
  const doc = new jsPDF();
  setupPDFFont(doc);
  
  let yPosition = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ЭКСТРЕННОЕ ИЗВЕЩЕНИЕ', 105, yPosition, { align: 'center' });
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Об обнаружении профессионального заболевания (подозрения)`, 20, yPosition);
  yPosition += 15;
  
  doc.text(`1. ФИО: ${employee.name}`, 20, yPosition);
  yPosition += 8;
  doc.text(`2. Организация: ${contract.clientName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`3. Должность: ${employee.position}`, 20, yPosition);
  yPosition += 8;
  doc.text(`4. Вредный фактор: ${employee.harmfulFactor}`, 20, yPosition);
  yPosition += 15;
  
  doc.text(`Предварительный диагноз: ${diagnosis}`, 20, yPosition);
  yPosition += 10;
  doc.text('Дата обнаружения: ' + new Date().toLocaleDateString('ru-RU'), 20, yPosition);
  yPosition += 15;
  
  doc.text('Врач: _________________________', 20, yPosition);
  yPosition += 10;
  doc.text('М.П.', 20, yPosition);
  
  return doc;
};