import React, { useState, useEffect } from 'react';
import { Contract, Doctor, UserRole, Employee, UserProfile, ContractDocument } from '../types';
import { parseEmployeeData } from '../services/geminiService';
import { sendWhatsAppMessage } from '../services/greenApi';
import { db, collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs, getDoc, rtdb, ref, onValue, push, remove, update, set } from '../services/firebase';
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
  
  // --- CONTRACT STATE ---
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  
  // --- DOCTORS STATE ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({ name: '', specialty: SPECIALTIES[0], isChairman: false });
  
  // --- FINAL REPORT MODAL STATE ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ finalAct: '', healthPlan: '' });
  const [isSavingReport, setIsSavingReport] = useState(false);

  // --- CREATE CONTRACT MODAL STATE ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newContractStep, setNewContractStep] = useState(1);
  const [searchBin, setSearchBin] = useState('');
  const [foundCounterparty, setFoundCounterparty] = useState<{name: string, bin: string, phone?: string} | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [contractTerms, setContractTerms] = useState({ price: '', headcount: '', endDate: '', contractDate: new Date().toISOString().split('T')[0] });
  const [isSearchingBin, setIsSearchingBin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // --- UI LOCAL STATE ---
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
            // Get user from Firestore
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setCurrentUser(userDoc.data() as UserProfile);
            } else {
                console.warn("User profile not found for UID:", uid);
                // Fallback (rare case if DB deleted but LocalStorage exists)
                const savedPhone = localStorage.getItem('medflow_phone');
                setCurrentUser({
                    uid,
                    role: 'organization',
                    bin: '000000000000',
                    companyName: 'Организация (Без профиля)',
                    leaderName: 'Пользователь',
                    phone: savedPhone || ''
                });
            }
        } catch (e) {
            console.error("Profile load error", e);
        } finally {
            setIsLoadingProfile(false);
        }
    };
    fetchProfile();
  }, []);

  // --- 2. LISTEN TO CONTRACTS ---
  useEffect(() => {
    if (!currentUser || !currentUser.bin) return;
    
    // Listen to ALL contracts and filter client-side to ensure robustness 
    // (Simpler than maintaining complex indexes for OR queries in demo)
    const q = query(collection(db, "contracts"));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const contractsData: Contract[] = [];
        const userBin = currentUser.bin.trim();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Contract;
          // Robust comparison handling potential whitespaces
          const clientBin = data.clientBin ? data.clientBin.toString().trim() : '';
          const clinicBin = data.clinicBin ? data.clinicBin.toString().trim() : '';
          
          if (clientBin === userBin || clinicBin === userBin) {
              contractsData.push({ id: doc.id, ...data });
          }
        });
        
        // Sort by date descending (newest first)
        contractsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setContracts(contractsData);
      },
      (error) => {
        console.warn("Contracts listener error", error);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // --- 2.5 LISTEN TO DOCTORS (RTDB) ---
  useEffect(() => {
      if (!currentUser || currentUser.role !== 'clinic') return;

      const doctorsRef = ref(rtdb, `clinics/${currentUser.uid}/doctors`);
      const unsubscribe = onValue(doctorsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
              const loadedDoctors: Doctor[] = Object.entries(data).map(([key, val]: any) => ({
                  id: key,
                  name: val.name,
                  specialty: val.specialty,
                  isChairman: val.isChairman
              }));
              setDoctors(loadedDoctors);
          } else {
              setDoctors([]);
          }
      });

      return () => unsubscribe();
  }, [currentUser]);


  // --- 3. ACTIONS ---

  const handleSearchBin = async () => {
      if (searchBin.length !== 12) return;
      setIsSearchingBin(true);
      setFoundCounterparty(null);
      
      try {
          // REMOVED TIMEOUT RACE CONDITION - Main fix for "Not Found" error
          const q = query(collection(db, "users"), where("bin", "==", searchBin));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
              const userData = snapshot.docs[0].data() as UserProfile;
              
              if (userData.role === currentUser?.role) {
                  alert("Ошибка: Вы пытаетесь заключить договор с организацией того же типа.");
              } else {
                  setFoundCounterparty({
                      name: userData.companyName,
                      bin: userData.bin,
                      phone: userData.phone
                  });
              }
          } else {
              // Valid empty result - show invite UI
              setFoundCounterparty(null);
          }
      } catch (e) {
          console.error("Search error:", e);
          setFoundCounterparty(null);
          alert("Ошибка при поиске. Проверьте соединение.");
      } finally {
          setIsSearchingBin(false);
      }
  };

  const handleCreateContract = async () => {
      if (!currentUser) return;
      
      if (!contractTerms.price || !contractTerms.headcount || !contractTerms.endDate || !contractTerms.contractDate) {
          alert("Пожалуйста, заполните все поля (Сумма, Люди, Даты).");
          return;
      }

      setIsCreating(true);

      const isInviteNeeded = !foundCounterparty;
      const targetName = foundCounterparty ? foundCounterparty.name : `Компания (БИН ${searchBin})`;
      
      // Ensure BINs are clean strings
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
          documents: [],
          calendarPlan: { startDate: contractTerms.contractDate, endDate: contractTerms.endDate, status: 'draft' }
      };

      try {
          // Direct add without timeout race condition
          await addDoc(collection(db, "contracts"), newContract);
          
          if (isInviteNeeded && invitePhone) {
              sendWhatsAppMessage(invitePhone, 
                `Здравствуйте! Организация "${currentUser.companyName}" отправила вам договор на медосмотр (сумма: ${contractTerms.price} тг). Зарегистрируйтесь в MedFlow, чтобы подписать: https://medflow.kz/register`
              ).catch(err => console.error("WA Error", err));
          }
          
          setIsCreateModalOpen(false);
          // Reset form
          setContractTerms({ price: '', headcount: '', endDate: '', contractDate: new Date().toISOString().split('T')[0] });
          setSearchBin('');
          setFoundCounterparty(null);
          setNewContractStep(1);

      } catch (e) {
          console.error("Error creating contract", e);
          alert("Не удалось создать договор. Попробуйте снова.");
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
         const year = new Date().getFullYear();
         const randomId = Math.floor(1000 + Math.random() * 9000); 
         updates.number = `D-${year}/${randomId}`;
     }

     if ((currentUser.role === 'organization' && selectedContract?.clinicSigned) || 
         (currentUser.role === 'clinic' && selectedContract?.clientSigned)) {
         updates.status = 'planning';
     }

     await updateContract(selectedContractId, updates);
  };

  // --- DOCTOR ACTIONS ---
  const handleOpenDoctorModal = (doctor?: Doctor) => {
      if (doctor) {
          setEditingDoctor(doctor);
          setDoctorForm({ name: doctor.name, specialty: doctor.specialty, isChairman: !!doctor.isChairman });
      } else {
          setEditingDoctor(null);
          setDoctorForm({ name: '', specialty: SPECIALTIES[0], isChairman: false });
      }
      setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async () => {
      if (!currentUser || !doctorForm.name) return;
      
      const doctorsRef = ref(rtdb, `clinics/${currentUser.uid}/doctors`);
      
      if (editingDoctor) {
          // Update
          const docRef = ref(rtdb, `clinics/${currentUser.uid}/doctors/${editingDoctor.id}`);
          await update(docRef, doctorForm);
      } else {
          // Create
          const newDocRef = push(doctorsRef);
          await set(newDocRef, doctorForm);
      }
      setIsDoctorModalOpen(false);
  };

  const handleDeleteDoctor = async (id: string) => {
      if (!currentUser || !window.confirm("Удалить врача?")) return;
      const docRef = ref(rtdb, `clinics/${currentUser.uid}/doctors/${id}`);
      await remove(docRef);
  };

  // --- EMPLOYEE STATUS TOGGLE (Simulate Exam) ---
  const handleToggleEmployeeStatus = async (employeeId: string) => {
     if(!selectedContractId || currentUser?.role !== 'clinic') return;
     const contract = contracts.find(c => c.id === selectedContractId);
     if(!contract) return;

     const updatedEmployees = contract.employees.map(e => {
         if(e.id === employeeId) {
             // Cycle: Pending -> Fit -> Unfit -> Needs Obs -> Pending
             if(e.status === 'pending') return { ...e, status: 'fit' as const };
             if(e.status === 'fit') return { ...e, status: 'needs_observation' as const };
             if(e.status === 'needs_observation') return { ...e, status: 'unfit' as const };
             return { ...e, status: 'pending' as const };
         }
         return e;
     });

     await updateContract(selectedContractId, { employees: updatedEmployees });
  };

  // --- GENERATE REPORTS (Act & Plan) ---
  const handleGenerateReports = () => {
      if(!selectedContract) return;

      const total = selectedContract.employees.length;
      const fit = selectedContract.employees.filter(e => e.status === 'fit').length;
      const unfit = selectedContract.employees.filter(e => e.status === 'unfit').length;
      const observation = selectedContract.employees.filter(e => e.status === 'needs_observation').length;
      
      const actTemplate = `ЗАКЛЮЧИТЕЛЬНЫЙ АКТ
по результатам проведенного периодического медицинского осмотра работников ${selectedContract.clientName}

1. Медицинская организация: ${selectedContract.clinicName}
2. Организация (Заказчик): ${selectedContract.clientName}
3. Всего работников, подлежащих осмотру: ${total}
4. Всего осмотрено: ${total} (% охвата: 100%)
   - Признаны годными к работе: ${fit}
   - Выявлено лиц с подозрением на профзаболевание: 0
   - Нуждаются в дообследовании (в т.ч. в условиях стационара): ${observation}
   - Выявлено лиц с общими заболеваниями, являющимися противопоказаниями к работе: ${unfit}

5. Результаты выполнения плана оздоровления за предыдущий год: 
   - Выполнено: 100%

Председатель врачебной комиссии: ____________________
М.П.                                  (Дата)`;

      const obsEmployees = selectedContract.employees.filter(e => e.status === 'needs_observation' || e.status === 'unfit');
      const obsList = obsEmployees.length > 0 
          ? obsEmployees.map((e, i) => `${i+1}. ${e.name} (${e.position}) - ${e.status === 'unfit' ? 'Противопоказан' : 'Наблюдение'}`).join('\n')
          : 'Нет сотрудников, требующих оздоровительных мероприятий.';

      const planTemplate = `ПЛАН ОЗДОРОВЛЕНИЯ
работников ${selectedContract.clientName} по результатам периодического медицинского осмотра

Список сотрудников, подлежащих оздоровлению (из группы 'Д' и группы риска):
${obsList}

РАСПРЕДЕЛЕНИЕ ПО ВИДАМ ОЗДОРОВЛЕНИЯ (Пункт 21):

1. Стационарное обследование и лечение:
   (Заполните ФИО)

2. Амбулаторное обследование и лечение:
   (Заполните ФИО)

3. Санаторно-курортное лечение:
   (Заполните ФИО)

4. Лечебно-профилактическое питание:
   (Заполните ФИО)

5. Временный перевод на другую работу по состоянию здоровья:
   (Заполните ФИО)

Врач-профпатолог: ____________________
Представитель работодателя: ____________________`;

      setReportForm({ finalAct: selectedContract.finalActContent || actTemplate, healthPlan: selectedContract.healthPlanContent || planTemplate });
      setIsReportModalOpen(true);
  };

  const handleSaveReports = async () => {
      if(!selectedContractId) return;
      setIsSavingReport(true);
      try {
          const date = new Date().toLocaleDateString();
          const newDocs: ContractDocument[] = [];
          
          // Helper to check if doc exists to avoid duplicates in UI list
          const existingDocs = selectedContract?.documents || [];
          
          if (!existingDocs.find(d => d.type === 'final_act')) {
              newDocs.push({ id: 'act_' + Date.now(), type: 'final_act', title: 'Заключительный акт', date });
          }
          if (!existingDocs.find(d => d.type === 'health_plan')) {
              newDocs.push({ id: 'plan_' + Date.now(), type: 'health_plan', title: 'План оздоровления', date });
          }

          await updateContract(selectedContractId, {
              finalActContent: reportForm.finalAct,
              healthPlanContent: reportForm.healthPlan,
              documents: [...existingDocs, ...newDocs],
              status: 'completed'
          });
          setIsReportModalOpen(false);
      } catch(e) {
          alert("Ошибка сохранения");
      } finally {
          setIsSavingReport(false);
      }
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

    // Check if exam is finished (all employees have status other than pending)
    const isExamFinished = selectedContract.employees.length > 0 && selectedContract.employees.every(e => e.status !== 'pending');

    // --- CALENDAR PLAN STATE ---
    const [planStart, setPlanStart] = useState(selectedContract.calendarPlan?.startDate || '');
    const [planEnd, setPlanEnd] = useState(selectedContract.calendarPlan?.endDate || '');
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    // Sync if contract updates from DB
    useEffect(() => {
        setPlanStart(selectedContract.calendarPlan?.startDate || '');
        setPlanEnd(selectedContract.calendarPlan?.endDate || '');
    }, [selectedContract]);

    const handleSavePlan = async () => {
        if(!selectedContractId) return;
        setIsSavingPlan(true);
        try {
            const status = (planStart && planEnd) ? 'approved' : 'draft';
            await updateContract(selectedContractId, {
                calendarPlan: {
                    startDate: planStart,
                    endDate: planEnd,
                    status: status
                }
            });
        } catch(e) {
            alert("Ошибка сохранения плана");
        } finally {
            setIsSavingPlan(false);
        }
    };

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
                                       <tr>
                                           <th className="px-6 py-3">ФИО</th>
                                           <th className="px-6 py-3">Должность</th>
                                           <th className="px-6 py-3">Вредность</th>
                                           <th className="px-6 py-3">Статус</th>
                                        </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {selectedContract.employees.map(e => (
                                           <tr key={e.id} className="hover:bg-slate-50">
                                               <td className="px-6 py-3 font-medium">{e.name}</td>
                                               <td className="px-6 py-3 text-slate-500">{e.position}</td>
                                               <td className="px-6 py-3 text-amber-600">{e.harmfulFactor || '-'}</td>
                                               <td className="px-6 py-3">
                                                   <button 
                                                        onClick={() => handleToggleEmployeeStatus(e.id)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                                                           e.status === 'fit' ? 'bg-green-100 text-green-700' :
                                                           e.status === 'unfit' ? 'bg-red-100 text-red-700' :
                                                           e.status === 'needs_observation' ? 'bg-amber-100 text-amber-700' :
                                                           'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                   >
                                                       {e.status === 'fit' ? 'Годен' :
                                                        e.status === 'unfit' ? 'Не годен' :
                                                        e.status === 'needs_observation' ? 'Набл.' : 'Ожидание'}
                                                   </button>
                                               </td>
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
                   
                   {/* Calendar Plan Section */}
                   <section className="bg-white rounded-2xl p-6 border border-slate-200">
                       <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Календарный план
                            </h3>
                            {selectedContract.calendarPlan?.status === 'approved' && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase">Утвержден</span>
                            )}
                       </div>

                       <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                               <div>
                                   <label className="text-[10px] uppercase font-bold text-slate-400">Начало</label>
                                   <input
                                       type="date"
                                       disabled={currentUser?.role !== 'clinic'}
                                       value={planStart}
                                       onChange={(e) => setPlanStart(e.target.value)}
                                       className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                                   />
                               </div>
                               <div>
                                   <label className="text-[10px] uppercase font-bold text-slate-400">Конец</label>
                                   <input
                                       type="date"
                                       disabled={currentUser?.role !== 'clinic'}
                                       value={planEnd}
                                       onChange={(e) => setPlanEnd(e.target.value)}
                                       className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition-colors"
                                   />
                               </div>
                           </div>

                           {currentUser?.role === 'clinic' && (
                               <button
                                   onClick={handleSavePlan}
                                   disabled={isSavingPlan}
                                   className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md flex justify-center items-center gap-2"
                               >
                                   {isSavingPlan ? <LoaderIcon className="w-3 h-3 animate-spin" /> : 'Сохранить план'}
                               </button>
                           )}
                           {currentUser?.role === 'organization' && !selectedContract.calendarPlan?.startDate && (
                               <p className="text-xs text-slate-400 italic text-center">Ожидание заполнения плана Клиникой...</p>
                           )}
                       </div>
                   </section>

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
                               <div key={doc.id} onClick={() => { if(doc.type === 'final_act' || doc.type === 'health_plan') handleGenerateReports() }} className={`bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm ${doc.type === 'final_act' || doc.type === 'health_plan' ? 'cursor-pointer hover:border-blue-400' : ''}`}>
                                   <div className={`p-2 rounded-lg text-slate-500 ${doc.type === 'final_act' ? 'bg-green-50 text-green-600' : 'bg-slate-50'}`}><FileTextIcon className="w-4 h-4" /></div>
                                   <div className="text-xs">
                                       <p className="font-bold">{doc.title}</p>
                                       <p className="text-slate-400">{doc.date}</p>
                                   </div>
                               </div>
                           ))}

                           {/* Generate Reports Button */}
                           {currentUser?.role === 'clinic' && isExamFinished && (
                               <button 
                                  onClick={handleGenerateReports}
                                  className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-md shadow-blue-200"
                               >
                                  <SparklesIcon className="w-4 h-4" />
                                  Сформировать заключительные документы
                               </button>
                           )}
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
                                          <div className="flex items-center gap-2 text-xs text-green-700">
                                              <span>БИН: {foundCounterparty.bin}</span>
                                              {foundCounterparty.phone && <span>• {foundCounterparty.phone}</span>}
                                          </div>
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
                                  <div>
                                      <p className="font-bold">{foundCounterparty?.name || `Приглашение для БИН ${searchBin}`}</p>
                                      {foundCounterparty?.phone && <p className="text-xs text-slate-500 mt-0.5">{foundCounterparty.phone}</p>}
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Сумма договора (тенге)</label>
                                      <input 
                                          type="number"
                                          value={contractTerms.price}
                                          onChange={e => setContractTerms({...contractTerms, price: e.target.value})}
                                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                          placeholder="1 500 000"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Планируемое кол-во сотрудников</label>
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
                                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Дата начала</label>
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

      {/* Doctor Modal */}
      {isDoctorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDoctorModalOpen(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                  <div className="p-8">
                      <h3 className="text-2xl font-bold mb-6">{editingDoctor ? 'Редактировать врача' : 'Добавить врача'}</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">ФИО Врача</label>
                              <input 
                                  value={doctorForm.name}
                                  onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                                  placeholder="Иванов Иван Иванович"
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Специальность</label>
                              <select 
                                  value={doctorForm.specialty}
                                  onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 appearance-none"
                              >
                                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                              <input 
                                  type="checkbox"
                                  id="chairman"
                                  checked={doctorForm.isChairman}
                                  onChange={e => setDoctorForm({...doctorForm, isChairman: e.target.checked})}
                                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="chairman" className="text-sm font-medium text-slate-700">Председатель комиссии</label>
                          </div>
                      </div>
                      <div className="pt-8 flex gap-3">
                          <button onClick={() => setIsDoctorModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Отмена</button>
                          <button onClick={handleSaveDoctor} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Сохранить</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* FINAL REPORT MODAL */}
      {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col animate-fade-in-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold">Заключительные документы</h3>
                      <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-8 grid grid-cols-2 gap-8">
                      <div className="flex flex-col h-full">
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                              <FileTextIcon className="w-4 h-4" /> Заключительный акт (Приложение 1)
                          </label>
                          <textarea 
                              value={reportForm.finalAct}
                              onChange={e => setReportForm({...reportForm, finalAct: e.target.value})}
                              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed outline-none resize-none focus:border-blue-500"
                          />
                      </div>
                      <div className="flex flex-col h-full">
                          <label className="block text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                              <UserMdIcon className="w-4 h-4" /> План оздоровления
                          </label>
                          <textarea 
                              value={reportForm.healthPlan}
                              onChange={e => setReportForm({...reportForm, healthPlan: e.target.value})}
                              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed outline-none resize-none focus:border-blue-500"
                          />
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                      <button onClick={() => setIsReportModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Отмена</button>
                      <button onClick={handleSaveReports} disabled={isSavingReport} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2">
                          {isSavingReport ? <LoaderIcon className="w-4 h-4 animate-spin"/> : 'Сохранить и Завершить'}
                      </button>
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
            {currentUser?.role === 'clinic' && (
                <button 
                    onClick={() => { setActiveSidebarItem('doctors'); setSelectedContractId(null); }} 
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSidebarItem === 'doctors' ? 'bg-slate-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <UserMdIcon className="w-4 h-4"/>
                    <span className="flex-1 text-left">Врачи</span>
                </button>
            )}
        </nav>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
         
         {activeSidebarItem === 'contracts' && selectedContractId ? (
             <ContractWorkspace />
         ) : activeSidebarItem === 'contracts' ? (
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
         ) : activeSidebarItem === 'doctors' && currentUser?.role === 'clinic' ? (
             <div className="p-8 max-w-5xl mx-auto w-full animate-fade-in-up">
                 <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-bold tracking-tight">Врачи клиники</h2>
                     <button onClick={() => handleOpenDoctorModal()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-transform active:scale-95 shadow-lg flex items-center gap-2">
                         <PlusIcon className="w-4 h-4" />
                         Добавить врача
                     </button>
                 </div>
                 
                 {doctors.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <UserMdIcon className="w-8 h-8" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900">Список врачей пуст</h3>
                         <p className="text-slate-500 mb-6 max-w-md mx-auto">Добавьте специалистов для формирования медицинской комиссии.</p>
                         <button onClick={() => handleOpenDoctorModal()} className="text-blue-600 font-bold hover:underline">Добавить сейчас</button>
                     </div>
                 ) : (
                     <div className="grid gap-4">
                         {doctors.map(doc => (
                             <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${doc.isChairman ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                         {doc.name[0]}
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-2">
                                             <h3 className="text-lg font-bold">{doc.name}</h3>
                                             {doc.isChairman && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-200">Председатель</span>}
                                         </div>
                                         <p className="text-sm text-slate-400">{doc.specialty}</p>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <button onClick={() => handleOpenDoctorModal(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                         <SettingsIcon className="w-5 h-5" />
                                     </button>
                                     <button onClick={() => handleDeleteDoctor(doc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                         <TrashIcon className="w-5 h-5" />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
         ) : null}
      </main>
    </div>
  );
};

export default Dashboard;