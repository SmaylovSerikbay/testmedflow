import React, { useState, useCallback } from 'react';
import { Contract, UserProfile } from '../types';
import { sendWhatsAppMessage } from '../services/greenApi';
import { rtdb, ref, push, set, get } from '../services/firebase';
import { 
  LoaderIcon, CheckShieldIcon, PlusIcon, BriefcaseIcon, ChevronLeftIcon
} from './Icons';
import { StepOne, StepTwo } from './CreateContractSteps';

interface ContractsListProps {
  currentUser: UserProfile | null;
  contracts: Contract[];
  onContractSelect: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

const ContractsList: React.FC<ContractsListProps> = ({ 
  currentUser, 
  contracts, 
  onContractSelect, 
  showToast 
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateContract = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
      <div className="p-8 max-w-5xl mx-auto w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Договоры</h2>
          <button 
            onClick={handleCreateContract}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-transform active:scale-95 shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Новый договор
          </button>
        </div>

        {contracts.length === 0 ? (
          <EmptyState onCreateContract={handleCreateContract} />
        ) : (
          <ContractsGrid 
            contracts={contracts} 
            currentUser={currentUser}
            onContractSelect={onContractSelect} 
          />
        )}
      </div>

      {isCreateModalOpen && (
        <CreateContractModal
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          showToast={showToast}
        />
      )}
    </main>
  );
};

// --- EMPTY STATE ---
interface EmptyStateProps {
  onCreateContract: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateContract }) => (
  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
      <BriefcaseIcon className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-bold text-slate-900">Нет активных договоров</h3>
    <p className="text-slate-500 mb-6 max-w-md mx-auto">
      Создайте новый договор, чтобы начать процесс медицинского осмотра.
    </p>
    <button 
      onClick={onCreateContract}
      className="text-blue-600 font-bold hover:underline"
    >
      Создать сейчас
    </button>
  </div>
);

// --- CONTRACTS GRID ---
interface ContractsGridProps {
  contracts: Contract[];
  currentUser: UserProfile | null;
  onContractSelect: (id: string) => void;
}

const ContractsGrid: React.FC<ContractsGridProps> = ({ contracts, currentUser, onContractSelect }) => {
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

  return (
    <div className="grid gap-4">
      {contracts.map(contract => (
        <div 
          key={contract.id} 
          onClick={() => onContractSelect(contract.id)}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              contract.status === 'completed' ? 'bg-green-500' : 'bg-slate-900'
            }`}>
              {currentUser?.role === 'organization' ? contract.clinicName[0] : contract.clientName[0]}
            </div>
            <div>
              <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                {currentUser?.role === 'organization' ? contract.clinicName : contract.clientName}
              </h3>
              <p className="text-sm text-slate-400">№{contract.number} • {contract.price?.toLocaleString()} ₸</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Статус</p>
              <StatusBadge status={contract.status} />
            </div>
            <ChevronLeftIcon className="w-5 h-5 text-slate-300 rotate-180" />
          </div>
        </div>
      ))}
    </div>
  );
};

// --- CREATE CONTRACT MODAL ---
interface CreateContractModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({ currentUser, onClose, showToast }) => {
  const [step, setStep] = useState(1);
  const [searchBin, setSearchBin] = useState('');
  const [foundCounterparty, setFoundCounterparty] = useState<{name: string, bin: string, phone?: string} | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [contractTerms, setContractTerms] = useState({ 
    price: '', 
    headcount: '', 
    endDate: '', 
    contractDate: new Date().toISOString().split('T')[0] 
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearchBin = useCallback(async () => {
    if (searchBin.length !== 12) return;
    setIsSearching(true);
    setFoundCounterparty(null);
    
    try {
      const usersRef = ref(rtdb, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const foundUser = Object.values(users as Record<string, UserProfile>).find(
          (user: any) => user.bin && user.bin.toString().trim() === searchBin.trim()
        ) as UserProfile | undefined;
        
        if (foundUser) {
          if (foundUser.role === currentUser?.role) {
            showToast('error', 'Вы не можете заключить договор с организацией того же типа.');
          } else {
            setFoundCounterparty({
              name: foundUser.companyName,
              bin: foundUser.bin,
              phone: foundUser.phone
            });
          }
        } else {
          setFoundCounterparty(null);
        }
      } else {
        setFoundCounterparty(null);
      }
    } catch (e) {
      console.error("Search error:", e);
      setFoundCounterparty(null);
      showToast('error', 'Ошибка при поиске. Проверьте соединение.');
    } finally {
      setIsSearching(false);
    }
  }, [searchBin, currentUser?.role, showToast]);

  const handleCreateContract = useCallback(async () => {
    if (!currentUser) return;
    
    if (!contractTerms.price || !contractTerms.headcount || !contractTerms.endDate || !contractTerms.contractDate) {
      showToast('error', 'Пожалуйста, заполните все поля (Сумма, Люди, Даты).');
      return;
    }

    setIsCreating(true);

    const isInviteNeeded = !foundCounterparty;
    const targetName = foundCounterparty ? foundCounterparty.name : `Компания (БИН ${searchBin})`;
    
    const myBin = currentUser.bin.trim();
    const targetBin = searchBin.trim();

    const newContract: Omit<Contract, 'id'> = {
      number: 'DRAFT',
      date: contractTerms.contractDate,
      status: 'request',
      
      clientName: currentUser.role === 'organization' ? currentUser.companyName : targetName,
      clientBin: currentUser.role === 'organization' ? myBin : targetBin,
      clientSigned: false,

      clinicName: currentUser.role === 'clinic' ? currentUser.companyName : targetName,
      clinicBin: currentUser.role === 'clinic' ? myBin : targetBin,
      clinicSigned: false,

      price: Number(contractTerms.price),
      plannedHeadcount: Number(contractTerms.headcount),
      
      employees: [],
      documents: []
    };

    try {
      const contractsRef = ref(rtdb, 'contracts');
      const newContractRef = push(contractsRef);
      await set(newContractRef, newContract);
      
      if (isInviteNeeded && invitePhone) {
        sendWhatsAppMessage(invitePhone, 
          `Здравствуйте! Организация "${currentUser.companyName}" отправила вам договор на медосмотр (сумма: ${contractTerms.price} тг). Зарегистрируйтесь в MedFlow, чтобы подписать: https://medflow.kz/register`
        ).catch(err => console.error("WA Error", err));
      }
      
      onClose();
      showToast('success', 'Договор создан и отправлен контрагенту.');
    } catch (e) {
      console.error("Error creating contract", e);
      showToast('error', 'Не удалось создать договор. Попробуйте снова.');
    } finally {
      setIsCreating(false);
    }
  }, [currentUser, contractTerms, foundCounterparty, searchBin, invitePhone, onClose, showToast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-6">Новый договор</h3>
          
          {step === 1 ? (
            <StepOne
              searchBin={searchBin}
              setSearchBin={setSearchBin}
              foundCounterparty={foundCounterparty}
              invitePhone={invitePhone}
              setInvitePhone={setInvitePhone}
              isSearching={isSearching}
              onSearch={handleSearchBin}
              onNext={() => setStep(2)}
              currentUser={currentUser}
            />
          ) : (
            <StepTwo
              foundCounterparty={foundCounterparty}
              searchBin={searchBin}
              contractTerms={contractTerms}
              setContractTerms={setContractTerms}
              isCreating={isCreating}
              onBack={() => setStep(1)}
              onCreate={handleCreateContract}
            />
          )}
        </div>
      </div>
    </div>
  );
};



export default ContractsList;