import React, { useState, useEffect } from 'react';
import { UserProfile, Contract, AmbulatoryCard, Doctor, DoctorRouteSheet } from '../types';
import { rtdb, ref, get, onValue } from '../services/firebase';
import { LoaderIcon, UserMdIcon, FileTextIcon, CheckShieldIcon, CalendarIcon, ClockIcon } from './Icons';
import { FACTOR_RULES, FactorRule } from '../factorRules';

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

        // Загружаем амбулаторную карту
        const cardRef = ref(rtdb, `ambulatoryCards/${currentUser.employeeId}_${currentUser.contractId}`);
        const cardSnapshot = await get(cardRef);
        if (cardSnapshot.exists()) {
          setAmbulatoryCard({ ...cardSnapshot.val() } as AmbulatoryCard);
        }

        // Подписываемся на обновления амбулаторной карты
        const unsubscribe = onValue(cardRef, (snapshot) => {
          if (snapshot.exists()) {
            setAmbulatoryCard({ ...snapshot.val() } as AmbulatoryCard);
          }
        });

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

        return () => unsubscribe();
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
    }> = [];

    routeSheets.forEach(sheet => {
      const empInSheet = sheet.employees?.find(
        (emp: any) => emp.employeeId === currentUser.employeeId
      );
      if (empInSheet) {
        // Находим врача по doctorId
        const doctor = doctors.find(d => d.id === sheet.doctorId);
        employeeInSheets.push({
          doctorId: sheet.doctorId,
          specialty: doctor?.specialty || 'Не указано',
          doctorName: doctor?.name,
          examinationDate: empInSheet.examinationDate,
          status: empInSheet.status || 'pending'
        });
      }
    });

    // Если есть врачи в маршрутных листах, возвращаем их
    if (employeeInSheets.length > 0) {
      return employeeInSheets;
    }

    // Если врачи еще не назначены, определяем специализации по вредным факторам
    if (employee.harmfulFactor) {
      const rules = resolveFactorRules(employee.harmfulFactor);
      const specialties = new Set<string>();
      rules.forEach(rule => {
        rule.specialties.forEach(spec => specialties.add(spec));
      });
      
      return Array.from(specialties).map(specialty => ({
        doctorId: '',
        specialty: specialty,
        doctorName: undefined,
        examinationDate: undefined,
        status: 'pending'
      }));
    }

    return null;
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
            <div className="text-right">
              <p className="text-sm text-slate-600">Организация: {contract.clientName}</p>
              <p className="text-sm text-slate-600">Клиника: {contract.clinicName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Маршрутный лист */}
        {(() => {
          const routeInfo = getEmployeeRouteInfo();
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

        {/* Осмотры врачей */}
        {ambulatoryCard && Object.keys(ambulatoryCard.examinations).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileTextIcon className="w-5 h-5" />
              Осмотры врачей
            </h2>
            <div className="space-y-4">
              {Object.entries(ambulatoryCard.examinations).map(([specialty, examination]) => (
                <div key={specialty} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{getDoctorName(specialty)}</h3>
                    {examination.status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckShieldIcon className="w-3 h-3 mr-1" />
                        Завершен
                      </span>
                    )}
                  </div>
                  {examination.status === 'completed' && (
                    <>
                      {examination.conclusion && (
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 mb-1">Заключение:</p>
                          <p className="text-sm text-slate-900">{examination.conclusion}</p>
                        </div>
                      )}
                      {examination.recommendations && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Рекомендации:</p>
                          <p className="text-sm text-slate-900">{examination.recommendations}</p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-3">
                        Дата осмотра: {new Date(examination.date).toLocaleDateString('ru-RU')}
                      </p>
                    </>
                  )}
                  {examination.status === 'pending' && (
                    <p className="text-sm text-slate-500 italic">Ожидает осмотра</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Финальное заключение */}
        {ambulatoryCard?.finalConclusion && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckShieldIcon className="w-5 h-5" />
              Финальное заключение
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">Статус:</p>
                <div>{getStatusBadge(ambulatoryCard.finalConclusion.status)}</div>
              </div>
              {ambulatoryCard.finalConclusion.notes && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Примечания:</p>
                  <p className="text-sm text-slate-900">{ambulatoryCard.finalConclusion.notes}</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Дата: {new Date(ambulatoryCard.finalConclusion.date).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        )}

        {(!ambulatoryCard || Object.keys(ambulatoryCard.examinations || {}).length === 0) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Амбулаторная карта пока не заполнена</p>
            <p className="text-sm text-slate-400 mt-2">Данные появятся после осмотра врачами</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;

