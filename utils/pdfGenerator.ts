import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Contract, Employee, Doctor } from '../types';

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
    doc.text('Председатель комиссии:', 25, yPosition);
    yPosition += 7;
    doc.text('Врач-профпатолог: _________________________', 30, yPosition);
    yPosition += 10;
    
    doc.text('Члены комиссии:', 25, yPosition);
    yPosition += 7;
    doc.text('Терапевт: _________________________', 30, yPosition);
    yPosition += 7;
    doc.text('(Другие специалисты согласно вредным факторам)', 30, yPosition);
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