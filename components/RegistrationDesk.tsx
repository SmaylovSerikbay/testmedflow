import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Contract, Employee, EmployeeVisit, EmployeeRoute, DoctorRouteSheet, IndividualPatient } from '../types';
import { 
  LoaderIcon, 
  SearchIcon, 
  UserMdIcon, 
  FileTextIcon, 
  CheckShieldIcon, 
  LogoutIcon,
  ClockIcon,
  CalendarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  XIcon,
  BriefcaseIcon,
  FilterIcon,
  RefreshIcon,
  DownloadIcon,
  BellIcon,
  UsersIcon
} from './Icons';
import BrandLogo from './BrandLogo';
import {
  apiListContractsByBin,
  apiGetContract,
  apiListRouteSheets,
  apiGetAmbulatoryCard,
  apiListAmbulatoryCardsByContract,
  apiCreateEmployeeVisit,
  apiUpdateEmployeeVisit,
  apiListEmployeeVisits,
  apiCreateRouteSheet,
  apiListDoctors,
} from '../services/api';
import { createRouteSheetsForAllSpecialties } from '../utils/routeSheetGenerator';

interface RegistrationDeskProps {
  currentUser: UserProfile;
}

// Фильтры для удобной работы
interface FilterOptions {
  contractStatus: 'all' | 'execution' | 'planning';
  visitStatus: 'all' | 'registered' | 'in_progress' | 'completed';
  searchQuery: string;
  dateFilter: 'today' | 'week' | 'month' | 'all';
}

const RegistrationDesk: React.FC<RegistrationDeskProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedIndividualPatient, setSelectedIndividualPatient] = useState<IndividualPatient | null>(null);
  const [employeeRoute, setEmployeeRoute] = useState<EmployeeRoute | null>(null);
  const [employeeVisit, setEmployeeVisit] = useState<EmployeeVisit | null>(null);
  const [routeSheets, setRouteSheets] = useState<DoctorRouteSheet[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visits, setVisits] = useState<EmployeeVisit[]>([]);
  const [showIndividualPatientModal, setShowIndividualPatientModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Фильтры
  const [filters, setFilters] = useState<FilterOptions>({
    contractStatus: 'all',
    visitStatus: 'all',
    searchQuery: '',
    dateFilter: 'today',
  });

  // Загрузка договоров клиники
  const loadContracts = useCallback(async () => {
    if (!currentUser.clinicBin && !currentUser.bin) {
      setIsLoading(false);
      return;
    }

    try {
      const bin = currentUser.clinicBin || currentUser.bin;
      if (!bin) return;

      const contractsList = await apiListContractsByBin(bin);
      const contractsData: Contract[] = contractsList.map(c => ({
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
      
      // Показываем все договоры, кроме черновиков
      const activeContracts = contractsData.filter(c => 
        c.status === 'execution' || 
        c.status === 'planning' || 
        c.status === 'negotiation' ||
        c.status === 'request'
      );
      setContracts(activeContracts);
      if (activeContracts.length > 0 && !selectedContract) {
        const executionContract = activeContracts.find(c => c.status === 'execution');
        setSelectedContract(executionContract || activeContracts[0]);
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

  // Загрузка врачей клиники
  useEffect(() => {
    const loadDoctors = async () => {
      if (!currentUser.clinicId && !currentUser.uid) return;

      try {
        const clinicUid = currentUser.clinicId || currentUser.uid;
        const doctorsList = await apiListDoctors(clinicUid);
        setDoctors(doctorsList);
      } catch (error) {
        console.error('Error loading doctors:', error);
      }
    };

    loadDoctors();
  }, [currentUser]);

  // Загрузка маршрутных листов для выбранного договора
  const loadRouteSheets = useCallback(async () => {
    if (!selectedContract) return;

    try {
      const contractIdNum = parseInt(selectedContract.id, 10);
      if (isNaN(contractIdNum)) return;

      const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });
      const sheets: DoctorRouteSheet[] = apiSheets.map(s => ({
        id: String(s.id),
        doctorId: s.doctorId,
        contractId: String(s.contractId),
        specialty: s.specialty,
        virtualDoctor: s.virtualDoctor,
        employees: s.employees,
        createdAt: s.createdAt,
      }));

      setRouteSheets(sheets);
      
      if (selectedEmployee) {
        const route = getEmployeeRoute(selectedEmployee.id, sheets);
        setEmployeeRoute(route);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading route sheets:', error);
    }
  }, [selectedContract, selectedEmployee?.id]);

  useEffect(() => {
    loadRouteSheets();
    
    if (autoRefresh) {
      const interval = setInterval(loadRouteSheets, 10000);
      return () => clearInterval(interval);
    }
  }, [loadRouteSheets, autoRefresh]);

  // Загрузка посещений
  const loadVisits = useCallback(async () => {
    if (!currentUser.clinicId && !currentUser.bin) return;

    try {
      const clinicId = currentUser.clinicId || currentUser.uid;
      let dateFilter = new Date().toISOString().split('T')[0];
      
      if (filters.dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString().split('T')[0];
      } else if (filters.dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString().split('T')[0];
      }
      
      const visitsList = await apiListEmployeeVisits({
        clinicId,
        ...(filters.dateFilter !== 'all' && { date: dateFilter }),
      });
      
      const visitsData: EmployeeVisit[] = visitsList.map(v => ({
        id: String(v.id),
        employeeId: v.employeeId,
        contractId: v.contractId ? String(v.contractId) : undefined,
        clinicId: v.clinicId,
        visitDate: v.visitDate,
        checkInTime: v.checkInTime,
        checkOutTime: v.checkOutTime,
        status: v.status,
        routeSheetId: v.routeSheetId ? String(v.routeSheetId) : undefined,
        documentsIssued: v.documentsIssued,
        registeredBy: v.registeredBy,
        notes: v.notes,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }));
      
      setVisits(visitsData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading visits:', error);
    }
  }, [currentUser, filters.dateFilter]);

  useEffect(() => {
    loadVisits();
    
    if (autoRefresh) {
      const interval = setInterval(loadVisits, 5000); // Чаще обновляем посещения
      return () => clearInterval(interval);
    }
  }, [loadVisits, autoRefresh]);

  // Получение маршрута сотрудника
  const getEmployeeRoute = useCallback((employeeId: string, sheets = routeSheets): EmployeeRoute | null => {
    if (!sheets.length) return null;

    const routeItems: EmployeeRoute['routeItems'] = [];
    
    sheets.forEach(sheet => {
      const empInSheet = sheet.employees.find(e => e.employeeId === employeeId);
      if (empInSheet) {
        routeItems.push({
          specialty: sheet.specialty || 'Не указано',
          doctorId: sheet.virtualDoctor ? undefined : sheet.doctorId,
          status: empInSheet.status === 'completed' ? 'completed' : 
                  empInSheet.status === 'examined' ? 'completed' : 'pending',
          examinationDate: empInSheet.examinationDate,
          order: routeItems.length + 1,
        });
      }
    });

    if (routeItems.length === 0) return null;

    return {
      employeeId,
      contractId: selectedContract?.id || '',
      routeItems: routeItems.sort((a, b) => a.order - b.order),
    };
  }, [routeSheets, selectedContract]);

  // Регистрация входа сотрудника
  const handleCheckIn = async (employee: Employee) => {
    if (!selectedContract) return;
    setIsRegistering(true);

    try {
      const clinicId = currentUser.clinicId || currentUser.uid;
      if (!clinicId) {
        alert('Ошибка: не указан ID клиники');
        setIsRegistering(false);
        return;
      }

      const contractIdNum = parseInt(selectedContract.id, 10);
      if (isNaN(contractIdNum)) {
        alert('Ошибка: неверный ID договора');
        setIsRegistering(false);
        return;
      }

      if (!employee.id) {
        alert('Ошибка: не указан ID сотрудника');
        setIsRegistering(false);
        return;
      }
      
      // Создаем посещение через API
      const visit = await apiCreateEmployeeVisit({
        employeeId: employee.id,
        contractId: contractIdNum,
        clinicId,
        visitDate: new Date().toISOString().split('T')[0],
        status: 'registered',
        registeredBy: currentUser.uid,
      });

      // Проверяем, есть ли маршрутные листы для этого договора
      const existingSheets = await apiListRouteSheets({ contractId: contractIdNum });
      if (existingSheets.length === 0) {
        await createRouteSheetsForAllSpecialties(
          selectedContract.id,
          selectedContract.employees || [],
          doctors
        );
      }

      await loadRouteSheets();
      await loadVisits();

      const visitData: EmployeeVisit = {
        id: String(visit.id),
        employeeId: visit.employeeId,
        contractId: visit.contractId ? String(visit.contractId) : undefined,
        clinicId: visit.clinicId,
        visitDate: visit.visitDate,
        checkInTime: visit.checkInTime,
        checkOutTime: visit.checkOutTime,
        status: visit.status,
        routeSheetId: visit.routeSheetId ? String(visit.routeSheetId) : undefined,
        documentsIssued: visit.documentsIssued,
        registeredBy: visit.registeredBy,
        notes: visit.notes,
        createdAt: visit.createdAt,
        updatedAt: visit.updatedAt,
      };

      setEmployeeVisit(visitData);
      setSelectedEmployee(employee);
      
      const route = getEmployeeRoute(employee.id);
      setEmployeeRoute(route);
    } catch (error) {
      console.error('Error checking in employee:', error);
      alert('Ошибка при регистрации сотрудника');
    } finally {
      setIsRegistering(false);
    }
  };

  // Регистрация выхода сотрудника
  const handleCheckOut = async () => {
    if (!employeeVisit) return;
    setIsRegistering(true);

    try {
      const visitId = parseInt(employeeVisit.id, 10);
      if (isNaN(visitId)) return;

      await apiUpdateEmployeeVisit(visitId, {
        checkOutTime: new Date().toISOString(),
        status: 'completed',
      });

      const updatedVisit: EmployeeVisit = {
        ...employeeVisit,
        checkOutTime: new Date().toISOString(),
        status: 'completed',
      };

      setEmployeeVisit(updatedVisit);
      await loadVisits();
    } catch (error) {
      console.error('Error checking out employee:', error);
      alert('Ошибка при регистрации выхода');
    } finally {
      setIsRegistering(false);
    }
  };

  // Выдача документов
  const handleIssueDocument = async (documentType: string) => {
    if (!employeeVisit || !selectedEmployee || !selectedContract) return;
    setIsRegistering(true);

    try {
      const visitId = parseInt(employeeVisit.id, 10);
      if (isNaN(visitId)) return;

      if (documentType === 'Маршрутный лист') {
        const { generateEmployeeRouteSheetPDF } = await import('../utils/pdfGenerator');
        const doc = generateEmployeeRouteSheetPDF(
          selectedEmployee,
          selectedContract,
          employeeRoute,
          doctors
        );
        const filename = `Маршрутный_лист_${selectedEmployee.name.replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
      }

      const updatedDocuments = [...(employeeVisit.documentsIssued || []), documentType];
      
      await apiUpdateEmployeeVisit(visitId, {
        documentsIssued: updatedDocuments,
      });

      const updatedVisit: EmployeeVisit = {
        ...employeeVisit,
        documentsIssued: updatedDocuments,
      };
      
      setEmployeeVisit(updatedVisit);
      
      if (documentType === 'Маршрутный лист') {
        alert('Маршрутный лист успешно сгенерирован и сохранен');
      }
    } catch (error) {
      console.error('Error issuing document:', error);
      alert('Ошибка при выдаче документа');
    } finally {
      setIsRegistering(false);
    }
  };

  // Фильтрация сотрудников
  const filteredEmployees = useMemo(() => {
    let employees = selectedContract?.employees || [];
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      employees = employees.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query) ||
        emp.id.includes(query)
      );
    }
    
    // Фильтр по статусу посещения
    if (filters.visitStatus !== 'all') {
      employees = employees.filter(emp => {
        const visit = visits.find(v => v.employeeId === emp.id);
        return visit?.status === filters.visitStatus;
      });
    }
    
    return employees;
  }, [selectedContract?.employees, searchQuery, filters.visitStatus, visits]);

  // Статистика посещений
  const visitsStats = useMemo(() => ({
    total: visits.length,
    inProgress: visits.filter(v => v.status === 'in_progress' || v.status === 'registered').length,
    completed: visits.filter(v => v.status === 'completed').length,
  }), [visits]);

  // Статистика по договорам
  const contractsStats = useMemo(() => ({
    total: contracts.length,
    execution: contracts.filter(c => c.status === 'execution').length,
    planning: contracts.filter(c => c.status === 'planning').length,
  }), [contracts]);

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
                    Регистратура
                  </span>
                  <span className="text-xs text-slate-500">
                    {currentUser.clinicName || currentUser.companyName || 'Клиника'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Real-time Stats */}
            <div className="hidden xl:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50">
                <BriefcaseIcon className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="text-xs text-blue-600 font-medium">Договоры</div>
                  <div className="text-sm font-bold text-blue-900">{contractsStats.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
                <UsersIcon className="w-4 h-4 text-slate-600" />
                <div className="text-left">
                  <div className="text-xs text-slate-500 font-medium">Сегодня</div>
                  <div className="text-sm font-bold text-slate-900">{visitsStats.total}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                <ClockIcon className="w-4 h-4 text-amber-600" />
                <div className="text-left">
                  <div className="text-xs text-amber-600 font-medium">В работе</div>
                  <div className="text-sm font-bold text-amber-900">{visitsStats.inProgress}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <div className="text-left">
                  <div className="text-xs text-green-600 font-medium">Завершено</div>
                  <div className="text-sm font-bold text-green-900">{visitsStats.completed}</div>
                </div>
              </div>
            </div>

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
                Обновлено: {lastUpdate.toLocaleTimeString('ru-RU')}
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
          {/* Левая панель: Договоры и список сотрудников (40%) */}
          <div className="xl:col-span-5 space-y-4">
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
                      <p className="text-xs text-slate-500">Выберите активный договор</p>
                    </div>
                  </div>
                </div>
                {contracts.length === 0 ? (
                  <div className="p-6 bg-amber-50/50 border border-amber-200/50 rounded-xl text-center">
                    <AlertCircleIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-800">Договоры не найдены</p>
                    <p className="text-xs text-amber-600 mt-1">Проверьте наличие активных договоров</p>
                  </div>
                ) : (
                  <select
                    value={selectedContract?.id || ''}
                    onChange={(e) => {
                      const contract = contracts.find(c => c.id === e.target.value);
                      setSelectedContract(contract || null);
                      setSelectedEmployee(null);
                      setEmployeeVisit(null);
                      setEmployeeRoute(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium bg-white shadow-sm transition-all"
                  >
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.number} — {contract.clientName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Детальная информация о договоре */}
              {selectedContract && (
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Номер договора</p>
                      <p className="text-sm font-bold text-slate-900">{selectedContract.number || '—'}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Дата</p>
                      <p className="text-sm font-bold text-slate-900">
                        {selectedContract.date ? new Date(selectedContract.date).toLocaleDateString('ru-RU') : '—'}
                      </p>
                    </div>
                    <div className="col-span-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Клиент</p>
                      <p className="text-sm font-bold text-slate-900">{selectedContract.clientName || '—'}</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1 font-medium">Сотрудников</p>
                      <p className="text-sm font-bold text-blue-900">
                        {selectedContract.employees?.length || 0} / {selectedContract.plannedHeadcount || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                      <p className="text-xs text-green-600 mb-1 font-medium">Статус</p>
                      <p className="text-xs font-bold text-green-900">
                        {selectedContract.status === 'execution' ? 'Исполнение' : 
                         selectedContract.status === 'planning' ? 'Планирование' : 
                         selectedContract.status}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Поиск и фильтры */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm p-5 space-y-3">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по ФИО, должности, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium shadow-sm transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filters.visitStatus}
                  onChange={(e) => setFilters({ ...filters, visitStatus: e.target.value as any })}
                  className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                >
                  <option value="all">Все статусы</option>
                  <option value="registered">Зарегистрированы</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Завершены</option>
                </select>
                
                <select
                  value={filters.dateFilter}
                  onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value as any })}
                  className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                >
                  <option value="today">Сегодня</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="all">Все время</option>
                </select>
              </div>
            </div>

            {/* Список сотрудников с виртуализацией */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Сотрудники</h2>
                      <p className="text-xs text-slate-500">{filteredEmployees.length} человек</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-h-[calc(100vh-600px)] min-h-[400px] overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-4">
                      <UserMdIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">Сотрудники не найдены</p>
                    <p className="text-xs text-slate-400 mt-1">Попробуйте изменить фильтры</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredEmployees.map(employee => {
                      const hasVisit = visits.some(v => v.employeeId === employee.id && v.status !== 'completed');
                      const isSelected = selectedEmployee?.id === employee.id;
                      return (
                        <button
                          key={employee.id}
                          onClick={() => handleCheckIn(employee)}
                          className={`w-full p-4 text-left hover:bg-blue-50/50 transition-all relative group ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-l-4 border-blue-500' 
                              : 'border-l-4 border-transparent hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{employee.name}</p>
                                {hasVisit && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                                    В работе
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 truncate">{employee.position}</p>
                              {employee.harmfulFactor && (
                                <p className="text-[10px] text-amber-600 mt-1 truncate" title={employee.harmfulFactor}>
                                  {employee.harmfulFactor}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {employee.status === 'fit' && (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              )}
                              {employee.status === 'unfit' && (
                                <XCircleIcon className="w-5 h-5 text-red-500" />
                              )}
                              {employee.status === 'needs_observation' && (
                                <ClockIcon className="w-5 h-5 text-amber-500" />
                              )}
                              {!employee.status && (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
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
          </div>

          {/* Правая панель: Информация о сотруднике и действия (60%) */}
          <div className="xl:col-span-7 space-y-4">
            {(selectedEmployee || selectedIndividualPatient) ? (
              <>
                {/* Информация о сотруднике */}
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                          {selectedEmployee?.name || selectedIndividualPatient?.fullName}
                        </h2>
                        <p className="text-sm text-slate-600">
                          {selectedEmployee?.position || selectedIndividualPatient?.position || 'Индивидуальный пациент'}
                        </p>
                      </div>
                      {employeeVisit && (
                        <div className="text-right ml-4">
                          <p className="text-xs text-slate-500 mb-1">Время входа</p>
                          <p className="text-sm font-bold text-slate-900">
                            {employeeVisit.checkInTime ? new Date(employeeVisit.checkInTime).toLocaleTimeString('ru-RU') : '—'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Дата рождения</p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedEmployee?.dob || selectedIndividualPatient?.dateOfBirth || '—'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 mb-1 font-medium">Пол</p>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedEmployee?.gender || selectedIndividualPatient?.gender || '—'}
                        </p>
                      </div>
                      {(selectedEmployee?.harmfulFactor || selectedIndividualPatient?.harmfulFactors) && (
                        <div className="col-span-2 p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                          <p className="text-xs text-amber-600 mb-1 font-bold">Вредные факторы</p>
                          <p className="text-sm font-medium text-amber-900">
                            {selectedEmployee?.harmfulFactor || selectedIndividualPatient?.harmfulFactors || '—'}
                          </p>
                        </div>
                      )}
                    </div>

                    {!employeeVisit && selectedEmployee && (
                      <button
                        onClick={() => handleCheckIn(selectedEmployee)}
                        disabled={isRegistering}
                        className="group relative w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {isRegistering ? (
                          <>
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                            Регистрация...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            Зарегистрировать вход
                          </>
                        )}
                      </button>
                    )}

                    {employeeVisit && employeeVisit.status !== 'completed' && (
                      <button
                        onClick={handleCheckOut}
                        className="group relative w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                      >
                        <ArrowRightIcon className="w-5 h-5" />
                        Зарегистрировать выход
                      </button>
                    )}
                  </div>
                </div>

                {/* Маршрут осмотра */}
                {employeeRoute && employeeRoute.routeItems.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Маршрут осмотра</h3>
                          <p className="text-xs text-slate-500">
                            Пройдено {employeeRoute.routeItems.filter(i => i.status === 'completed').length} из {employeeRoute.routeItems.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {employeeRoute.routeItems.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                              item.status === 'completed' 
                                ? 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-300 shadow-sm' 
                                : item.status === 'in_progress'
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-300 shadow-sm'
                                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                              item.status === 'completed'
                                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                : item.status === 'in_progress'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-600'
                            }`}>
                              {item.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm">{item.specialty}</p>
                              {item.doctorName && (
                                <p className="text-xs text-slate-600 mt-1">Врач: {item.doctorName}</p>
                              )}
                              {item.examinationDate && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  Осмотр: {new Date(item.examinationDate).toLocaleString('ru-RU')}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {item.status === 'completed' && (
                                <CheckCircleIcon className="w-7 h-7 text-green-500" />
                              )}
                              {item.status === 'in_progress' && (
                                <ClockIcon className="w-7 h-7 text-blue-500" />
                              )}
                              {item.status === 'pending' && (
                                <div className="w-7 h-7 rounded-full border-2 border-slate-300 bg-white" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Выданные документы */}
                {employeeVisit && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                          <FileTextIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Выданные документы</h3>
                          <p className="text-xs text-slate-500">
                            {employeeVisit.documentsIssued?.length || 0} документов
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {employeeVisit.documentsIssued && employeeVisit.documentsIssued.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {employeeVisit.documentsIssued.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-200/50">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FileTextIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-900 flex-1">{doc}</span>
                              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-4 p-6 bg-slate-50/50 rounded-xl border border-slate-200/50 text-center">
                          <FileTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-medium text-slate-500">Документы не выданы</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleIssueDocument('Направление на анализы')}
                          disabled={isRegistering}
                          className="group relative inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileTextIcon className="w-4 h-4" />
                          <span>Выдать направление</span>
                        </button>
                        <button
                          onClick={() => handleIssueDocument('Маршрутный лист')}
                          disabled={isRegistering}
                          className="group relative inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <DownloadIcon className="w-4 h-4" />
                          <span>Маршрутный лист</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm p-16 text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertCircleIcon className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Выберите сотрудника</h3>
                <p className="text-sm text-slate-500">Выберите сотрудника из списка для просмотра информации и регистрации</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDesk;
