import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Contract, Employee, EmployeeRoute, DoctorRouteSheet, AmbulatoryCard } from '../types';
import { 
  LoaderIcon, 
  LogoutIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  FileTextIcon,
  UserMdIcon,
  AlertCircleIcon,
  RefreshIcon,
  BellIcon
} from './Icons';
import BrandLogo from './BrandLogo';
import AmbulatoryCardView from './AmbulatoryCardView';
import {
  apiGetContract,
  apiListRouteSheets,
  apiGetAmbulatoryCard,
  apiListDoctors,
} from '../services/api';

interface EmployeePortalProps {
  currentUser: UserProfile;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ currentUser }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [employeeRoute, setEmployeeRoute] = useState<EmployeeRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Загрузка данных
  const loadData = async () => {
    if (!currentUser.employeeId) {
      setIsLoading(false);
      return;
    }

    try {
      // Если есть contractId - загружаем договор
      if (currentUser.contractId) {
        const contractIdNum = parseInt(currentUser.contractId, 10);
        if (!isNaN(contractIdNum)) {
          const apiContract = await apiGetContract(contractIdNum);
          if (apiContract) {
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
              documents: apiContract.documents || [],
              calendarPlan: apiContract.calendarPlan,
            };
            setContract(contractData);

            const emp = contractData.employees?.find(e => e.id === currentUser.employeeId);
            if (emp) {
              setEmployee(emp);
            }

            // Загружаем маршрутные листы
            const apiSheets = await apiListRouteSheets({ contractId: contractIdNum });
            
            const routeItems: EmployeeRoute['routeItems'] = [];
            apiSheets.forEach(sheet => {
              const empInSheet = sheet.employees.find(e => e.employeeId === currentUser.employeeId);
              if (empInSheet) {
                routeItems.push({
                  specialty: sheet.specialty || 'Не указано',
                  doctorId: sheet.virtualDoctor ? undefined : sheet.doctorId,
                  status: empInSheet.status === 'completed' ? 'completed' : 'pending',
                  examinationDate: empInSheet.examinationDate,
                  order: routeItems.length + 1,
                });
              }
            });

            if (routeItems.length > 0) {
              setEmployeeRoute({
                employeeId: currentUser.employeeId,
                contractId: currentUser.contractId,
                routeItems: routeItems.sort((a, b) => a.order - b.order),
              });
            }
          }
        }
      } else {
        // Для индивидуальных пациентов
        setEmployeeRoute({
          employeeId: currentUser.employeeId,
          contractId: undefined,
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
        });

        setEmployee({
          id: currentUser.employeeId,
          name: currentUser.leaderName || 'Индивидуальный пациент',
          dob: '',
          gender: 'М',
          site: '',
          position: '',
          harmfulFactor: '',
          status: 'pending',
        });
      }

      // Загружаем амбулаторную карту
      const contractIdNum = currentUser.contractId ? parseInt(currentUser.contractId, 10) : null;
      const apiCard = await apiGetAmbulatoryCard(
        currentUser.employeeId, 
        !isNaN(contractIdNum as number) ? contractIdNum : null
      );
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
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 15000); // Обновляем каждые 15 секунд
      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentUser]);

  // Статистика осмотров
  const examinationStats = useMemo(() => ({
    total: employeeRoute?.routeItems.length || 0,
    completed: employeeRoute?.routeItems.filter(r => r.status === 'completed').length || 0,
    pending: employeeRoute?.routeItems.filter(r => r.status === 'pending').length || 0,
    progress: employeeRoute?.routeItems.length 
      ? Math.round((employeeRoute.routeItems.filter(r => r.status === 'completed').length / employeeRoute.routeItems.length) * 100)
      : 0,
  }), [employeeRoute?.routeItems]);

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

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircleIcon className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Данные не найдены</h2>
          <p className="text-slate-600 mb-4">
            Не удалось загрузить информацию о пациенте.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Современный минималистичный Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo and Info */}
            <div className="flex items-center gap-6">
              <BrandLogo size="sm" />
              
              <div className="hidden md:flex items-center gap-4 pl-6 border-l border-slate-200">
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-900">
                    Моя амбулаторная карта
                  </span>
                  <span className="text-xs text-slate-500">
                    {employee.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Progress */}
            {employeeRoute && employeeRoute.routeItems.length > 0 && (
              <div className="hidden xl:flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-slate-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - examinationStats.progress / 100)}`}
                        className="text-blue-600 transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-900">{examinationStats.progress}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Прогресс осмотра</p>
                    <p className="text-sm font-bold text-slate-900">
                      {examinationStats.completed} из {examinationStats.total}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                  <ClockIcon className="w-4 h-4 text-amber-600" />
                  <div className="text-left">
                    <div className="text-xs text-amber-600 font-medium">Ожидают</div>
                    <div className="text-sm font-bold text-amber-900">{examinationStats.pending}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <div className="text-left">
                    <div className="text-xs text-green-600 font-medium">Пройдено</div>
                    <div className="text-sm font-bold text-green-900">{examinationStats.completed}</div>
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

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {/* Информация о пациенте */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-slate-50/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{employee.name}</h2>
                <p className="text-sm text-slate-600">{employee.position || 'Пациент'}</p>
              </div>
              {contract && (
                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500 mb-1">Организация</p>
                  <p className="text-sm font-bold text-slate-900">{contract.clientName}</p>
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-medium">Дата рождения</p>
                <p className="text-sm font-bold text-slate-900">{employee.dob || '—'}</p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1 font-medium">Пол</p>
                <p className="text-sm font-bold text-slate-900">{employee.gender || '—'}</p>
              </div>
              <div className="col-span-2 p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl border border-amber-200/50">
                <p className="text-xs text-amber-600 mb-1 font-bold">Вредные факторы</p>
                <p className="text-sm font-medium text-amber-900">{employee.harmfulFactor || 'Не указаны'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Маршрут осмотра */}
        {employeeRoute && employeeRoute.routeItems.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Маршрут осмотра</h2>
                    <p className="text-xs text-slate-500">
                      Пройдено {examinationStats.completed} из {examinationStats.total} специалистов
                    </p>
                  </div>
                </div>
                
                {/* Прогресс бар */}
                <div className="hidden md:block w-48">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                      style={{ width: `${examinationStats.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-right mt-1">{examinationStats.progress}% завершено</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {employeeRoute.routeItems.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                      item.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-50 to-green-100/50 border-green-300 shadow-sm' 
                        : item.status === 'in_progress'
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-300 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${
                      item.status === 'completed'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                        : item.status === 'in_progress'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-600'
                    }`}>
                      {item.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-base mb-1">{item.specialty}</p>
                      {item.doctorName && (
                        <p className="text-sm text-slate-600">Врач: {item.doctorName}</p>
                      )}
                      {item.examinationDate && (
                        <p className="text-xs text-slate-500 mt-1">
                          Осмотр: {new Date(item.examinationDate).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {item.status === 'completed' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-8 h-8 text-green-500" />
                          <span className="text-sm font-bold text-green-700">Пройдено</span>
                        </div>
                      ) : item.status === 'in_progress' ? (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-8 h-8 text-blue-500 animate-pulse" />
                          <span className="text-sm font-bold text-blue-700">В процессе</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-slate-300 bg-white" />
                          <span className="text-sm font-bold text-slate-500">Ожидает</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Амбулаторная карта */}
        {ambulatoryCard ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                  <FileTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Амбулаторная карта</h2>
                  <p className="text-xs text-slate-500">Форма № 025/у</p>
                </div>
              </div>
            </div>
            <AmbulatoryCardView 
              card={ambulatoryCard} 
              contract={contract} 
              doctors={[]} 
            />
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-sm p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mx-auto mb-6">
              <FileTextIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Амбулаторная карта не создана</h3>
            <p className="text-sm text-slate-500">Карта будет создана при первом осмотре врачом</p>
          </div>
        )}

        {/* Уведомления и напоминания */}
        {examinationStats.pending > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/50 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <BellIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900 mb-1">Напоминание</h3>
                <p className="text-sm text-amber-800">
                  У вас осталось {examinationStats.pending} {examinationStats.pending === 1 ? 'осмотр' : 'осмотра'} для прохождения. 
                  Пожалуйста, пройдите все необходимые обследования.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;
