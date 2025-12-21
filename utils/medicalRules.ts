import { Employee } from '../types';
import { FACTOR_RULES, FactorRule } from '../factorRules';

/**
 * Парсит стаж из строки (например, "10 лет", "5 лет 3 месяца", "10")
 * Возвращает количество лет (дробное число)
 */
export const parseExperience = (experienceStr?: string): number => {
  if (!experienceStr || !experienceStr.trim()) return 0;
  
  const str = experienceStr.trim().toLowerCase();
  
  // Ищем числа в строке
  const yearMatch = str.match(/(\d+)\s*(?:лет|год|г\.?)/i);
  const monthMatch = str.match(/(\d+)\s*(?:месяц|мес\.?)/i);
  const simpleNumberMatch = str.match(/^(\d+)$/);
  
  let years = 0;
  
  if (yearMatch) {
    years = parseInt(yearMatch[1], 10);
  } else if (simpleNumberMatch) {
    // Если просто число, считаем что это годы
    years = parseInt(simpleNumberMatch[1], 10);
  }
  
  if (monthMatch) {
    const months = parseInt(monthMatch[1], 10);
    years += months / 12;
  }
  
  return years;
};

/**
 * Определяет, является ли это предварительным осмотром
 * (если lastMedDate отсутствует или очень старая)
 */
export const isPreliminaryExam = (lastMedDate?: string): boolean => {
  if (!lastMedDate) return true;
  
  try {
    const lastDate = new Date(lastMedDate);
    const now = new Date();
    const diffYears = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    // Если последний осмотр был более 2 лет назад, считаем предварительным
    return diffYears > 2;
  } catch {
    return true;
  }
};

/**
 * Парсит текст исследований и применяет условия к сотруднику
 * Возвращает персонализированный список исследований
 */
export const personalizeResearch = (researchText: string, employee: Employee): string => {
  if (!researchText || !researchText.trim()) return '';
  
  const text = researchText.trim();
  
  // Получаем стаж сотрудника
  const totalExp = parseExperience(employee.totalExperience);
  const positionExp = parseExperience(employee.positionExperience);
  const experience = positionExp > 0 ? positionExp : totalExp; // Используем стаж по должности, если есть
  
  const isPreliminary = isPreliminaryExam(employee.lastMedDate);
  
  let processedText = text;
  
  // Обрабатываем условия "при стаже более X лет"
  const moreThanPattern = /при\s+стаже\s+более\s+(\d+)\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  let match;
  while ((match = moreThanPattern.exec(text)) !== null) {
    const threshold = parseInt(match[1], 10);
    if (experience <= threshold) {
      const start = match.index;
      const end = match.index + match[0].length;
      const afterMatch = text.slice(end).match(/^[^,;.]*/);
      const phraseEnd = end + (afterMatch ? afterMatch[0].length : 0);
      processedText = processedText.replace(text.slice(start, phraseEnd), '').trim();
    } else {
      processedText = processedText.replace(match[0], '').trim();
    }
  }
  
  // Обрабатываем условия "при стаже X-Y лет"
  const rangePattern = /при\s+стаже\s+(\d+)\s*-\s*(\d+)\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  while ((match = rangePattern.exec(text)) !== null) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    if (experience < min || experience > max) {
      const start = match.index;
      const end = match.index + match[0].length;
      const afterMatch = text.slice(end).match(/^[^,;.]*/);
      const phraseEnd = end + (afterMatch ? afterMatch[0].length : 0);
      processedText = processedText.replace(text.slice(start, phraseEnd), '').trim();
    } else {
      processedText = processedText.replace(match[0], '').trim();
    }
  }

  // Обрабатываем условия предварительного/повторного осмотра
  const preliminaryPattern = /при\s+предварительном\s+осмотре\s+[^,;.]*(?:,|;|$)/gi;
  if (preliminaryPattern.test(processedText)) {
    if (!isPreliminary) {
      processedText = processedText.replace(preliminaryPattern, '').trim();
    } else {
      processedText = processedText.replace(/при\s+предварительном\s+осмотре\s*,?\s*/gi, '').trim();
    }
  }
  
  const repeatedPattern = /при\s+повторном\s+осмотре\s+[^,;.]*(?:,|;|$)/gi;
  if (repeatedPattern.test(processedText)) {
    if (isPreliminary) {
      processedText = processedText.replace(repeatedPattern, '').trim();
    } else {
      processedText = processedText.replace(/при\s+повторном\s+осмотре\s*,?\s*/gi, '').trim();
    }
  }
  
  // Удаляем фразы с неопределяемыми условиями
  processedText = processedText.replace(/если\s+имеются\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/при\s+наличии\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/через\s+\d+\s+лет?\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/\d+\s+раз\s+в\s+\d+\s+лет?\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  
  // Очищаем от лишних запятых
  processedText = processedText.replace(/[,;]\s*[,;]+/g, ', ').trim();
  processedText = processedText.replace(/^[,;]\s*/, '').trim();
  processedText = processedText.replace(/\s*[,;]\s*$/, '').trim();
  
  return processedText;
};

/**
 * Функция для определения правил по вредным факторам
 */
export const resolveFactorRules = (text: string): FactorRule[] => {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase();
  const foundRules: FactorRule[] = [];
  const foundKeys = new Set<string>();
  
  // Ищем все упоминания пунктов в тексте (п. 12, пункт 12, п12, п.12, п.33 и т.д.)
  const pointRegex = /п\.?\s*(\d+)|пункт\s*(\d+)/gi;
  let match;
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
      if (!foundKeys.has(rule.uniqueKey)) {
        foundRules.push(rule);
        foundKeys.add(rule.uniqueKey);
      }
      return;
    }
    
    // Если правил несколько, выбираем по контексту
    const ruleScores = rulesWithId.map(rule => {
      const combinedContext = (context + ' ' + normalized).toLowerCase();
      let score = 0;
      
      const ruleKeywords = rule.keywords || [];
      ruleKeywords.forEach(keyword => {
        if (combinedContext.includes(keyword.toLowerCase())) score += 3;
      });
      
      const ruleTitleWords = rule.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      ruleTitleWords.forEach(word => {
        if (combinedContext.includes(word)) score += 2;
      });
      
      if (rule.category === 'profession' && (combinedContext.includes('професси') || combinedContext.includes('зрительно'))) score += 5;
      if (rule.category === 'chemical' && (combinedContext.includes('химическ') || combinedContext.includes('соединен'))) score += 5;
      
      return { rule, score };
    });
    
    ruleScores.sort((a, b) => b.score - a.score);
    const bestMatch = ruleScores[0];
    
    if (bestMatch && !foundKeys.has(bestMatch.rule.uniqueKey)) {
      foundRules.push(bestMatch.rule);
      foundKeys.add(bestMatch.rule.uniqueKey);
    }
  });
  
  if (foundRules.length > 0) return foundRules;
  
  // Если не нашли по пунктам, ищем по ключевым словам
  const matchingRules = FACTOR_RULES.map(rule => {
    const matchingKeywords = rule.keywords.filter(kw => kw && normalized.includes(kw.toLowerCase()));
    return { rule, matchCount: matchingKeywords.length };
  }).filter(item => item.matchCount > 0);
  
  if (matchingRules.length === 0) return [];
  
  const maxMatch = Math.max(...matchingRules.map(m => m.matchCount));
  return matchingRules
    .filter(m => m.matchCount === maxMatch)
    .map(m => m.rule)
    .sort((a, b) => a.id - b.id)
    .slice(0, 1);
};

