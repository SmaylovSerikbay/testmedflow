import React, { useState, useEffect } from 'react';
import { UserProfile, AmbulatoryCard } from '../types';
import { ApiVisit, apiListVisits, apiGetAmbulatoryCard } from '../services/api';
import Form075 from '../src/components/documents/Form075';
import HealthPassport from '../src/components/documents/HealthPassport';
import { generateForm075, generateHealthPassport } from '../src/utils/documentGenerator';
import { websocketService } from '../services/websocketService';
import { 
  CheckCircleIcon, ClockIcon, MapPinIcon, 
  UserMdIcon, LoaderIcon, FileTextIcon, XIcon, PrinterIcon
} from './Icons';

interface EmployeeWorkspaceProps {
  currentUser: UserProfile | null;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const EmployeeWorkspace: React.FC<EmployeeWorkspaceProps> = ({ currentUser, showToast }) => {
  const [activeVisit, setActiveVisit] = useState<ApiVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ambulatoryCard, setAmbulatoryCard] = useState<AmbulatoryCard | null>(null);
  const [activeDocument, setActiveDocument] = useState<'form075' | 'healthPassport' | null>(null);

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

  // Загрузка амбулаторной карты при наличии визита
  useEffect(() => {
    const loadCard = async () => {
      if (!activeVisit) {
        setAmbulatoryCard(null);
        return;
      }

      try {
        console.log('EmployeeWorkspace: Loading card', { employeeId: activeVisit.employeeId });
        const card = await apiGetAmbulatoryCard({ 
          patientUid: activeVisit.employeeId, 
          iin: activeVisit.employeeId 
        });
        console.log('EmployeeWorkspace: Loaded card', card);
        setAmbulatoryCard(card);
      } catch (error) {
        console.error('Error loading ambulatory card:', error);
        setAmbulatoryCard(null);
      }
    };

    loadCard();
  }, [activeVisit]);

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

  const completedCount = activeVisit.routeSheet?.filter(s => s.status === 'completed').length || 0;
  const totalCount = activeVisit.routeSheet?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
            {(activeVisit.routeSheet || []).length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <UserMdIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400">Маршрутный лист пуст</p>
              </div>
            ) : (
              (activeVisit.routeSheet || []).map((step, idx) => (
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
              ))
            )}
          </div>
        </div>

        {/* Documents Section */}
        {activeVisit && progress === 100 && ambulatoryCard && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-2">
              <FileTextIcon className="w-5 h-5 text-blue-600" />
              Документы результатов
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveDocument('form075')}
                className="bg-white border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FileTextIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Форма 075/у</h3>
                    <p className="text-xs text-slate-500">Общее заключение</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Заключение о результатах медицинского осмотра
                </p>
              </button>

              <button
                onClick={() => setActiveDocument('healthPassport')}
                className="bg-white border-2 border-emerald-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <FileTextIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Паспорт здоровья</h3>
                    <p className="text-xs text-slate-500">Для вредных условий</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Паспорт здоровья работника с вредными факторами
                </p>
              </button>
            </div>
          </div>
        )}

        {activeVisit && progress < 100 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-amber-800 text-sm font-medium">
              Медосмотр еще не завершен. Документы будут доступны после прохождения всех врачей.
            </p>
          </div>
        )}
      </div>

      {/* Document Modal */}
      {activeDocument && activeVisit && ambulatoryCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col p-4 overflow-hidden">
          {/* Header with print button - фиксированный */}
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-900">
              {activeDocument === 'form075' ? 'Форма 075/у' : 'Паспорт здоровья'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all"
              >
                <PrinterIcon className="w-4 h-4" />
                Печать
              </button>
              <button
                onClick={() => setActiveDocument(null)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Content - scrollable */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-5xl mx-auto">
              {activeDocument === 'form075' && (
                <Form075 
                  data={generateForm075(ambulatoryCard, {
                    name: activeVisit.clientName || 'Медицинская организация',
                    address: 'Адрес не указан',
                    bin: 'БИН не указан'
                  })}
                />
              )}
              
              {activeDocument === 'healthPassport' && (
                <HealthPassport 
                  data={generateHealthPassport(ambulatoryCard, {
                    companyName: activeVisit.clientName || 'Организация не указана',
                    department: 'Отдел не указан',
                    profession: ambulatoryCard.general.position || 'Должность не указана',
                    harmfulFactors: '', // TODO: Получить из контракта или данных сотрудника (employee.harmfulFactor)
                    hazardExperienceYears: 0 // TODO: Получить из данных сотрудника (positionExperience)
                  })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeWorkspace;

