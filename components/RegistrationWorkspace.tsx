import React, { useState, useMemo, useCallback } from 'react';
import { UserProfile, Contract, Employee, Doctor, RouteSheetItem } from '../types';
import { apiListContractsByBin, apiCreateVisit, apiListDoctors, apiUpdateDoctor, apiGetUserByBin, apiListVisits, ApiVisit, apiCreateDoctor } from '../services/api';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import { resolveFactorRules, personalizeResearch } from '../utils/medicalRules';
import { sendWhatsAppMessage } from '../services/greenApi';
import { 
  SearchIcon, UserMdIcon, UserIcon, PhoneIcon, 
  CheckCircleIcon, LoaderIcon, MapPinIcon, SendIcon,
  ClockIcon, PlusIcon, FileTextIcon
} from './Icons';
import { DoctorModal } from './DoctorsList'; // Используем единую модалку

interface RegistrationWorkspaceProps {
  currentUser: UserProfile | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

// Выносим вспомогательный компонент за пределы основного
const EmployeeRow = ({ 
  emp, 
  getEmployeeRequirements, 
  openPhoneModal, 
  isStartingVisit 
}: { 
  emp: Employee & { contractId: string; clientName: string };
  getEmployeeRequirements: (emp: Employee) => any;
  openPhoneModal: (emp: any) => void;
  isStartingVisit: string | null;
  key?: string | number; // Добавляем key в пропсы для типизации
}) => {
  const requirements = useMemo(() => getEmployeeRequirements(emp), [emp, getEmployeeRequirements]);
  const isReady = requirements.missing.length === 0;

  return (
    <div className="py-5 flex items-center justify-between group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 -mx-4 px-4 transition-colors">
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all border-2 shadow-sm ${
          isReady 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:scale-110' 
            : 'bg-red-50 text-red-600 border-red-100 group-hover:shake'
        }`}>
          {emp.name[0]}
        </div>
        <div className="min-w-0">
          <div className="font-black text-slate-900 text-xl leading-tight tracking-tight">{emp.name}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-900 text-white rounded-md shadow-sm">ИИН: {emp.id}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">{emp.clientName}</span>
            <span className="text-[10px] font-medium text-slate-400">Факторы: {emp.harmfulFactor}</span>
          </div>
          
          {/* Статус готовности клиники */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {requirements.required.map((spec: string) => {
                const isMissing = requirements.missing.includes(spec);
                return (
                  <span key={spec} className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition-all ${
                    isMissing 
                      ? 'border-red-200 bg-red-50 text-red-500' 
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
                  }`}>
                    {spec}
                  </span>
                );
              })}
            </div>

            {requirements.research.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requirements.research.map((res: string) => (
                  <span key={res} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-blue-100 bg-blue-50/50 text-blue-500">
                    {res}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 ml-4">
        {!isReady && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Нужны врачи:</span>
            <span className="text-[10px] font-bold text-red-400 bg-red-50/50 px-2 py-0.5 rounded-md border border-red-100/50">
              {requirements.missing.join(', ')}
            </span>
          </div>
        )}
        <button
          onClick={() => openPhoneModal(emp)}
          disabled={isStartingVisit === emp.id || !isReady}
          className={`group relative flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl active:scale-95 ${
            isReady 
              ? 'bg-slate-900 text-white hover:bg-black hover:shadow-blue-500/20' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200'
          }`}
        >
          {isStartingVisit === emp.id ? (
            <LoaderIcon className="w-5 h-5 animate-spin" />
          ) : (
            <SendIcon className={`w-5 h-5 ${isReady ? 'group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform' : ''}`} />
          )}
          Начать осмотр
        </button>
      </div>
    </div>
  );
};

const RegistrationWorkspace: React.FC<RegistrationWorkspaceProps> = ({ currentUser, showToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isStartingVisit, setIsStartingVisit] = useState<string | null>(null);
  const [recentVisits, setRecentVisits] = useState<ApiVisit[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null);
  
  // Состояния для модалки врача
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  // Форматирование телефона (как в AuthModal)
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    
    // Если начинается с 7 или 8, нормализуем к +7
    let result = '+7';
    let digits = numbers;
    
    if (numbers.startsWith('7') || numbers.startsWith('8')) {
      digits = numbers.substring(1);
    }
    
    if (digits.length > 0) result += ' (' + digits.substring(0, 3);
    if (digits.length > 3) result += ') ' + digits.substring(3, 6);
    if (digits.length > 6) result += '-' + digits.substring(6, 8);
    if (digits.length > 8) result += '-' + digits.substring(8, 10);
    
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Позволяем удалять символы
    if (val.length < phoneModal.phone.length) {
      setPhoneModal(prev => ({ ...prev, phone: val }));
      return;
    }
    setPhoneModal(prev => ({ ...prev, phone: formatPhone(val) }));
  };

  const openPhoneModal = (emp: Employee & { contractId: string }) => {
    setPhoneModal({
      isOpen: true,
      employee: emp,
      phone: emp.phone ? formatPhone(emp.phone) : '+7 ('
    });
  };
  
  // Состояния для модалки телефона
  const [phoneModal, setPhoneModal] = useState<{
    isOpen: boolean;
    employee: (Employee & { contractId: string }) | null;
    phone: string;
  }>({
    isOpen: false,
    employee: null,
    phone: '+7 ('
  });

  const loadRecentVisits = useCallback(async () => {
    const clinicIdToUse = currentClinicId || currentUser?.uid;
    if (!clinicIdToUse) return;
    setIsLoadingVisits(true);
    try {
      const data = await apiListVisits({ clinicId: clinicIdToUse });
      setRecentVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setIsLoadingVisits(false);
    }
  }, [currentUser, currentClinicId]);

  // Загружаем данные при входе
  React.useEffect(() => {
    const loadInitialData = async () => {
      const binToFetch = currentUser?.clinicBin || currentUser?.bin;
      if (!binToFetch) return;
      
      setIsLoading(true);
      try {
        console.log('RegistrationWorkspace: loading data for bin', binToFetch);
        
        // Сначала загружаем договоры
        const contractsData = await apiListContractsByBin(binToFetch);
        console.log('RegistrationWorkspace: contracts loaded', contractsData);
        setContracts(contractsData as any);

        // Пытаемся определить ID клиники
        // Если у регистратора нет clinicId, пробуем найти клинику по БИН
        let clinicIdToFetch = currentUser.clinicId;
        
        if (!clinicIdToFetch && binToFetch) {
          console.log('RegistrationWorkspace: clinicId missing, searching by bin', binToFetch);
          const clinicUser = await apiGetUserByBin(binToFetch);
          if (clinicUser) {
            clinicIdToFetch = clinicUser.uid;
            console.log('RegistrationWorkspace: clinic found by bin', clinicIdToFetch);
          }
        }

        if (!clinicIdToFetch) {
          clinicIdToFetch = currentUser.uid;
        }
        
        setCurrentClinicId(clinicIdToFetch);
        console.log('RegistrationWorkspace: fetching doctors for clinicId', clinicIdToFetch);
        const doctorsData = await apiListDoctors(clinicIdToFetch);
        console.log('RegistrationWorkspace: doctors loaded', doctorsData);
        setDoctors(doctorsData as any);

        // Загружаем недавние визиты
        await loadRecentVisits();
      } catch (error) {
        console.error('RegistrationWorkspace: error loading initial data', error);
        showToast('error', 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser, showToast, loadRecentVisits]);

  // Все сотрудники из всех договоров клиники (любого статуса, где есть список)
  const allEmployees = useMemo(() => {
    const list: (Employee & { contractId: string; clientName: string })[] = [];
    console.log('RegistrationWorkspace: building allEmployees from contracts', contracts);
    
    contracts.forEach(c => {
      if (c.employees && Array.isArray(c.employees)) {
        c.employees.forEach(e => {
          list.push({ ...e, contractId: String(c.id), clientName: c.clientName });
        });
      }
    });
    
    console.log('RegistrationWorkspace: total employees found:', list.length);
    return list;
  }, [contracts]);

  // Фильтрация сотрудников по поиску
  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];
    return allEmployees.filter(e => 
      e.name.toLowerCase().includes(query) || 
      e.id.includes(query) ||
      (e.phone && e.phone.includes(query))
    );
  }, [allEmployees, searchQuery]);

  // Умная проверка готовности и получение требований
  const getEmployeeRequirements = (employee: Employee) => {
    // 1. Получаем правила через общую логику (как в ContractComponents)
    const rules = resolveFactorRules(employee.harmfulFactor || '');
    
    // ЛОГ ДЛЯ ОТЛАДКИ (поможет понять, почему не находит врача)
    console.log(`Checking requirements for ${employee.name}:`, {
      harmfulFactor: employee.harmfulFactor,
      resolvedRules: rules.map(r => r.id + ': ' + r.title),
      availableDoctors: doctors.map(d => `${d.specialty} (${d.roomNumber || 'нет кабинета'})`)
    });

    const neededSpecialties = new Set<string>();
    const neededResearch = new Set<string>();
    
    // БАЗОВЫЙ МИНИМУМ (Приказ 304)
    neededSpecialties.add('Терапевт');
    neededSpecialties.add('Профпатолог');
    
    // Дефолтные исследования для всех (Приказ 304)
    neededResearch.add('ОАК (Общий анализ крови)');
    neededResearch.add('ОАМ (Общий анализ мочи)');
    neededResearch.add('ЭКГ (Электрокардиография)');
    neededResearch.add('Флюорография');

    // ДОБАВЛЯЕМ СПЕЦИФИКУ ПО ПРАВИЛАМ
    rules.forEach(r => {
      // Специалисты
      r.specialties.forEach(s => {
        if (s) {
          // Очищаем название специальности для единообразия
          const cleanSpec = s.trim().replace(/^врач-?/i, '').trim();
          neededSpecialties.add(cleanSpec.charAt(0).toUpperCase() + cleanSpec.slice(1));
        }
      });
      
      // Исследования (персонализируем под стаж и условия)
      if (r.research) {
        const personalized = personalizeResearch(r.research, employee);
        if (personalized) {
          personalized.split(/[,;]/).forEach(res => {
            const trimmed = res.trim();
            if (trimmed) neededResearch.add(trimmed);
          });
        }
      }
    });

    const specialtiesList = Array.from(neededSpecialties).sort();
    
    // Функция для поиска врача по специальности
    const findDoctor = (spec: string) => {
      const target = spec.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').trim();
      return doctors.find(d => {
        const current = d.specialty.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').trim();
        // Прямое совпадение или частичное (напр. "Офтальмолог" и "Врач-офтальмолог")
        return current === target || current.includes(target) || target.includes(current);
      });
    };

    const missingSpecialties = specialtiesList.filter(spec => {
      const doctor = findDoctor(spec);
      return !doctor || !doctor.roomNumber;
    });

    return {
      required: specialtiesList,
      missing: missingSpecialties,
      research: Array.from(neededResearch).sort(),
      routeSheet: [
        ...specialtiesList.map(spec => {
          const doctor = findDoctor(spec);
          return {
            type: 'doctor' as const,
            specialty: spec,
            doctorId: doctor?.id,
            doctorName: doctor?.name,
            roomNumber: doctor?.roomNumber,
            status: 'pending' as const
          };
        }),
        ...Array.from(neededResearch).map(res => ({
          type: 'research' as const,
          specialty: res,
          status: 'pending' as const,
          roomNumber: 'Лаборатория'
        }))
      ]
    };
  };

  const handleConfirmStartVisit = async () => {
    const { employee, phone } = phoneModal;
    if (!employee) return;

    const requirements = getEmployeeRequirements(employee);
    
    if (requirements.missing.length > 0) {
        showToast('error', `Невозможно начать: добавьте врачей (${requirements.missing.join(', ')}) и укажите их кабинеты`);
        return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
        showToast('error', 'Введите полный номер телефона (11 цифр)');
        return;
    }

    setIsStartingVisit(employee.id);
    setPhoneModal(prev => ({ ...prev, isOpen: false }));

    try {
      const clinicIdToUse = currentClinicId || currentUser!.uid;
      console.log('RegistrationWorkspace: Creating visit with clinicId=', clinicIdToUse);
      await apiCreateVisit({
        employeeId: employee.id,
        employeeName: employee.name,
        clientName: employee.clientName,
        contractId: Number(employee.contractId),
        clinicId: clinicIdToUse,
        phone: cleanPhone,
        routeSheet: requirements.routeSheet
      });

      // Отправка WhatsApp уведомления
      const routeText = requirements.routeSheet
        .map((s, i) => `${i + 1}. ${s.specialty}${s.roomNumber ? ` - каб. ${s.roomNumber}` : ''}`)
        .join('\n');
      
      const message = `Здравствуйте, ${employee.name}!\nВаш медосмотр начат. Ваш маршрутный лист (врачи и исследования):\n${routeText}\n\nПожалуйста, посетите указанные кабинеты. Желаем здоровья!`;
      
      try {
        await sendWhatsAppMessage(cleanPhone, message);
      } catch (wsError) {
        console.error('WhatsApp error:', wsError);
      }

      showToast('success', `Медосмотр начат для ${employee.name}`);
      setSearchQuery(''); 
      loadRecentVisits();
    } catch (error) {
      showToast('error', 'Ошибка при запуске медосмотра');
    } finally {
      setIsStartingVisit(null);
    }
  };

  const handleUpdateRoom = async (doctorId: string, newRoom: string) => {
    try {
        const doctor = doctors.find(d => d.id === doctorId);
        if (!doctor || !currentClinicId) return;
        
        await apiUpdateDoctor(currentClinicId, Number(doctorId), {
            ...doctor,
            roomNumber: newRoom
        } as any);
        
        setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, roomNumber: newRoom } : d));
        showToast('success', 'Номер кабинета обновлен');
    } catch (error) {
        console.error('Error updating room:', error);
        showToast('error', 'Ошибка обновления кабинета');
    }
  };

  const handleAddDoctor = () => {
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (doctorData: any) => {
    if (!currentUser || !currentClinicId) return;
    setIsSavingDoctor(true);
    try {
      const cleanPhone = doctorData.phone ? doctorData.phone.replace(/\D/g, '') : '';
      
      await apiCreateDoctor(currentClinicId, {
        ...doctorData,
        phone: cleanPhone
      });

      // Просто перезагружаем список врачей, чтобы данные подтянулись с сервера
      const doctorsData = await apiListDoctors(currentClinicId);
      setDoctors(doctorsData as any);

      showToast('success', 'Врач успешно добавлен');
      setIsDoctorModalOpen(false);
    } catch (error) {
      console.error('Error adding doctor:', error);
      showToast('error', 'Ошибка при добавлении врача');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Регистратура</h1>
          <p className="text-slate-500 font-medium">Система автоматического контроля медосмотра по Приказу 304</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Search & Registration */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[32px] shadow-xl border border-slate-200/60 p-8">
              <div className="relative group">
                {/* Эффект свечения под полем, pointer-events-none обязателен */}
                <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-7 h-7 group-focus-within:text-blue-600 transition-all group-focus-within:scale-110 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск сотрудника по ФИО или ИИН..."
                  className="relative z-0 w-full pl-14 pr-6 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white outline-none text-slate-900 text-xl font-bold transition-all shadow-sm placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery && (
                <div className="mt-6 divide-y divide-slate-100 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <EmployeeRow 
                        key={emp.id} 
                        emp={emp} 
                        getEmployeeRequirements={getEmployeeRequirements}
                        openPhoneModal={openPhoneModal}
                        isStartingVisit={isStartingVisit}
                      />
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <SearchIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium">Сотрудник не найден в базе активных договоров</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Registrations */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        Недавние регистрации
                    </div>
                    <button 
                        onClick={loadRecentVisits}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-400 hover:text-blue-600"
                    >
                        <LoaderIcon className={`w-4 h-4 ${isLoadingVisits ? 'animate-spin' : ''}`} />
                    </button>
                </h3>
                
                <div className="space-y-3">
                    {isLoadingVisits && recentVisits.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Загрузка...
                        </div>
                    ) : recentVisits.length > 0 ? (
                        recentVisits.slice(0, 5).map(visit => (
                            <div key={visit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-slate-900 truncate">{visit.employeeName || `ID: ${visit.employeeId}`}</div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-tight bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/50 truncate max-w-[150px]">
                                                {visit.clientName || 'Без договора'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                                <ClockIcon className="w-3 h-3" />
                                                {new Date(visit.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    visit.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {visit.status === 'completed' ? 'Завершен' : 'В процессе'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Сегодня регистраций еще не было
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Right Column: Doctors & Rooms */}
          <div className="space-y-6">
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <UserMdIcon className="w-5 h-5 text-blue-500" />
                  Кабинеты врачей
                </h3>
                <button 
                  onClick={handleAddDoctor}
                  className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-all shadow-md active:scale-90"
                  title="Добавить врача"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                {doctors.map(doc => (
                  <div key={doc.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-transparent hover:border-blue-100 transition-all">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate text-sm">{doc.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{doc.specialty}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <MapPinIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                        <input
                          type="text"
                          defaultValue={doc.roomNumber || ''}
                          onBlur={(e) => handleUpdateRoom(doc.id, e.target.value)}
                          placeholder="Каб."
                          className="w-16 pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {doctors.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    Список врачей пуст
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Модальное окно создания врача для регистратуры (Единое с клиникой) */}
      {isDoctorModalOpen && (
        <DoctorModal 
          doctor={null}
          onClose={() => setIsDoctorModalOpen(false)}
          onSave={handleSaveDoctor}
          isSaving={isSavingDoctor}
        />
      )}

      {/* Модальное окно ввода телефона */}
      {phoneModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <PhoneIcon className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Регистрация телефона</h3>
              <p className="text-slate-500 mb-8">
                Введите номер WhatsApp сотрудника <span className="font-semibold text-slate-900">{phoneModal.employee?.name}</span> для отправки маршрутного листа.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                    Номер телефона
                  </label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="tel"
                      autoFocus
                      value={phoneModal.phone}
                      onChange={handlePhoneChange}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-lg font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setPhoneModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleConfirmStartVisit}
                    className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <SendIcon className="w-5 h-5" />
                    Запустить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationWorkspace;

