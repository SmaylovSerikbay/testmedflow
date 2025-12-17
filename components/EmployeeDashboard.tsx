import React, { useState, useEffect } from 'react';
import { UserProfile, Contract, AmbulatoryCard, Doctor, DoctorRouteSheet, Employee, DoctorExamination } from '../types';
import { rtdb, ref, get, onValue, set } from '../services/firebase';
import { LoaderIcon, UserMdIcon, FileTextIcon, CheckShieldIcon, CalendarIcon, ClockIcon, LogoutIcon } from './Icons';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import AmbulatoryCardView from './AmbulatoryCardView';

// --- RESEARCH PARSING UTILITIES ---
/**
 * Парсит стаж из строки (например, "10 лет", "5 лет 3 месяца", "10")
 * Возвращает количество лет (дробное число)
 */
const parseExperience = (experienceStr?: string): number => {
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
const isPreliminaryExam = (lastMedDate?: string): boolean => {
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
const personalizeResearch = (researchText: string, employee: Employee): string => {
  if (!researchText || !researchText.trim()) return '';
  
  const text = researchText.trim();
  
  // Получаем стаж сотрудника
  const totalExp = parseExperience(employee.totalExperience);
  const positionExp = parseExperience(employee.positionExperience);
  const experience = positionExp > 0 ? positionExp : totalExp; // Используем стаж по должности, если есть
  
  const isPreliminary = isPreliminaryExam(employee.lastMedDate);
  
  // Сначала обрабатываем сложные случаи с встроенными условиями
  // Разбиваем текст на части, сохраняя структуру
  
  // Шаг 1: Разбиваем на основные части по запятым и точкам с запятой
  // Но учитываем, что условия могут быть встроены в текст
  let processedText = text;
  
  // Обрабатываем условия "при стаже более X лет" - удаляем их, если условие не выполняется
  const moreThanPattern = /при\s+стаже\s+более\s+(\d+)\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  let match;
  while ((match = moreThanPattern.exec(text)) !== null) {
    const threshold = parseInt(match[1], 10);
    if (experience <= threshold) {
      // Условие не выполняется - удаляем эту часть текста
      // Находим границы фразы с условием
      const start = match.index;
      const end = match.index + match[0].length;
      
      // Ищем следующую запятую, точку или конец строки
      const afterMatch = text.slice(end).match(/^[^,;.]*/);
      const phraseEnd = end + (afterMatch ? afterMatch[0].length : 0);
      
      // Удаляем всю фразу с условием
      processedText = processedText.replace(text.slice(start, phraseEnd), '').trim();
    } else {
      // Условие выполняется - удаляем только условие, оставляем исследование
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
  
  // Обрабатываем "при стаже более X-ти лет"
  const moreThanTypPattern = /при\s+стаже\s+более\s+(\d+)\s*-?\s*ти\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  while ((match = moreThanTypPattern.exec(text)) !== null) {
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
  
  // Обрабатываем "со стажем до X лет"
  const untilPattern = /со\s+стажем\s+до\s+(\d+)\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  while ((match = untilPattern.exec(text)) !== null) {
    const threshold = parseInt(match[1], 10);
    if (experience >= threshold) {
      const start = match.index;
      const end = match.index + match[0].length;
      const afterMatch = text.slice(end).match(/^[^,;.]*/);
      const phraseEnd = end + (afterMatch ? afterMatch[0].length : 0);
      processedText = processedText.replace(text.slice(start, phraseEnd), '').trim();
    } else {
      processedText = processedText.replace(match[0], '').trim();
    }
  }
  
  // Обрабатываем "для подземных работников со стажем до X лет"
  const undergroundPattern = /для\s+подземных\s+работников\s+со\s+стажем\s+до\s+(\d+)\s*(?:лет|год|г\.?)\s*,?\s*/gi;
  while ((match = undergroundPattern.exec(text)) !== null) {
    const threshold = parseInt(match[1], 10);
    // Пока не можем определить, подземный ли работник, поэтому пропускаем такие условия
    // Можно добавить проверку по должности или участку в будущем
    processedText = processedText.replace(match[0], '').trim();
  }
  
  // Обрабатываем условия предварительного/повторного осмотра
  // Ищем фразы, которые начинаются с "при предварительном осмотре" и удаляем их, если это не предварительный осмотр
  const preliminaryPattern = /при\s+предварительном\s+осмотре\s+[^,;.]*(?:,|;|$)/gi;
  if (preliminaryPattern.test(processedText)) {
    if (!isPreliminary) {
      // Удаляем всю фразу с предварительным осмотром до следующей запятой или конца
      processedText = processedText.replace(preliminaryPattern, '').trim();
    } else {
      // Удаляем только условие, оставляем исследование
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
  
  // Удаляем фразы с неопределяемыми условиями (до следующей запятой или конца)
  processedText = processedText.replace(/если\s+имеются\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/при\s+наличии\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  
  // Удаляем фразы с временными условиями, которые мы не можем проверить
  processedText = processedText.replace(/через\s+\d+\s+лет?\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/\d+\s+раз\s+в\s+\d+\s+лет?\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  processedText = processedText.replace(/для\s+подземных\s+работников\s+[^,;.]*(?:,|;|$)/gi, '').trim();
  
  // Очищаем от лишних запятых и точек с запятой
  processedText = processedText.replace(/[,;]\s*[,;]+/g, ', ').trim();
  processedText = processedText.replace(/^[,;]\s*/, '').trim();
  processedText = processedText.replace(/\s*[,;]\s*$/, '').trim();
  
  // Если после обработки остался пустой текст, возвращаем пустую строку
  if (!processedText || processedText.trim().length === 0) {
    return '';
  }
  
  return processedText;
};

// Автоопределение нужных врачей по вредным факторам на основе FACTOR_RULES
const resolveFactorRules = (text: string): FactorRule[] => {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase();
  const foundRules: FactorRule[] = [];
  const foundKeys = new Set<string>();
  
  // Ищем все упоминания пунктов в тексте (п. 12, пункт 12, п12, п.12 и т.д.)
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
      const key = rule.uniqueKey;
      if (!foundKeys.has(key)) {
        foundRules.push(rule);
        foundKeys.add(key);
      }
      return;
    }
    
    let selectedRule = rulesWithId[0];
    
    if (context.includes('професси') || context.includes('работ')) {
      const professionRule = rulesWithId.find(r => r.category === 'profession');
      if (professionRule) selectedRule = professionRule;
    } else if (context.includes('химическ') || context.includes('соединен')) {
      const chemicalRule = rulesWithId.find(r => r.category === 'chemical');
      if (chemicalRule) selectedRule = chemicalRule;
    } else {
      const professionRule = rulesWithId.find(r => r.category === 'profession');
      if (professionRule) selectedRule = professionRule;
    }
    
    const key = selectedRule.uniqueKey;
    if (!foundKeys.has(key)) {
      foundRules.push(selectedRule);
      foundKeys.add(key);
    }
  });
  
  if (foundRules.length > 0) return foundRules;
  
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

interface EmployeeDashboardProps {
  currentUser: UserProfile;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentUser }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [routeSheets, setRouteSheets] = useState<DoctorRouteSheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.contractId || !currentUser.employeeId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Загружаем договор
        const contractRef = ref(rtdb, `contracts/${currentUser.contractId}`);
        const contractSnapshot = await get(contractRef);
        if (contractSnapshot.exists()) {
          const contractData = { id: currentUser.contractId, ...contractSnapshot.val() } as Contract;
          setContract(contractData);

          // Находим данные сотрудника
          const emp = contractData.employees?.find(e => e.id === currentUser.employeeId);
          if (emp) {
            setEmployee(emp);
            
            // Загружаем амбулаторную карту и выполняем миграцию если нужно
            const cardRef = ref(rtdb, `ambulatoryCards/${currentUser.employeeId}_${currentUser.contractId}`);
            const cardSnapshot = await get(cardRef);
            if (cardSnapshot.exists()) {
              let cardData = { ...cardSnapshot.val() } as AmbulatoryCard;
              
              // Миграция: если нет personalInfo, создаем его из данных сотрудника
              if (!cardData.personalInfo) {
                cardData.personalInfo = {
                  fullName: emp.name,
                  dateOfBirth: emp.dob || '',
                  gender: emp.gender,
                  phone: emp.phone,
                  workplace: contractData.clientName,
                  position: emp.position,
                  harmfulFactors: emp.harmfulFactor || '',
                };
                
                // Сохраняем обновленную карту
                await set(cardRef, cardData);
              }
              
              setAmbulatoryCard(cardData);
            }
            
            // Подписываемся на обновления амбулаторной карты
            const unsubscribe = onValue(cardRef, (snapshot) => {
              if (snapshot.exists()) {
                setAmbulatoryCard({ ...snapshot.val() } as AmbulatoryCard);
              }
            });
          }

          // Загружаем врачей клиники
          // Ищем клинику по BIN в users, чтобы получить её uid
          if (contractData.clinicBin) {
            try {
              const usersRef = ref(rtdb, 'users');
              const usersSnapshot = await get(usersRef);
              if (usersSnapshot.exists()) {
                const users = usersSnapshot.val();
                const clinicUser = Object.values(users).find((u: any) => 
                  u.role === 'clinic' && u.bin === contractData.clinicBin
                ) as any;
              
                if (clinicUser && clinicUser.uid) {
                  const clinicRef = ref(rtdb, `clinics/${clinicUser.uid}/doctors`);
                  const doctorsSnapshot = await get(clinicRef);
                  if (doctorsSnapshot.exists()) {
                    const doctorsData = doctorsSnapshot.val();
                    const doctorsList = Object.entries(doctorsData).map(([id, doctor]: [string, any]) => ({
                      id,
                      ...doctor
                    })) as Doctor[];
                    setDoctors(doctorsList);
                  }
                }
              }
            } catch (error) {
              console.error('Error loading doctors:', error);
            }
          }
        }

        // Загружаем маршрутные листы для этого договора
        try {
          const routeSheetsRef = ref(rtdb, 'routeSheets');
          const routeSheetsSnapshot = await get(routeSheetsRef);
          if (routeSheetsSnapshot.exists()) {
            const allRouteSheets = routeSheetsSnapshot.val();
            // Фильтруем маршрутные листы для этого договора, которые содержат этого сотрудника
            const relevantSheets: DoctorRouteSheet[] = [];
            Object.entries(allRouteSheets).forEach(([key, sheet]: [string, any]) => {
              const routeSheet = { ...sheet } as DoctorRouteSheet;
              // Проверяем, что это маршрутный лист для нашего договора
              if (routeSheet.contractId === currentUser.contractId) {
                // Проверяем, есть ли этот сотрудник в маршрутном листе
                const hasEmployee = routeSheet.employees?.some(
                  (emp: any) => emp.employeeId === currentUser.employeeId
                );
                if (hasEmployee) {
                  relevantSheets.push(routeSheet);
                }
              }
            });
            setRouteSheets(relevantSheets);
          }
        } catch (error) {
          console.error('Error loading route sheets:', error);
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser.contractId, currentUser.employeeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!contract || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Данные не найдены</p>
        </div>
      </div>
    );
  }

  const getDoctorName = (specialty: string) => {
    const doctor = doctors.find(d => d.specialty === specialty);
    return doctor ? doctor.name : specialty;
  };

  // Получаем список врачей/специализаций для этого сотрудника
  const getEmployeeRouteInfo = () => {
    if (!employee) return null;

    // Сначала пытаемся получить информацию из маршрутных листов
    const employeeInSheets: Array<{
      doctorId: string;
      specialty: string;
      doctorName?: string;
      examinationDate?: string;
      status: string;
      virtualDoctor?: boolean;
    }> = [];

    console.log('Анализ маршрутных листов для сотрудника:', currentUser.employeeId);
    console.log('Найдено маршрутных листов:', routeSheets.length);
    
    routeSheets.forEach((sheet, index) => {
      console.log(`Маршрутный лист ${index + 1}:`, {
        doctorId: sheet.doctorId,
        contractId: sheet.contractId,
        employeesCount: sheet.employees?.length || 0,
        employees: sheet.employees?.map(e => ({ id: e.employeeId, name: e.name })) || []
      });
      
      const empInSheet = sheet.employees?.find(
        (emp: any) => emp.employeeId === currentUser.employeeId
      );
      
      console.log(`Сотрудник ${currentUser.employeeId} найден в листе ${index + 1}:`, !!empInSheet);
      
      if (empInSheet) {
        // Находим врача по doctorId или используем данные из маршрутного листа
        const doctor = doctors.find(d => d.id === sheet.doctorId);
        const specialty = doctor?.specialty || sheet.specialty || 'Не указано';
        const doctorName = doctor?.name || (sheet.virtualDoctor ? undefined : 'Не найден');
        
        console.log(`Врач для листа ${index + 1}:`, {
          doctorId: sheet.doctorId,
          specialty: specialty,
          doctorName: doctorName || 'Не назначен',
          virtualDoctor: sheet.virtualDoctor || false
        });
        
        employeeInSheets.push({
          doctorId: sheet.doctorId,
          specialty: specialty,
          doctorName: doctorName,
          examinationDate: empInSheet.examinationDate,
          status: empInSheet.status || 'pending',
          virtualDoctor: sheet.virtualDoctor || false
        });
      }
    });

    console.log('Врачи из маршрутных листов:', employeeInSheets);

    // Если есть врачи в маршрутных листах, возвращаем их
    if (employeeInSheets.length > 0) {
      console.log('Используем врачей из маршрутных листов');
      return employeeInSheets;
    }

    // Если врачи еще не назначены, определяем специализации по вредным факторам
    // и находим соответствующих врачей в клинике
    console.log('Маршрутные листы пусты, используем fallback логику по вредным факторам');
    
    if (employee.harmfulFactor) {
      const rules = resolveFactorRules(employee.harmfulFactor);
      const requiredSpecialties = new Set<string>();
      rules.forEach(rule => {
        rule.specialties.forEach(spec => requiredSpecialties.add(spec));
      });
      
      // Отладочная информация
      console.log(`Fallback для сотрудника ${employee.name}:`, {
        harmfulFactor: employee.harmfulFactor,
        foundRules: rules.length,
        allSpecialties: rules.flatMap(r => r.specialties),
        uniqueSpecialties: Array.from(requiredSpecialties),
        availableDoctors: doctors.map(d => `${d.name} (${d.specialty})`)
      });
      
      // Находим врачей в клинике для каждой требуемой специализации
      const routeInfo: Array<{
        doctorId: string;
        specialty: string;
        doctorName?: string;
        examinationDate?: string;
        status: string;
      }> = [];
      
      requiredSpecialties.forEach(specialty => {
        // Ищем врача этой специализации в клинике
        const doctor = doctors.find(d => d.specialty === specialty);
        
        routeInfo.push({
          doctorId: doctor?.id || '',
          specialty: specialty,
          doctorName: doctor?.name,
          examinationDate: undefined,
          status: 'pending'
        });
      });
      
      console.log(`Fallback маршрут для ${employee.name}:`, routeInfo);
      return routeInfo;
    }

    return null;
  };

  // Получаем лабораторные и функциональные исследования для сотрудника
  const getEmployeeResearch = (): string => {
    if (!employee || !employee.harmfulFactor) return '';
    
    const rules = resolveFactorRules(employee.harmfulFactor);
    const personalizedResearchList: string[] = [];
    
    for (const rule of rules) {
      if (rule.research && rule.research.trim()) {
        const personalized = personalizeResearch(rule.research, employee);
        if (personalized.trim().length > 0) {
          personalizedResearchList.push(personalized);
        }
      }
    }
    
    // Объединяем персонализированные исследования, убираем дубликаты
    const uniqueResearch = Array.from(new Set(personalizedResearchList));
    return uniqueResearch.join('; ') || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fit':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Годен</span>;
      case 'unfit':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Не годен</span>;
      case 'needs_observation':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Наблюдение</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Ожидание</span>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medflow_uid');
    localStorage.removeItem('medflow_phone');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Моя амбулаторная карта</h1>
              <p className="text-sm text-slate-600 mt-1">
                {employee.name} • {employee.position}
              </p>
            </div>
            <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600">Организация: {contract.clientName}</p>
              <p className="text-sm text-slate-600">Клиника: {contract.clinicName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogoutIcon className="w-4 h-4" />
                Выход
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Если есть амбулаторная карта, показываем её */}
        {ambulatoryCard ? (
          <AmbulatoryCardView card={ambulatoryCard} contract={contract} doctors={doctors} />
        ) : (
          <>
        {/* Маршрутный лист */}
        {(() => {
          const routeInfo = getEmployeeRouteInfo();
          
          // Проверяем статус календарного плана
          if (contract.calendarPlan?.status !== 'approved') {
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Маршрутный лист
                </h2>
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">Маршрутный лист будет создан после утверждения календарного плана</p>
                  <p className="text-sm text-slate-400">
                    Статус плана: {
                      contract.calendarPlan?.status === 'draft' ? 'На согласовании' :
                      contract.calendarPlan?.status === 'rejected' ? 'Отклонен' :
                      'Не заполнен'
                    }
                  </p>
                </div>
              </div>
            );
          }
          
          return routeInfo && routeInfo.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Маршрутный лист
              </h2>
              <div className="space-y-3">
                {routeInfo.map((routeInfoItem, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">
                          {routeInfoItem.doctorName ? (
                            <span>{routeInfoItem.doctorName} ({routeInfoItem.specialty})</span>
                          ) : (
                            <span>{routeInfoItem.specialty}</span>
                          )}
                        </h3>
                        {routeInfoItem.examinationDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              Дата осмотра: {new Date(routeInfoItem.examinationDate).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                        {!routeInfoItem.examinationDate && contract.calendarPlan?.startDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              Период осмотра: {new Date(contract.calendarPlan.startDate).toLocaleDateString('ru-RU')} - {contract.calendarPlan.endDate ? new Date(contract.calendarPlan.endDate).toLocaleDateString('ru-RU') : '—'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        {routeInfoItem.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <CheckShieldIcon className="w-3 h-3 mr-1" />
                            Завершен
                          </span>
                        )}
                        {routeInfoItem.status === 'examined' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            Осмотрен
                          </span>
                        )}
                        {routeInfoItem.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            Ожидает
                          </span>
                        )}
                      </div>
                    </div>
                    {!routeInfoItem.doctorName && (
                      <p className="text-xs text-slate-400 mt-2 italic">
                        Врач еще не назначен. Осмотр будет проведен врачом указанной специализации.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Информация о сотруднике */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserMdIcon className="w-5 h-5" />
            Личные данные
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">ФИО</p>
              <p className="font-medium text-slate-900">{employee.name}</p>
            </div>
            <div>
              <p className="text-slate-500">Должность</p>
              <p className="font-medium text-slate-900">{employee.position}</p>
            </div>
            <div>
              <p className="text-slate-500">Дата рождения</p>
              <p className="font-medium text-slate-900">{employee.dob || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Пол</p>
              <p className="font-medium text-slate-900">{employee.gender}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Вредные факторы</p>
              <p className="font-medium text-amber-600">{employee.harmfulFactor || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Статус осмотра</p>
              <div className="mt-1">{getStatusBadge(employee.status)}</div>
            </div>
          </div>
        </div>

        {/* Лабораторные и функциональные исследования */}
        {(() => {
          const research = getEmployeeResearch();
          return research && contract.calendarPlan?.status === 'approved' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                Лабораторные и функциональные исследования
              </h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {research}
                </p>
              </div>
            </div>
          );
        })()}

          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;

