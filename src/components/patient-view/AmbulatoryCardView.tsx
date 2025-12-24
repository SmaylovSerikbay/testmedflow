import React, { useState, useEffect } from 'react';
import { AmbulatoryCard } from '../../../types';
import { apiGetAmbulatoryCard } from '../../../services/api';
import { 
  FileTextIcon, XIcon, PrinterIcon, UserIcon, 
  HeartIcon, ActivityIcon, MapPinIcon, BriefcaseIcon,
  ClockIcon, UserMdIcon, CheckShieldIcon
} from '../../../components/Icons';

interface AmbulatoryCardViewProps {
  patientUid: string;
  iin: string;
  onClose?: () => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AmbulatoryCardView: React.FC<AmbulatoryCardViewProps> = ({
  patientUid,
  iin,
  onClose,
  showToast
}) => {
  const [card, setCard] = useState<AmbulatoryCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'history' | 'specialists' | 'labs' | 'final'>('general');

  useEffect(() => {
    const loadCard = async () => {
      setIsLoading(true);
      try {
        console.log('AmbulatoryCardView: Loading card', { patientUid, iin });
        const data = await apiGetAmbulatoryCard({ patientUid, iin });
        console.log('AmbulatoryCardView: Loaded card', data);
        
        if (data) {
          // Парсим JSON поля если они пришли как строки
          let specialistEntries = data.specialistEntries || {};
          let labResults = data.labResults || {};
          
          // Если specialistEntries это строка, парсим её
          if (typeof specialistEntries === 'string') {
            try {
              specialistEntries = JSON.parse(specialistEntries);
            } catch (e) {
              console.error('Error parsing specialistEntries:', e);
              specialistEntries = {};
            }
          }
          
          // Если labResults это строка, парсим её
          if (typeof labResults === 'string') {
            try {
              labResults = JSON.parse(labResults);
            } catch (e) {
              console.error('Error parsing labResults:', e);
              labResults = {};
            }
          }
          
          setCard({
            ...data,
            specialistEntries,
            labResults,
          });
        } else {
          console.log('AmbulatoryCardView: No card found');
        }
      } catch (error) {
        console.error('Error loading ambulatory card:', error);
        showToast?.('error', 'Ошибка при загрузке медицинской карты');
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, [patientUid, iin, showToast]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold">Загрузка амбулаторной карты...</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
        <FileTextIcon className="w-16 h-16 text-slate-300" />
        <p className="font-bold">Амбулаторная карта не найдена</p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all"
          >
            Закрыть
          </button>
        )}
      </div>
    );
  }

  const SPECIALTIES = [
    'Терапевт', 'Хирург', 'Невропатолог', 'Оториноларинголог', 
    'Офтальмолог', 'Дерматовенеролог', 'Гинеколог', 'Психиатр', 'Нарколог'
  ];

  return (
    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full max-h-[90vh] animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileTextIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">Амбулаторная карта пациента</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest bg-blue-500/20 px-2 py-0.5 rounded">ИИН: {iin}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Форма № 052/у</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold text-sm"
          >
            <PrinterIcon className="w-4 h-4" />
            Печать
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <XIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-50 px-6 pt-4 border-b border-slate-200 shrink-0">
        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'general' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Паспортные данные
          </button>
          <button 
            onClick={() => setActiveTab('medical')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'medical' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Мед. показатели
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            История и риски
          </button>
          <button 
            onClick={() => setActiveTab('specialists')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'specialists' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Осмотры врачей
          </button>
          <button 
            onClick={() => setActiveTab('labs')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'labs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Исследования
          </button>
          <button 
            onClick={() => setActiveTab('final')}
            className={`px-6 py-3 rounded-t-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'final' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            Заключение
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
        {activeTab === 'general' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ФИО пациента</label>
                <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                  {card.general.fullName || '—'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Дата рождения</label>
                <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                  {card.general.dob || '—'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Пол</label>
                <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                  {card.general.gender === 'male' ? 'Мужской' : 'Женский'}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Возраст</label>
                <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                  {card.general.age || '—'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-blue-500" />
                Контактная информация
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Адрес проживания</label>
                <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                  {card.general.address || '—'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-blue-500" />
                Социальный статус и работа
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Место работы</label>
                  <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                    {card.general.workPlace || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Должность</label>
                  <div className="px-4 py-3 rounded-xl text-sm font-bold bg-slate-50 text-slate-900">
                    {card.general.position || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-blue-600">Антропометрия</h3>
                <div className="space-y-2">
                  <div><span className="text-xs text-slate-600">Рост:</span> <span className="font-bold">{card.medical.anthropometry?.height || '—'}</span></div>
                  <div><span className="text-xs text-slate-600">Вес:</span> <span className="font-bold">{card.medical.anthropometry?.weight || '—'}</span></div>
                  <div><span className="text-xs text-slate-600">ИМТ:</span> <span className="font-bold">{card.medical.anthropometry?.bmi || '—'}</span></div>
                </div>
              </div>
              <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-red-600">Витальные знаки</h3>
                <div className="space-y-2">
                  <div><span className="text-xs text-slate-600">АД:</span> <span className="font-bold">{card.medical.anthropometry?.pressure || '—'}</span></div>
                  <div><span className="text-xs text-slate-600">Пульс:</span> <span className="font-bold">{card.medical.anthropometry?.pulse || '—'}</span></div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-600">Группа крови</h3>
                <div className="space-y-2">
                  <div><span className="text-xs text-slate-600">Группа:</span> <span className="font-bold">{card.medical.bloodGroup || '—'}</span></div>
                  <div><span className="text-xs text-slate-600">Резус:</span> <span className="font-bold">{card.medical.rhFactor || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specialists' && (
          <div className="space-y-6 animate-fade-in-up">
            {SPECIALTIES.map(spec => {
              const entry = card.specialistEntries?.[spec];
              if (!entry) return null;
              
              // Парсим objective если это JSON строка
              let objectiveText = entry.objective || '';
              if (objectiveText && objectiveText.startsWith('{')) {
                try {
                  const objectiveData = JSON.parse(objectiveText);
                  // Преобразуем объект в читаемый текст
                  objectiveText = Object.entries(objectiveData)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                } catch (e) {
                  // Если не JSON, оставляем как есть
                  console.log('Objective is not JSON, using as-is');
                }
              }
              
              return (
                <div key={spec} className="bg-slate-50 rounded-[24px] border border-slate-100 p-6">
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <UserMdIcon className="w-5 h-5 text-blue-500" />
                    {spec}
                  </h3>
                  <div className="space-y-4">
                    {entry.complaints && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Жалобы</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900">{entry.complaints}</div>
                      </div>
                    )}
                    {entry.anamnesis && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Анамнез</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900">{entry.anamnesis}</div>
                      </div>
                    )}
                    {objectiveText && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Объективные данные</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900 whitespace-pre-wrap">{objectiveText}</div>
                      </div>
                    )}
                    {entry.diagnosis && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Диагноз (МКБ-10)</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900">{entry.diagnosis}</div>
                      </div>
                    )}
                    {entry.recommendations && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Рекомендации</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900">{entry.recommendations}</div>
                      </div>
                    )}
                    {entry.fitnessStatus && (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Заключение</label>
                        <div className="mt-1 px-4 py-3 rounded-xl text-sm bg-white text-slate-900">
                          {entry.fitnessStatus === 'fit' ? 'Годен' : 
                           entry.fitnessStatus === 'unfit' ? 'Не годен' : 
                           'Требует наблюдения'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'final' && card.finalConclusion && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up py-8">
            <div className="text-center space-y-2 mb-12">
              <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-4">
                <CheckShieldIcon className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Итоговое медицинское заключение</h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Группа здоровья</label>
                <div className="mt-1 px-4 py-3 rounded-xl text-2xl font-black bg-white text-slate-900">
                  {card.finalConclusion.healthGroup}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Итог медосмотра</label>
                <div className="mt-1 px-4 py-3 rounded-xl text-sm font-bold bg-white text-slate-900">
                  {card.finalConclusion.isFit ? 'Годен' : 'Не годен'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <ClockIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Последнее обновление: {new Date(card.updatedAt || new Date()).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AmbulatoryCardView;

