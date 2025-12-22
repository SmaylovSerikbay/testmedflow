import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ApiVisit, apiListVisits } from '../services/api';
import AmbulatoryCard from './AmbulatoryCard';
import { websocketService } from '../services/websocketService';
import { 
  UserIcon, ClockIcon, CheckCircleIcon, 
  LoaderIcon, FileTextIcon, SearchIcon, XIcon 
} from './Icons';

interface DoctorWorkspaceProps {
  currentUser: UserProfile | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const DoctorWorkspace: React.FC<DoctorWorkspaceProps> = ({ currentUser, showToast }) => {
  const [visits, setVisits] = useState<ApiVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [selectedVisit, setSelectedVisit] = useState<ApiVisit | null>(null);

  const loadVisits = async () => {
    if (!currentUser?.specialty || !currentUser?.clinicId) {
      console.log('DoctorWorkspace: Missing specialty or clinicId', { specialty: currentUser?.specialty, clinicId: currentUser?.clinicId });
      setVisits([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Ищем визиты, где в маршрутном листе есть специальность этого врача
      console.log('DoctorWorkspace: Loading visits for', { 
        clinicId: currentUser.clinicId, 
        specialty: currentUser.specialty,
        doctorId: currentUser.doctorId 
      });
      const data = await apiListVisits({ 
        clinicId: currentUser.clinicId, 
        doctorId: currentUser.doctorId || currentUser.specialty 
      });
      console.log('DoctorWorkspace: Received visits', data);
      // Обрабатываем null или undefined как пустой массив
      setVisits(Array.isArray(data) ? data : (data === null || data === undefined ? [] : []));
    } catch (error) {
      console.error('DoctorWorkspace: Error loading visits:', error);
      showToast('error', 'Ошибка загрузки очереди');
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
    
    // Подписка на WebSocket для мгновенного обновления очереди
    if (currentUser?.clinicId) {
      // Подписываемся на события создания и обновления визитов
      const unsubscribeVisitStarted = websocketService.on('visit_started', (msg) => {
        console.log('DoctorWorkspace: Visit started via WS', msg);
        loadVisits();
      });
      
      const unsubscribeVisitUpdated = websocketService.on('visit_updated', (msg) => {
        console.log('DoctorWorkspace: Visit updated via WS', msg);
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

  // Вспомогательная функция для получения шага маршрутного листа текущего врача
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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">{currentUser?.specialty}</h1>
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
                        Открыть 052/у
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

      {/* Ambulatory Card Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full flex flex-col">
            <AmbulatoryCard 
              patientUid={selectedVisit.employeeId}
              iin={selectedVisit.employeeId}
              initialData={{
                name: selectedVisit.employeeName,
                clientName: selectedVisit.clientName,
                userSpecialty: currentUser?.specialty, // Pass specialty to auto-focus
              }}
              mode="edit"
              userRole={currentUser?.role}
              onClose={() => setSelectedVisit(null)}
              onSaveSuccess={() => {
                // После успешного сохранения можно либо закрыть карту, либо обновить очередь
                loadVisits();
                // Для удобства врачей можно закрыть окно, чтобы они видели обновленный список
                setTimeout(() => setSelectedVisit(null), 1000);
              }}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWorkspace;

