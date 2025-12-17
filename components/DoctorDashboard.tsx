import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserProfile, Contract, Employee, DoctorRouteSheet, DoctorExamination, AmbulatoryCard } from '../types';
import { rtdb, ref, get, set, onValue, query, orderByChild, equalTo } from '../services/firebase';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import { LoaderIcon, UserMdIcon, FileTextIcon, CheckShieldIcon, LogoutIcon, AlertCircleIcon, SearchIcon, FilterIcon } from './Icons';
import FinalConclusionModal from './FinalConclusionModal';

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

    await set(ref(rtdb, `routeSheets/${doctorId}_${contractId}`), newRouteSheet);
    setRouteSheet(newRouteSheet);
    console.log('Route sheet created successfully:', newRouteSheet);
  }, [currentUser.specialty, resolveFactorRules]);

  // Загружаем данные договора и маршрутного листа
  useEffect(() => {
    if (!currentUser.doctorId || !currentUser.clinicId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Шаг 1: Если contractId указан в профиле, используем его
        if (currentUser.contractId) {
          const contractRef = ref(rtdb, `contracts/${currentUser.contractId}`);
          const contractSnapshot = await get(contractRef);
          if (contractSnapshot.exists()) {
            const contractData = { id: currentUser.contractId, ...contractSnapshot.val() } as Contract;
            
            // Проверяем, что план утвержден и есть сотрудники
            if (contractData.calendarPlan?.status === 'approved' && contractData.employees && contractData.employees.length > 0) {
              setContract(contractData);
              setEmployees(contractData.employees || []);

              // Загружаем или создаем маршрутный лист
              const routeSheetRef = ref(rtdb, `routeSheets/${currentUser.doctorId}_${currentUser.contractId}`);
              const routeSheetSnapshot = await get(routeSheetRef);
              if (routeSheetSnapshot.exists()) {
                setRouteSheet({ ...routeSheetSnapshot.val() } as DoctorRouteSheet);
              } else {
                await createRouteSheet(currentUser.contractId, currentUser.doctorId, contractData.employees || []);
              }
              setIsLoading(false);
              return;
            }
          }
        }

        // Шаг 2: Ищем маршрутные листы для этого врача
        console.log('Searching for route sheets for doctor:', currentUser.doctorId);
        const routeSheetsRef = ref(rtdb, 'routeSheets');
        const routeSheetsSnapshot = await get(routeSheetsRef);
        
        if (routeSheetsSnapshot.exists()) {
          const routeSheets = routeSheetsSnapshot.val();
          console.log('Found route sheets:', Object.keys(routeSheets).length, 'total');
          
          // Ищем маршрутные листы этого врача
          let foundRouteSheet: DoctorRouteSheet | null = null;
          let foundContractId: string | null = null;
          
          Object.entries(routeSheets).forEach(([key, sheet]: [string, any]) => {
            if (key.startsWith(currentUser.doctorId + '_')) {
              foundRouteSheet = { ...sheet } as DoctorRouteSheet;
              foundContractId = sheet.contractId || key.split('_')[1];
              console.log('Found route sheet by key:', key, 'contractId:', foundContractId);
            } else if (sheet.doctorId === currentUser.doctorId) {
              foundRouteSheet = { ...sheet } as DoctorRouteSheet;
              foundContractId = sheet.contractId;
              console.log('Found route sheet by doctorId:', key, 'contractId:', foundContractId);
            }
          });
          
          if (foundRouteSheet && foundContractId) {
            // Загружаем договор
            const contractRef = ref(rtdb, `contracts/${foundContractId}`);
            const contractSnapshot = await get(contractRef);
            
            if (contractSnapshot.exists()) {
              const contractData = { id: foundContractId, ...contractSnapshot.val() } as Contract;
              console.log('Contract loaded successfully, employees:', contractData.employees?.length || 0);
              setContract(contractData);
              setEmployees(contractData.employees || []);
              setRouteSheet(foundRouteSheet);
              setIsLoading(false);
              return;
            }
          }
        }

        // Шаг 3: Ищем договоры клиники, к которой привязан врач
        console.log('Searching for contracts by clinicId:', currentUser.clinicId, 'or clinicBin:', currentUser.clinicBin);
        const contractsRef = ref(rtdb, 'contracts');
        const contractsSnapshot = await get(contractsRef);
        
        if (contractsSnapshot.exists()) {
          const contracts = contractsSnapshot.val();
          const clinicBin = currentUser.clinicBin?.toString().trim() || '';
          
          // Ищем договоры этой клиники с утвержденным планом
          for (const [contractId, contractData] of Object.entries(contracts)) {
            const contract = contractData as Contract;
            const contractClinicBin = contract.clinicBin?.toString().trim() || '';
            
            // Проверяем, что это договор нашей клиники и план утвержден
            if (contractClinicBin === clinicBin && 
                contract.calendarPlan?.status === 'approved' && 
                contract.employees && 
                contract.employees.length > 0) {
              
              console.log('Found contract with approved plan:', contractId);
              
              // Проверяем, есть ли маршрутный лист для этого врача
              const routeSheetKey = `${currentUser.doctorId}_${contractId}`;
              const routeSheetRef = ref(rtdb, `routeSheets/${routeSheetKey}`);
              const routeSheetSnapshot = await get(routeSheetRef);
              
              if (routeSheetSnapshot.exists()) {
                // Маршрутный лист уже существует
                const routeSheetData = { ...routeSheetSnapshot.val() } as DoctorRouteSheet;
                setContract({ id: contractId, ...contract } as Contract);
                setEmployees(contract.employees || []);
                setRouteSheet(routeSheetData);
                
                // Загружаем амбулаторные карты для профпатолога
                if (currentUser.specialty === 'Профпатолог') {
                  await loadAmbulatoryCards(contractId, contract.employees || []);
                }
                
                setIsLoading(false);
                return;
              } else {
                // Создаем маршрутный лист
                console.log('Creating route sheet for contract:', contractId);
                setContract({ id: contractId, ...contract } as Contract);
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
  }, [currentUser.contractId, currentUser.doctorId, currentUser.clinicId, currentUser.clinicBin, createRouteSheet]);

  // Загрузка амбулаторных карт для профпатолога
  const loadAmbulatoryCards = useCallback(async (contractId: string, employeesList: Employee[]) => {
    const cards: Record<string, AmbulatoryCard> = {};
    
    for (const emp of employeesList) {
      try {
        const cardRef = ref(rtdb, `ambulatoryCards/${emp.id}_${contractId}`);
        const cardSnapshot = await get(cardRef);
        if (cardSnapshot.exists()) {
          cards[emp.id] = cardSnapshot.val() as AmbulatoryCard;
        }
      } catch (error) {
        console.error(`Error loading card for employee ${emp.id}:`, error);
      }
    }
    
    setAmbulatoryCards(cards);
  }, []);

  // Сохранение осмотра
  const handleSaveExamination = useCallback(async () => {
    if (!selectedEmployee || !contract || !currentUser.doctorId) return;

    setIsSaving(true);
    try {
      // Загружаем или создаем амбулаторную карту
      const cardRef = ref(rtdb, `ambulatoryCards/${selectedEmployee.id}_${contract.id}`);
      const cardSnapshot = await get(cardRef);
      
      let card: AmbulatoryCard;
      if (cardSnapshot.exists()) {
        card = { ...cardSnapshot.val() } as AmbulatoryCard;
      } else {
        // Создаем новую карту с полной структурой
        card = {
          employeeId: selectedEmployee.id,
          contractId: contract.id,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Добавляем/обновляем осмотр этого врача
      const examination: DoctorExamination = {
        doctorId: currentUser.doctorId,
        specialty: currentUser.specialty!,
        date: new Date().toISOString(),
        status: 'completed',
        complaints: examinationForm.complaints,
        objectiveExamination: examinationForm.objectiveExamination,
        diagnosis: examinationForm.diagnosis,
        conclusion: examinationForm.conclusion,
        recommendations: examinationForm.recommendations,
        isFit: examinationForm.isFit,
      };

      card.examinations[currentUser.specialty!] = examination;
      card.updatedAt = new Date().toISOString();

      await set(cardRef, card);

      // Обновляем маршрутный лист
      if (routeSheet) {
        const updatedRouteSheet = {
          ...routeSheet,
          employees: routeSheet.employees.map(emp =>
            emp.employeeId === selectedEmployee.id
              ? { ...emp, status: 'examined', examinationDate: new Date().toISOString() }
              : emp
          ),
        };
        await set(ref(rtdb, `routeSheets/${currentUser.doctorId}_${contract.id}`), updatedRouteSheet);
        setRouteSheet(updatedRouteSheet);
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
  }, [selectedEmployee, contract, currentUser, examinationForm, routeSheet]);

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
                            onClick={() => {
                              if (employee && currentUser.specialty !== 'Профпатолог') {
                                setSelectedEmployee(employee);
                                // Загружаем существующий осмотр, если есть
                                const loadExistingExamination = async () => {
                                  const cardRef = ref(rtdb, `ambulatoryCards/${employee.id}_${contract.id}`);
                                  const cardSnapshot = await get(cardRef);
                                  if (cardSnapshot.exists()) {
                                    const card = cardSnapshot.val() as AmbulatoryCard;
                                    const existingExam = card.examinations[currentUser.specialty!];
                                    if (existingExam) {
                                      setExaminationForm({
                                        complaints: existingExam.complaints || '',
                                        objectiveExamination: existingExam.objectiveExamination || '',
                                        diagnosis: existingExam.diagnosis || '',
                                        conclusion: existingExam.conclusion || '',
                                        recommendations: existingExam.recommendations || '',
                                        isFit: existingExam.isFit !== undefined ? existingExam.isFit : true,
                                      });
                                    }
                                  }
                                };
                                loadExistingExamination();
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

          {/* Форма осмотра */}
          {selectedEmployee && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Осмотр сотрудника</h3>
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
          doctorId={currentUser.doctorId}
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
    </div>
  );
};

export default DoctorDashboard;

