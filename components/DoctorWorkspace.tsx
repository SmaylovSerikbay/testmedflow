import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ApiVisit, apiListVisits } from '../services/api';
import VisitForm052 from '../src/components/doctor-workspace/VisitForm052';
import { DoctorVisit } from '../src/types/medical-forms';
import { mapSpecialtyToEnum } from '../src/utils/specialtyMapper';
import { websocketService } from '../services/websocketService';
import { 
  UserIcon, ClockIcon, CheckCircleIcon, 
  LoaderIcon, FileTextIcon, XIcon 
} from './Icons';
import { apiUpsertAmbulatoryCard, apiGetAmbulatoryCard } from '../services/api';
import { AmbulatoryCard } from '../types';

interface DoctorWorkspaceProps {
  currentUser: UserProfile | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser, showToast }) => {
  const [visits, setVisits] = useState<ApiVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [selectedVisit, setSelectedVisit] = useState<ApiVisit | null>(null);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);

  const loadVisits = async () => {
    if (!currentUser?.specialty || !currentUser?.clinicId) {
      setVisits([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiListVisits({ 
        clinicId: currentUser.clinicId, 
        doctorId: currentUser.doctorId || currentUser.specialty 
      });
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading visits:', error);
      showToast('error', 'Ошибка загрузки очереди');
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка амбулаторной карты при выборе визита
  useEffect(() => {
    const loadCard = async () => {
      if (!selectedVisit) {
        setAmbulatoryCard(null);
        return;
      }

      try {
        console.log('DoctorWorkspace: Loading card for visit', { employeeId: selectedVisit.employeeId });
        const card = await apiGetAmbulatoryCard({ 
          patientUid: selectedVisit.employeeId, 
          iin: selectedVisit.employeeId 
        });
        console.log('DoctorWorkspace: Loaded card', card);
        console.log('DoctorWorkspace: Card specialistEntries', card?.specialistEntries);
        
        // Парсим JSON поля если они пришли как строки
        if (card) {
          let specialistEntries = card.specialistEntries || {};
          if (typeof specialistEntries === 'string') {
            try {
              specialistEntries = JSON.parse(specialistEntries);
            } catch (e) {
              console.error('Error parsing specialistEntries:', e);
              specialistEntries = {};
            }
          }
          
          let labResults = card.labResults || {};
          if (typeof labResults === 'string') {
            try {
              labResults = JSON.parse(labResults);
            } catch (e) {
              console.error('Error parsing labResults:', e);
              labResults = {};
            }
          }
          
          const parsedCard = {
            ...card,
            specialistEntries,
            labResults
          };
          
          console.log('DoctorWorkspace: Parsed card specialistEntries', parsedCard.specialistEntries);
          setAmbulatoryCard(parsedCard);
        } else {
          console.log('DoctorWorkspace: No card found, setting to null');
          setAmbulatoryCard(null);
        }
      } catch (error) {
        console.error('Error loading ambulatory card:', error);
        setAmbulatoryCard(null);
      }
    };

    loadCard();
  }, [selectedVisit]);

  useEffect(() => {
    loadVisits();
    
    if (currentUser?.clinicId) {
      const unsubscribeVisitStarted = websocketService.on('visit_started', () => {
        loadVisits();
      });
      
      const unsubscribeVisitUpdated = websocketService.on('visit_updated', () => {
        loadVisits();
      });
      
      return () => {
        unsubscribeVisitStarted();
        unsubscribeVisitUpdated();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(loadVisits, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const getMyStep = (visit: ApiVisit) => {
    if (!visit.routeSheet || !currentUser?.specialty) return null;
    const mySpec = currentUser.specialty.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').trim();
    return visit.routeSheet.find(step => {
      const stepSpec = step.specialty.toLowerCase().replace(/[^а-яёa-z0-9]/g, '').trim();
      return stepSpec === mySpec || stepSpec.includes(mySpec) || mySpec.includes(stepSpec);
    });
  };

  const filteredVisits = visits.filter(v => {
    const myStep = getMyStep(v);
    if (!myStep) return false;
    if (filter === 'pending') return myStep.status === 'pending';
    return myStep.status === 'completed';
  });

  // Сохранение визита врача в амбулаторную карту
  const handleSaveVisit = async (visit: DoctorVisit) => {
    if (!selectedVisit || !currentUser?.specialty) {
      console.error('handleSaveVisit: Missing selectedVisit or specialty', { selectedVisit, specialty: currentUser?.specialty });
      return;
    }

    try {
      console.log('handleSaveVisit: Starting save for visit', { visit, employeeId: selectedVisit.employeeId });
      
      // Загружаем или создаем карту
      let card = ambulatoryCard;
      if (!card) {
        console.log('handleSaveVisit: Loading card from API');
        card = await apiGetAmbulatoryCard({ 
          patientUid: selectedVisit.employeeId, 
          iin: selectedVisit.employeeId 
        });
        console.log('handleSaveVisit: Loaded card', card);
      }

      // Если карты нет, создаем базовую структуру
      if (!card) {
        console.log('handleSaveVisit: Creating new card');
        card = {
          patientUid: selectedVisit.employeeId,
          iin: selectedVisit.employeeId,
          general: {
            fullName: selectedVisit.employeeName || '',
            dob: '',
            gender: 'male',
            age: 0,
            residentType: 'city',
            address: '',
            workPlace: selectedVisit.clientName || '',
            position: '',
            citizenship: 'РК',
            visitReason: 'Периодический медосмотр'
          },
          medical: {
            anthropometry: {
              height: '',
              weight: '',
              bmi: '',
              pressure: '',
              pulse: ''
            }
          },
          specialistEntries: {},
          labResults: {}
        };
      }

      // Преобразуем визит в формат амбулаторной карты
      const specialtyKey = currentUser.specialty;
      const specialistEntry = {
        doctorName: visit.doctorName || currentUser.specialty,
        date: visit.visitDate,
        complaints: visit.complaints,
        anamnesis: visit.anamnesis,
        objective: JSON.stringify(visit.objectiveData),
        diagnosis: visit.icd10Code,
        recommendations: visit.recommendations,
        fitnessStatus: visit.conclusion === 'FIT' ? 'fit' : 
                      visit.conclusion === 'UNFIT' ? 'unfit' : 'needs_observation'
      };

      const updatedCard: AmbulatoryCard = {
        ...card,
        specialistEntries: {
          ...(card.specialistEntries || {}),
          [specialtyKey]: specialistEntry
        }
      };

      console.log('handleSaveVisit: Saving card', { 
        patientUid: updatedCard.patientUid, 
        iin: updatedCard.iin,
        specialtyKey,
        specialistEntry 
      });

      await apiUpsertAmbulatoryCard(updatedCard);
      console.log('handleSaveVisit: Card saved successfully');
      
      // Перезагружаем карту из API чтобы получить актуальные данные
      try {
        const reloadedCard = await apiGetAmbulatoryCard({ 
          patientUid: selectedVisit.employeeId, 
          iin: selectedVisit.employeeId 
        });
        console.log('handleSaveVisit: Reloaded card after save', reloadedCard);
        
        if (reloadedCard) {
          // Парсим JSON поля
          let specialistEntries = reloadedCard.specialistEntries || {};
          if (typeof specialistEntries === 'string') {
            try {
              specialistEntries = JSON.parse(specialistEntries);
            } catch (e) {
              console.error('Error parsing specialistEntries after reload:', e);
              specialistEntries = {};
            }
          }
          
          let labResults = reloadedCard.labResults || {};
          if (typeof labResults === 'string') {
            try {
              labResults = JSON.parse(labResults);
            } catch (e) {
              console.error('Error parsing labResults after reload:', e);
              labResults = {};
            }
          }
          
          setAmbulatoryCard({
            ...reloadedCard,
            specialistEntries,
            labResults
          });
        }
      } catch (reloadError) {
        console.error('Error reloading card after save:', reloadError);
        // Используем обновленную карту из памяти
        setAmbulatoryCard(updatedCard);
      }
      
      showToast('success', 'Данные визита сохранены');
      loadVisits();
      
      // Закрываем форму через секунду
      setTimeout(() => setSelectedVisit(null), 1000);
    } catch (error) {
      console.error('Error saving visit:', error);
      showToast('error', `Ошибка при сохранении данных визита: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      throw error;
    }
  };

  // Получаем начальные данные визита из амбулаторной карты
  const getInitialVisitData = (): Partial<DoctorVisit> | undefined => {
    if (!ambulatoryCard || !currentUser?.specialty) {
      console.log('getInitialVisitData: No card or specialty', { 
        hasCard: !!ambulatoryCard, 
        specialty: currentUser?.specialty 
      });
      return undefined;
    }

    const specialtyKey = currentUser.specialty;
    console.log('getInitialVisitData: Looking for entry', { 
      specialtyKey, 
      specialistEntriesKeys: Object.keys(ambulatoryCard.specialistEntries || {}) 
    });
    
    const entry = ambulatoryCard.specialistEntries?.[specialtyKey];
    
    if (!entry) {
      console.log('getInitialVisitData: No entry found for specialty', specialtyKey);
      return undefined;
    }

    console.log('getInitialVisitData: Found entry', entry);

    try {
      // Парсим objective если это JSON строка
      let objectiveData = {};
      if (entry.objective) {
        if (typeof entry.objective === 'string') {
          try {
            objectiveData = JSON.parse(entry.objective);
          } catch (e) {
            console.error('getInitialVisitData: Error parsing objective JSON', e, entry.objective);
            // Если не JSON, возможно это уже объект или просто текст
            objectiveData = {};
          }
        } else if (typeof entry.objective === 'object') {
          objectiveData = entry.objective;
        }
      }

      const result = {
        complaints: entry.complaints || '',
        anamnesis: entry.anamnesis || '',
        objectiveData,
        icd10Code: entry.diagnosis || '',
        conclusion: entry.fitnessStatus === 'fit' ? 'FIT' :
                    entry.fitnessStatus === 'unfit' ? 'UNFIT' : 'REQUIRES_EXAM',
        recommendations: entry.recommendations || '',
        doctorName: entry.doctorName || '',
        visitDate: entry.date || new Date().toISOString()
      };

      console.log('getInitialVisitData: Returning data', result);
      return result;
    } catch (e) {
      console.error('getInitialVisitData: Error processing entry', e);
      return {
        complaints: entry.complaints || '',
        anamnesis: entry.anamnesis || '',
        objectiveData: {},
        icd10Code: entry.diagnosis || '',
        conclusion: entry.fitnessStatus === 'fit' ? 'FIT' :
                    entry.fitnessStatus === 'unfit' ? 'UNFIT' : 'REQUIRES_EXAM',
        recommendations: entry.recommendations || '',
        doctorName: entry.doctorName || '',
        visitDate: entry.date || new Date().toISOString()
      };
    }
  };

  if (!currentUser?.specialty) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">Специальность не указана</p>
      </div>
    );
  }

  const specialtyEnum = mapSpecialtyToEnum(currentUser.specialty);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">{currentUser.specialty}</h1>
            <p className="text-slate-500 text-sm">Очередь пациентов на сегодня</p>
          </div>
          <button 
            onClick={loadVisits}
            className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-blue-600"
          >
            <LoaderIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ожидают ({visits.filter(v => getMyStep(v)?.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Приняты ({visits.filter(v => getMyStep(v)?.status === 'completed').length})
          </button>
        </div>

        {/* Patients Queue */}
        <div className="space-y-3">
          {isLoading && visits.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <LoaderIcon className="w-8 h-8 animate-spin" />
              <p>Загрузка очереди...</p>
            </div>
          ) : filteredVisits.length > 0 ? (
            filteredVisits.map(visit => (
              <div 
                key={visit.id} 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer"
                onClick={() => setSelectedVisit(visit)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all ${
                    filter === 'pending' 
                      ? 'bg-blue-50 text-blue-600 border-blue-100 group-hover:scale-110' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {visit.employeeName ? visit.employeeName[0] : '#'}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-xl tracking-tight flex items-center gap-2">
                        {visit.employeeName || `ID: ${visit.employeeId}`}
                        {filter === 'completed' && <CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-3 mt-1 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(visit.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span>ИИН: {visit.employeeId}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4" />
                        Открыть форму 052/у
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <UserIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-slate-900 font-semibold">Очередь пуста</h3>
              <p className="text-slate-400 text-sm">На данный момент нет пациентов в статусе "{filter === 'pending' ? 'Ожидание' : 'Принято'}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Visit Form Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full flex flex-col">
            <VisitForm052
              patient={{
                id: selectedVisit.employeeId,
                name: selectedVisit.employeeName || `ID: ${selectedVisit.employeeId}`,
                iin: selectedVisit.employeeId
              }}
              specialty={specialtyEnum}
              doctorId={currentUser.doctorId || currentUser.uid}
              doctorName={currentUser.specialty}
              initialData={getInitialVisitData()}
              onSave={handleSaveVisit}
              onClose={() => setSelectedVisit(null)}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspace;
