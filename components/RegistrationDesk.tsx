import React, { useState, useEffect, useCallback } from 'react';
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
  BriefcaseIcon
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

  // Загрузка договоров клиники
  useEffect(() => {
    const loadContracts = async () => {
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
          // Выбираем договор в статусе исполнения, если есть, иначе первый
          const executionContract = activeContracts.find(c => c.status === 'execution');
          setSelectedContract(executionContract || activeContracts[0]);
        }
      } catch (error) {
        console.error('Error loading contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, [currentUser]);

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
  useEffect(() => {
    const loadRouteSheets = async () => {
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
        
        // Обновляем маршрут выбранного сотрудника, если он есть
        if (selectedEmployee) {
          const route = getEmployeeRoute(selectedEmployee.id);
          setEmployeeRoute(route);
        }
      } catch (error) {
        console.error('Error loading route sheets:', error);
      }
    };

    loadRouteSheets();
    
    // Обновляем маршрутные листы каждые 10 секунд для отслеживания прогресса
    const interval = setInterval(loadRouteSheets, 10000);
    return () => clearInterval(interval);
  }, [selectedContract, selectedEmployee?.id]);

  // Загрузка посещений за сегодня
  useEffect(() => {
    const loadVisits = async () => {
      if (!currentUser.clinicId && !currentUser.bin) return;

      try {
        const clinicId = currentUser.clinicId || currentUser.uid;
        const today = new Date().toISOString().split('T')[0];
        const visitsList = await apiListEmployeeVisits({
          clinicId,
          date: today,
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
      } catch (error) {
        console.error('Error loading visits:', error);
      }
    };

    loadVisits();
  }, [currentUser]);

  // Поиск сотрудника
  const filteredEmployees = selectedContract?.employees?.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.includes(searchQuery)
  ) || [];

  // Получение маршрута сотрудника
  const getEmployeeRoute = useCallback((employeeId: string): EmployeeRoute | null => {
    if (!routeSheets.length) return null;

    const routeItems: EmployeeRoute['routeItems'] = [];
    
    routeSheets.forEach(sheet => {
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
        // Создаем маршрутные листы для всех необходимых специализаций
        await createRouteSheetsForAllSpecialties(
          selectedContract.id,
          selectedContract.employees || [],
          doctors
        );
      }

      // Загружаем обновленные маршрутные листы
      const updatedSheets = await apiListRouteSheets({ contractId: contractIdNum });
      const sheets: DoctorRouteSheet[] = updatedSheets.map(s => ({
        id: String(s.id),
        doctorId: s.doctorId,
        contractId: String(s.contractId),
        specialty: s.specialty,
        virtualDoctor: s.virtualDoctor,
        employees: s.employees,
        createdAt: s.createdAt,
      }));
      setRouteSheets(sheets);

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

      // Обновляем список посещений
      const today = new Date().toISOString().split('T')[0];
      const visitsList = await apiListEmployeeVisits({
        clinicId,
        date: today,
      });
      setVisits(visitsList.map(v => ({
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
      })));
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

      // Обновляем список посещений
      const clinicId = currentUser.clinicId || currentUser.uid;
      const today = new Date().toISOString().split('T')[0];
      const visitsList = await apiListEmployeeVisits({
        clinicId,
        date: today,
      });
      setVisits(visitsList.map(v => ({
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
      })));
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

      // Если выдается маршрутный лист - генерируем PDF
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

  // Регистрация индивидуального пациента
  const handleRegisterIndividualPatient = async (patient: IndividualPatient) => {
    setIsRegistering(true);

    try {
      const clinicId = currentUser.clinicId || currentUser.uid;
      if (!clinicId) {
        alert('Ошибка: не указан ID клиники');
        setIsRegistering(false);
        return;
      }

      if (!patient.id) {
        alert('Ошибка: не указан ID пациента');
        setIsRegistering(false);
        return;
      }
      
      // Создаем посещение для индивидуального пациента
      const visit = await apiCreateEmployeeVisit({
        employeeId: patient.id,
        contractId: undefined, // Индивидуальный пациент
        clinicId,
        visitDate: new Date().toISOString().split('T')[0],
        status: 'registered',
        registeredBy: currentUser.uid,
        notes: `Индивидуальный пациент: ${patient.fullName}`,
      });

      const visitData: EmployeeVisit = {
        id: String(visit.id),
        employeeId: visit.employeeId,
        contractId: undefined,
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
      setSelectedIndividualPatient(patient);
      setShowIndividualPatientModal(false);

      // Для индивидуальных пациентов создаем базовый маршрут (профпатолог + терапевт)
      const route: EmployeeRoute = {
        employeeId: patient.id,
        contractId: undefined,
        visitId: visitData.id,
        routeItems: [
          {
            specialty: 'Профпатолог',
            status: 'pending',
            order: 1,
          },
          {
            specialty: 'Терапевт',
            status: 'pending',
            order: 2,
          },
        ],
      };
      setEmployeeRoute(route);
    } catch (error) {
      console.error('Error registering individual patient:', error);
      alert('Ошибка при регистрации пациента');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('medwork_uid');
    localStorage.removeItem('medwork_phone');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderIcon className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Статистика посещений
  const visitsStats = {
    total: visits.length,
    inProgress: visits.filter(v => v.status === 'in_progress' || v.status === 'registered').length,
    completed: visits.filter(v => v.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - унифицированный стиль с Dashboard */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Info */}
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <BrandLogo size="sm" />
              </div>
              
              <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    Регистратура
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {currentUser.clinicName || 'Клиника'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Stats */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500">Всего сегодня</div>
                <div className="text-sm font-bold text-slate-900">{visitsStats.total}</div>
              </div>
              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-600">В работе</div>
                <div className="text-sm font-bold text-blue-700">{visitsStats.inProgress}</div>
              </div>
              <div className="px-4 py-2 bg-green-50 rounded-lg">
                <div className="text-xs text-green-600">Завершено</div>
                <div className="text-sm font-bold text-green-700">{visitsStats.completed}</div>
              </div>
            </div>

            {/* Right: Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogoutIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">Выход</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая панель: Выбор договора и список сотрудников */}
          <div className="lg:col-span-1 space-y-4">
            {/* Выбор договора с детальной информацией */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-semibold text-slate-900">
                    Договор
                  </label>
                </div>
                {contracts.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 text-center">
                      Договоры не найдены. Проверьте, что у клиники есть активные договоры.
                    </p>
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
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                  >
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.number} - {contract.clientName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Детальная информация о договоре */}
              {selectedContract && (
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Номер</p>
                      <p className="font-semibold text-slate-900">{selectedContract.number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Дата</p>
                      <p className="font-semibold text-slate-900">
                        {selectedContract.date ? new Date(selectedContract.date).toLocaleDateString('ru-RU') : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Клиент</p>
                      <p className="font-semibold text-slate-900 truncate">{selectedContract.clientName || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Сотрудников</p>
                      <p className="font-semibold text-slate-900">
                        {selectedContract.employees?.length || 0} / {selectedContract.plannedHeadcount || 0}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Статус</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        selectedContract.status === 'execution' 
                          ? 'bg-green-100 text-green-700'
                          : selectedContract.status === 'planning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedContract.status === 'execution' ? 'Исполнение' : 
                         selectedContract.status === 'planning' ? 'Планирование' : 
                         selectedContract.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Поиск сотрудника */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по ФИО, должности, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Список сотрудников */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">
                    Сотрудники
                  </h2>
                  <span className="px-2.5 py-1 bg-white rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                    {filteredEmployees.length}
                  </span>
                </div>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center">
                    <UserMdIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Сотрудники не найдены</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredEmployees.map(employee => {
                      const hasVisit = visits.some(v => v.employeeId === employee.id && v.status !== 'completed');
                      return (
                        <button
                          key={employee.id}
                          onClick={() => handleCheckIn(employee)}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-all ${
                            selectedEmployee?.id === employee.id 
                              ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm' 
                              : 'hover:border-l-4 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-slate-900 truncate">{employee.name}</p>
                                {hasVisit && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                                    В работе
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 truncate">{employee.position}</p>
                              {employee.harmfulFactor && (
                                <p className="text-xs text-amber-600 mt-1 truncate" title={employee.harmfulFactor}>
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

          {/* Правая панель: Информация о сотруднике и маршрут */}
          <div className="lg:col-span-2 space-y-4">
            {(selectedEmployee || selectedIndividualPatient) ? (
              <>
                {/* Информация о сотруднике/пациенте */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
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
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Дата рождения</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedEmployee?.dob || selectedIndividualPatient?.dateOfBirth || '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Пол</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedEmployee?.gender || selectedIndividualPatient?.gender || '—'}
                        </p>
                      </div>
                      {(selectedEmployee?.harmfulFactor || selectedIndividualPatient?.harmfulFactors) && (
                        <div className="col-span-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-600 mb-1 font-semibold">Вредные факторы</p>
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
                        className="group relative w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                    {employeeVisit && employeeVisit.status === 'in_progress' && (
                      <button
                        onClick={handleCheckOut}
                        className="group relative w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <ArrowRightIcon className="w-5 h-5" />
                        Зарегистрировать выход
                      </button>
                    )}
                  </div>
                </div>

                {/* Маршрут осмотра */}
                {employeeRoute && employeeRoute.routeItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Маршрут осмотра
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {employeeRoute.routeItems.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                              item.status === 'completed' 
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-sm' 
                                : item.status === 'in_progress'
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                              item.status === 'completed'
                                ? 'bg-green-500 text-white'
                                : item.status === 'in_progress'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-600'
                            }`}>
                              {item.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-base">{item.specialty}</p>
                              {item.doctorName && (
                                <p className="text-sm text-slate-600 mt-1">Врач: {item.doctorName}</p>
                              )}
                              {item.roomNumber && (
                                <p className="text-sm text-slate-600">Кабинет: {item.roomNumber}</p>
                              )}
                              {item.examinationDate && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Осмотр: {new Date(item.examinationDate).toLocaleString('ru-RU')}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {item.status === 'completed' && (
                                <CheckCircleIcon className="w-7 h-7 text-green-500" />
                              )}
                              {item.status === 'in_progress' && (
                                <ClockIcon className="w-7 h-7 text-blue-500 animate-spin" />
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
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-blue-600" />
                        Выданные документы
                      </h3>
                    </div>
                    <div className="p-6">
                      {employeeVisit.documentsIssued && employeeVisit.documentsIssued.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {employeeVisit.documentsIssued.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FileTextIcon className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-slate-900 flex-1">{doc}</span>
                              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                          <FileTextIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Документы не выданы</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleIssueDocument('Направление на анализы')}
                          disabled={isRegistering}
                          className="group relative inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileTextIcon className="w-4 h-4" />
                          <span>Выдать направление</span>
                        </button>
                        <button
                          onClick={() => handleIssueDocument('Маршрутный лист')}
                          disabled={isRegistering}
                          className="group relative inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FileTextIcon className="w-4 h-4" />
                          <span>Выдать маршрутный лист</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <AlertCircleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Выберите сотрудника для просмотра информации</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDesk;

