import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserProfile, Contract, Employee, DoctorRouteSheet, DoctorExamination, AmbulatoryCard } from '../types';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import { LoaderIcon, UserMdIcon, FileTextIcon, CheckShieldIcon, LogoutIcon, AlertCircleIcon, SearchIcon, FilterIcon, CalendarIcon, ClockIcon } from './Icons';
import FinalConclusionModal from './FinalConclusionModal';
import Form052Editor from './Form052Editor';
import { Form052Data } from '../types/form052';
import {
  apiListContractsByBin,
  apiListRouteSheets,
  apiCreateRouteSheet,
  apiUpdateRouteSheet,
  apiGetAmbulatoryCard,
  apiListAmbulatoryCardsByContract,
  apiCreateAmbulatoryCard,
  apiUpdateAmbulatoryCard,
  apiGetUserByUid,
  apiCreateUser,
  ApiRouteSheet,
  ApiAmbulatoryCard
} from '../services/api';

interface DoctorDashboardProps {
  currentUser: UserProfile;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ currentUser }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [routeSheet, setRouteSheet] = useState<DoctorRouteSheet | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [examinationForm, setExaminationForm] = useState<{
    complaints: string;
    objectiveExamination: string;
    diagnosis: string;
    conclusion: string;
    recommendations: string;
    isFit: boolean;
  }>({
    complaints: '',
    objectiveExamination: '',
    diagnosis: '',
    conclusion: '',
    recommendations: '',
    isFit: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showFinalConclusionModal, setShowFinalConclusionModal] = useState(false);
  const [selectedEmployeeForConclusion, setSelectedEmployeeForConclusion] = useState<Employee | null>(null);
  const [ambulatoryCards, setAmbulatoryCards] = useState<Record<string, AmbulatoryCard>>({});
  const [showForm052, setShowForm052] = useState(false);
  const [form052Data, setForm052Data] = useState<Form052Data | null>(null);
  
  // Состояния для поиска и пагинации
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'examined' | 'completed'>('all');

  // Функция определения правил по вредным факторам (из ContractComponents)
  const resolveFactorRules = useCallback((text: string): FactorRule[] => {
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
  }, []);

  // Создание маршрутного листа на основе вредных факторов
  const createRouteSheet = useCallback(async (contractId: string, doctorId: string, employeesList: Employee[]) => {
    if (!currentUser.specialty) {
      console.log('No specialty for doctor:', currentUser);
      return;
    }

    console.log('Creating route sheet for:', {
      doctorId,
      contractId,
      specialty: currentUser.specialty,
      employeesCount: employeesList.length
    });

    // Определяем, каких сотрудников должен осмотреть этот врач
    let relevantEmployees: Employee[];
    
    // Профпатолог (председатель комиссии) должен осматривать всех сотрудников
    if (currentUser.specialty === 'Профпатолог') {
      relevantEmployees = employeesList;
      console.log('Профпатолог: осматривает всех сотрудников:', relevantEmployees.length);
    } else {
      // Для других врачей - только тех, у кого есть соответствующие вредные факторы
      relevantEmployees = employeesList.filter(emp => {
        const rules = resolveFactorRules(emp.harmfulFactor || '');
        const shouldExamine = rules.some(rule => rule.specialties.includes(currentUser.specialty!));
        
        // Отладочная информация
        if (rules.length > 0) {
          console.log(`Сотрудник ${emp.name}:`, {
            harmfulFactor: emp.harmfulFactor,
            foundRules: rules.length,
            specialties: rules.flatMap(r => r.specialties),
            shouldExamine: shouldExamine,
            doctorSpecialty: currentUser.specialty
          });
        }
        
        return shouldExamine;
      });
      console.log(`Врач ${currentUser.specialty}: осматривает ${relevantEmployees.length} сотрудников`);
    }

    const newRouteSheet: DoctorRouteSheet = {
      doctorId,
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

    try {
      const contractIdNum = parseInt(contractId, 10);
      if (isNaN(contractIdNum)) {
        console.error('Invalid contractId:', contractId);
        return;
      }

      const apiRouteSheet = await apiCreateRouteSheet({
        doctorId,
        contractId: contractIdNum,
        specialty: currentUser.specialty,
        virtualDoctor: false,
        employees: newRouteSheet.employees,
      });

      // Конвертируем обратно в DoctorRouteSheet для совместимости
      const convertedRouteSheet: DoctorRouteSheet = {
        id: String(apiRouteSheet.id),
        doctorId: apiRouteSheet.doctorId,
        contractId: String(apiRouteSheet.contractId),
        specialty: apiRouteSheet.specialty,
        virtualDoctor: apiRouteSheet.virtualDoctor,
        employees: apiRouteSheet.employees,
        createdAt: apiRouteSheet.createdAt,
      };
      
      setRouteSheet(convertedRouteSheet);
      console.log('Route sheet created successfully:', convertedRouteSheet);
    } catch (error) {
      console.error('Error creating route sheet:', error);
    }
  }, [currentUser.specialty, resolveFactorRules]);

  // Загрузка амбулаторных карт для профпатолога
  const loadAmbulatoryCards = useCallback(async (contractId: string, employeesList: Employee[]) => {
    const cards: Record<string, AmbulatoryCard> = {};
    const contractIdNum = parseInt(contractId, 10);
    
    if (isNaN(contractIdNum)) {
      console.error('Invalid contractId:', contractId);
      return;
    }

    try {
      for (const emp of employeesList) {
        try {
          let card = await apiGetAmbulatoryCard(emp.id, contractIdNum);
          if (!card) {
            // Создаем новую амбулаторную карту
            card = await apiCreateAmbulatoryCard({
              employeeId: emp.id,
              contractId: contractIdNum,
              personalInfo: {
                fullName: emp.name,
                dateOfBirth: emp.dob,
                gender: emp.gender || 'М',
                address: emp.address || '',
                workplace: emp.workplace || '',
                position: emp.position,
                bloodType: emp.bloodType || '',
                rhFactor: emp.rhFactor || '',
              },
              examinations: {},
            });
          }
          
          if (card) {
            const cardData: AmbulatoryCard = {
              employeeId: card.employeeId,
              contractId: String(card.contractId),
              cardNumber: card.cardNumber,
              personalInfo: card.personalInfo as any,
              anamnesis: card.anamnesis as any,
              vitals: card.vitals as any,
              labTests: card.labTests as any,
              examinations: card.examinations as any,
              finalConclusion: card.finalConclusion as any,
              createdAt: card.createdAt,
              updatedAt: card.updatedAt,
            };
            cards[emp.id] = cardData;
          }
        } catch (error) {
          console.error(`Error loading ambulatory card for employee ${emp.id}:`, error);
        }
      }
      
      setAmbulatoryCards(cards);
    } catch (error) {
      console.error('Error loading ambulatory cards:', error);
    }
  }, []);

  // Загружаем данные договора и маршрутного листа
  useEffect(() => {
    const loadData = async () => {
      // Определяем clinicBin - используем clinicBin, если есть, иначе bin
      let clinicBin = currentUser.clinicBin || currentUser.bin;
      
      // Если у врача нет clinicBin, но есть clinicId, пытаемся получить bin клиники
      if (!clinicBin && currentUser.clinicId) {
        try {
          console.log('Trying to get clinic bin from clinicId (uid):', currentUser.clinicId);
          // Ищем клинику по uid (clinicId)
          const clinicUser = await apiGetUserByUid(currentUser.clinicId);
          if (clinicUser && clinicUser.bin) {
            clinicBin = clinicUser.bin;
            console.log('Found clinic bin:', clinicBin);
            // Обновляем пользователя в базе с найденным clinicBin
            try {
              await apiCreateUser({
                uid: currentUser.uid,
                role: currentUser.role,
                phone: currentUser.phone,
                bin: currentUser.bin,
                companyName: currentUser.companyName,
                leaderName: currentUser.leaderName,
                doctorId: currentUser.doctorId,
                clinicId: currentUser.clinicId,
                specialty: currentUser.specialty,
                clinicBin: clinicBin,
                createdAt: currentUser.createdAt,
              } as any);
            } catch (error) {
              console.error('Error updating doctor clinicBin:', error);
            }
          }
        } catch (error) {
          console.error('Error getting clinic bin:', error);
        }
      }
      
      // Проверяем наличие необходимых данных для врача
      if (!clinicBin) {
        console.log('Missing clinicBin/bin for doctor:', currentUser);
        setIsLoading(false);
        return;
      }
      
      if (!currentUser.specialty) {
        console.log('Missing specialty for doctor:', currentUser);
        setIsLoading(false);
        return;
      }

      try {
        // Шаг 1: Ищем маршрутные листы для этого врача
        // Сначала ищем по doctorId, если он есть
        let routeSheets: any[] = [];
        if (currentUser.doctorId) {
          console.log('Searching for route sheets by doctorId:', currentUser.doctorId);
          routeSheets = await apiListRouteSheets({ doctorId: currentUser.doctorId });
          console.log('Found route sheets by doctorId:', routeSheets.length);
        }
        
        // Если не нашли по doctorId, ищем по specialty среди всех маршрутных листов клиники
        if (routeSheets.length === 0 && currentUser.specialty) {
          console.log('Route sheets not found by doctorId, searching by specialty:', currentUser.specialty);
          // Получаем все договоры клиники и проверяем маршрутные листы
          const clinicBin = currentUser.clinicBin || currentUser.bin;
          if (clinicBin) {
            const contracts = await apiListContractsByBin(clinicBin);
            console.log('Found contracts for clinic:', contracts.length);
            
            for (const contract of contracts) {
              if (contract.calendarPlan?.status === 'approved') {
                console.log('Checking contract:', contract.id, 'for route sheets');
                const allRouteSheets = await apiListRouteSheets({ contractId: contract.id });
                console.log('Route sheets for contract:', allRouteSheets.length, allRouteSheets.map(rs => ({
                  doctorId: rs.doctorId,
                  specialty: rs.specialty,
                  virtualDoctor: rs.virtualDoctor
                })));
                
                // Ищем маршрутные листы по specialty
                const matchingSheets = allRouteSheets.filter(rs => {
                  const specialtyMatch = rs.specialty === currentUser.specialty;
                  const doctorIdMatch = !rs.virtualDoctor && (
                    rs.doctorId === currentUser.doctorId || 
                    rs.doctorId === String(currentUser.doctorId) ||
                    (currentUser.phone && rs.doctorId && rs.doctorId.includes(currentUser.phone))
                  );
                  const virtualMatch = rs.virtualDoctor && specialtyMatch;
                  
                  console.log('Checking route sheet:', {
                    doctorId: rs.doctorId,
                    specialty: rs.specialty,
                    virtualDoctor: rs.virtualDoctor,
                    specialtyMatch,
                    doctorIdMatch,
                    virtualMatch,
                    currentUserDoctorId: currentUser.doctorId,
                    currentUserSpecialty: currentUser.specialty
                  });
                  
                  return specialtyMatch && (doctorIdMatch || virtualMatch);
                });
                
                if (matchingSheets.length > 0) {
                  routeSheets = matchingSheets;
                  console.log('Found matching route sheets:', matchingSheets.length);
                  break;
                }
              }
            }
            console.log('Total found route sheets by specialty:', routeSheets.length);
          }
        }
        
        if (routeSheets.length > 0) {
          // Берем первый маршрутный лист (можно улучшить логику выбора)
          const apiRouteSheet = routeSheets[0];
          const contractId = String(apiRouteSheet.contractId);
          
          // Загружаем договор
          const clinicBin = currentUser.clinicBin || currentUser.bin;
          if (!clinicBin) {
            setIsLoading(false);
            return;
          }
          const contracts = await apiListContractsByBin(clinicBin);
          const contractData = contracts.find(c => String(c.id) === contractId);
          
          if (contractData && contractData.calendarPlan?.status === 'approved' && contractData.employees && contractData.employees.length > 0) {
            // Конвертируем ApiContract в Contract
            const contract: Contract = {
              id: String(contractData.id),
              number: contractData.number,
              clientName: contractData.clientName,
              clientBin: contractData.clientBin,
              clientSigned: contractData.clientSigned,
              clinicName: contractData.clinicName,
              clinicBin: contractData.clinicBin,
              clinicSigned: contractData.clinicSigned,
              date: contractData.date,
              status: contractData.status as any,
              price: contractData.price,
              plannedHeadcount: contractData.plannedHeadcount,
              employees: contractData.employees || [],
              calendarPlan: contractData.calendarPlan,
              documents: contractData.documents || [],
            };
            
            setContract(contract);
            setEmployees(contract.employees || []);
            
              // Конвертируем ApiRouteSheet в DoctorRouteSheet
              const routeSheet: DoctorRouteSheet = {
                id: String(apiRouteSheet.id),
                doctorId: apiRouteSheet.doctorId,
                contractId: String(apiRouteSheet.contractId),
                specialty: apiRouteSheet.specialty,
                virtualDoctor: apiRouteSheet.virtualDoctor,
                employees: apiRouteSheet.employees,
                createdAt: apiRouteSheet.createdAt,
              };
              setRouteSheet(routeSheet);
            
            // Загружаем амбулаторные карты для профпатолога
            if (currentUser.specialty === 'Профпатолог') {
              await loadAmbulatoryCards(contractId, contract.employees || []);
            }
            
              setIsLoading(false);
              return;
            }
          }

        // Шаг 2: Ищем договоры клиники с утвержденным планом
        const clinicBin = currentUser.clinicBin || currentUser.bin;
        if (!clinicBin) {
          console.log('Missing clinicBin/bin for doctor:', currentUser);
          setIsLoading(false);
          return;
        }
        console.log('Searching for contracts by clinicBin:', clinicBin);
        const contracts = await apiListContractsByBin(clinicBin);
          
        // Ищем договоры с утвержденным планом
        for (const apiContract of contracts) {
          if (apiContract.calendarPlan?.status === 'approved' && 
              apiContract.employees && 
              apiContract.employees.length > 0) {
              
            const contractId = String(apiContract.id);
              console.log('Found contract with approved plan:', contractId);
              
              // Проверяем, есть ли маршрутный лист для этого врача
            // Сначала ищем по doctorId, если он есть
            let routeSheets: any[] = [];
            if (currentUser.doctorId) {
              routeSheets = await apiListRouteSheets({ 
                doctorId: currentUser.doctorId, 
                contractId: apiContract.id 
              });
            }
            
            // Если не нашли по doctorId, ищем по specialty (для виртуальных врачей или если doctorId не совпадает)
            if (routeSheets.length === 0 && currentUser.specialty) {
              console.log('Route sheet not found by doctorId, searching by specialty:', currentUser.specialty);
              // Получаем все маршрутные листы для этого договора и фильтруем по specialty
              const allRouteSheets = await apiListRouteSheets({ contractId: apiContract.id });
              console.log('All route sheets for contract:', allRouteSheets.map(rs => ({
                doctorId: rs.doctorId,
                specialty: rs.specialty,
                virtualDoctor: rs.virtualDoctor
              })));
              
              // Ищем маршрутные листы по specialty
              routeSheets = allRouteSheets.filter(rs => {
                const specialtyMatch = rs.specialty === currentUser.specialty;
                // Для виртуальных врачей - просто проверяем specialty
                if (rs.virtualDoctor) {
                  return specialtyMatch;
                }
                // Для реальных врачей - проверяем совпадение doctorId или ищем по телефону
                const doctorIdMatch = rs.doctorId === currentUser.doctorId || 
                                     rs.doctorId === String(currentUser.doctorId);
                return specialtyMatch && doctorIdMatch;
              });
              console.log('Found route sheets by specialty:', routeSheets.length, routeSheets.map(rs => ({
                doctorId: rs.doctorId,
                specialty: rs.specialty
              })));
            }
            
            if (routeSheets.length > 0) {
                // Маршрутный лист уже существует
              const apiRouteSheet = routeSheets[0];
              const contract: Contract = {
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
              
              setContract(contract);
                setEmployees(contract.employees || []);
              
              const routeSheet: DoctorRouteSheet = {
                id: String(apiRouteSheet.id),
                doctorId: apiRouteSheet.doctorId,
                contractId: String(apiRouteSheet.contractId),
                specialty: apiRouteSheet.specialty,
                virtualDoctor: apiRouteSheet.virtualDoctor,
                employees: apiRouteSheet.employees,
                createdAt: apiRouteSheet.createdAt,
              };
              setRouteSheet(routeSheet);
                
                // Загружаем амбулаторные карты для профпатолога
                if (currentUser.specialty === 'Профпатолог') {
                  await loadAmbulatoryCards(contractId, contract.employees || []);
                }
                
                setIsLoading(false);
                return;
              } else {
                // Создаем маршрутный лист
                console.log('Creating route sheet for contract:', contractId);
              const contract: Contract = {
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
              
              setContract(contract);
                setEmployees(contract.employees || []);
                await createRouteSheet(contractId, currentUser.doctorId, contract.employees || []);
                
                // Загружаем амбулаторные карты для профпатолога
                if (currentUser.specialty === 'Профпатолог') {
                  await loadAmbulatoryCards(contractId, contract.employees || []);
                }
                
                setIsLoading(false);
                return;
            }
          }
        }

        // Если ничего не найдено, показываем информационное сообщение
        console.log('No route sheets found for doctor. Waiting for plan approval.');
      } catch (error) {
        console.error('Error loading doctor data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser.doctorId, currentUser.clinicBin, currentUser.clinicId, currentUser.specialty, createRouteSheet, loadAmbulatoryCards]);

  // Сохранение осмотра
  const handleSaveExamination = useCallback(async () => {
    if (!selectedEmployee || !contract || !currentUser.doctorId || !currentUser.specialty) return;

    setIsSaving(true);
    try {
      const contractIdNum = parseInt(contract.id, 10);
      if (isNaN(contractIdNum)) {
        console.error('Invalid contractId:', contract.id);
        return;
      }

      // Загружаем или создаем амбулаторную карту
      let apiCard = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
      
      if (!apiCard) {
        // Создаем новую карту
        apiCard = await apiCreateAmbulatoryCard({
          employeeId: selectedEmployee.id,
          contractId: contractIdNum,
          cardNumber: `052/${contract.number}/${selectedEmployee.id}`,
          personalInfo: {
            fullName: selectedEmployee.name,
            dateOfBirth: selectedEmployee.dob || '',
            gender: selectedEmployee.gender,
            phone: selectedEmployee.phone,
            workplace: contract.clientName,
            position: selectedEmployee.position,
            harmfulFactors: selectedEmployee.harmfulFactor || '',
          },
          examinations: {},
        });
      }

      // Добавляем/обновляем осмотр этого врача
      const examination: DoctorExamination = {
        doctorId: currentUser.doctorId,
        specialty: currentUser.specialty,
        date: new Date().toISOString(),
        status: 'completed',
        complaints: examinationForm.complaints,
        objectiveExamination: examinationForm.objectiveExamination,
        diagnosis: examinationForm.diagnosis,
        conclusion: examinationForm.conclusion,
        recommendations: examinationForm.recommendations,
        isFit: examinationForm.isFit,
      };

      const updatedExaminations = {
        ...apiCard.examinations,
        [currentUser.specialty]: examination,
      };

      // Обновляем карту со всеми полями
      const updateData: any = {
        examinations: updatedExaminations,
      };
      
      // Сохраняем personalInfo если есть изменения
      if (apiCard.personalInfo) {
        updateData.personalInfo = apiCard.personalInfo;
      }
      
      // Сохраняем anamnesis если есть
      if (apiCard.anamnesis) {
        updateData.anamnesis = apiCard.anamnesis;
      }
      
      // Сохраняем vitals если есть
      if (apiCard.vitals) {
        updateData.vitals = apiCard.vitals;
      }
      
      // Сохраняем labTests если есть
      if (apiCard.labTests) {
        updateData.labTests = apiCard.labTests;
      }

      console.log('💾 handleSaveExamination - Updating card with data:', updateData);
      await apiUpdateAmbulatoryCard(apiCard.id, updateData);

      // Обновляем маршрутный лист
      if (routeSheet) {
        const updatedEmployees = routeSheet.employees.map(emp =>
            emp.employeeId === selectedEmployee.id
            ? { ...emp, status: 'examined' as const, examinationDate: new Date().toISOString() }
              : emp
        );
        
        // Находим ID маршрутного листа через API
        try {
          const routeSheets = await apiListRouteSheets({ 
            doctorId: currentUser.doctorId, 
            contractId: contractIdNum 
          });
          if (routeSheets.length > 0) {
            await apiUpdateRouteSheet(routeSheets[0].id, {
              employees: updatedEmployees,
            });
          }
        } catch (error) {
          console.error('Error updating route sheet:', error);
        }
        
        setRouteSheet({
          ...routeSheet,
          employees: updatedEmployees,
        });
      }

      // Перезагружаем амбулаторные карты для профпатолога
      if (currentUser.specialty === 'Профпатолог' && contract) {
        await loadAmbulatoryCards(contract.id, employees);
      }

      setSelectedEmployee(null);
      setExaminationForm({
        complaints: '',
        objectiveExamination: '',
        diagnosis: '',
        conclusion: '',
        recommendations: '',
        isFit: true
      });
    } catch (error) {
      console.error('Error saving examination:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedEmployee, contract, currentUser, examinationForm, routeSheet, loadAmbulatoryCards, employees]);

  // Фильтрация и поиск пациентов
  const filteredEmployees = useMemo(() => {
    if (!routeSheet) return [];
    
    return routeSheet.employees.filter(emp => {
      const employee = employees.find(e => e.id === emp.employeeId);
      if (!employee) return false;
      
      // Поиск по ФИО и телефону
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        employee.name.toLowerCase().includes(searchLower) ||
        (employee.phone && employee.phone.includes(searchQuery));
      
      // Фильтр по статусу
      const ambulatoryCard = ambulatoryCards[emp.employeeId];
      const hasFinalConclusion = ambulatoryCard?.finalConclusion;
      const allExamsCompleted = ambulatoryCard ? 
        Object.values(ambulatoryCard.examinations).every((exam: any) => exam.status === 'completed') : 
        false;
      
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = emp.status === 'pending';
      } else if (statusFilter === 'examined') {
        matchesStatus = emp.status === 'examined' && !hasFinalConclusion;
      } else if (statusFilter === 'completed') {
        matchesStatus = hasFinalConclusion;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [routeSheet, employees, ambulatoryCards, searchQuery, statusFilter]);

  // Пагинация
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('medflow_uid');
    localStorage.removeItem('medflow_phone');
    window.location.reload();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Показываем дашборд даже если маршрутный лист не найден
  if (!contract || !routeSheet) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Личный кабинет врача</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {currentUser.specialty}
                </p>
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

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileTextIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Маршрутный лист не найден</h2>
              <p className="text-slate-600 mb-6">
                Маршрутный лист будет создан автоматически после утверждения календарного плана договора.
              </p>
              <div className="bg-slate-50 rounded-xl p-6 text-left space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">Возможные причины:</span>
                </p>
                <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                  <li>Календарный план договора еще не утвержден</li>
                  <li>Договор еще не создан или не привязан к вашей клинике</li>
                  <li>В договоре нет сотрудников для осмотра</li>
                </ul>
                <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-200">
                  Обратитесь к администратору клиники для получения доступа к договорам и создания маршрутных листов.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Личный кабинет врача</h1>
              <p className="text-sm text-slate-600 mt-1">
                {currentUser.specialty} • Договор: {contract.number}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Всего пациентов</p>
                <p className="text-2xl font-bold text-slate-900">{routeSheet.employees.length}</p>
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
                  {routeSheet.employees.filter(e => e.status === 'pending').length}
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
                <p className="text-xs text-slate-500 mb-1">Осмотрены</p>
                <p className="text-2xl font-bold text-green-600">
                  {routeSheet.employees.filter(e => e.status === 'examined').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckShieldIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Завершены</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(ambulatoryCards).filter(c => c?.finalConclusion).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Прогресс-бар */}
        {routeSheet.employees.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Прогресс осмотра</span>
              <span className="text-sm text-slate-500">
                {Math.round((routeSheet.employees.filter(e => e.status === 'examined' || e.status === 'completed').length / routeSheet.employees.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(routeSheet.employees.filter(e => e.status === 'examined' || e.status === 'completed').length / routeSheet.employees.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Маршрутный лист */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5" />
                  Маршрутный лист
                  <span className="text-sm font-normal text-slate-500">
                    ({filteredEmployees.length} из {routeSheet.employees.length})
                  </span>
                </h2>
              </div>

              {/* Поиск и фильтры */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Поиск по ФИО или телефону..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Все статусы</option>
                    <option value="pending">Ожидают</option>
                    <option value="examined">Осмотрены</option>
                    <option value="completed">Завершены</option>
                  </select>
                </div>
              </div>

              {/* Список пациентов */}
              <div className="space-y-2">
                {paginatedEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Нет пациентов по заданным критериям' 
                        : 'Нет сотрудников для осмотра'
                      }
                    </p>
                  </div>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const employee = employees.find(e => e.id === emp.employeeId);
                    const ambulatoryCard = ambulatoryCards[emp.employeeId];
                    const hasFinalConclusion = ambulatoryCard?.finalConclusion;
                    const allExamsCompleted = ambulatoryCard ? 
                      Object.values(ambulatoryCard.examinations).every((exam: any) => exam.status === 'completed') : 
                      false;
                    
                    return (
                      <div
                        key={emp.employeeId}
                        className={`p-4 rounded-lg border transition-colors hover:shadow-sm ${
                          hasFinalConclusion
                            ? 'bg-blue-50 border-blue-200'
                            : emp.status === 'examined'
                            ? 'bg-green-50 border-green-200'
                            : emp.status === 'completed'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex-1 cursor-pointer min-w-0"
                            onClick={async () => {
                              if (employee && contract) {
                                setSelectedEmployee(employee);
                                // Загружаем данные формы 052 из амбулаторной карты
                                const contractIdNum = parseInt(contract.id, 10);
                                if (!isNaN(contractIdNum)) {
                                  try {
                                    const card = await apiGetAmbulatoryCard(employee.id, contractIdNum);
                                    let form052Data: Form052Data;
                                    
                                    if (card && card.personalInfo) {
                                      // Конвертируем данные амбулаторной карты в формат формы 052
                                      form052Data = {
                                        passportData: {
                                          iin: card.personalInfo.iin as string,
                                          fullName: card.personalInfo.fullName as string,
                                          dateOfBirth: card.personalInfo.dateOfBirth as string,
                                          gender: card.personalInfo.gender === 'М' ? 'male' : 'female',
                                          address: card.personalInfo.address as string,
                                          workplace: card.personalInfo.workplace as string,
                                          position: card.personalInfo.position as string,
                                        },
                                        minimalMedicalData: {
                                          bloodGroup: card.personalInfo.bloodType as string,
                                          rhFactor: card.personalInfo.rhFactor as string,
                                          // Загружаем данные из anamnesis
                                          diseaseHistory: card.anamnesis?.chronicDiseases || card.anamnesis?.pastDiseases || card.anamnesis?.heredity,
                                          harmfulHabits: card.anamnesis?.badHabits,
                                          allergicReactions: card.anamnesis?.allergies ? card.anamnesis.allergies.split(', ').map((name: string) => ({ name: name.trim() })) : undefined,
                                          // Загружаем данные из vitals
                                          anthropometricData: card.vitals ? {
                                            height: card.vitals.height,
                                            weight: card.vitals.weight,
                                            bmi: card.vitals.bmi,
                                            headCircumference: undefined,
                                          } : undefined,
                                        },
                                        cardNumber: card.cardNumber || undefined,
                                      };
                                      
                                      console.log('📥 Loading form 052 data from card:', {
                                        hasAnamnesis: !!card.anamnesis,
                                        hasVitals: !!card.vitals,
                                        anamnesis: card.anamnesis,
                                        vitals: card.vitals,
                                        minimalMedicalData: form052Data.minimalMedicalData,
                                      });
                                      
                                      // Загружаем существующий осмотр врача, если есть
                                      if (currentUser.specialty && card.examinations[currentUser.specialty]) {
                                        const existingExam = card.examinations[currentUser.specialty] as DoctorExamination;
                                        form052Data.dynamicObservation = {
                                          treatedCase: {
                                            diseaseAnamnesis: existingExam.complaints || '',
                                            objectiveData: existingExam.objectiveExamination || '',
                                            diagnosis: existingExam.diagnosis ? {
                                              name: existingExam.diagnosis,
                                            } : undefined,
                                            prescribedServices: existingExam.recommendations || '',
                                            consultations: existingExam.conclusion || '',
                                          },
                                        };
                                      }
                                    } else {
                                      // Создаем новую форму 052 с базовыми данными
                                      form052Data = {
                                        passportData: {
                                          fullName: employee.name,
                                          dateOfBirth: employee.dob,
                                          gender: employee.gender === 'М' ? 'male' : 'female',
                                          workplace: contract.clientName,
                                          position: employee.position,
                                        },
                                        cardNumber: `052/${contract.number}/${employee.id}`,
                                      };
                                    }
                                    
                                    setForm052Data(form052Data);
                                    setShowForm052(true);
                                  } catch (error) {
                                    console.error('Error loading form 052 data:', error);
                                    // В случае ошибки все равно открываем форму с базовыми данными
                                    const form052Data: Form052Data = {
                                      passportData: {
                                        fullName: employee.name,
                                        dateOfBirth: employee.dob,
                                        gender: employee.gender === 'М' ? 'male' : 'female',
                                        workplace: contract.clientName,
                                        position: employee.position,
                                      },
                                      cardNumber: `052/${contract.number}/${employee.id}`,
                                    };
                                    setForm052Data(form052Data);
                                    setShowForm052(true);
                                  }
                                }
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 text-sm truncate">{emp.name}</p>
                                    <p className="text-xs text-slate-600 truncate">{emp.position}</p>
                                  </div>
                                  {employee?.phone && (
                                    <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded ml-2 flex-shrink-0">
                                      {employee.phone}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-amber-600">
                                  <p 
                                    className="break-words overflow-hidden"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      maxHeight: '2.5rem'
                                    }}
                                    title={emp.harmfulFactor}
                                  >
                                    {emp.harmfulFactor}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {hasFinalConclusion ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                <CheckShieldIcon className="w-3 h-3 mr-1" />
                                Завершен
                              </span>
                            ) : emp.status === 'examined' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                Осмотрен
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                Ожидает
                              </span>
                            )}
                            
                            {/* Кнопка для профпатолога */}
                            {currentUser.specialty === 'Профпатолог' && employee && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Закрываем форму 052 перед открытием модального окна финального заключения
                                  if (showForm052) {
                                    setShowForm052(false);
                                    setSelectedEmployee(null);
                                  }
                                  setSelectedEmployeeForConclusion(employee);
                                  setShowFinalConclusionModal(true);
                                }}
                                disabled={!allExamsCompleted}
                                className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
                                  allExamsCompleted
                                    ? 'bg-slate-900 text-white hover:bg-black'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {hasFinalConclusion ? 'Редактировать' : 'Заключение'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Показано {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} из {filteredEmployees.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Назад
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Форма осмотра - теперь сразу открываем форму 052 */}
          {selectedEmployee && !showForm052 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Осмотр сотрудника</h3>
                </div>
                <div className="mb-4">
                  <p className="font-medium text-slate-900">{selectedEmployee.name}</p>
                  <p className="text-sm text-slate-600">{selectedEmployee.position}</p>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Жалобы
                    </label>
                    <textarea
                      value={examinationForm.complaints}
                      onChange={(e) => setExaminationForm({ ...examinationForm, complaints: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                      placeholder="Жалобы пациента..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Объективный осмотр
                    </label>
                    <textarea
                      value={examinationForm.objectiveExamination}
                      onChange={(e) => setExaminationForm({ ...examinationForm, objectiveExamination: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Данные объективного осмотра..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Диагноз
                    </label>
                    <input
                      type="text"
                      value={examinationForm.diagnosis}
                      onChange={(e) => setExaminationForm({ ...examinationForm, diagnosis: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Диагноз..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Заключение
                    </label>
                    <textarea
                      value={examinationForm.conclusion}
                      onChange={(e) => setExaminationForm({ ...examinationForm, conclusion: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={3}
                      placeholder="Заключение врача..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Рекомендации
                    </label>
                    <textarea
                      value={examinationForm.recommendations}
                      onChange={(e) => setExaminationForm({ ...examinationForm, recommendations: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                      placeholder="Рекомендации..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="isFit"
                      checked={examinationForm.isFit}
                      onChange={(e) => setExaminationForm({ ...examinationForm, isFit: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="isFit" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Годен к работе по специальности
                    </label>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleSaveExamination}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <CheckShieldIcon className="w-4 h-4" />
                        Сохранить осмотр
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEmployee(null);
                      setExaminationForm({
                        complaints: '',
                        objectiveExamination: '',
                        diagnosis: '',
                        conclusion: '',
                        recommendations: '',
                        isFit: true
                      });
                    }}
                    className="w-full py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно финального заключения */}
      {showFinalConclusionModal && selectedEmployeeForConclusion && contract && (
        <FinalConclusionModal
          employee={selectedEmployeeForConclusion}
          card={ambulatoryCards[selectedEmployeeForConclusion.id]}
          contract={contract}
          doctorId={currentUser.doctorId!}
          doctorName={currentUser.companyName || 'Профпатолог'}
          onClose={() => {
            setShowFinalConclusionModal(false);
            setSelectedEmployeeForConclusion(null);
          }}
          onSaved={() => {
            // Перезагружаем амбулаторные карты
            if (contract) {
              loadAmbulatoryCards(contract.id, employees);
            }
          }}
        />
      )}

      {/* Модальное окно формы 052 */}
      {showForm052 && selectedEmployee && form052Data && contract && !showFinalConclusionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Форма 052/у - Медицинская карта амбулаторного пациента</h2>
                  <p className="text-sm text-slate-600 mt-1">{selectedEmployee.name} • {selectedEmployee.position}</p>
                </div>
                <button
                  onClick={async () => {
                    // Сохраняем данные формы 052 в амбулаторную карту при закрытии (та же логика, что и в onSave)
                    if (form052Data && contract && selectedEmployee && currentUser.specialty && currentUser.doctorId) {
                      const contractIdNum = parseInt(contract.id, 10);
                      if (!isNaN(contractIdNum)) {
                        try {
                          let card = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
                          if (!card) {
                            card = await apiCreateAmbulatoryCard({
                              employeeId: selectedEmployee.id,
                              contractId: contractIdNum,
                              cardNumber: form052Data.cardNumber || `052/${contract.number}/${selectedEmployee.id}`,
                              personalInfo: {
                                fullName: form052Data.passportData?.fullName || selectedEmployee.name,
                                dateOfBirth: form052Data.passportData?.dateOfBirth || selectedEmployee.dob || '',
                                gender: form052Data.passportData?.gender === 'male' ? 'М' : 'Ж',
                                address: form052Data.passportData?.address || '',
                                workplace: form052Data.passportData?.workplace || contract.clientName,
                                position: form052Data.passportData?.position || selectedEmployee.position,
                                bloodType: form052Data.minimalMedicalData?.bloodGroup || '',
                                rhFactor: form052Data.minimalMedicalData?.rhFactor || '',
                              },
                              examinations: {},
                            });
                          }
                          
                          if (card) {
                            const updatedPersonalInfo = {
                              ...card.personalInfo,
                              fullName: form052Data.passportData?.fullName || card.personalInfo?.fullName,
                              dateOfBirth: form052Data.passportData?.dateOfBirth || card.personalInfo?.dateOfBirth,
                              gender: form052Data.passportData?.gender === 'male' ? 'М' : 'Ж',
                              address: form052Data.passportData?.address || card.personalInfo?.address,
                              workplace: form052Data.passportData?.workplace || card.personalInfo?.workplace,
                              position: form052Data.passportData?.position || card.personalInfo?.position,
                              bloodType: form052Data.minimalMedicalData?.bloodGroup || card.personalInfo?.bloodType,
                              rhFactor: form052Data.minimalMedicalData?.rhFactor || card.personalInfo?.rhFactor,
                            };
                            
                            const examinationData = form052Data.dynamicObservation?.treatedCase;
                            if (examinationData) {
                              const examination: DoctorExamination = {
                                doctorId: currentUser.doctorId,
                                doctorName: currentUser.companyName || currentUser.leaderName || '',
                                specialty: currentUser.specialty || '',
                                date: new Date().toISOString(),
                                status: 'completed',
                                complaints: examinationData.anamnesis || examinationData.diseaseAnamnesis || '',
                                objectiveExamination: examinationData.objectiveData || '',
                                diagnosis: typeof examinationData.diagnosis === 'string' 
                                  ? examinationData.diagnosis 
                                  : examinationData.diagnosis?.name || '',
                                conclusion: examinationData.consultations || '',
                                recommendations: examinationData.prescribedServices || '',
                                isFit: true,
                              };
                              
                              const updatedExaminations = {
                                ...card.examinations,
                                [currentUser.specialty]: examination,
                              };
                              
                              // Подготавливаем объект для обновления со всеми полями
                              const updateDataOnClose: any = {
                                personalInfo: updatedPersonalInfo,
                                examinations: updatedExaminations,
                              };
                              
                              // Используем ту же логику создания anamnesis и vitals
                              const updatedAnamnesisOnClose: any = {};
                              if (card.anamnesis) {
                                Object.assign(updatedAnamnesisOnClose, card.anamnesis);
                              }
                              if (form052Data.minimalMedicalData) {
                                if (form052Data.minimalMedicalData.diseaseHistory) {
                                  updatedAnamnesisOnClose.chronicDiseases = form052Data.minimalMedicalData.diseaseHistory;
                                  updatedAnamnesisOnClose.pastDiseases = form052Data.minimalMedicalData.diseaseHistory;
                                  updatedAnamnesisOnClose.heredity = form052Data.minimalMedicalData.diseaseHistory;
                                }
                                if (form052Data.minimalMedicalData.allergicReactions && form052Data.minimalMedicalData.allergicReactions.length > 0) {
                                  updatedAnamnesisOnClose.allergies = form052Data.minimalMedicalData.allergicReactions.map((r: any) => r.name || r.code || '').filter(Boolean).join(', ');
                                }
                                if (form052Data.minimalMedicalData.harmfulHabits) {
                                  updatedAnamnesisOnClose.badHabits = form052Data.minimalMedicalData.harmfulHabits;
                                }
                                if (card.anamnesis?.occupationalHistory) {
                                  updatedAnamnesisOnClose.occupationalHistory = card.anamnesis.occupationalHistory;
                                }
                              }
                              
                              const updatedVitalsOnClose: any = {};
                              if (card.vitals) {
                                Object.assign(updatedVitalsOnClose, card.vitals);
                              }
                              if (form052Data.minimalMedicalData?.anthropometricData) {
                                if (form052Data.minimalMedicalData.anthropometricData.height !== undefined) {
                                  updatedVitalsOnClose.height = form052Data.minimalMedicalData.anthropometricData.height;
                                }
                                if (form052Data.minimalMedicalData.anthropometricData.weight !== undefined) {
                                  updatedVitalsOnClose.weight = form052Data.minimalMedicalData.anthropometricData.weight;
                                }
                                if (form052Data.minimalMedicalData.anthropometricData.bmi !== undefined) {
                                  updatedVitalsOnClose.bmi = form052Data.minimalMedicalData.anthropometricData.bmi;
                                }
                                if (!updatedVitalsOnClose.measuredAt) {
                                  updatedVitalsOnClose.measuredAt = new Date().toISOString();
                                }
                              }
                              
                              // Фильтруем пустые значения
                              const anamnesisKeysOnClose = Object.keys(updatedAnamnesisOnClose).filter(k => updatedAnamnesisOnClose[k] !== undefined && updatedAnamnesisOnClose[k] !== null && updatedAnamnesisOnClose[k] !== '');
                              const vitalsKeysOnClose = Object.keys(updatedVitalsOnClose).filter(k => updatedVitalsOnClose[k] !== undefined && updatedVitalsOnClose[k] !== null && updatedVitalsOnClose[k] !== '');
                              
                              if (anamnesisKeysOnClose.length > 0) {
                                const filteredAnamnesis: any = {};
                                anamnesisKeysOnClose.forEach(k => {
                                  filteredAnamnesis[k] = updatedAnamnesisOnClose[k];
                                });
                                updateDataOnClose.anamnesis = filteredAnamnesis;
                              }
                              
                              if (vitalsKeysOnClose.length > 0) {
                                const filteredVitals: any = {};
                                vitalsKeysOnClose.forEach(k => {
                                  filteredVitals[k] = updatedVitalsOnClose[k];
                                });
                                updateDataOnClose.vitals = filteredVitals;
                              }
                              
                              console.log('💾 onClose - Updating card with data:', updateDataOnClose);
                              await apiUpdateAmbulatoryCard(card.id, updateDataOnClose);
                              
                              // Обновляем маршрутный лист
                              if (routeSheet) {
                                const updatedEmployees = routeSheet.employees.map(emp =>
                                  emp.employeeId === selectedEmployee.id
                                    ? { ...emp, status: 'examined' as const, examinationDate: new Date().toISOString() }
                                    : emp
                                );
                                try {
                                  const routeSheets = await apiListRouteSheets({ 
                                    doctorId: currentUser.doctorId, 
                                    contractId: contractIdNum 
                                  });
                                  if (routeSheets.length > 0) {
                                    await apiUpdateRouteSheet(routeSheets[0].id, {
                                      employees: updatedEmployees,
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error updating route sheet:', error);
                                }
                                setRouteSheet({
                                  ...routeSheet,
                                  employees: updatedEmployees,
                                });
                              }
                            } else {
                              // Подготавливаем объект для обновления без examination
                              const updateDataNoExam: any = {
                                personalInfo: updatedPersonalInfo,
                              };
                              
                              // Используем ту же логику создания anamnesis и vitals
                              const updatedAnamnesisNoExam: any = {};
                              if (card.anamnesis) {
                                Object.assign(updatedAnamnesisNoExam, card.anamnesis);
                              }
                              if (form052Data.minimalMedicalData) {
                                if (form052Data.minimalMedicalData.diseaseHistory) {
                                  updatedAnamnesisNoExam.chronicDiseases = form052Data.minimalMedicalData.diseaseHistory;
                                  updatedAnamnesisNoExam.pastDiseases = form052Data.minimalMedicalData.diseaseHistory;
                                  updatedAnamnesisNoExam.heredity = form052Data.minimalMedicalData.diseaseHistory;
                                }
                                if (form052Data.minimalMedicalData.allergicReactions && form052Data.minimalMedicalData.allergicReactions.length > 0) {
                                  updatedAnamnesisNoExam.allergies = form052Data.minimalMedicalData.allergicReactions.map((r: any) => r.name || r.code || '').filter(Boolean).join(', ');
                                }
                                if (form052Data.minimalMedicalData.harmfulHabits) {
                                  updatedAnamnesisNoExam.badHabits = form052Data.minimalMedicalData.harmfulHabits;
                                }
                                if (card.anamnesis?.occupationalHistory) {
                                  updatedAnamnesisNoExam.occupationalHistory = card.anamnesis.occupationalHistory;
                                }
                              }
                              
                              const updatedVitalsNoExam: any = {};
                              if (card.vitals) {
                                Object.assign(updatedVitalsNoExam, card.vitals);
                              }
                              if (form052Data.minimalMedicalData?.anthropometricData) {
                                if (form052Data.minimalMedicalData.anthropometricData.height !== undefined) {
                                  updatedVitalsNoExam.height = form052Data.minimalMedicalData.anthropometricData.height;
                                }
                                if (form052Data.minimalMedicalData.anthropometricData.weight !== undefined) {
                                  updatedVitalsNoExam.weight = form052Data.minimalMedicalData.anthropometricData.weight;
                                }
                                if (form052Data.minimalMedicalData.anthropometricData.bmi !== undefined) {
                                  updatedVitalsNoExam.bmi = form052Data.minimalMedicalData.anthropometricData.bmi;
                                }
                                if (!updatedVitalsNoExam.measuredAt) {
                                  updatedVitalsNoExam.measuredAt = new Date().toISOString();
                                }
                              }
                              
                              updateDataNoExam.anamnesis = updatedAnamnesisNoExam;
                              updateDataNoExam.vitals = updatedVitalsNoExam;
                              
                              console.log('💾 onClose (no exam) - Updating card with data:', updateDataNoExam);
                              await apiUpdateAmbulatoryCard(card.id, updateDataNoExam);
                            }
                          }
                        } catch (error) {
                          console.error('Error saving form 052 data:', error);
                        }
                      }
                    }
                    setShowForm052(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Закрыть
                </button>
              </div>
              <div className="p-6">
                <Form052Editor
                  initialData={form052Data}
                  mode="edit"
                  onSave={async (data) => {
                    console.log('💾 Form 052 onSave called with data:', data);
                    console.log('💾 Form 052 minimalMedicalData:', data.minimalMedicalData);
                    console.log('💾 Form 052 diseaseHistory:', data.minimalMedicalData?.diseaseHistory);
                    console.log('💾 Form 052 harmfulHabits:', data.minimalMedicalData?.harmfulHabits);
                    console.log('💾 Form 052 allergicReactions:', data.minimalMedicalData?.allergicReactions);
                    console.log('💾 Form 052 anthropometricData:', data.minimalMedicalData?.anthropometricData);
                    console.log('💾 Form 052 dynamicObservation:', data.dynamicObservation);
                    console.log('💾 Form 052 treatedCase:', data.dynamicObservation?.treatedCase);
                    setForm052Data(data);
                    // Сохраняем данные формы 052 в амбулаторную карту
                    if (contract && selectedEmployee && currentUser.specialty && currentUser.doctorId) {
                      const contractIdNum = parseInt(contract.id, 10);
                      if (!isNaN(contractIdNum)) {
                        try {
                          // Загружаем или создаем амбулаторную карту
                          let card = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
                          
                          if (!card) {
                            // Создаем новую карту
                            card = await apiCreateAmbulatoryCard({
                              employeeId: selectedEmployee.id,
                              contractId: contractIdNum,
                              cardNumber: data.cardNumber || `052/${contract.number}/${selectedEmployee.id}`,
                              personalInfo: {
                                fullName: data.passportData?.fullName || selectedEmployee.name,
                                dateOfBirth: data.passportData?.dateOfBirth || selectedEmployee.dob,
                                gender: data.passportData?.gender === 'male' ? 'М' : 'Ж',
                                address: data.passportData?.address || '',
                                workplace: data.passportData?.workplace || contract.clientName,
                                position: data.passportData?.position || selectedEmployee.position,
                                bloodType: data.minimalMedicalData?.bloodGroup || '',
                                rhFactor: data.minimalMedicalData?.rhFactor || '',
                              },
                              examinations: {},
                            });
                          }
                          
                          if (card) {
                            // Обновляем персональные данные
                            const updatedPersonalInfo = {
                              ...card.personalInfo,
                              fullName: data.passportData?.fullName || card.personalInfo?.fullName,
                              dateOfBirth: data.passportData?.dateOfBirth || card.personalInfo?.dateOfBirth,
                              gender: data.passportData?.gender === 'male' ? 'М' : 'Ж',
                              address: data.passportData?.address || card.personalInfo?.address,
                              workplace: data.passportData?.workplace || card.personalInfo?.workplace,
                              position: data.passportData?.position || card.personalInfo?.position,
                              bloodType: data.minimalMedicalData?.bloodGroup || card.personalInfo?.bloodType,
                              rhFactor: data.minimalMedicalData?.rhFactor || card.personalInfo?.rhFactor,
                            };
                            
                            // Извлекаем и обновляем анамнез из формы 052
                            const updatedAnamnesis: any = {};
                            if (card.anamnesis) {
                              Object.assign(updatedAnamnesis, card.anamnesis);
                            }
                            if (data.minimalMedicalData) {
                              if (data.minimalMedicalData.diseaseHistory) {
                                updatedAnamnesis.chronicDiseases = data.minimalMedicalData.diseaseHistory;
                                updatedAnamnesis.pastDiseases = data.minimalMedicalData.diseaseHistory;
                                updatedAnamnesis.heredity = data.minimalMedicalData.diseaseHistory;
                              }
                              if (data.minimalMedicalData.allergicReactions && data.minimalMedicalData.allergicReactions.length > 0) {
                                updatedAnamnesis.allergies = data.minimalMedicalData.allergicReactions.map((r: any) => r.name || r.code || '').filter(Boolean).join(', ');
                              }
                              if (data.minimalMedicalData.harmfulHabits) {
                                updatedAnamnesis.badHabits = data.minimalMedicalData.harmfulHabits;
                              }
                              if (card.anamnesis?.occupationalHistory) {
                                updatedAnamnesis.occupationalHistory = card.anamnesis.occupationalHistory;
                              }
                            }
                            
                            // Извлекаем и обновляем витальные показатели из формы 052
                            const updatedVitals: any = {};
                            if (card.vitals) {
                              Object.assign(updatedVitals, card.vitals);
                            }
                            if (data.minimalMedicalData?.anthropometricData) {
                              if (data.minimalMedicalData.anthropometricData.height !== undefined) {
                                updatedVitals.height = data.minimalMedicalData.anthropometricData.height;
                              }
                              if (data.minimalMedicalData.anthropometricData.weight !== undefined) {
                                updatedVitals.weight = data.minimalMedicalData.anthropometricData.weight;
                              }
                              if (data.minimalMedicalData.anthropometricData.bmi !== undefined) {
                                updatedVitals.bmi = data.minimalMedicalData.anthropometricData.bmi;
                              }
                              if (!updatedVitals.measuredAt) {
                                updatedVitals.measuredAt = new Date().toISOString();
                              }
                            }
                            
                            console.log('📊 onSave - Prepared data:', {
                              hasMinimalMedicalData: !!data.minimalMedicalData,
                              minimalMedicalData: data.minimalMedicalData,
                              updatedAnamnesis,
                              updatedVitals,
                              anamnesisKeys: Object.keys(updatedAnamnesis),
                              vitalsKeys: Object.keys(updatedVitals),
                              cardAnamnesis: card.anamnesis,
                              cardVitals: card.vitals,
                            });
                            
                            // Извлекаем данные осмотра из формы 052 (раздел "Динамическое наблюдение")
                            const examinationData = data.dynamicObservation?.treatedCase;
                            
                            console.log('🔍 onSave - Extracting examination data:', {
                              hasDynamicObservation: !!data.dynamicObservation,
                              hasTreatedCase: !!examinationData,
                              examinationData: examinationData,
                              fullData: data,
                            });
                            
                            // Сохраняем осмотр только если есть данные в treatedCase
                            if (examinationData && (
                              examinationData.anamnesis || 
                              examinationData.diseaseAnamnesis || 
                              examinationData.objectiveData || 
                              examinationData.diagnosis ||
                              examinationData.consultations ||
                              examinationData.prescribedServices
                            )) {
                              const examination: DoctorExamination = {
                                doctorId: currentUser.doctorId,
                                doctorName: currentUser.companyName || currentUser.leaderName || '',
                                specialty: currentUser.specialty || '',
                                date: new Date().toISOString(),
                                status: 'completed',
                                complaints: examinationData.anamnesis || examinationData.diseaseAnamnesis || '',
                                objectiveExamination: examinationData.objectiveData || '',
                                diagnosis: typeof examinationData.diagnosis === 'string' 
                                  ? examinationData.diagnosis 
                                  : examinationData.diagnosis?.name || '',
                                conclusion: examinationData.consultations || '',
                                recommendations: examinationData.prescribedServices || '',
                                isFit: true, // По умолчанию годен
                              };
                              
                              console.log('💾 onSave - Saving examination data:', {
                                specialty: currentUser.specialty,
                                examination: examination,
                                examinationData: examinationData
                              });
                              
                              // Обновляем осмотры врачей
                              const updatedExaminations = {
                                ...card.examinations,
                                [currentUser.specialty]: examination,
                              };
                              
                              console.log('💾 onSave - Updating ambulatory card:', {
                                cardId: card.id,
                                specialty: currentUser.specialty,
                                updatedExaminations: updatedExaminations
                              });
                              
                              // Подготавливаем объект для обновления со всеми полями
                              const updateData: any = {
                                personalInfo: updatedPersonalInfo,
                                examinations: updatedExaminations,
                              };
                              
                              // Добавляем anamnesis и vitals только если есть данные
                              const anamnesisKeys = Object.keys(updatedAnamnesis).filter(k => {
                                const val = updatedAnamnesis[k];
                                return val !== undefined && val !== null && val !== '';
                              });
                              const vitalsKeys = Object.keys(updatedVitals).filter(k => {
                                const val = updatedVitals[k];
                                return val !== undefined && val !== null && val !== '';
                              });
                              
                              console.log('🔍 onSave - Filtering data:', {
                                anamnesisKeys,
                                vitalsKeys,
                                anamnesisValues: anamnesisKeys.map(k => ({ key: k, value: updatedAnamnesis[k] })),
                                vitalsValues: vitalsKeys.map(k => ({ key: k, value: updatedVitals[k] })),
                              });
                              
                              // Всегда добавляем anamnesis и vitals если есть хотя бы одно поле
                              if (anamnesisKeys.length > 0) {
                                const filteredAnamnesis: any = {};
                                anamnesisKeys.forEach(k => {
                                  filteredAnamnesis[k] = updatedAnamnesis[k];
                                });
                                updateData.anamnesis = filteredAnamnesis;
                              } else if (data.minimalMedicalData && (data.minimalMedicalData.diseaseHistory || data.minimalMedicalData.harmfulHabits || data.minimalMedicalData.allergicReactions)) {
                                // Если данные были в форме, но не попали в anamnesis, все равно сохраняем
                                console.warn('⚠️ onSave - Anamnesis data exists in form but not extracted properly');
                                updateData.anamnesis = updatedAnamnesis;
                              }
                              
                              if (vitalsKeys.length > 0) {
                                const filteredVitals: any = {};
                                vitalsKeys.forEach(k => {
                                  filteredVitals[k] = updatedVitals[k];
                                });
                                updateData.vitals = filteredVitals;
                              } else if (data.minimalMedicalData?.anthropometricData) {
                                // Если данные были в форме, но не попали в vitals, все равно сохраняем
                                console.warn('⚠️ onSave - Vitals data exists in form but not extracted properly');
                                updateData.vitals = updatedVitals;
                              }
                              
                              console.log('💾 onSave - Final update data:', {
                                keys: Object.keys(updateData),
                                anamnesis: updateData.anamnesis,
                                vitals: updateData.vitals,
                                anamnesisKeys,
                                vitalsKeys,
                                willSendAnamnesis: !!updateData.anamnesis,
                                willSendVitals: !!updateData.vitals,
                              });
                              
                              await apiUpdateAmbulatoryCard(card.id, updateData);
                              
                              console.log('✅ onSave - Ambulatory card updated successfully');
                              
                              // Обновляем маршрутный лист
                              if (routeSheet) {
                                const updatedEmployees = routeSheet.employees.map(emp =>
                                  emp.employeeId === selectedEmployee.id
                                    ? { ...emp, status: 'examined' as const, examinationDate: new Date().toISOString() }
                                    : emp
                                );
                                try {
                                  const routeSheets = await apiListRouteSheets({ 
                                    doctorId: currentUser.doctorId, 
                                    contractId: contractIdNum 
                                  });
                                  if (routeSheets.length > 0) {
                                    await apiUpdateRouteSheet(routeSheets[0].id, {
                                      employees: updatedEmployees,
                                    });
                                    console.log('✅ onSave - Route sheet updated successfully');
                                  }
                                } catch (error) {
                                  console.error('❌ onSave - Error updating route sheet:', error);
                                }
                                setRouteSheet({
                                  ...routeSheet,
                                  employees: updatedEmployees,
                                });
                              }
                              
                              // Показываем уведомление об успешном сохранении
                              alert('Данные осмотра успешно сохранены!');
                            } else {
                              console.warn('⚠️ onSave - No examination data found in treatedCase, saving personalInfo, anamnesis and vitals');
                              const updateData: any = {
                                personalInfo: updatedPersonalInfo,
                              };
                              
                              // Добавляем anamnesis и vitals только если есть данные
                              const anamnesisKeys = Object.keys(updatedAnamnesis).filter(k => updatedAnamnesis[k] !== undefined && updatedAnamnesis[k] !== null && updatedAnamnesis[k] !== '');
                              const vitalsKeys = Object.keys(updatedVitals).filter(k => updatedVitals[k] !== undefined && updatedVitals[k] !== null && updatedVitals[k] !== '');
                              
                              if (anamnesisKeys.length > 0) {
                                const filteredAnamnesis: any = {};
                                anamnesisKeys.forEach(k => {
                                  filteredAnamnesis[k] = updatedAnamnesis[k];
                                });
                                updateData.anamnesis = filteredAnamnesis;
                              }
                              
                              if (vitalsKeys.length > 0) {
                                const filteredVitals: any = {};
                                vitalsKeys.forEach(k => {
                                  filteredVitals[k] = updatedVitals[k];
                                });
                                updateData.vitals = filteredVitals;
                              }
                              
                              console.log('💾 onSave (no exam) - Updating card with data:', {
                                keys: Object.keys(updateData),
                                anamnesis: updateData.anamnesis,
                                vitals: updateData.vitals,
                                anamnesisKeys,
                                vitalsKeys,
                              });
                              
                              await apiUpdateAmbulatoryCard(card.id, updateData);
                            }
                            
                            // Обновляем маршрутный лист
                            if (routeSheet) {
                              const updatedEmployees = routeSheet.employees.map(emp =>
                                emp.employeeId === selectedEmployee.id
                                  ? { ...emp, status: 'examined' as const, examinationDate: new Date().toISOString() }
                                  : emp
                              );
                              
                              try {
                                const routeSheets = await apiListRouteSheets({ 
                                  doctorId: currentUser.doctorId, 
                                  contractId: contractIdNum 
                                });
                                if (routeSheets.length > 0) {
                                  await apiUpdateRouteSheet(routeSheets[0].id, {
                                    employees: updatedEmployees,
                                  });
                                }
                              } catch (error) {
                                console.error('Error updating route sheet:', error);
                              }
                              
                              setRouteSheet({
                                ...routeSheet,
                                employees: updatedEmployees,
                              });
                            }
                            
                            // Перезагружаем амбулаторные карты для профпатолога
                            if (currentUser.specialty === 'Профпатолог') {
                              await loadAmbulatoryCards(contract.id, employees);
                            }
                            
                            // Закрываем форму
                            setShowForm052(false);
                            setSelectedEmployee(null);
                          }
                        } catch (error) {
                          console.error('Error saving form 052 data:', error);
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;

