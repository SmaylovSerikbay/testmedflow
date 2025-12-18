import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Contract, UserProfile } from '../types';
import { sendWhatsAppMessage } from '../services/greenApi';
import { apiCreateContract, apiGetUserByPhone, apiGetUserByBin, ApiContract } from '../services/api';
import { 
  LoaderIcon, CheckShieldIcon, PlusIcon, BriefcaseIcon, ChevronLeftIcon, SearchIcon, FilterIcon, XIcon, UsersIcon, CalendarIcon
} from './Icons';
import { StepOne, StepTwo } from './CreateContractSteps';

interface ContractsListProps {
  currentUser: UserProfile | null;
  contracts: Contract[];
  onContractSelect: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  refetchContracts?: () => void;
}

const ContractsList: React.FC<ContractsListProps> = ({ 
  currentUser, 
  contracts, 
  onContractSelect, 
  showToast,
  refetchContracts
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Закрытие фильтров при клике вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  const handleCreateContract = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Фильтрация договоров
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchQuery === '' || 
      contract.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clinicName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="flex-1 flex flex-col relative overflow-auto bg-slate-50">
      <div className="p-6 w-full max-w-7xl mx-auto">
        {/* Header with Search and Actions */}
        <div className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Title and Create Button Row */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Договоры</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredContracts.length === 0 
                    ? 'Нет договоров' 
                    : `${filteredContracts.length} из ${contracts.length} ${contracts.length === 1 ? 'договора' : 'договоров'}`}
                </p>
              </div>
          <button 
            onClick={handleCreateContract}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
          >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <PlusIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Новый договор</span>
          </button>
        </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по номеру, названию организации..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  showFilters || statusFilter !== 'all'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Фильтр
                {statusFilter !== 'all' && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    1
                  </span>
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Статус</p>
                  </div>
                  <div className="p-2">
                    {[
                      { value: 'all', label: 'Все статусы' },
                      { value: 'request', label: 'Черновик' },
                      { value: 'negotiation', label: 'Согласование' },
                      { value: 'planning', label: 'Планирование' },
                      { value: 'execution', label: 'Исполнение' },
                      { value: 'completed', label: 'Завершен' }
                    ].map(status => (
                      <button
                        key={status.value}
                        onClick={() => {
                          setStatusFilter(status.value);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          statusFilter === status.value
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <EmptyState onCreateContract={handleCreateContract} />
        ) : filteredContracts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <SearchIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Ничего не найдено</h3>
            <p className="text-sm text-slate-500 mb-4">
              Попробуйте изменить параметры поиска или фильтра
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <ContractsGrid 
            contracts={filteredContracts} 
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
            refetchContracts={refetchContracts}
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
  <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <BriefcaseIcon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Нет активных договоров</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
      Создайте новый договор, чтобы начать процесс медицинского осмотра работников.
    </p>
    <button 
      onClick={onCreateContract}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
    >
      <PlusIcon className="w-4 h-4" />
      Создать договор
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
    <div className="grid gap-3">
      {contracts.map(contract => {
        const employeesCount = contract.employees?.length || 0;
        const hasEmployees = employeesCount > 0;
        
        return (
        <div 
          key={contract.id} 
          onClick={() => onContractSelect(contract.id)}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md ${
                    contract.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                    contract.status === 'execution' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    contract.status === 'planning' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                    contract.status === 'negotiation' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    'bg-gradient-to-br from-slate-700 to-slate-900'
            }`}>
                    {currentUser?.role === 'organization' ? contract.clinicName?.[0] : contract.clientName?.[0]}
            </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold group-hover:text-blue-600 transition-colors truncate mb-1">
                {currentUser?.role === 'organization' ? contract.clinicName : contract.clientName}
              </h3>
                        <p className="text-sm text-slate-500 font-mono">ID: {contract.number}</p>
            </div>
                      <StatusBadge status={contract.status} />
          </div>
          
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">
                          {contract.price ? contract.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'} Т
                        </span>
                      </div>
                      {contract.plannedHeadcount && (
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="w-4 h-4 text-slate-400" />
                          <span>{contract.plannedHeadcount} чел.</span>
                        </div>
                      )}
                      {hasEmployees && (
                        <div className="flex items-center gap-1.5">
                          <CheckShieldIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-emerald-600 font-medium">{employeesCount} в списке</span>
                        </div>
                      )}
                      {contract.date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          <span>{new Date(contract.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronLeftIcon className="w-5 h-5 text-slate-300 rotate-180 flex-shrink-0 group-hover:text-blue-500 transition-colors mt-1" />
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

// --- CREATE CONTRACT MODAL ---
interface CreateContractModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  refetchContracts?: () => void;
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({ currentUser, onClose, showToast, refetchContracts }) => {
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchBin = useCallback(async () => {
    if (searchBin.length !== 12) {
      setFoundCounterparty(null);
      return;
    }
    
    setIsSearching(true);
    setFoundCounterparty(null);
    
    try {
      // Проверяем, что это не наш собственный BIN
      if (currentUser?.bin && searchBin.trim() === currentUser.bin.trim()) {
        showToast('error', 'Нельзя создать договор с самим собой');
        setIsSearching(false);
        return;
      }

      // Ищем пользователя по BIN
      const foundUser = await apiGetUserByBin(searchBin);
      
      if (foundUser) {
        // Проверяем, что роль соответствует ожидаемой
        const expectedRole = currentUser?.role === 'organization' ? 'clinic' : 'organization';
        if (foundUser.role !== expectedRole) {
          showToast('error', `Найден пользователь с ролью "${foundUser.role}", ожидается "${expectedRole}"`);
          setFoundCounterparty(null);
        } else {
          setFoundCounterparty({
            name: foundUser.companyName || 'Не указано',
            bin: foundUser.bin || searchBin,
            phone: foundUser.phone
          });
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
  }, [searchBin, currentUser, showToast]);

  // Автоматический поиск при вводе 12 цифр
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Если введено 12 цифр, запускаем поиск с задержкой
    if (searchBin.length === 12) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchBin();
      }, 500); // Задержка 500мс для debounce
    } else {
      // Если меньше 12 цифр, очищаем результат
      setFoundCounterparty(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchBin, handleSearchBin]);

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

    // Генерируем номер договора сразу при создании
    const year = new Date().getFullYear();
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const contractNumber = `D-${year}/${randomId}`;
    
    const newContract: Omit<Contract, 'id'> = {
      number: contractNumber,
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
      const created = await apiCreateContract({
        number: newContract.number,
        clientName: newContract.clientName,
        clientBin: newContract.clientBin,
        clinicName: newContract.clinicName,
        clinicBin: newContract.clinicBin,
        date: newContract.date,
        status: newContract.status as any,
        price: newContract.price,
        plannedHeadcount: newContract.plannedHeadcount,
      });
      
      if (isInviteNeeded && invitePhone) {
        sendWhatsAppMessage(invitePhone, 
          `Здравствуйте! Организация "${currentUser.companyName}" отправила вам договор на медосмотр (сумма: ${contractTerms.price} тг). Зарегистрируйтесь в MedFlow, чтобы подписать: https://medflow.kz/register`
        ).catch(err => console.error("WA Error", err));
      }
      
      onClose();
      // Обновляем список договоров после успешного создания с небольшой задержкой
      if (refetchContracts) {
        setTimeout(() => {
          refetchContracts();
        }, 500);
      }
      showToast('success', 'Договор создан и отправлен контрагенту.');
    } catch (e) {
      console.error("Error creating contract", e);
      showToast('error', 'Не удалось создать договор. Попробуйте снова.');
    } finally {
      setIsCreating(false);
    }
  }, [currentUser, contractTerms, foundCounterparty, searchBin, invitePhone, onClose, showToast, refetchContracts]);

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