import React, { useState, useCallback, useMemo } from 'react';
import { Contract, UserProfile, Employee } from '../types';
import { FACTOR_RULES, FactorRule } from '../factorRules';
import { generateOTP, sendWhatsAppMessage } from '../services/greenApi';
import { 
  ChevronLeftIcon, CalendarIcon, UsersIcon, PlusIcon, LoaderIcon,
  CheckShieldIcon, PenIcon
} from './Icons';
import EmployeeModal from './EmployeeModal';
import EmployeeTableRow from './EmployeeTableRow';
import ContingentSection from './ContingentSection';
import { SigningControls, CommercialTermsCard, CalendarPlanSection, DocumentsSection } from './ContractComponents';
import HarmfulFactorModal from './HarmfulFactorModal';
import { processEmployeesForAutoRegistration } from '../utils/employeeRegistration';

interface ContractWorkspaceProps {
  currentUser: UserProfile | null;
  contract: Contract;
  doctors?: any[];
  onBack: () => void;
  updateContract: (id: string, updates: Partial<Contract>) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

const ContractWorkspace: React.FC<ContractWorkspaceProps> = ({
  currentUser,
  contract,
  doctors = [],
  onBack,
  updateContract,
  showToast
}) => {
  // --- EMPLOYEE MODAL STATE ---
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // --- HARMFUL FACTOR MODAL STATE ---
  const [isHarmfulFactorModalOpen, setIsHarmfulFactorModalOpen] = useState(false);
  const [selectedFactorKeys, setSelectedFactorKeys] = useState<Set<string>>(new Set());
  
  // --- OTP SIGNING STATE ---
  const [otpValue, setOtpValue] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // --- CALENDAR PLAN STATE ---
  const [planStart, setPlanStart] = useState(contract.calendarPlan?.startDate || '');
  const [planEnd, setPlanEnd] = useState(contract.calendarPlan?.endDate || '');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const employees = useMemo(() => contract.employees || [], [contract.employees]);

  const isOrg = currentUser?.role === 'organization';
  const myRoleSigned = isOrg ? contract.clientSigned : contract.clinicSigned;
  const otherRoleSigned = isOrg ? contract.clinicSigned : contract.clientSigned;
  const canSign = !myRoleSigned && (contract.status === 'request' || contract.status === 'negotiation');

  // --- EMPLOYEE HANDLERS ---
  const handleAddEmployee = useCallback(() => {
    const newEmployee: Employee = {
      id: `${Date.now()}`,
      name: '',
      dob: '',
      gender: 'М',
      site: '',
      position: '',
      harmfulFactor: '',
      status: 'pending',
    };
    setEditingEmployee(newEmployee);
    setIsEmployeeModalOpen(true);
  }, []);

  const handleEditEmployee = useCallback((employee: Employee) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  }, []);

  const handleSaveEmployee = useCallback(async (employee: Employee) => {
    const exists = employees.some(emp => emp.id === employee.id);
    
    // Проверяем, есть ли телефон в примечании для автоматической регистрации
    const employeesToProcess = exists
      ? employees.map(emp => emp.id === employee.id ? employee : emp)
      : [...employees, employee];
    
    const processedEmployees = await processEmployeesForAutoRegistration(employeesToProcess, contract.id);
    const wasRegistered = processedEmployees.find(e => e.id === employee.id)?.userId && !employee.userId;
    
    await updateContract(contract.id, { employees: processedEmployees });
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
    
    if (wasRegistered) {
      showToast('success', exists ? 'Сотрудник обновлен и зарегистрирован' : 'Сотрудник добавлен и зарегистрирован');
    } else {
      showToast('success', exists ? 'Сотрудник обновлен' : 'Сотрудник добавлен');
    }
  }, [employees, contract.id, updateContract, showToast]);

  const handleDeleteEmployee = useCallback(async (employeeId: string) => {
    if (!window.confirm('Удалить сотрудника?')) return;
    const updated = employees.filter(emp => emp.id !== employeeId);
    await updateContract(contract.id, { employees: updated });
    showToast('success', 'Сотрудник удален');
  }, [employees, contract.id, updateContract, showToast]);

  const handleToggleEmployeeStatus = useCallback(async (employeeId: string) => {
    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        if (e.status === 'pending') return { ...e, status: 'fit' as const };
        if (e.status === 'fit') return { ...e, status: 'needs_observation' as const };
        if (e.status === 'needs_observation') return { ...e, status: 'unfit' as const };
        return { ...e, status: 'pending' as const };
      }
      return e;
    });

    await updateContract(contract.id, { employees: updatedEmployees });
  }, [employees, contract.id, updateContract]);

  const handleEmployeeFieldChange = useCallback((field: keyof Employee, value: string) => {
    setEditingEmployee(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleCloseEmployeeModal = useCallback(() => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  }, []);

  // --- OTP HANDLERS ---
  const handleRequestSignOtp = useCallback(async () => {
    if (!currentUser?.phone) {
      showToast('error', 'Номер телефона не указан в профиле');
      return;
    }

    setIsRequestingOtp(true);
    setOtpError('');

    try {
      const otp = generateOTP();
      const message = `Ваш код для подписания договора в MedFlow: ${otp}`;
      
      await sendWhatsAppMessage(currentUser.phone, message);
      
      // Сохраняем OTP в договоре
      const otpField = currentUser.role === 'organization' ? 'clientSignOtp' : 'clinicSignOtp';
      await updateContract(contract.id, { [otpField]: otp });
      
      setOtpSent(true);
      showToast('success', 'Код отправлен на ваш номер телефона');
    } catch (error) {
      console.error('OTP send error:', error);
      setOtpError('Ошибка отправки кода. Попробуйте снова.');
      showToast('error', 'Не удалось отправить код');
    } finally {
      setIsRequestingOtp(false);
    }
  }, [currentUser, contract.id, updateContract, showToast]);

  const handleConfirmOtp = useCallback(async () => {
    if (!otpValue || otpValue.length !== 4) {
      setOtpError('Введите 4-значный код');
      return;
    }

    setIsConfirmingOtp(true);
    setOtpError('');

    try {
      const storedOtp = currentUser?.role === 'organization' ? contract.clientSignOtp : contract.clinicSignOtp;
      
      if (otpValue !== storedOtp) {
        setOtpError('Неверный код');
        return;
      }

      const updates: Partial<Contract> = {};
      
      if (currentUser?.role === 'organization') {
        updates.clientSigned = true;
        updates.clientSignOtp = null;
      } else {
        updates.clinicSigned = true;
        updates.clinicSignOtp = null;
        const year = new Date().getFullYear();
        const randomId = Math.floor(1000 + Math.random() * 9000); 
        updates.number = `D-${year}/${randomId}`;
      }

      if ((currentUser?.role === 'organization' && contract.clinicSigned) || 
          (currentUser?.role === 'clinic' && contract.clientSigned)) {
        updates.status = 'planning';
      }

      await updateContract(contract.id, updates);
      
      setOtpValue('');
      setOtpSent(false);
      showToast('success', 'Договор успешно подписан!');
    } catch (error) {
      console.error('OTP confirm error:', error);
      setOtpError('Ошибка подтверждения кода');
      showToast('error', 'Не удалось подписать договор');
    } finally {
      setIsConfirmingOtp(false);
    }
  }, [otpValue, currentUser, contract, updateContract, showToast]);

  // --- CALENDAR PLAN HANDLERS ---
  const handleSavePlan = useCallback(async () => {
    if (!planStart || !planEnd) {
      showToast('error', 'Укажите даты начала и окончания');
      return;
    }

    if (employees.length === 0) {
      showToast('error', 'Сначала загрузите контингент работников');
      return;
    }

    setIsSavingPlan(true);
    try {
      await updateContract(contract.id, {
        calendarPlan: {
          startDate: planStart,
          endDate: planEnd,
          status: 'draft',
        }
      });
      showToast('success', 'План отправлен на согласование работодателю.');
    } catch (e) {
      console.error('Plan save error', e);
      showToast('error', 'Ошибка отправки плана на согласование. Попробуйте снова.');
    } finally {
      setIsSavingPlan(false);
    }
  }, [planStart, planEnd, employees.length, contract.id, updateContract, showToast]);

  // --- HARMFUL FACTOR HELPERS ---
  const parseHarmfulFactors = useCallback((factorString: string): Set<string> => {
    if (!factorString) return new Set();
    const factors = factorString.split(',').map(f => f.trim()).filter(f => f);
    const keys = new Set<string>();
    
    factors.forEach(factorText => {
      const match = factorText.match(/п\.?\s*(\d+)\s+(.+)/i);
      if (match) {
        const id = parseInt(match[1], 10);
        const title = match[2].trim();
        const rule = FACTOR_RULES.find(r => r.id === id && r.title === title);
        if (rule) {
          keys.add(rule.uniqueKey);
        }
      } else {
        const cleanFactor = factorText.replace(/^п\.?\s*\d+\s*/i, '').trim();
        if (cleanFactor) {
          const rule = FACTOR_RULES.find(r => 
            r.title.toLowerCase() === cleanFactor.toLowerCase() ||
            r.title.toLowerCase().includes(cleanFactor.toLowerCase())
          );
          if (rule) {
            keys.add(rule.uniqueKey);
          }
        }
      }
    });
    
    return keys;
  }, []);

  const formatHarmfulFactors = useCallback((keys: Set<string>): string => {
    if (keys.size === 0) return '';
    const selectedRules = FACTOR_RULES
      .filter(rule => keys.has(rule.uniqueKey))
      .sort((a, b) => {
        const catOrder = { 'chemical': 1, 'physical': 2, 'biological': 3, 'profession': 4, 'other': 5 };
        const catDiff = catOrder[a.category] - catOrder[b.category];
        if (catDiff !== 0) return catDiff;
        return a.id - b.id;
      });
    return selectedRules.map(rule => `п. ${rule.id} ${rule.title}`).join(', ');
  }, []);

  const openHarmfulFactorModal = useCallback(() => {
    if (editingEmployee?.harmfulFactor) {
      const keys = parseHarmfulFactors(editingEmployee.harmfulFactor);
      setSelectedFactorKeys(keys);
    } else {
      setSelectedFactorKeys(new Set());
    }
    setIsHarmfulFactorModalOpen(true);
  }, [editingEmployee?.harmfulFactor, parseHarmfulFactors]);

  const applyHarmfulFactors = useCallback(() => {
    if (editingEmployee) {
      const formatted = formatHarmfulFactors(selectedFactorKeys);
      setEditingEmployee({ ...editingEmployee, harmfulFactor: formatted });
    }
    setIsHarmfulFactorModalOpen(false);
  }, [editingEmployee, selectedFactorKeys, formatHarmfulFactors]);

  return (
    <div className="flex flex-col h-full bg-white animate-fade-in-up">
      {/* Header */}
      <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              {currentUser?.role === 'clinic' ? contract.clientName : contract.clinicName}
              <StatusBadge status={contract.status} />
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              ID: {contract.number} • ДАТА: {contract.date}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {myRoleSigned && (
            <span className="text-xs font-medium text-green-600">
              Ваша сторона подписала договор
            </span>
          )}
          {!myRoleSigned && canSign && (
            <SigningControls
              currentUser={currentUser}
              otpValue={otpValue}
              setOtpValue={setOtpValue}
              isRequestingOtp={isRequestingOtp}
              isConfirmingOtp={isConfirmingOtp}
              otpSent={otpSent}
              otpError={otpError}
              onRequestOtp={handleRequestSignOtp}
              onConfirmOtp={handleConfirmOtp}
            />
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-auto p-8 grid grid-cols-12 gap-8">
        {/* LEFT: Context & Contingent */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Commercial Terms */}
          <CommercialTermsCard contract={contract} />
          
          {/* Contingent Section */}
          <ContingentSection
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onToggleStatus={handleToggleEmployeeStatus}
            updateContract={updateContract}
            contractId={contract.id}
            showToast={showToast}
          />
        </div>

        {/* RIGHT: Calendar Plan & Documents */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <CalendarPlanSection
            currentUser={currentUser}
            contract={{ ...contract, doctors } as Contract}
            employees={employees}
            doctors={doctors}
            planStart={planStart}
            planEnd={planEnd}
            setPlanStart={setPlanStart}
            setPlanEnd={setPlanEnd}
            isSavingPlan={isSavingPlan}
            onSavePlan={handleSavePlan}
            updateContract={updateContract}
            showToast={showToast}
          />
          
          {/* Documents Section */}
          <DocumentsSection
            contract={contract}
            currentUser={currentUser}
            employees={employees}
            doctors={doctors}
            updateContract={updateContract}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && editingEmployee && (
        <EmployeeModal
          isOpen={isEmployeeModalOpen}
          employee={editingEmployee}
          isEditing={employees.some(emp => emp.id === editingEmployee.id)}
          onClose={handleCloseEmployeeModal}
          onSave={handleSaveEmployee}
          onOpenHarmfulFactorModal={openHarmfulFactorModal}
          onFieldChange={handleEmployeeFieldChange}
        />
      )}

      {/* Harmful Factor Modal */}
      {isHarmfulFactorModalOpen && (
        <HarmfulFactorModal
          selectedFactorKeys={selectedFactorKeys}
          setSelectedFactorKeys={setSelectedFactorKeys}
          onClose={() => setIsHarmfulFactorModalOpen(false)}
          onApply={applyHarmfulFactors}
        />
      )}
    </div>
  );
};

// --- STATUS BADGE ---
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
     'request': 'bg-slate-100 text-slate-600',
     'negotiation': 'bg-blue-100 text-blue-700',
     'planning': 'bg-amber-100 text-amber-700',
     'execution': 'bg-purple-100 text-purple-700',
     'completed': 'bg-green-100 text-green-700'
  };
  const label: Record<string, string> = {
     'request': 'Черновик',
     'negotiation': 'Согласование',
     'planning': 'Планирование',
     'execution': 'Исполнение',
     'completed': 'Завершен'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[status]}`}>
      {label[status]}
    </span>
  );
};

export default ContractWorkspace;