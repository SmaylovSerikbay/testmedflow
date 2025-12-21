import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Contract, Employee, EmployeeVisit, EmployeeRoute, DoctorRouteSheet } from '../types';
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
  AlertCircleIcon
} from './Icons';
import {
  apiListContractsByBin,
  apiGetContract,
  apiListRouteSheets,
  apiGetAmbulatoryCard,
  apiListAmbulatoryCardsByContract,
} from '../services/api';

interface RegistrationDeskProps {
  currentUser: UserProfile;
}

const RegistrationDesk: React.FC<RegistrationDeskProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeRoute, setEmployeeRoute] = useState<EmployeeRoute | null>(null);
  const [employeeVisit, setEmployeeVisit] = useState<EmployeeVisit | null>(null);
  const [routeSheets, setRouteSheets] = useState<DoctorRouteSheet[]>([]);

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
        
        setContracts(contractsData.filter(c => c.status === 'execution' || c.status === 'planning'));
        if (contractsData.length > 0) {
          setSelectedContract(contractsData[0]);
        }
      } catch (error) {
        console.error('Error loading contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
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
      } catch (error) {
        console.error('Error loading route sheets:', error);
      }
    };

    loadRouteSheets();
  }, [selectedContract]);

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

    // TODO: Вызов API для создания записи о посещении
    const visit: EmployeeVisit = {
      id: `visit_${Date.now()}`,
      employeeId: employee.id,
      contractId: selectedContract.id,
      visitDate: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toISOString(),
      status: 'in_progress',
      registeredBy: currentUser.uid,
    };

    setEmployeeVisit(visit);
    setSelectedEmployee(employee);
    
    const route = getEmployeeRoute(employee.id);
    setEmployeeRoute(route);
  };

  // Регистрация выхода сотрудника
  const handleCheckOut = async () => {
    if (!employeeVisit) return;

    // TODO: Вызов API для обновления записи о посещении
    const updatedVisit: EmployeeVisit = {
      ...employeeVisit,
      checkOutTime: new Date().toISOString(),
      status: 'completed',
    };

    setEmployeeVisit(updatedVisit);
  };

  // Выдача документов
  const handleIssueDocument = (documentType: string) => {
    // TODO: Логика выдачи документов
    if (!employeeVisit) return;
    
    const updatedVisit: EmployeeVisit = {
      ...employeeVisit,
      documentsIssued: [...(employeeVisit.documentsIssued || []), documentType],
    };
    
    setEmployeeVisit(updatedVisit);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Регистратура</h1>
              <p className="text-sm text-slate-600 mt-1">Регистрация сотрудников на медосмотр</p>
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

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая панель: Выбор договора и список сотрудников */}
          <div className="lg:col-span-1 space-y-4">
            {/* Выбор договора */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Договор
              </label>
              <select
                value={selectedContract?.id || ''}
                onChange={(e) => {
                  const contract = contracts.find(c => c.id === e.target.value);
                  setSelectedContract(contract || null);
                  setSelectedEmployee(null);
                  setEmployeeVisit(null);
                  setEmployeeRoute(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.number} - {contract.clientName}
                  </option>
                ))}
              </select>
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
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">
                  Сотрудники ({filteredEmployees.length})
                </h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Сотрудники не найдены
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        onClick={() => handleCheckIn(employee)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          selectedEmployee?.id === employee.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{employee.name}</p>
                            <p className="text-sm text-slate-600 mt-1">{employee.position}</p>
                            <p className="text-xs text-slate-400 mt-1">ID: {employee.id}</p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {employee.status === 'fit' && (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            )}
                            {employee.status === 'unfit' && (
                              <XCircleIcon className="w-5 h-5 text-red-500" />
                            )}
                            {employee.status === 'needs_observation' && (
                              <ClockIcon className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая панель: Информация о сотруднике и маршрут */}
          <div className="lg:col-span-2 space-y-4">
            {selectedEmployee ? (
              <>
                {/* Информация о сотруднике */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedEmployee.name}</h2>
                      <p className="text-sm text-slate-600 mt-1">{selectedEmployee.position}</p>
                    </div>
                    {employeeVisit && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Время входа:</p>
                        <p className="text-sm font-medium text-slate-900">
                          {employeeVisit.checkInTime ? new Date(employeeVisit.checkInTime).toLocaleTimeString('ru-RU') : '—'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Дата рождения</p>
                      <p className="text-sm font-medium text-slate-900">{selectedEmployee.dob || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Пол</p>
                      <p className="text-sm font-medium text-slate-900">{selectedEmployee.gender}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Вредные факторы</p>
                      <p className="text-sm font-medium text-amber-600 mt-1">{selectedEmployee.harmfulFactor || '—'}</p>
                    </div>
                  </div>

                  {!employeeVisit && (
                    <button
                      onClick={() => handleCheckIn(selectedEmployee)}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Зарегистрировать вход
                    </button>
                  )}

                  {employeeVisit && employeeVisit.status === 'in_progress' && (
                    <button
                      onClick={handleCheckOut}
                      className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRightIcon className="w-5 h-5" />
                      Зарегистрировать выход
                    </button>
                  )}
                </div>

                {/* Маршрут осмотра */}
                {employeeRoute && employeeRoute.routeItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      Маршрут осмотра
                    </h3>
                    <div className="space-y-3">
                      {employeeRoute.routeItems.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                            item.status === 'completed' 
                              ? 'bg-green-50 border-green-200' 
                              : item.status === 'in_progress'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center font-bold text-slate-600">
                            {item.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">{item.specialty}</p>
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
                              <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            )}
                            {item.status === 'in_progress' && (
                              <ClockIcon className="w-6 h-6 text-blue-500 animate-spin" />
                            )}
                            {item.status === 'pending' && (
                              <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Выданные документы */}
                {employeeVisit && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <FileTextIcon className="w-5 h-5" />
                      Выданные документы
                    </h3>
                    {employeeVisit.documentsIssued && employeeVisit.documentsIssued.length > 0 ? (
                      <div className="space-y-2">
                        {employeeVisit.documentsIssued.map((doc, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <FileTextIcon className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-900">{doc}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Документы не выданы</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleIssueDocument('Направление на анализы')}
                        className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Выдать направление
                      </button>
                      <button
                        onClick={() => handleIssueDocument('Маршрутный лист')}
                        className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Выдать маршрутный лист
                      </button>
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

