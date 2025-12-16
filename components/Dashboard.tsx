import React, { useState, useEffect } from 'react';
import { Contract, Doctor, UserRole, Employee, UserProfile } from '../types';
import { parseEmployeeData } from '../services/geminiService';
import { sendWhatsAppMessage } from '../services/greenApi';
import { db, collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, getDoc } from '../services/firebase';
import { 
  UploadIcon, LoaderIcon, SparklesIcon, LogoIcon, 
  FileTextIcon, CalendarIcon, UsersIcon, CheckShieldIcon,
  PenIcon, SettingsIcon, UserMdIcon, TrashIcon, PlusIcon,
  BriefcaseIcon, ChevronLeftIcon, FileSignatureIcon, LinkIcon
} from './Icons';

// --- CONSTANTS ---
const SPECIALTIES = [
    'Профпатолог', 'Терапевт', 'Хирург', 'Невропатолог', 
    'Оториноларинголог', 'Офтальмолог', 'Дерматовенеролог', 
    'Гинеколог', 'Рентгенолог', 'Врач по функциональной диагностике', 'Врач-лаборант'
];

const Dashboard: React.FC = () => {
  // --- USER SESSION STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // --- GLOBAL STATE ---
  const [activeSidebarItem, setActiveSidebarItem] = useState('contracts');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // --- CONTRACT STATE ---
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // --- CREATE CONTRACT MODAL STATE ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newContractStep, setNewContractStep] = useState(1);
  const [searchBin, setSearchBin] = useState('');
  const [foundCounterparty, setFoundCounterparty] = useState<{name: string, bin: string, phone?: string} | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  // Added contractDate
  const [contractTerms, setContractTerms] = useState({ price: '', headcount: '', endDate: '', contractDate: new Date().toISOString().split('T')[0] });
  const [isSearchingBin, setIsSearchingBin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // --- UI LOCAL STATE ---
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState(SPECIALTIES[1]);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. LOAD USER PROFILE ---
  useEffect(() => {
    const fetchProfile = async () => {
        const uid = localStorage.getItem('medflow_uid');
        if (!uid) {
            setIsLoadingProfile(false);
            return;
        }
        
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setCurrentUser(userDoc.data() as UserProfile);
            } else {
                const savedPhone = localStorage.getItem('medflow_phone');
                setCurrentUser({
                    uid,
                    role: 'organization',
                    bin: '000000000000',
                    companyName: 'Моя Компания (Демо)',
                    leaderName: 'Демо Пользователь',
                    phone: savedPhone || ''
                });
            }
        } catch (e) {
            console.error("Profile load error", e);
            setIsOfflineMode(true);
            setCurrentUser({
                uid,
                role: 'organization',
                bin: '000000000000',
                companyName: 'Офлайн Компания',
                leaderName: 'Пользователь',
                phone: ''
            });
        } finally {
            setIsLoadingProfile(false);
        }
    };
    fetchProfile();
  }, []);

  // --- 2. LISTEN TO CONTRACTS ---
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "contracts"));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const contractsData: Contract[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Contract;
          // Filter on client side for demo simplicity
          if (data.clientBin === currentUser.bin || data.clinicBin === currentUser.bin) {
              contractsData.push({ id: doc.id, ...data });
          }
        });
        setContracts(contractsData);
      },
      (error) => {
        console.warn("Contracts listener error", error);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // --- 3. ACTIONS ---

  const handleSearchBin = async () => {
      if (searchBin.length !== 12) return;
      setIsSearchingBin(true);
      setFoundCounterparty(null);
      
      try {
          const q = query(collection(db, "users"), where("bin", "==", searchBin));
          
          // Race condition to prevent hanging
          const fetchPromise = getDocs(q);
          const timeoutPromise = new Promise<any>(resolve => setTimeout(() => resolve({ empty: true }), 3000));
          
          const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
          
          if (snapshot && !snapshot.empty) {
              const userData = snapshot.docs[0].data() as UserProfile;
              if (userData.role === currentUser?.role) {
                  alert("Нельзя создать договор с организацией того же типа!");
              } else {
                  setFoundCounterparty({
                      name: userData.companyName,
                      bin: userData.bin,
                      phone: userData.phone
                  });
              }
          } else {
              setFoundCounterparty(null);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsSearchingBin(false);
      }
  };

  const handleCreateContract = async () => {
      if (!currentUser) return;
      
      // Validation
      if (!contractTerms.price || !contractTerms.headcount || !contractTerms.endDate || !contractTerms.contractDate) {
          alert("Пожалуйста, заполните все поля (Сумма, Люди, Даты).");
          return;
      }

      setIsCreating(true);

      const isInviteNeeded = !foundCounterparty;
      const targetName = foundCounterparty ? foundCounterparty.name : `Компания (БИН ${searchBin})`;
      
      const newContract: Omit<Contract, 'id'> = {
          number: 'DRAFT',
          date: contractTerms.contractDate, // Use user selected date
          status: 'request',
          
          clientName: currentUser.role === 'organization' ? currentUser.companyName : targetName,
          clientBin: currentUser.role === 'organization' ? currentUser.bin : searchBin,
          clientSigned: false,

          clinicName: currentUser.role === 'clinic' ? currentUser.companyName : targetName,
          clinicBin: currentUser.role === 'clinic' ? currentUser.bin : searchBin,
          clinicSigned: false,

          price: Number(contractTerms.price),
          plannedHeadcount: Number(contractTerms.headcount),
          
          employees: [],
          documents: [],
          calendarPlan: { startDate: contractTerms.contractDate, endDate: contractTerms.endDate, status: 'draft' }
      };

      try {
          // 1. Create DB Doc
          // Use Promise.race to prevent hanging. Resolve strictly after 3s if DB is slow.
          // This allows Firestore optimistic updates to handle the UI.
          const createPromise = addDoc(collection(db, "contracts"), newContract);
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve("timeout"), 3000));
          
          await Promise.race([createPromise, timeoutPromise]);
          
          // 2. Send WhatsApp in background (don't await blocking UI)
          if (isInviteNeeded && invitePhone) {
              sendWhatsAppMessage(invitePhone, 
                `Здравствуйте! Организация "${currentUser.companyName}" отправила вам договор на медосмотр (сумма: ${contractTerms.price} тг). Зарегистрируйтесь в MedFlow, чтобы подписать: https://medflow.kz/register`
              ).catch(err => console.error("WA Error", err));
          }
          
          // 3. Close Modal UI
          // Don't show alert if it timed out to avoid confusion, just close it.
          // alert("Договор успешно создан!");
          
          setIsCreateModalOpen(false);
          // Reset form
          setContractTerms({ price: '', headcount: '', endDate: '', contractDate: new Date().toISOString().split('T')[0] });
          setSearchBin('');
          setFoundCounterparty(null);
          setNewContractStep(1);

      } catch (e) {
          console.error("Error creating contract", e);
          alert("Ошибка при сохранении договора. Попробуйте еще раз.");
      } finally {
          setIsCreating(false);
      }
  };

  const updateContract = async (id: string, updates: Partial<Contract>) => {
    try {
        const contractRef = doc(db, "contracts", id);
        await updateDoc(contractRef, updates);
    } catch (e) {
        console.error("Update error", e);
    }
  };

  const handleProcessContingent = async () => {
    if (!rawText.trim() || !selectedContractId) return;
    setIsProcessing(true);
    try {
      const data = await parseEmployeeData(rawText);
      const formatted: Employee[] = data.map((d, i) => ({ ...d, id: Date.now() + i + '', status: 'pending' }));
      
      await updateContract(selectedContractId, { 
        employees: formatted,
        status: 'negotiation'
      });
      setRawText('');
    } catch (e) {
      alert("Ошибка обработки.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignContract = async () => {
     if(!selectedContractId || !currentUser) return;
     
     const updates: Partial<Contract> = {};
     
     if(currentUser.role === 'organization') {
         updates.clientSigned = true;
     } else {
         updates.clinicSigned = true;
         updates.number = 'D-2024/' + Math.floor(Math.random()*10000);
     }

     if ((currentUser.role === 'organization' && selectedContract?.clinicSigned) || 
         (currentUser.role === 'clinic' && selectedContract?.clientSigned)) {
         updates.status = 'planning';
     }

     await updateContract(selectedContractId, updates);
  };

  const handleFinishExam = async () => {
      if(!selectedContractId) return;
      const finalDocs: any[] = [
        { id: 'd3', type: 'final_act', title: 'Заключительный акт (Прил. 1)', date: new Date().toLocaleDateString() },
        { id: 'd4', type: 'health_plan', title: 'План оздоровления', date: new Date().toLocaleDateString() }
      ];
      await updateContract(selectedContractId, {
          status: 'completed',
          documents: [...selectedContract!.documents, ...finalDocs]
      });
  };

  // --- HELPERS ---
  const selectedContract = contracts.find(c => c.id === selectedContractId);

  // --- COMPONENTS ---
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
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${map[status]}`}>{label[status]}</span>;
  };

  const ContractWorkspace = () => {
    if (!selectedContract) return null;
    
    const myRoleSigned = currentUser?.role === 'organization' ? selectedContract.clientSigned : selectedContract.clinicSigned;
    const canSign = !myRoleSigned && (selectedContract.status === 'request' || selectedContract.status === 'negotiation');

    return (
       <div className="flex flex-col h-full bg-white animate-fade-in-up">
           {/* Header */}
           <div className="border-b border-slate-100 p-6 flex items-center justify-between bg-slate-50/50 backdrop-blur-xl">
               <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedContractId(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                     <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <div>
                     <h2 className="text-xl font-bold flex items-center gap-3">
                        {currentUser?.role === 'clinic' ? selectedContract.clientName : selectedContract.clinicName}
                        <StatusBadge status={selectedContract.status} />
                     </h2>
                     <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedContract.number} • ДАТА: {selectedContract.date}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                   {canSign && (
                       <button onClick={handleSignContract} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2">
                           <PenIcon className="w-4 h-4" />
                           Подписать ЭЦП
                       </button>
                   )}
               </div>
           </div>

           {/* Progress Bar */}
           <div className="px-12 pt-8">
              <div className="flex items-center w-full mb-8 relative">
                   <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                   <div className="absolute top-1/2 left-0 h-1 bg-green-500 rounded-full -z-10" style={{width: selectedContract.status === 'completed' ? '100%' : '30%'}}></div>
              </div>
           </div>

           {/* Content Grid */}
           <div className="flex-1 overflow-auto p-8 grid grid-cols-12 gap-8">
               
               {/* LEFT: Context & Contingent */}
               <div className="col-span-12 lg:col-span-8 space-y-8">
                   
                   {/* Commercial Terms (Small Card) */}
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 grid grid-cols-3 gap-4">
                       <div>
                           <p className="text-xs text-slate-400 uppercase font-bold">Сумма договора</p>
                           <p className="text-lg font-bold">{selectedContract.price?.toLocaleString()} ₸</p>
                       </div>
                       <div>
                           <p className="text-xs text-slate-400 uppercase font-bold">Планируемый штат</p>
                           <p className="text-lg font-bold">{selectedContract.plannedHeadcount} чел.</p>
                       </div>
                       <div>
                           <p className="text-xs text-slate-400 uppercase font-bold">Срок до</p>
                           <p className="text-lg font-bold">{selectedContract.calendarPlan?.endDate || '-'}</p>
                       </div>
                   </div>

                   {/* Contingent Section */}
                   <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                           <h3 className="font-bold flex items-center gap-2 text-slate-700">
                               <UsersIcon className="w-5 h-5 text-blue-500" />
                               Контингент (Приложение 3)
                           </h3>
                           <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{selectedContract.employees.length} чел.</span>
                       </div>
                       
                       {selectedContract.employees.length === 0 ? (
                           <div className="p-8 text-center">
                               {currentUser?.role === 'organization' ? (
                                   <div className="max-w-md mx-auto">
                                       <textarea 
                                          value={rawText}
                                          onChange={e => setRawText(e.target.value)}
                                          placeholder="Вставьте список сотрудников (ФИО, Должность...)"
                                          className="w-full h-32 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm mb-4"
                                       />
                                       <button onClick={handleProcessContingent} disabled={isProcessing} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                           {isProcessing ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <UploadIcon className="w-4 h-4"/>}
                                           Загрузить и Распознать
                                       </button>
                                   </div>
                               ) : (
                                   <p className="text-slate-400 italic">Ожидание загрузки списка от Организации...</p>
                               )}
                           </div>
                       ) : (
                           <div className="max-h-64 overflow-auto">
                               <table className="w-full text-xs text-left">
                                   <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                                       <tr><th className="px-6 py-3">ФИО</th><th className="px-6 py-3">Должность</th><th className="px-6 py-3">Вредность</th></tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {selectedContract.employees.map(e => (
                                           <tr key={e.id} className="hover:bg-slate-50">
                                               <td className="px-6 py-3 font-medium">{e.name}</td>
                                               <td className="px-6 py-3 text-slate-500">{e.position}</td>
                                               <td className="px-6 py-3 text-amber-600">{e.harmfulFactor || '-'}</td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       )}
                   </section>

               </div>

               {/* RIGHT: Documents & Signatures */}
               <div className="col-span-12 lg:col-span-4 space-y-8">
                   
                   {/* Signatures Status */}
                   <section className="bg-white rounded-2xl p-6 border border-slate-200">
                       <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                           <FileSignatureIcon className="w-5 h-5" />
                           Подписанты
                       </h3>
                       <div className="space-y-4">
                           {/* Client */}
                           <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedContract.clientSigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                       {selectedContract.clientSigned ? '✓' : '?'}
                                   </div>
                                   <div className="text-sm">
                                       <p className="font-bold">{selectedContract.clientName}</p>
                                       <p className="text-xs text-slate-400">Заказчик</p>
                                   </div>
                               </div>
                           </div>
                           {/* Clinic */}
                           <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedContract.clinicSigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                       {selectedContract.clinicSigned ? '✓' : '?'}
                                   </div>
                                   <div className="text-sm">
                                       <p className="font-bold">{selectedContract.clinicName}</p>
                                       <p className="text-xs text-slate-400">Исполнитель</p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </section>

                   {/* Generated Documents */}
                   <section className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                       <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                           <FileTextIcon className="w-5 h-5" />
                           Документы
                       </h3>
                       <div className="space-y-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileSignatureIcon className="w-4 h-4" /></div>
                                   <div className="text-xs">
                                       <p className="font-bold">Договор №{selectedContract.number}</p>
                                       <p className="text-slate-400">{selectedContract.status}</p>
                                   </div>
                               </div>
                           </div>
                           {selectedContract.documents.map(doc => (
                               <div key={doc.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
                                   <div className="p-2 rounded-lg bg-slate-50 text-slate-500"><FileTextIcon className="w-4 h-4" /></div>
                                   <div className="text-xs">
                                       <p className="font-bold">{doc.title}</p>
                                       <p className="text-slate-400">{doc.date}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </section>
               </div>
           </div>
       </div>
    );
  };

  if (isLoadingProfile) {
      return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><LoaderIcon className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Create Contract Modal (Inlined to prevent focus loss) */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                  <div className="p-8">
                      <h3 className="text-2xl font-bold mb-6">Новый договор</h3>
                      
                      {newContractStep === 1 ? (
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Найти контрагента ({currentUser?.role === 'organization' ? 'Клинику' : 'Организацию'})</label>
                                  <div className="flex gap-2">
                                      <input 
                                          value={searchBin}
                                          onChange={(e) => setSearchBin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                          placeholder="Введите БИН (12 цифр)"
                                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                                          autoFocus
                                      />
                                      <button 
                                          onClick={handleSearchBin}
                                          disabled={isSearchingBin || searchBin.length < 12}
                                          className="px-4 bg-slate-900 text-white rounded-xl hover:bg-black disabled:opacity-50"
                                      >
                                          {isSearchingBin ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Поиск'}
                                      </button>
                                  </div>
                              </div>

                              {foundCounterparty ? (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                          <CheckShieldIcon className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <p className="font-bold text-green-900">{foundCounterparty.name}</p>
                                          <p className="text-xs text-green-700">БИН: {foundCounterparty.bin}</p>
                                      </div>
                                  </div>
                              ) : searchBin.length === 12 && !isSearchingBin && (
                                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                      <p className="text-sm text-amber-800 font-medium mb-2">Организация не найдена в MedFlow.</p>
                                      <p className="text-xs text-amber-600 mb-3">Мы отправим приглашение на регистрацию и подписание договора в WhatsApp.</p>
                                      <input 
                                          value={invitePhone}
                                          onChange={(e) => setInvitePhone(e.target.value)}
                                          placeholder="+7 (700) 000-00-00"
                                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm"
                                      />
                                  </div>
                              )}

                              <div className="pt-4 flex justify-end">
                                  <button 
                                      onClick={() => setNewContractStep(2)}
                                      disabled={(!foundCounterparty && invitePhone.length < 11)}
                                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                  >
                                      Далее: Условия
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                                  <p className="text-xs text-slate-400 uppercase font-bold">Контрагент</p>
                                  <p className="font-bold">{foundCounterparty?.name || `Приглашение для БИН ${searchBin}`}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Сумма (тенге)</label>
                                      <input 
                                          type="number"
                                          value={contractTerms.price}
                                          onChange={e => setContractTerms({...contractTerms, price: e.target.value})}
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                          placeholder="1 500 000"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Кол-во людей</label>
                                      <input 
                                          type="number"
                                          value={contractTerms.headcount}
                                          onChange={e => setContractTerms({...contractTerms, headcount: e.target.value})}
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                          placeholder="50"
                                      />
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Дата заключения</label>
                                      <input 
                                          type="date"
                                          value={contractTerms.contractDate}
                                          onChange={e => setContractTerms({...contractTerms, contractDate: e.target.value})}
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Дата окончания</label>
                                      <input 
                                          type="date"
                                          value={contractTerms.endDate}
                                          onChange={e => setContractTerms({...contractTerms, endDate: e.target.value})}
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                      />
                                  </div>
                              </div>

                              <div className="pt-6 flex gap-3">
                                  <button onClick={() => setNewContractStep(1)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Назад</button>
                                  <button onClick={handleCreateContract} disabled={isCreating} className="flex-2 w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg flex justify-center items-center">
                                      {isCreating ? <LoaderIcon className="w-5 h-5 animate-spin"/> : 'Создать и Отправить'}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 z-20">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
            <LogoIcon className="w-6 h-6 text-slate-900" />
            <span className="font-bold text-lg tracking-tight">MedFlow</span>
        </div>
        
        {/* User Profile Card */}
        <div className="p-4">
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        {currentUser?.companyName[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{currentUser?.companyName}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{currentUser?.role === 'organization' ? 'Заказчик' : 'Клиника'}</p>
                    </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono bg-black/20 p-2 rounded-lg break-all">
                    БИН: {currentUser?.bin}
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
            <button 
                onClick={() => { setActiveSidebarItem('contracts'); setSelectedContractId(null); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSidebarItem === 'contracts' ? 'bg-slate-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <BriefcaseIcon className="w-4 h-4"/>
                <span className="flex-1 text-left">Договоры</span>
                <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px] font-bold">{contracts.length}</span>
            </button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
         
         {selectedContractId ? (
             <ContractWorkspace />
         ) : (
             <div className="p-8 max-w-5xl mx-auto w-full animate-fade-in-up">
                 <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-bold tracking-tight">Договоры</h2>
                     <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-transform active:scale-95 shadow-lg flex items-center gap-2">
                         <PlusIcon className="w-4 h-4" />
                         Новый договор
                     </button>
                 </div>

                 {contracts.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <BriefcaseIcon className="w-8 h-8" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900">Нет активных договоров</h3>
                         <p className="text-slate-500 mb-6 max-w-md mx-auto">Создайте новый договор, чтобы начать процесс медицинского осмотра.</p>
                         <button onClick={() => setIsCreateModalOpen(true)} className="text-blue-600 font-bold hover:underline">Создать сейчас</button>
                     </div>
                 ) : (
                     <div className="grid gap-4">
                         {contracts.map(contract => (
                             <div 
                                key={contract.id} 
                                onClick={() => setSelectedContractId(contract.id)}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between group"
                             >
                                 <div className="flex items-center gap-6">
                                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${contract.status === 'completed' ? 'bg-green-500' : 'bg-slate-900'}`}>
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
                 )}
             </div>
         )}
      </main>
    </div>
  );
};

export default Dashboard;