import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Contract, Employee, DoctorRouteSheet, DoctorExamination, AmbulatoryCard } from '../types';
import { 
  LoaderIcon, 
  SearchIcon, 
  UserMdIcon, 
  LogoutIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileTextIcon,
  CheckShieldIcon,
  BriefcaseIcon,
  RefreshIcon,
  BellIcon,
  UsersIcon,
  AlertCircleIcon
} from './Icons';
import BrandLogo from './BrandLogo';
import {
  apiListContractsByBin,
  apiListRouteSheets,
  apiUpdateRouteSheet,
  apiGetAmbulatoryCard,
  apiCreateAmbulatoryCard,
  apiUpdateAmbulatoryCard,
  ApiRouteSheet,
  ApiAmbulatoryCard
} from '../services/api';

interface DoctorWorkspaceProps {
  currentUser: UserProfile;
}

const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [routeSheet, setRouteSheet] = useState<DoctorRouteSheet | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const [examinationForm, setExaminationForm] = useState({
    complaints: '',
    objectiveExamination: '',
    diagnosis: '',
    conclusion: '',
    recommendations: '',
    isFit: true,
  });

  // Загрузка договоров
  const loadContracts = useCallback(async () => {
    if (!currentUser.clinicBin && !currentUser.bin) {
      setIsLoading(false);
      return;
    }

    try {
      const bin = currentUser.clinicBin || currentUser.bin;
      if (!bin) return;

      const contractsList = await apiListContractsByBin(bin);
      const contractsData: Contract[] = contractsList
        .filter(c => c.status === 'execution' || c.status === 'planning' || c.status === 'negotiation' || c.status === 'request')
        .map(c => ({
          id: String(c.id),
          number: c.number,
          clientName: c.clientName,
          clientBin: c.clientBin,
          clientSigned: c.clientSigned,
          clinicName: c.clinicName,
          clinicBin: c.clinicBin,
          clinicSigned: c.clinicSigned,
          date: c.date,
          status: c.status as any,
          price: c.price,
          plannedHeadcount: c.plannedHeadcount,
          employees: c.employees || [],
          documents: c.documents || [],
          calendarPlan: c.calendarPlan,
        }));
      
      setContracts(contractsData);
      if (contractsData.length > 0 && !selectedContract) {
        setSelectedContract(contractsData[0]);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedContract]);

  useEffect(() => {
    loadContracts();
  }, []);

  // Загрузка маршрутного листа
  const loadRouteSheet = useCallback(async () => {
    if (!selectedContract || !currentUser.doctorId) {
      setRouteSheet(null);
      return;
    }

    try {
      const contractIdNum = parseInt(selectedContract.id, 10);
      if (isNaN(contractIdNum)) return;

      const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });
      const mySheet = apiSheets.find(s => 
        s.doctorId === currentUser.doctorId || 
        (s.specialty === currentUser.specialty && s.virtualDoctor)
      );
      
      if (mySheet) {
        const sheet: DoctorRouteSheet = {
          id: String(mySheet.id),
          doctorId: mySheet.doctorId,
          contractId: String(mySheet.contractId),
          specialty: mySheet.specialty,
          virtualDoctor: mySheet.virtualDoctor,
          employees: mySheet.employees,
          createdAt: mySheet.createdAt,
        };
        setRouteSheet(sheet);
      } else {
        setRouteSheet(null);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading route sheet:', error);
      setRouteSheet(null);
    }
  }, [selectedContract, currentUser.doctorId, currentUser.specialty]);

  useEffect(() => {
    loadRouteSheet();
    
    if (autoRefresh) {
      const interval = setInterval(loadRouteSheet, 10000);
      return () => clearInterval(interval);
    }
  }, [loadRouteSheet, autoRefresh]);

  // Загрузка амбулаторной карты при выборе сотрудника
  useEffect(() => {
    const loadCard = async () => {
      if (!selectedEmployee || !selectedContract) return;

      try {
        const contractIdNum = parseInt(selectedContract.id, 10);
        if (isNaN(contractIdNum)) return;

        let apiCard = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
        
        if (!apiCard) {
          apiCard = await apiCreateAmbulatoryCard({
            employeeId: selectedEmployee.id,
            contractId: contractIdNum,
            personalInfo: {
              fullName: selectedEmployee.name,
              dateOfBirth: selectedEmployee.dob,
              gender: selectedEmployee.gender || 'М',
              workplace: selectedContract.clientName,
              position: selectedEmployee.position,
              harmfulFactors: selectedEmployee.harmfulFactor || '',
            },
            examinations: {},
          });
        }

        if (apiCard) {
          const card: AmbulatoryCard = {
            employeeId: apiCard.employeeId,
            contractId: apiCard.contractId ? String(apiCard.contractId) : undefined,
            cardNumber: apiCard.cardNumber,
            personalInfo: apiCard.personalInfo as any,
            anamnesis: apiCard.anamnesis as any,
            vitals: apiCard.vitals as any,
            labTests: apiCard.labTests as any,
            examinations: apiCard.examinations as any,
            finalConclusion: apiCard.finalConclusion as any,
            createdAt: apiCard.createdAt,
            updatedAt: apiCard.updatedAt,
          };
          setAmbulatoryCard(card);

          const specialty = currentUser.specialty || '';
          const existingExam = card.examinations[specialty] as DoctorExamination | undefined;
          if (existingExam) {
            setExaminationForm({
              complaints: existingExam.complaints || '',
              objectiveExamination: existingExam.objectiveExamination || '',
              diagnosis: existingExam.diagnosis || '',
              conclusion: existingExam.conclusion || '',
              recommendations: existingExam.recommendations || '',
              isFit: existingExam.isFit ?? true,
            });
          } else {
            setExaminationForm({
              complaints: '',
              objectiveExamination: '',
              diagnosis: '',
              conclusion: '',
              recommendations: '',
              isFit: true,
            });
          }
        }
      } catch (error) {
        console.error('Error loading card:', error);
      }
    };

    loadCard();
  }, [selectedEmployee, selectedContract, currentUser.specialty]);

  // Сохранение осмотра
  const handleSaveExamination = async () => {
    if (!ambulatoryCard || !selectedEmployee || !selectedContract || !currentUser.specialty || !currentUser.doctorId) {
      return;
    }

    setIsSaving(true);
    try {
      const contractIdNum = parseInt(selectedContract.id, 10);
      if (isNaN(contractIdNum)) return;

      const specialty = currentUser.specialty;
      const examination: DoctorExamination = {
        doctorId: currentUser.doctorId,
        doctorName: currentUser.companyName || 'Врач',
        specialty,
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
        ...ambulatoryCard.examinations,
        [specialty]: examination,
      };

      const currentCard = await apiGetAmbulatoryCard(selectedEmployee.id, contractIdNum);
      if (currentCard) {
        await apiUpdateAmbulatoryCard(currentCard.id, {
          examinations: updatedExaminations,
        });
      }

      // Обновляем статус в маршрутном листе
      if (routeSheet) {
        const updatedEmployees = routeSheet.employees.map(emp => {
          if (emp.employeeId === selectedEmployee.id) {
            return {
              ...emp,
              status: 'completed' as const,
              examinationDate: new Date().toISOString(),
            };
          }
          return emp;
        });

        const sheetIdNum = parseInt(routeSheet.id || '0', 10);
        if (!isNaN(sheetIdNum)) {
          await apiUpdateRouteSheet(sheetIdNum, {
            employees: updatedEmployees,
          });

          setRouteSheet({
            ...routeSheet,
            employees: updatedEmployees,
          });
        }
      }

      setAmbulatoryCard({
        ...ambulatoryCard,
        examinations: updatedExaminations,
        updatedAt: new Date().toISOString(),
      });

      alert('Осмотр сохранен успешно');
      
      // Переходим к следующему пациенту
      const currentIndex = filteredEmployees.findIndex(e => e.employeeId === selectedEmployee.id);
      if (currentIndex < filteredEmployees.length - 1) {
        const nextEmp = filteredEmployees[currentIndex + 1];
        const employee = selectedContract?.employees.find(e => e.id === nextEmp.employeeId);
        if (employee) {
          setSelectedEmployee(employee);
        }
      }
    } catch (error) {
      console.error('Error saving examination:', error);
      alert('Ошибка при сохранении осмотра');
    } finally {
      setIsSaving(false);
    }
  };

  // Фильтрация сотрудников
  const filteredEmployees = useMemo(() => {
    let employees = routeSheet?.employees || [];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(query) || 
        emp.position.toLowerCase().includes(query) ||
        emp.employeeId.includes(query)
      );
    }
    
    if (filterStatus !== 'all') {
      employees = employees.filter(emp => emp.status === filterStatus);
    }
    
    return employees;
  }, [routeSheet?.employees, searchQuery, filterStatus]);

  // Статистика пациентов
  const patientsStats = useMemo(() => ({
    total: routeSheet?.employees.length || 0,
    completed: routeSheet?.employees.filter(e => e.status === 'completed').length || 0,
    pending: routeSheet?.employees.filter(e => e.status === 'pending').length || 0,
  }), [routeSheet?.employees]);

  const handleLogout = () => {
    localStorage.removeItem('medwork_uid');
    localStorage.removeItem('medwork_phone');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <LoaderIcon className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-slate-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Современный минималистичный Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo and Info */}
            <div className="flex items-center gap-6">
              <BrandLogo size="sm" />
              
              <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900">
                    Рабочее место врача
                  </span>
                  <span className="text-xs text-slate-500">
                    {currentUser.specialty || 'Врач'} • {currentUser.companyName || ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Real-time Stats */}
            {routeSheet && (
              <div className="hidden xl:flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                  <UsersIcon className="w-4 h-4 text-slate-600" />
                  <div className="text-left">
                    <div className="text-xs text-slate-500 font-medium">Всего</div>
                    <div className="text-sm font-bold text-slate-900">{patientsStats.total}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                  <ClockIcon className="w-4 h-4 text-amber-600" />
                  <div className="text-left">
                    <div className="text-xs text-amber-600 font-medium">Ожидают</div>
                    <div className="text-sm font-bold text-amber-900">{patientsStats.pending}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <div className="text-left">
                    <div className="text-xs text-green-600 font-medium">Осмотрено</div>
                    <div className="text-sm font-bold text-green-900">{patientsStats.completed}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
                title={autoRefresh ? 'Авто-обновление включено' : 'Авто-обновление выключено'}
              >
                <RefreshIcon className={`w-5 h-5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
              </button>
              
              <div className="hidden lg:block text-xs text-slate-500">
                {lastUpdate.toLocaleTimeString('ru-RU')}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogoutIcon className="w-4 h-4"/>
                <span className="hidden sm:inline">Выход</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Левая панель: Договоры и список пациентов (35%) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Выбор договора */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <BriefcaseIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Договор</h3>
                      <p className="text-xs text-slate-500">Выберите договор</p>
                    </div>
                  </div>
                </div>
                <select
                  value={selectedContract?.id || ''}
                  onChange={(e) => {
                    const contract = contracts.find(c => c.id === e.target.value);
                    setSelectedContract(contract || null);
                    setSelectedEmployee(null);
                    setAmbulatoryCard(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium bg-white shadow-sm transition-all"
                >
                  {contracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.number} — {contract.clientName}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedContract && (
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Номер</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedContract.number || '—'}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Клиент</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{selectedContract.clientName || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Поиск и фильтры */}
            {routeSheet && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm p-5 space-y-3">
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Поиск пациента..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium shadow-sm transition-all"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === 'all'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === 'pending'
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Ожидают
                  </button>
                  <button
                    onClick={() => setFilterStatus('completed')}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === 'completed'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Осмотрено
                  </button>
                </div>
              </div>
            )}

            {/* Список пациентов */}
            {routeSheet ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                        <UsersIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Пациенты</h2>
                        <p className="text-xs text-slate-500">{filteredEmployees.length} человек</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-h-[calc(100vh-550px)] min-h-[400px] overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-4">
                        <UserMdIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Пациенты не найдены</p>
                      <p className="text-xs text-slate-400 mt-1">Попробуйте изменить фильтры</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredEmployees.map(emp => {
                        const employee = selectedContract?.employees.find(e => e.id === emp.employeeId);
                        const isSelected = selectedEmployee?.id === emp.employeeId;
                        return (
                          <button
                            key={emp.employeeId}
                            onClick={() => setSelectedEmployee(employee || null)}
                            className={`w-full p-4 text-left hover:bg-blue-50/50 transition-all relative group ${
                              isSelected 
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-blue-500' 
                                : 'border-l-4 border-transparent hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                  {emp.status === 'completed' && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                      Осмотрено
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 truncate">{emp.position}</p>
                              </div>
                              <div className="flex-shrink-0">
                                {emp.status === 'completed' && (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                )}
                                {emp.status === 'pending' && (
                                  <ClockIcon className="w-5 h-5 text-amber-500" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileTextIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Маршрутный лист не найден</h3>
                  <p className="text-sm text-slate-500">Выберите договор с активным маршрутным листом</p>
                </div>
              </div>
            )}
          </div>

          {/* Правая панель: Амбулаторная карта (форма 052) (65%) */}
          <div className="xl:col-span-8">
            {selectedEmployee && ambulatoryCard ? (
              <div className="space-y-4">
                {/* Заголовок пациента */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedEmployee.name}</h2>
                        <p className="text-sm text-slate-600">{selectedEmployee.position}</p>
                        {selectedEmployee.harmfulFactor && (
                          <p className="text-xs text-amber-600 mt-2 font-medium">
                            Вредные факторы: {selectedEmployee.harmfulFactor}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Форма № 025/у</p>
                        <p className="text-sm font-bold text-slate-900">Амбулаторная карта</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Амбулаторная карта с формой осмотра */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                    <h3 className="text-lg font-bold text-slate-900">
                      Осмотр: {currentUser.specialty}
                    </h3>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Форма осмотра */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Жалобы
                        </label>
                        <textarea
                          value={examinationForm.complaints}
                          onChange={(e) => setExaminationForm({ ...examinationForm, complaints: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                          rows={3}
                          placeholder="Жалобы пациента..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Объективный осмотр
                        </label>
                        <textarea
                          value={examinationForm.objectiveExamination}
                          onChange={(e) => setExaminationForm({ ...examinationForm, objectiveExamination: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                          rows={4}
                          placeholder="Результаты объективного осмотра..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Диагноз
                          </label>
                          <input
                            type="text"
                            value={examinationForm.diagnosis}
                            onChange={(e) => setExaminationForm({ ...examinationForm, diagnosis: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            placeholder="Диагноз..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            Заключение
                          </label>
                          <input
                            type="text"
                            value={examinationForm.conclusion}
                            onChange={(e) => setExaminationForm({ ...examinationForm, conclusion: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            placeholder="Заключение..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Рекомендации
                        </label>
                        <textarea
                          value={examinationForm.recommendations}
                          onChange={(e) => setExaminationForm({ ...examinationForm, recommendations: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                          rows={2}
                          placeholder="Рекомендации..."
                        />
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border-2 border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={examinationForm.isFit}
                            onChange={(e) => setExaminationForm({ ...examinationForm, isFit: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            Годен к работе по специальности
                          </span>
                        </label>
                      </div>

                      <button
                        onClick={handleSaveExamination}
                        disabled={isSaving}
                        className="group relative w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {isSaving ? (
                          <>
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                            Сохранение в карту...
                          </>
                        ) : (
                          <>
                            <CheckShieldIcon className="w-5 h-5" />
                            Сохранить в амбулаторную карту (форма 052)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Предыдущие осмотры */}
                {ambulatoryCard.examinations && Object.keys(ambulatoryCard.examinations).length > 0 && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                      <h3 className="text-lg font-bold text-slate-900">
                        История осмотров в карте
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {Object.entries(ambulatoryCard.examinations).map(([specialty, exam]: [string, any]) => (
                          <div key={specialty} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-slate-900">{specialty}</h4>
                              <span className="text-xs text-slate-500">
                                {exam.date ? new Date(exam.date).toLocaleDateString('ru-RU') : ''}
                              </span>
                            </div>
                            {exam.diagnosis && (
                              <p className="text-sm text-slate-700 mb-1">
                                <span className="font-semibold">Диагноз:</span> {exam.diagnosis}
                              </p>
                            )}
                            {exam.conclusion && (
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold">Заключение:</span> {exam.conclusion}
                              </p>
                            )}
                            {exam.isFit !== undefined && (
                              <div className="mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  exam.isFit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {exam.isFit ? 'Годен' : 'Не годен'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                <div className="p-16 text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <UserMdIcon className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Выберите пациента</h3>
                  <p className="text-sm text-slate-500">Выберите сотрудника из списка для проведения осмотра</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorWorkspace;
