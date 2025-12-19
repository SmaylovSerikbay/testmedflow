import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Contract, Doctor, UserRole, Employee, UserProfile, ContractDocument } from '../types';
import { FACTOR_RULES, FactorRule, CATEGORY_LABELS } from '../factorRules';
import * as XLSX from 'xlsx';
import { parseEmployeeData } from '../services/geminiService';
import { sendWhatsAppMessage, generateOTP } from '../services/greenApi';
import { apiListContractsByBin, apiUpdateContract, apiListDoctors, apiGetUserByPhone, apiCreateUser, ApiContract, ApiDoctor } from '../services/api';
import BrandLogo from './BrandLogo';
import { 
  UploadIcon, LoaderIcon, SparklesIcon, LogoIcon, 
  FileTextIcon, CalendarIcon, UsersIcon, CheckShieldIcon,
  PenIcon, SettingsIcon, UserMdIcon, TrashIcon, PlusIcon,
  BriefcaseIcon, ChevronLeftIcon, FileSignatureIcon, LinkIcon, LogoutIcon
} from './Icons';
import EmployeeModal from './EmployeeModal';
import EmployeeTableRow from './EmployeeTableRow';

// --- LAZY IMPORTS ---
const ContractsList = React.lazy(() => import('./ContractsList'));
const ContractWorkspace = React.lazy(() => import('./ContractWorkspace'));
const DoctorsList = React.lazy(() => import('./DoctorsList'));

// --- CONSTANTS ---
const SPECIALTIES = [
    'Профпатолог', 'Терапевт', 'Хирург', 'Невропатолог', 
    'Оториноларинголог', 'Офтальмолог', 'Дерматовенеролог', 
    'Гинеколог', 'Рентгенолог', 'Врач по функциональной диагностике', 'Врач-лаборант'
];

// Автоопределение нужных врачей по вредным факторам на основе FACTOR_RULES
// Может быть несколько пунктов через запятую: "п. 12, п. 33, п. 45"
const resolveFactorRules = (text: string): FactorRule[] => {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase();
  const foundRules: FactorRule[] = [];
  const foundKeys = new Set<string>(); // Используем uniqueKey для избежания дубликатов
  
  // Ищем все упоминания пунктов в тексте (п. 12, пункт 12, п12, п.12 и т.д.)
  const pointRegex = /п\.?\s*(\d+)|пункт\s*(\d+)/gi;
  let match;
  const matches: Array<{ id: number; context: string }> = [];
  
  while ((match = pointRegex.exec(text)) !== null) {
    const pointId = parseInt(match[1] || match[2], 10);
    if (pointId && !isNaN(pointId)) {
      // Берем контекст вокруг найденного пункта (50 символов до и после)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.slice(start, end).toLowerCase();
      matches.push({ id: pointId, context });
    }
  }
  
  // Для каждого найденного пункта ищем соответствующее правило
  matches.forEach(({ id, context }) => {
    // Ищем все правила с этим id
    const rulesWithId = FACTOR_RULES.filter(r => r.id === id);
    
    if (rulesWithId.length === 0) {
      return; // Не нашли правило
    }
    
    // Если правило одно - берем его
    if (rulesWithId.length === 1) {
      const rule = rulesWithId[0];
      const key = rule.uniqueKey;
      if (!foundKeys.has(key)) {
        foundRules.push(rule);
        foundKeys.add(key);
      }
      return;
    }
    
    // Если правил несколько (разные разделы), пытаемся выбрать по контексту
    // Проверяем, есть ли в контексте указание на категорию
    let selectedRule = rulesWithId[0]; // По умолчанию первое
    
    if (context.includes('професси') || context.includes('работ')) {
      // Ищем правило категории "profession"
      const professionRule = rulesWithId.find(r => r.category === 'profession');
      if (professionRule) {
        selectedRule = professionRule;
      }
    } else if (context.includes('химическ') || context.includes('соединен')) {
      // Ищем правило категории "chemical"
      const chemicalRule = rulesWithId.find(r => r.category === 'chemical');
      if (chemicalRule) {
        selectedRule = chemicalRule;
      }
    } else {
      // Если не можем определить по контексту, берем первое правило категории "profession",
      // если есть, иначе первое химическое, иначе просто первое
      const professionRule = rulesWithId.find(r => r.category === 'profession');
      if (professionRule) {
        selectedRule = professionRule;
      } else {
        selectedRule = rulesWithId[0];
      }
    }
    
    const key = selectedRule.uniqueKey;
    if (!foundKeys.has(key)) {
      foundRules.push(selectedRule);
      foundKeys.add(key);
    }
  });
  
  // Если нашли правила по номерам пунктов, возвращаем их
  if (foundRules.length > 0) {
    return foundRules;
  }
  
  // Если не нашли по номерам, ищем по ключевым словам
  // Но берем только самое точное совпадение (с наибольшим количеством совпадающих ключевых слов)
  const matchingRules = FACTOR_RULES.map(rule => {
    const matchingKeywords = rule.keywords.filter(kw => 
      kw && normalized.includes(kw.toLowerCase())
    );
    return { rule, matchCount: matchingKeywords.length };
  }).filter(item => item.matchCount > 0);
  
  if (matchingRules.length === 0) return [];
  
  // Сортируем по количеству совпадений и берем только правила с максимальным совпадением
  const maxMatch = Math.max(...matchingRules.map(m => m.matchCount));
  const bestMatches = matchingRules
    .filter(m => m.matchCount === maxMatch)
    .map(m => m.rule);
  
  // Если есть несколько правил с одинаковым количеством совпадений,
  // предпочитаем правило с меньшим id (более ранний пункт)
  return bestMatches.sort((a, b) => a.id - b.id).slice(0, 1); // Берем только первое (самое точное)
};

// --- CUSTOM HOOKS ---
const useUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        const phone = localStorage.getItem('medwork_phone');
        if (!phone) {
            setIsLoadingProfile(false);
            // Очищаем состояние и перенаправляем на главную
            localStorage.removeItem('medwork_uid');
            localStorage.removeItem('medwork_phone');
            window.location.href = '/';
            return;
        }
        
        try {
            const apiUser = await apiGetUserByPhone(phone);
            
            if (apiUser) {
                // Для врачей: если нет clinicBin, но есть bin, используем его
                const clinicBin = apiUser.clinicBin || (apiUser.role === 'doctor' ? apiUser.bin : undefined);
                
                const userData: UserProfile = {
                    uid: apiUser.uid,
                    role: apiUser.role,
                    bin: apiUser.bin,
                    companyName: apiUser.companyName,
                    leaderName: apiUser.leaderName,
                    phone: apiUser.phone,
                    createdAt: apiUser.createdAt || new Date().toISOString(),
                    // Загружаем дополнительные поля для врачей
                    doctorId: apiUser.doctorId,
                    clinicId: apiUser.clinicId,
                    specialty: apiUser.specialty,
                    clinicBin: clinicBin,
                    // Для сотрудников
                    employeeId: apiUser.employeeId,
                    contractId: apiUser.contractId,
                };
                
                // Если у врача нет clinicBin, но есть bin, обновляем пользователя в базе
                if (apiUser.role === 'doctor' && !apiUser.clinicBin && apiUser.bin) {
                    try {
                        await apiCreateUser({
                            uid: apiUser.uid,
                            role: apiUser.role,
                            phone: apiUser.phone,
                            bin: apiUser.bin,
                            companyName: apiUser.companyName,
                            leaderName: apiUser.leaderName,
                            doctorId: apiUser.doctorId,
                            clinicId: apiUser.clinicId,
                            specialty: apiUser.specialty,
                            clinicBin: apiUser.bin, // Используем bin как clinicBin
                            createdAt: apiUser.createdAt,
                        } as any);
                    } catch (error) {
                        console.error('Error updating doctor clinicBin:', error);
                    }
                }
                
                setCurrentUser(userData);
            } else {
                if (import.meta.env.DEV) {
                    console.warn("User profile not found for phone:", phone);
                }
                localStorage.removeItem('medflow_uid');
                localStorage.removeItem('medflow_phone');
                window.location.href = '/';
                return;
            }
        } catch (e: any) {
            if (import.meta.env.DEV) {
                console.error("Profile load error", e);
            }
        } finally {
            setIsLoadingProfile(false);
        }
    };
    fetchProfile();
  }, []);

  return { currentUser, isLoadingProfile };
};

const useContracts = (currentUser: UserProfile | null) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadContracts = useCallback(async () => {
    if (!currentUser || !currentUser.bin) {
      setContracts([]);
      return;
    }

    try {
      const apiContracts = await apiListContractsByBin(currentUser.bin!);
      // Проверяем, что это массив
      if (!Array.isArray(apiContracts)) {
        if (import.meta.env.DEV) {
          console.warn("Contracts response is not an array:", apiContracts);
        }
        setContracts([]);
        return;
      }
      const mapped: Contract[] = apiContracts.map((c: ApiContract) => ({
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
        employees: (c.employees as any) || [],
        doctors: [],
        calendarPlan: c.calendarPlan ? {
          startDate: c.calendarPlan.startDate,
          endDate: c.calendarPlan.endDate,
          status: c.calendarPlan.status,
          rejectReason: c.calendarPlan.rejectReason,
        } : undefined,
        documents: (c.documents as any) || [],
        clientSignOtp: c.clientSignOtp,
        clinicSignOtp: c.clinicSignOtp,
        finalActContent: undefined,
        healthPlanContent: undefined,
      }));
      setContracts(mapped);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("Contracts load error", e);
      }
      setContracts([]);
    }
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    loadContracts().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [loadContracts, refreshKey]);

  const refetchContracts = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const updateContractOptimistic = useCallback((id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, []);

  return { contracts, refetchContracts, updateContractOptimistic };
};

const useDoctors = (currentUser: UserProfile | null, selectedContract: Contract | null) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDoctors = useCallback(async () => {
    if (!currentUser) {
      setDoctors([]);
      return;
    }

    let clinicUid: string | null = null;

    if (currentUser.role === 'clinic') {
      clinicUid = currentUser.uid;
    } else if (currentUser.role === 'organization' && selectedContract) {
      // для организации врачей берем по клинике из контракта не зная clinicUid,
      // поэтому на этом уровне пока не загружаем список (можно реализовать позже через поиск клиники по BIN)
      clinicUid = null;
    }

    if (!clinicUid) {
      setDoctors([]);
      return;
    }

    try {
      // apiListDoctors уже делает URL-encode внутри
      const apiDoctors = await apiListDoctors(clinicUid!);
      // Проверяем, что это массив
      if (!Array.isArray(apiDoctors)) {
        if (import.meta.env.DEV) {
          console.warn("Doctors response is not an array:", apiDoctors);
        }
        setDoctors([]);
        return;
      }
      const mapped: Doctor[] = apiDoctors.map((d: ApiDoctor) => ({
        id: String(d.id),
        name: d.name,
        specialty: d.specialty,
        phone: d.phone,
        isChairman: d.isChairman,
      }));
      setDoctors(mapped);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('Error loading doctors:', e);
      }
      setDoctors([]);
    }
  }, [currentUser, selectedContract?.id]);

  useEffect(() => {
    let cancelled = false;
    loadDoctors().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [loadDoctors, refreshKey]);

  const refetchDoctors = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { doctors, refetchDoctors };
};

// --- TOAST HOOK ---
type ToastType = 'success' | 'error' | 'info';
interface ToastState {
  type: ToastType;
  message: string;
}

const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<number | null>(null);

  const showToast = useCallback((type: ToastType, message: string, duration: number = 4000) => {
    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }
    setToast({ type, message });
    const id = window.setTimeout(() => {
      setToast(null);
      setToastTimeoutId(null);
    }, duration);
    setToastTimeoutId(id);
  }, [toastTimeoutId]);

  return { toast, showToast };
};

// --- MAIN COMPONENT ---
const Dashboard: React.FC = () => {
  const { currentUser, isLoadingProfile } = useUserProfile();
  const { contracts, refetchContracts, updateContractOptimistic } = useContracts(currentUser);

  const { toast, showToast } = useToast();

  // --- GLOBAL STATE ---
  const [activeSidebarItem, setActiveSidebarItem] = useState('contracts');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  
  // --- CONTRACT ACTIONS ---
  const updateContract = useCallback(async (id: string, updates: Partial<Contract>) => {
    try {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        console.error("Invalid contract id", id);
        return;
      }
      // Оптимистичное обновление для мгновенного отображения изменений
      updateContractOptimistic(id, updates);
      await apiUpdateContract(numericId, updates as any);
      // Обновляем список контрактов после успешного обновления для синхронизации с сервером
      // Используем setTimeout для гарантии, что обновление произойдет после завершения запроса
      setTimeout(() => {
        refetchContracts();
      }, 100);
    } catch (e) {
      console.error("Update error", e);
      showToast('error', 'Ошибка обновления договора');
      // В случае ошибки откатываем оптимистичное обновление
      setTimeout(() => {
        refetchContracts();
      }, 100);
    }
  }, [showToast, refetchContracts, updateContractOptimistic]);

  const selectedContract = useMemo(() => {
    return contracts.find(c => c.id === selectedContractId);
  }, [contracts, selectedContractId]);

  const { doctors, refetchDoctors } = useDoctors(currentUser, selectedContract);

  const employees = useMemo(() => {
    return selectedContract?.employees || [];
  }, [selectedContract?.employees]);

  if (isLoadingProfile) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
          <LoaderIcon className="w-8 h-8 animate-spin text-slate-300" />
                  </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* Toast Notifications */}
      <ToastNotification toast={toast} onClose={() => showToast('info', '')} />
      
      {/* Compact Header */}
      <Header 
        currentUser={currentUser}
        contracts={contracts}
        activeSidebarItem={activeSidebarItem}
        onSidebarItemChange={setActiveSidebarItem}
        onContractSelect={setSelectedContractId}
      />

      {/* Main Content */}
      <MainContent
        currentUser={currentUser}
        contracts={contracts}
        doctors={doctors}
        selectedContract={selectedContract}
        activeSidebarItem={activeSidebarItem}
        onContractSelect={setSelectedContractId}
        updateContract={updateContract}
        showToast={showToast}
        refetchContracts={refetchContracts}
      />
    </div>
  );
};

// --- TOAST COMPONENT ---
interface ToastNotificationProps {
  toast: ToastState | null;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`min-w-[260px] max-w-sm rounded-2xl px-4 py-3 shadow-xl border backdrop-blur bg-white/90 flex items-start gap-3 ${
              toast.type === 'success'
                ? 'border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? 'border-red-200 text-red-800'
                : 'border-slate-200 text-slate-800'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckShieldIcon className="w-4 h-4 text-emerald-500" />}
              {toast.type === 'error' && <span className="w-4 h-4 inline-block rounded-full bg-red-500" />}
              {toast.type === 'info' && <span className="w-4 h-4 inline-block rounded-full bg-slate-400" />}
            </div>
            <div className="text-sm font-medium">{toast.message}</div>
            <button
              type="button"
          onClick={onClose}
              className="ml-2 text-xs text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
  );
};

// --- HEADER COMPONENT ---
interface HeaderProps {
  currentUser: UserProfile | null;
  contracts: Contract[];
  activeSidebarItem: string;
  onSidebarItemChange: (item: string) => void;
  onContractSelect: (id: string | null) => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ 
  currentUser, 
  contracts, 
  activeSidebarItem, 
  onSidebarItemChange, 
  onContractSelect 
}) => {
  const handleContractsClick = useCallback(() => {
    onSidebarItemChange('contracts');
    onContractSelect(null);
  }, [onSidebarItemChange, onContractSelect]);

  const handleDoctorsClick = useCallback(() => {
    onSidebarItemChange('doctors');
    onContractSelect(null);
  }, [onSidebarItemChange, onContractSelect]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('medflow_uid');
    localStorage.removeItem('medflow_phone');
    window.location.href = '/';
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and User Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <BrandLogo size="sm" />
            </div>
            
            {currentUser && (
              <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.companyName?.[0] || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                    {currentUser.companyName}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {currentUser.role === 'organization' ? 'Заказчик' : 'Клиника'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button 
              onClick={handleContractsClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeSidebarItem === 'contracts' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BriefcaseIcon className="w-4 h-4"/>
              <span>Договоры</span>
              {contracts.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeSidebarItem === 'contracts' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {contracts.length}
                </span>
              )}
            </button>
            {currentUser?.role === 'clinic' && (
              <button 
                onClick={handleDoctorsClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeSidebarItem === 'doctors' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserMdIcon className="w-4 h-4"/>
                <span>Врачи</span>
              </button>
            )}
          </nav>

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
  );
});

Header.displayName = 'Header';

// --- MAIN CONTENT COMPONENT ---
interface MainContentProps {
  currentUser: UserProfile | null;
  contracts: Contract[];
  doctors: Doctor[];
  selectedContract: Contract | undefined;
  activeSidebarItem: string;
  onContractSelect: (id: string | null) => void;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  refetchContracts: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
  currentUser,
  contracts,
  doctors,
  selectedContract,
  activeSidebarItem,
  onContractSelect,
  updateContract,
  showToast,
  refetchContracts,
  refetchDoctors
}) => {
  if (activeSidebarItem === 'contracts' && selectedContract) {
    return (
      <div className="flex-1 overflow-hidden">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300" /></div>}>
          <ContractWorkspace
            currentUser={currentUser}
            contract={selectedContract}
            doctors={doctors}
            onBack={() => onContractSelect(null)}
            updateContract={updateContract}
            showToast={showToast}
          />
        </React.Suspense>
      </div>
    );
  }

  if (activeSidebarItem === 'contracts') {
    return (
      <div className="flex-1 overflow-auto">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300" /></div>}>
          <ContractsList
            currentUser={currentUser}
            contracts={contracts}
            onContractSelect={onContractSelect}
            showToast={showToast}
            refetchContracts={refetchContracts}
          />
        </React.Suspense>
      </div>
    );
  }

  if (activeSidebarItem === 'doctors' && currentUser?.role === 'clinic') {
    return (
      <div className="flex-1 overflow-auto">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300" /></div>}>
          <DoctorsList
            currentUser={currentUser}
            doctors={doctors}
            showToast={showToast}
            onDoctorsChange={refetchDoctors}
          />
        </React.Suspense>
      </div>
    );
  }

  return null;
};

export default Dashboard;