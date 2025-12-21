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
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  BellIcon,
  UsersIcon
} from './Icons';
import BrandLogo from './BrandLogo';
import {
  apiListContractsByBin,
  apiGetContract,
  apiListRouteSheets,
  apiCreateEmployeeVisit,
  apiUpdateEmployeeVisit,
  apiListEmployeeVisits,
  apiListDoctors,
} from '../services/api';

interface RegistrationDeskSimpleProps {
  currentUser: UserProfile;
}

const RegistrationDeskSimple: React.FC<RegistrationDeskSimpleProps> = ({ currentUser }) => {
  // Состояния
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [employeeVisit, setEmployeeVisit] = useState<EmployeeVisit | null>(null);
  const [employeeRoute, setEmployeeRoute] = useState<EmployeeRoute | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [visits, setVisits] = useState<EmployeeVisit[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
        const contractsData: Contract[] = contractsList
          .filter(c => c.status === 'execution' || c.status === 'planning')
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
      } catch (error) {
        console.error('Error loading contracts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, [currentUser]);

  // Загрузка врачей
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

  // Загрузка посещений за сегодня
  useEffect(() => {
    const loadVisits = async () => {
      if (!currentUser.clinicId && !currentUser.bin) return;

      try {
        const clinicId = currentUser.clinicId || currentUser.uid;
        const dateToday = new Date().toISOString().split('T')[0];
        
        const visitsList = await apiListEmployeeVisits({
          clinicId,
          date: dateToday,
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
    const interval = setInterval(loadVisits, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Поиск сотрудника
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSelectedEmployee(null);
      setSelectedContract(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Ищем сотрудника во всех договорах
    for (const contract of contracts) {
      const employee = contract.employees?.find(emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.phone?.includes(query) ||
        emp.id.includes(query)
      );

      if (employee) {
        setSelectedEmployee(employee);
        setSelectedContract(contract);
        
        // Проверяем есть ли активное посещение
        const activeVisit = visits.find(v => 
          v.employeeId === employee.id && 
          v.status !== 'completed' && 
          v.status !== 'cancelled'
        );
        setEmployeeVisit(activeVisit || null);
        
        return;
      }
    }

    alert('Сотрудник не найден в базе');
    setSelectedEmployee(null);
    setSelectedContract(null);
  }, [searchQuery, contracts, visits]);

  // Регистрация входа
  const handleCheckIn = async () => {
    if (!selectedEmployee || !selectedContract) return;
    
    setIsProcessing(true);
    try {
      const clinicId = currentUser.clinicId || currentUser.uid;
      const contractIdNum = parseInt(selectedContract.id, 10);
      
      const visitData = {
        employeeId: selectedEmployee.id,
        contractId: contractIdNum,
        clinicId,
        visitDate: new Date().toISOString(),
        checkInTime: new Date().toISOString(),
        status: 'registered' as const,
        registeredBy: currentUser.uid,
      };

      const newVisit = await apiCreateEmployeeVisit(visitData);
      const visit: EmployeeVisit = {
        id: String(newVisit.id),
        employeeId: newVisit.employeeId,
        contractId: String(newVisit.contractId),
        clinicId: newVisit.clinicId,
        visitDate: newVisit.visitDate,
        checkInTime: newVisit.checkInTime,
        status: newVisit.status,
        registeredBy: newVisit.registeredBy,
        createdAt: newVisit.createdAt,
        updatedAt: newVisit.updatedAt,
      };

      setEmployeeVisit(visit);
      
      // Отправляем уведомление
      const { notificationService } = await import('../services/notificationService');
      await notificationService.notifyVisitRegistered(
        selectedEmployee.id,
        selectedEmployee.name,
        currentUser.companyName || 'Регистратура'
      );

      alert('Сотрудник зарегистрирован на осмотр');
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Ошибка при регистрации');
    } finally {
      setIsProcessing(false);
    }
  };

  // Обновление маршрута
  const handleUpdateRoute = async () => {
    if (!selectedEmployee || !selectedContract) return;
    
    setIsProcessing(true);
    try {
      const contractIdNum = parseInt(selectedContract.id, 10);
      const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });

      const routeItems: EmployeeRoute['routeItems'] = [];
      apiSheets.forEach(sheet => {
        const empInSheet = sheet.employees.find(e => e.employeeId === selectedEmployee.id);
        if (empInSheet) {
          const doctor = doctors.find(d => d.id === sheet.doctorId);
          routeItems.push({
            specialty: sheet.specialty || 'Не указано',
            doctorId: sheet.doctorId,
            doctorName: doctor?.name,
            roomNumber: doctor?.roomNumber,
            status: empInSheet.status === 'completed' ? 'completed' : 'pending',
            order: routeItems.length + 1,
          });
        }
      });

      routeItems.sort((a, b) => a.order - b.order);
      
      const route: EmployeeRoute = {
        employeeId: selectedEmployee.id,
        contractId: selectedContract.id,
        visitId: employeeVisit?.id,
        routeItems,
      };

      setEmployeeRoute(route);

      // Отправляем уведомление с маршрутом
      const { notificationService } = await import('../services/notificationService');
      await notificationService.notifyRouteUpdated(
        selectedEmployee.id,
        selectedEmployee.name,
        currentUser.companyName || 'Регистратура',
        { route: routeItems, clinicName: currentUser.clinicName }
      );

      alert('Маршрут обновлен и отправлен сотруднику');
    } catch (error) {
      console.error('Error updating route:', error);
      alert('Ошибка при обновлении маршрута');
    } finally {
      setIsProcessing(false);
    }
  };

  // Выдача направления
  const handleIssueReferral = async (referralType: string) => {
    if (!employeeVisit || !selectedEmployee) return;
    
    setIsProcessing(true);
    try {
      const visitId = parseInt(employeeVisit.id, 10);
      const updatedDocuments = [...(employeeVisit.documentsIssued || []), `Направление: ${referralType}`];
      
      await apiUpdateEmployeeVisit(visitId, {
        documentsIssued: updatedDocuments,
      });

      setEmployeeVisit({
        ...employeeVisit,
        documentsIssued: updatedDocuments,
      });

      // Отправляем уведомление
      const { notificationService } = await import('../services/notificationService');
      await notificationService.notifyDocumentIssued(
        selectedEmployee.id,
        `Направление: ${referralType}`,
        currentUser.companyName || 'Регистратура',
        { type: referralType }
      );

      alert(`Направление на ${referralType} выдано`);
    } catch (error) {
      console.error('Error issuing referral:', error);
      alert('Ошибка при выдаче направления');
    } finally {
      setIsProcessing(false);
    }
  };

  // Регистрация выхода
  const handleCheckOut = async () => {
    if (!employeeVisit) return;
    
    setIsProcessing(true);
    try {
      const visitId = parseInt(employeeVisit.id, 10);
      await apiUpdateEmployeeVisit(visitId, {
        checkOutTime: new Date().toISOString(),
        status: 'completed',
      });

      setEmployeeVisit(null);
      setSelectedEmployee(null);
      setSelectedContract(null);
      setEmployeeRoute(null);
      setSearchQuery('');

      alert('Сотрудник завершил осмотр');
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Ошибка при регистрации выхода');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <LoaderIcon className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Шапка */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BrandLogo />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Регистратура</h1>
                <p className="text-sm text-slate-600">{currentUser.clinicName || currentUser.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{currentUser.leaderName || 'Администратор'}</p>
                <p className="text-xs text-slate-500">Регистратор</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogoutIcon className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка: Поиск и информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Поиск сотрудника */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Поиск сотрудника</h2>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="ФИО, ИИН, телефон..."
                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg"
                >
                  Найти
                </button>
              </div>
            </div>

            {/* Информация о сотруднике */}
            {selectedEmployee && selectedContract ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{selectedEmployee.position}</p>
                      <p className="text-sm text-slate-600">Организация: {selectedContract.clientName}</p>
                    </div>
                    <div className="text-right">
                      {employeeVisit ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Зарегистрирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700">
                          <AlertCircleIcon className="w-4 h-4 mr-1" />
                          Не зарегистрирован
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {!employeeVisit ? (
                    <>
                      {/* Регистрация входа */}
                      <button
                        onClick={handleCheckIn}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CheckShieldIcon className="w-5 h-5" />
                            Зарегистрировать вход
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Обновление маршрута */}
                      <button
                        onClick={handleUpdateRoute}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <RefreshIcon className="w-5 h-5" />
                            Обновить и отправить маршрут
                          </>
                        )}
                      </button>

                      {/* Выдача направлений */}
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Выдача направлений:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleIssueReferral('Анализы крови')}
                            disabled={isProcessing}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 text-sm"
                          >
                            Анализы
                          </button>
                          <button
                            onClick={() => handleIssueReferral('Флюорография')}
                            disabled={isProcessing}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 text-sm"
                          >
                            ФЛГ
                          </button>
                          <button
                            onClick={() => handleIssueReferral('ЭКГ')}
                            disabled={isProcessing}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 text-sm"
                          >
                            ЭКГ
                          </button>
                          <button
                            onClick={() => handleIssueReferral('Другое')}
                            disabled={isProcessing}
                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 text-sm"
                          >
                            Другое
                          </button>
                        </div>
                      </div>

                      {/* Выданные документы */}
                      {employeeVisit.documentsIssued && employeeVisit.documentsIssued.length > 0 && (
                        <div className="border-t border-slate-200 pt-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Выданные направления:</h4>
                          <div className="space-y-1">
                            {employeeVisit.documentsIssued.map((doc, idx) => (
                              <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                {doc}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Маршрут */}
                      {employeeRoute && employeeRoute.routeItems.length > 0 && (
                        <div className="border-t border-slate-200 pt-4">
                          <h4 className="text-sm font-bold text-slate-700 mb-2">Маршрут осмотра:</h4>
                          <div className="space-y-2">
                            {employeeRoute.routeItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{item.specialty}</p>
                                  {item.doctorName && (
                                    <p className="text-xs text-slate-600">{item.doctorName}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {item.roomNumber && (
                                    <p className="text-xs text-slate-600">Каб. {item.roomNumber}</p>
                                  )}
                                  {item.status === 'completed' ? (
                                    <span className="text-xs text-green-600 font-semibold">✓ Пройдено</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600 font-semibold">В очереди</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Регистрация выхода */}
                      <div className="border-t border-slate-200 pt-4">
                        <button
                          onClick={handleCheckOut}
                          disabled={isProcessing}
                          className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isProcessing ? (
                            <LoaderIcon className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <LogoutIcon className="w-5 h-5" />
                              Завершить осмотр (выход)
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Используйте поиск для регистрации сотрудника</p>
              </div>
            )}
          </div>

          {/* Правая колонка: Сегодняшние посещения */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Сегодня</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                  {visits.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {visits.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Пока нет посещений</p>
                ) : (
                  visits.map((visit) => {
                    const contract = contracts.find(c => c.id === visit.contractId);
                    const employee = contract?.employees?.find(e => e.id === visit.employeeId);
                    
                    return (
                      <div
                        key={visit.id}
                        className={`p-3 rounded-lg border ${
                          visit.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : visit.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {employee?.name || 'Неизвестно'}
                        </p>
                        <p className="text-xs text-slate-600">{contract?.clientName || ''}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-500">
                            {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                          <span className={`text-xs font-semibold ${
                            visit.status === 'completed'
                              ? 'text-green-700'
                              : visit.status === 'in_progress'
                              ? 'text-blue-700'
                              : 'text-yellow-700'
                          }`}>
                            {visit.status === 'completed' ? 'Завершен' : visit.status === 'in_progress' ? 'В процессе' : 'Зарегистрирован'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDeskSimple;

