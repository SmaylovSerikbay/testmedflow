import { Employee, Doctor, DoctorRouteSheet } from '../types';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import { rtdb, ref, set, get, update } from '../services/firebase';

/**
 * Определение правил по вредным факторам (копия из других компонентов)
 */
const resolveFactorRules = (text: string): FactorRule[] => {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase();
  const foundRules: FactorRule[] = [];
  const foundKeys = new Set<string>();
  
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
    if (rulesWithId.length === 1) {
      const rule = rulesWithId[0];
      const key = rule.uniqueKey;
      if (!foundKeys.has(key)) {
        foundRules.push(rule);
        foundKeys.add(key);
      }
    } else if (rulesWithId.length > 1) {
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

/**
 * Создание маршрутных листов для всех врачей клиники
 */
export const createRouteSheetsForAllDoctors = async (
  contractId: string,
  employees: Employee[],
  doctors: Doctor[]
): Promise<void> => {
  console.log('Creating route sheets for all doctors:', {
    contractId,
    employeesCount: employees.length,
    doctorsCount: doctors.length
  });

  // Создаем маршрутные листы для каждого врача
  const routeSheetPromises = doctors.map(async (doctor) => {
    console.log(`\n=== Создание маршрутного листа для врача ${doctor.name} (${doctor.specialty}) ===`);
    
    let relevantEmployees: Employee[];
    
    // Профпатолог (председатель комиссии) должен осматривать всех сотрудников
    if (doctor.specialty === 'Профпатолог') {
      relevantEmployees = employees;
      console.log(`Профпатолог ${doctor.name}: осматривает всех сотрудников (${relevantEmployees.length})`);
      console.log('Список всех сотрудников:', employees.map(e => `${e.name} (${e.position})`));
    } else {
      // Для других врачей - только тех, у кого есть соответствующие вредные факторы
      console.log(`Анализ сотрудников для врача ${doctor.specialty}:`);
      
      relevantEmployees = employees.filter(emp => {
        const rules = resolveFactorRules(emp.harmfulFactor || '');
        const shouldExamine = rules.some(rule => rule.specialties.includes(doctor.specialty));
        
        console.log(`  Сотрудник ${emp.name}:`, {
          harmfulFactor: emp.harmfulFactor,
          foundRules: rules.length,
          specialties: rules.flatMap(r => r.specialties),
          shouldExamine: shouldExamine,
          doctorSpecialty: doctor.specialty
        });
        
        return shouldExamine;
      });
      
      console.log(`Врач ${doctor.specialty} ${doctor.name}: осматривает ${relevantEmployees.length} сотрудников`);
      if (relevantEmployees.length > 0) {
        console.log('Назначенные сотрудники:', relevantEmployees.map(e => `${e.name} (${e.position})`));
      }
    }

    // Создаем маршрутный лист только если есть пациенты для этого врача
    if (relevantEmployees.length > 0) {
      const routeSheet: DoctorRouteSheet = {
        doctorId: doctor.id,
        contractId,
        employees: relevantEmployees.map(emp => ({
          employeeId: emp.id,
          name: emp.name,
          position: emp.position,
          harmfulFactor: emp.harmfulFactor,
          status: 'pending',
        })),
        createdAt: new Date().toISOString(),
      };

      const routeSheetKey = `${doctor.id}_${contractId}`;
      console.log(`Сохранение маршрутного листа: ${routeSheetKey}`);
      console.log('Данные маршрутного листа:', {
        doctorId: doctor.id,
        contractId,
        employeesCount: routeSheet.employees.length,
        employees: routeSheet.employees.map(e => ({ id: e.employeeId, name: e.name, position: e.position }))
      });

      await set(ref(rtdb, `routeSheets/${routeSheetKey}`), routeSheet);
      console.log(`✅ Route sheet created for ${doctor.specialty} ${doctor.name} with ${routeSheet.employees.length} employees`);
    } else {
      console.log(`❌ No patients for ${doctor.specialty} ${doctor.name}, skipping route sheet`);
    }
  });

  await Promise.all(routeSheetPromises);
  console.log('All route sheets created successfully');
};

/**
 * Создание маршрутных листов для всех необходимых специализаций (включая отсутствующих врачей)
 */
export const createRouteSheetsForAllSpecialties = async (
  contractId: string,
  employees: Employee[],
  doctors: Doctor[]
): Promise<void> => {
  console.log('Creating route sheets for all required specialties:', {
    contractId,
    employeesCount: employees.length,
    doctorsCount: doctors.length
  });

  // Собираем все необходимые специализации из вредных факторов сотрудников
  const requiredSpecialties = new Set<string>();
  
  // Профпатолог всегда нужен
  requiredSpecialties.add('Профпатолог');
  
  employees.forEach(employee => {
    if (employee.harmfulFactor) {
      const rules = resolveFactorRules(employee.harmfulFactor);
      rules.forEach(rule => {
        rule.specialties.forEach(specialty => {
          requiredSpecialties.add(specialty);
        });
      });
    }
  });

  console.log('Required specialties:', Array.from(requiredSpecialties));

  // Создаем маршрутные листы для каждой необходимой специализации
  const routeSheetPromises = Array.from(requiredSpecialties).map(async (specialty) => {
    console.log(`\n=== Создание маршрутного листа для специализации ${specialty} ===`);
    
    // Ищем врача этой специализации
    const doctor = doctors.find(d => d.specialty === specialty);
    
    let relevantEmployees: Employee[];
    
    // Профпатолог осматривает всех
    if (specialty === 'Профпатолог') {
      relevantEmployees = employees;
      console.log(`Профпатолог: осматривает всех сотрудников (${relevantEmployees.length})`);
    } else {
      // Для других специализаций - только тех, у кого есть соответствующие вредные факторы
      relevantEmployees = employees.filter(emp => {
        const rules = resolveFactorRules(emp.harmfulFactor || '');
        const shouldExamine = rules.some(rule => rule.specialties.includes(specialty));
        return shouldExamine;
      });
      
      console.log(`Специализация ${specialty}: осматривает ${relevantEmployees.length} сотрудников`);
    }

    if (relevantEmployees.length > 0) {
      // Используем ID врача, если есть, или создаем виртуальный ID для специализации
      const doctorId = doctor?.id || `virtual_${specialty.toLowerCase().replace(/\s+/g, '_')}_${contractId}`;
      
      const routeSheet: DoctorRouteSheet = {
        doctorId: doctorId,
        contractId,
        specialty: specialty, // Добавляем специализацию для виртуальных врачей
        virtualDoctor: !doctor, // Флаг виртуального врача
        employees: relevantEmployees.map(emp => ({
          employeeId: emp.id,
          name: emp.name,
          position: emp.position,
          harmfulFactor: emp.harmfulFactor,
          status: 'pending',
        })),
        createdAt: new Date().toISOString(),
      };

      const routeSheetKey = `${doctorId}_${contractId}`;
      console.log(`Сохранение маршрутного листа: ${routeSheetKey}`);
      console.log('Данные маршрутного листа:', {
        doctorId: doctorId,
        specialty: specialty,
        virtualDoctor: !doctor,
        doctorName: doctor?.name || 'Не назначен',
        contractId,
        employeesCount: routeSheet.employees.length
      });

      await set(ref(rtdb, `routeSheets/${routeSheetKey}`), routeSheet);
      
      if (doctor) {
        console.log(`✅ Route sheet created for ${specialty} ${doctor.name} with ${routeSheet.employees.length} employees`);
      } else {
        console.log(`✅ Virtual route sheet created for ${specialty} (врач не назначен) with ${routeSheet.employees.length} employees`);
      }
    } else {
      console.log(`❌ No patients for ${specialty}, skipping route sheet`);
    }
  });

  await Promise.all(routeSheetPromises);
  console.log('All route sheets created successfully');
};

/**
 * Получение списка специализаций, необходимых для сотрудника
 */
export const getRequiredSpecialtiesForEmployee = (employee: Employee): string[] => {
  if (!employee.harmfulFactor) return [];
  
  const rules = resolveFactorRules(employee.harmfulFactor);
  const specialties = new Set<string>();
  
  rules.forEach(rule => {
    rule.specialties.forEach(spec => specialties.add(spec));
  });
  
  return Array.from(specialties);
};

/**
 * Получение списка лабораторных исследований для сотрудника
 */
export const getRequiredResearchForEmployee = (employee: Employee): string => {
  if (!employee.harmfulFactor) return '';
  
  const rules = resolveFactorRules(employee.harmfulFactor);
  const researchList: string[] = [];
  
  rules.forEach(rule => {
    if (rule.research && rule.research.trim()) {
      // Здесь можно добавить персонализацию исследований
      // на основе стажа, возраста и других факторов
      researchList.push(rule.research);
    }
  });
  
  return researchList.join('; ');
};

/**
 * Обновление маршрутных листов при добавлении нового врача
 */
export const updateRouteSheetsForNewDoctor = async (
  doctor: Doctor,
  clinicUid: string
): Promise<void> => {
  console.log(`Updating route sheets for new doctor: ${doctor.name} (${doctor.specialty})`);
  
  try {
    // Ищем все маршрутные листы, которые ожидают врача этой специализации
    const routeSheetsRef = ref(rtdb, 'routeSheets');
    const routeSheetsSnapshot = await get(routeSheetsRef);
    
    if (!routeSheetsSnapshot.exists()) {
      console.log('No route sheets found');
      return;
    }
    
    const routeSheets = routeSheetsSnapshot.val();
    const updates: Record<string, any> = {};
    
    // Ищем виртуальные маршрутные листы для этой специализации
    Object.entries(routeSheets).forEach(([key, sheet]: [string, any]) => {
      const routeSheet = sheet as DoctorRouteSheet;
      
      // Проверяем, что это виртуальный врач нужной специализации
      if (routeSheet.virtualDoctor && routeSheet.specialty === doctor.specialty) {
        console.log(`Found virtual route sheet for ${doctor.specialty}: ${key}`);
        
        // Создаем новый ключ с реальным ID врача
        const newKey = `${doctor.id}_${routeSheet.contractId}`;
        
        // Обновляем данные маршрутного листа
        const updatedRouteSheet: DoctorRouteSheet = {
          ...routeSheet,
          doctorId: doctor.id,
          virtualDoctor: false // Теперь это реальный врач
        };
        
        // Добавляем в обновления
        updates[`routeSheets/${newKey}`] = updatedRouteSheet;
        updates[`routeSheets/${key}`] = null; // Удаляем старый виртуальный лист
        
        console.log(`Will update route sheet: ${key} -> ${newKey}`);
      }
    });
    
    // Применяем все обновления одновременно
    if (Object.keys(updates).length > 0) {
      await update(ref(rtdb), updates);
      console.log(`✅ Updated ${Object.keys(updates).length / 2} route sheets for doctor ${doctor.name}`);
    } else {
      console.log(`No virtual route sheets found for specialty ${doctor.specialty}`);
    }
    
  } catch (error) {
    console.error('Error updating route sheets for new doctor:', error);
  }
};

/**
 * Получение всех необходимых специализаций для договора
 */
export const getRequiredSpecialtiesForContract = (employees: Employee[]): string[] => {
  const requiredSpecialties = new Set<string>();
  
  // Профпатолог всегда нужен
  requiredSpecialties.add('Профпатолог');
  
  employees.forEach(employee => {
    if (employee.harmfulFactor) {
      const rules = resolveFactorRules(employee.harmfulFactor);
      rules.forEach(rule => {
        rule.specialties.forEach(specialty => {
          requiredSpecialties.add(specialty);
        });
      });
    }
  });
  
  return Array.from(requiredSpecialties).sort();
};