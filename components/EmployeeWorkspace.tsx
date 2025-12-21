import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ApiVisit, apiListVisits } from '../services/api';
import AmbulatoryCard from './AmbulatoryCard';
import { websocketService } from '../services/websocketService';
import { 
  CheckCircleIcon, ClockIcon, MapPinIcon, 
  UserMdIcon, LoaderIcon, FileTextIcon, XIcon 
} from './Icons';

interface EmployeeWorkspaceProps {
  currentUser: UserProfile | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const EmployeeWorkspace: React.FC<EmployeeWorkspaceProps> = ({ currentUser, showToast }) => {
  const [activeVisit, setActiveVisit] = useState<ApiVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMedicalCard, setShowMedicalCard] = useState(false);

  const loadVisit = async () => {
    // Используем либо employeeId (ИИН), либо uid (ID пользователя)
    const searchId = currentUser?.employeeId || currentUser?.uid;
    if (!searchId) return;

    setIsLoading(true);
    try {
      const data = await apiListVisits({ employeeId: searchId });
      // Берем самый свежий визит
      if (Array.isArray(data) && data.length > 0) {
        setActiveVisit(data[0]);
      }
    } catch (error) {
      console.error('Error loading visit:', error);
      showToast('error', 'Ошибка загрузки данных о медосмотре');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisit();
    
    // Подписка на обновления визита через WebSocket
    if (currentUser?.uid) {
      const unsubscribe = websocketService.on('visit_updated', (msg) => {
        console.log('Visit updated via WS:', msg);
        loadVisit();
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(loadVisit, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (isLoading && !activeVisit) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50">
            <LoaderIcon className="w-10 h-10 animate-spin" />
            <p className="font-medium">Загрузка вашего маршрутного листа...</p>
        </div>
    );
  }

  if (!activeVisit) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-50 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <FileTextIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Медосмотр не найден</h3>
            <p className="max-w-xs">У вас нет активных медосмотров на данный момент. Пожалуйста, обратитесь в регистратуру клиники.</p>
        </div>
    );
  }

  const completedCount = activeVisit.routeSheet.filter(s => s.status === 'completed').length;
  const totalCount = activeVisit.routeSheet.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-auto">
      <div className="p-6 space-y-8 max-w-2xl mx-auto w-full">
        
        {/* Progress Card */}
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl shadow-blue-200/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Ваш медосмотр</h1>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      Начат: {new Date(activeVisit.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Обновлено: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <span className="text-2xl font-bold">{progress}%</span>
                </div>
                <button 
                  onClick={loadVisit}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white"
                  title="Обновить"
                >
                  <LoaderIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Прогресс прохождения</span>
                <span>{completedCount} из {totalCount} врачей</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />
        </div>

        {/* Route Sheet List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-2">
            <MapPinIcon className="w-5 h-5 text-blue-600" />
            Маршрутный лист
          </h2>
          
          <div className="grid gap-3">
            {activeVisit.routeSheet.map((step, idx) => (
              <div 
                key={idx}
                className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
                  step.status === 'completed' 
                    ? 'bg-emerald-50/50 border-emerald-100 opacity-75' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {step.status === 'completed' ? <CheckCircleIcon className="w-6 h-6" /> : <UserMdIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className={`font-bold ${step.status === 'completed' ? 'text-emerald-900 line-through opacity-50' : 'text-slate-900'}`}>
                        {step.specialty}
                    </div>
                    {step.roomNumber && (
                        <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            Кабинет {step.roomNumber}
                        </div>
                    )}
                  </div>
                </div>

                {step.status === 'pending' && (
                    <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        Ожидает
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div 
          onClick={() => setShowMedicalCard(true)}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-100 transition-all group"
        >
            <p className="text-blue-800 text-sm font-medium flex items-center justify-center gap-2">
                <FileTextIcon className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                Посмотреть мою амбулаторную карту (052/у)
            </p>
        </div>
      </div>

      {/* Ambulatory Card Modal */}
      {showMedicalCard && currentUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-full flex flex-col">
            <AmbulatoryCard 
              patientUid={currentUser.employeeId || currentUser.uid} // Use employeeId (IIN) as primary key
              iin={currentUser.employeeId || ''}
              mode="view"
              userRole={currentUser.role}
              onClose={() => setShowMedicalCard(false)}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWorkspace;

