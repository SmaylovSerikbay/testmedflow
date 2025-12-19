import React, { useState, useEffect } from 'react';
import { UserProfile, Contract, AmbulatoryCard, Doctor, DoctorRouteSheet, Employee, DoctorExamination } from '../types';
import { LoaderIcon, UserMdIcon, FileTextIcon, CheckShieldIcon, CalendarIcon, ClockIcon, LogoutIcon, AlertCircleIcon } from './Icons';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import AmbulatoryCardView from './AmbulatoryCardView';
import {
  apiListContractsByBin,
  apiGetContract,
  apiListRouteSheets,
  apiGetAmbulatoryCard,
  apiCreateAmbulatoryCard,
  apiListDoctors,
  apiGetUserByBin,
  ApiRouteSheet,
  ApiAmbulatoryCard,
  ApiDoctor,
} from '../services/api';

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
    console.log('EmployeeDashboard: Loading data for user:', {
      contractId: currentUser.contractId,
      employeeId: currentUser.employeeId,
      bin: currentUser.bin,
      phone: currentUser.phone,
    });
    
    if (!currentUser.contractId || !currentUser.employeeId) {
      console.warn('EmployeeDashboard: Missing required fields:', {
        hasContractId: !!currentUser.contractId,
        hasEmployeeId: !!currentUser.employeeId,
        hasBin: !!currentUser.bin,
      });
      setIsLoading(false);
      return;
    }
    
    // Если нет bin, пытаемся получить его из договора
    if (!currentUser.bin) {
      console.warn('EmployeeDashboard: No bin in user profile, will try to get from contract');
    }

    const loadData = async () => {
      try {
        const contractIdNum = parseInt(currentUser.contractId, 10);
        if (isNaN(contractIdNum)) {
          console.error('Invalid contractId:', currentUser.contractId);
          setIsLoading(false);
          return;
        }

        // Загружаем договор через API
        let apiContract: ApiContract | undefined;
        
        // Сначала пытаемся получить договор напрямую по ID (если есть contractId)
        if (contractIdNum > 0) {
          try {
            apiContract = await apiGetContract(contractIdNum);
            console.log('✅ Contract loaded by ID:', apiContract.id);
            
            // Если у пользователя нет bin, обновляем его из договора
            if (!currentUser.bin && apiContract.clientBin) {
              console.log('📝 Updating user bin from contract:', apiContract.clientBin);
              // Обновляем bin пользователя (можно вызвать apiCreateUser для обновления)
              // Но это не критично для работы, просто логируем
            }
          } catch (error) {
            console.warn('Failed to load contract by ID, trying by bin:', error);
          }
        }
        
        // Если не получилось по ID, пытаемся по bin
        if (!apiContract && currentUser.bin) {
          try {
            const contracts = await apiListContractsByBin(currentUser.bin);
            apiContract = contracts.find(c => String(c.id) === currentUser.contractId);
            if (apiContract) {
              console.log('✅ Contract found by bin:', apiContract.id);
            }
          } catch (error) {
            console.error('Error loading contracts by bin:', error);
          }
        }
        
        if (!apiContract) {
          console.error('❌ Contract not found:', {
            contractId: currentUser.contractId,
            contractIdNum: contractIdNum,
            bin: currentUser.bin,
            employeeId: currentUser.employeeId,
          });
          setIsLoading(false);
          return;
        }
        
        console.log('Found contract:', apiContract.id, apiContract.number);

        // Конвертируем ApiContract в Contract
        const contractData: Contract = {
          id: String(apiContract.id),
          number: apiContract.number,
          clientName: apiContract.clientName,
          clientBin: apiContract.clientBin,
          clientSigned: apiContract.clientSigned,
          clinicName: apiContract.clinicName,
          clinicBin: apiContract.clinicBin,
          clinicSigned: apiContract.clinicSigned,
          date: apiContract.date,
          status: apiContract.status as any,
          price: apiContract.price,
          plannedHeadcount: apiContract.plannedHeadcount,
          employees: apiContract.employees || [],
          calendarPlan: apiContract.calendarPlan,
          documents: apiContract.documents || [],
        };
        setContract(contractData);

        // Находим данные сотрудника
        const emp = contractData.employees?.find(e => e.id === currentUser.employeeId);
        if (!emp) {
          console.error('Employee not found in contract:', {
            employeeId: currentUser.employeeId,
            contractId: currentUser.contractId,
            employeesInContract: contractData.employees?.length || 0,
            employeeIds: contractData.employees?.map(e => e.id) || [],
          });
          setIsLoading(false);
          return;
        }
        
        console.log('Found employee:', emp.name);
        setEmployee(emp);
        
        // Загружаем амбулаторную карту, если её нет - создаем
        let apiCard = await apiGetAmbulatoryCard(currentUser.employeeId, contractIdNum);
        if (!apiCard) {
          // Создаем амбулаторную карту автоматически, если её нет
          console.log('📋 Creating ambulatory card for employee:', emp.name);
          try {
            apiCard = await apiCreateAmbulatoryCard({
              employeeId: currentUser.employeeId,
              contractId: contractIdNum,
              cardNumber: `052/${contractData.number}/${currentUser.employeeId}`,
              personalInfo: {
                fullName: emp.name,
                dateOfBirth: emp.dob || '',
                gender: emp.gender || 'М',
                phone: emp.phone || currentUser.phone,
                address: emp.address || '',
                workplace: contractData.clientName,
                position: emp.position,
                harmfulFactors: emp.harmfulFactor || '',
              },
              examinations: {},
            });
            console.log('✅ Ambulatory card created successfully');
          } catch (error) {
            console.error('❌ Error creating ambulatory card:', error);
          }
        }
        
        if (apiCard) {
          console.log('📋 EmployeeDashboard - Loaded card:', {
            id: apiCard.id,
            employeeId: apiCard.employeeId,
            contractId: apiCard.contractId,
            hasPersonalInfo: !!apiCard.personalInfo,
            hasAnamnesis: !!apiCard.anamnesis,
            hasVitals: !!apiCard.vitals,
            hasLabTests: !!apiCard.labTests,
            hasExaminations: !!apiCard.examinations,
            examinationsCount: apiCard.examinations ? Object.keys(apiCard.examinations).length : 0,
            hasFinalConclusion: !!apiCard.finalConclusion,
            updatedAt: apiCard.updatedAt,
          });
          
          // Конвертируем ApiAmbulatoryCard в AmbulatoryCard
          const cardData: AmbulatoryCard = {
            employeeId: apiCard.employeeId,
            contractId: String(apiCard.contractId),
            cardNumber: apiCard.cardNumber,
            personalInfo: apiCard.personalInfo as any,
            anamnesis: apiCard.anamnesis as any,
            vitals: apiCard.vitals as any,
            labTests: apiCard.labTests as any,
            examinations: apiCard.examinations as any || {},
            finalConclusion: apiCard.finalConclusion as any,
            createdAt: apiCard.createdAt,
            updatedAt: apiCard.updatedAt,
          };
          
          console.log('📋 EmployeeDashboard - Converted card data:', {
            hasAnamnesis: !!cardData.anamnesis,
            hasVitals: !!cardData.vitals,
            examinationsKeys: Object.keys(cardData.examinations || {}),
          });
          
          setAmbulatoryCard(cardData);
        } else {
          console.warn('⚠️ EmployeeDashboard - No card found for employee:', currentUser.employeeId);
        }

        // Загружаем врачей клиники
        if (contractData.clinicBin) {
          try {
            // Ищем клинику по BIN через API users
            const clinicUser = await apiGetUserByBin(contractData.clinicBin);
            
            if (clinicUser && clinicUser.role === 'clinic' && clinicUser.uid) {
              const apiDoctors = await apiListDoctors(clinicUser.uid);
              const doctorsList: Doctor[] = apiDoctors.map((d: ApiDoctor) => ({
                id: String(d.id),
                name: d.name,
                specialty: d.specialty,
                phone: d.phone,
                isChairman: d.isChairman,
              }));
              setDoctors(doctorsList);
            }
          } catch (error) {
            console.error('Error loading doctors:', error);
          }
        }

        // Загружаем маршрутные листы для этого договора
        try {
          const apiRouteSheets = await apiListRouteSheets({ contractId: contractIdNum });
          
          // Фильтруем маршрутные листы, которые содержат этого сотрудника
          const relevantSheets: DoctorRouteSheet[] = [];
          for (const apiSheet of apiRouteSheets) {
            const hasEmployee = apiSheet.employees.some(
              (emp: any) => emp.employeeId === currentUser.employeeId
            );
            if (hasEmployee) {
              const routeSheet: DoctorRouteSheet = {
                id: String(apiSheet.id),
                doctorId: apiSheet.doctorId,
                contractId: String(apiSheet.contractId),
                specialty: apiSheet.specialty,
                virtualDoctor: apiSheet.virtualDoctor,
                employees: apiSheet.employees,
                createdAt: apiSheet.createdAt,
              };
              relevantSheets.push(routeSheet);
            }
          }
          setRouteSheets(relevantSheets);
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
    
    // Периодическое обновление данных каждые 30 секунд
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing employee data...');
      loadData();
    }, 30000);
    
    // Обновление данных при фокусе на окне
    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing employee data...');
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser.contractId, currentUser.employeeId, currentUser.bin]);

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
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircleIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Данные не найдены</h2>
          <p className="text-slate-600 mb-4">
            {!currentUser.contractId || !currentUser.employeeId 
              ? 'Ваш профиль не привязан к договору. Обратитесь к администратору организации.'
              : 'Не удалось загрузить данные договора или информацию о сотруднике. Обратитесь к администратору.'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left text-sm text-slate-600 space-y-2">
            <p><strong>Телефон:</strong> {currentUser.phone}</p>
            {currentUser.contractId && <p><strong>ID договора:</strong> {currentUser.contractId}</p>}
            {currentUser.employeeId && <p><strong>ID сотрудника:</strong> {currentUser.employeeId}</p>}
            {currentUser.bin && <p><strong>БИН:</strong> {currentUser.bin}</p>}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('medwork_uid');
              localStorage.removeItem('medwork_phone');
              window.location.reload();
            }}
            className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Выйти и войти заново
          </button>
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
        // Находим врача по специализации из маршрутного листа (более надежный способ)
        const specialty = sheet.specialty || 'Не указано';
        // Ищем врача по специализации, а не по ID (так как ID может не совпадать)
        const doctor = doctors.find(d => d.specialty === specialty);
        // Если не нашли по специализации, пытаемся найти по ID
        const doctorById = doctor || doctors.find(d => String(d.id) === String(sheet.doctorId));
        const doctorName = doctorById?.name || (sheet.virtualDoctor ? undefined : undefined);
        
        console.log(`Врач для листа ${index + 1}:`, {
          doctorId: sheet.doctorId,
          specialty: specialty,
          doctorName: doctorName || 'Не назначен',
          virtualDoctor: sheet.virtualDoctor || false,
          foundBySpecialty: !!doctor,
          foundById: !!doctorById
        });
        
        employeeInSheets.push({
          doctorId: sheet.doctorId,
          specialty: specialty,
          doctorName: doctorName, // Может быть undefined для виртуальных врачей
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
    localStorage.removeItem('medwork_uid');
    localStorage.removeItem('medwork_phone');
    window.location.reload();
  };

  const handleRefresh = async () => {
    if (!currentUser.contractId || !currentUser.employeeId) return;
    
    setIsLoading(true);
    try {
      const contractIdNum = parseInt(currentUser.contractId, 10);
      if (isNaN(contractIdNum)) {
        console.error('Invalid contractId:', currentUser.contractId);
        setIsLoading(false);
        return;
      }

      // Перезагружаем амбулаторную карту
      console.log('🔄 EmployeeDashboard - Refreshing card data...');
      const apiCard = await apiGetAmbulatoryCard(currentUser.employeeId, contractIdNum);
      if (apiCard) {
        console.log('✅ EmployeeDashboard - Refreshed card:', {
          id: apiCard.id,
          hasExaminations: !!apiCard.examinations,
          examinationsCount: apiCard.examinations ? Object.keys(apiCard.examinations).length : 0,
          hasAnamnesis: !!apiCard.anamnesis,
          hasVitals: !!apiCard.vitals,
          updatedAt: apiCard.updatedAt,
        });
        
        const cardData: AmbulatoryCard = {
          employeeId: apiCard.employeeId,
          contractId: String(apiCard.contractId),
          cardNumber: apiCard.cardNumber,
          personalInfo: apiCard.personalInfo as any,
          anamnesis: apiCard.anamnesis as any,
          vitals: apiCard.vitals as any,
          labTests: apiCard.labTests as any,
          examinations: apiCard.examinations as any || {},
          finalConclusion: apiCard.finalConclusion as any,
          createdAt: apiCard.createdAt,
          updatedAt: apiCard.updatedAt,
        };
        setAmbulatoryCard(cardData);
      } else {
        console.warn('⚠️ EmployeeDashboard - Card not found after refresh');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
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
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-50"
                title="Обновить данные"
              >
                {isLoading ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <ClockIcon className="w-4 h-4" />
                )}
                Обновить
              </button>
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
        {/* Статистика осмотра */}
        {routeSheets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Всего врачей</p>
                  <p className="text-2xl font-bold text-slate-900">{routeSheets.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserMdIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ожидают осмотра</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {routeSheets.filter(rs => {
                      const emp = rs.employees.find(e => e.employeeId === currentUser.employeeId);
                      return emp && emp.status === 'pending';
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Завершено</p>
                  <p className="text-2xl font-bold text-green-600">
                    {routeSheets.filter(rs => {
                      const emp = rs.employees.find(e => e.employeeId === currentUser.employeeId);
                      return emp && (emp.status === 'examined' || emp.status === 'completed');
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckShieldIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Прогресс-бар осмотра */}
        {routeSheets.length > 0 && (() => {
          const totalDoctors = routeSheets.length;
          const completedDoctors = routeSheets.filter(rs => {
            const emp = rs.employees.find(e => e.employeeId === currentUser.employeeId);
            return emp && (emp.status === 'examined' || emp.status === 'completed');
          }).length;
          const progress = totalDoctors > 0 ? (completedDoctors / totalDoctors) * 100 : 0;
          
          return (
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Прогресс медосмотра</span>
                <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Осмотрено {completedDoctors} из {totalDoctors} врачей
              </p>
            </div>
          );
        })()}

        {/* Амбулаторная карта - всегда показываем, даже если пустая */}
        {ambulatoryCard ? (
          <AmbulatoryCardView card={ambulatoryCard} contract={contract} doctors={doctors} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <div className="text-center py-8">
              <FileTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Амбулаторная карта</h3>
              <p className="text-slate-600 mb-4">
                Ваша амбулаторная карта будет создана автоматически при первом осмотре врача
              </p>
              <p className="text-sm text-slate-500">
                Врачи будут заполнять данные осмотра в этой карте по мере прохождения медосмотра
              </p>
            </div>
          </div>
        )}

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
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 transition-all ${
                      routeInfoItem.status === 'completed' 
                        ? 'bg-green-50 border-green-200 shadow-sm' 
                        : routeInfoItem.status === 'examined'
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            routeInfoItem.status === 'completed' 
                              ? 'bg-green-100' 
                              : routeInfoItem.status === 'examined'
                              ? 'bg-blue-100'
                              : 'bg-slate-200'
                          }`}>
                            <UserMdIcon className={`w-6 h-6 ${
                              routeInfoItem.status === 'completed' 
                                ? 'text-green-600' 
                                : routeInfoItem.status === 'examined'
                                ? 'text-blue-600'
                                : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {routeInfoItem.doctorName ? (
                                <span>{routeInfoItem.doctorName}</span>
                              ) : (
                                <span className="text-slate-500">Врач не назначен</span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-600">{routeInfoItem.specialty}</p>
                          </div>
                        </div>
                        
                        {routeInfoItem.examinationDate ? (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                            <CheckShieldIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">
                              Осмотр пройден: {new Date(routeInfoItem.examinationDate).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : contract.calendarPlan?.startDate ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                            <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Период осмотра: {new Date(contract.calendarPlan.startDate).toLocaleDateString('ru-RU')} - {contract.calendarPlan.endDate ? new Date(contract.calendarPlan.endDate).toLocaleDateString('ru-RU') : '—'}
                            </span>
                          </div>
                        ) : null}
                        
                        {!routeInfoItem.doctorName && (
                          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                            ⚠️ Врач еще не назначен. Осмотр будет проведен врачом указанной специализации.
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {routeInfoItem.status === 'completed' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <CheckShieldIcon className="w-3 h-3 mr-1" />
                            Завершен
                          </span>
                        )}
                        {routeInfoItem.status === 'examined' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            <CheckShieldIcon className="w-3 h-3 mr-1" />
                            Осмотрен
                          </span>
                        )}
                        {routeInfoItem.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            Ожидает
                          </span>
                        )}
                      </div>
                    </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">ФИО</p>
                <p className="font-semibold text-slate-900 text-base">{employee.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Должность</p>
                <p className="font-medium text-slate-900">{employee.position}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Дата рождения</p>
                <p className="font-medium text-slate-900">{employee.dob || '—'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Пол</p>
                <p className="font-medium text-slate-900">{employee.gender}</p>
              </div>
              {employee.phone && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Телефон</p>
                  <p className="font-medium text-slate-900">{employee.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Статус осмотра</p>
                <div className="mt-1">{getStatusBadge(employee.status)}</div>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 mb-2">Вредные факторы</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-medium text-amber-900 text-sm leading-relaxed">{employee.harmfulFactor || '—'}</p>
              </div>
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
      </div>
    </div>
  );
};

export default EmployeeDashboard;

