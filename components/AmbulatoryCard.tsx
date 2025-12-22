import React, { useState, useEffect } from 'react';
import { AmbulatoryCard as AmbulatoryCardType, UserProfile } from '../types';
import { apiGetAmbulatoryCard, apiUpsertAmbulatoryCard } from '../services/api';
import { 
  UserIcon, HeartIcon, ActivityIcon, FileTextIcon, 
  SaveIcon, PrinterIcon, EditIcon, XIcon, CheckCircleIcon,
  MapPinIcon, PhoneIcon, CalendarIcon, BriefcaseIcon, ShieldIcon,
  ClockIcon, UserMdIcon, CheckShieldIcon
} from './Icons';

interface AmbulatoryCardProps {
  patientUid: string;
  iin: string;
  initialData?: any; // For pre-filling if needed
  mode: 'view' | 'edit';
  userRole?: string; // Role of the person viewing/editing
  onClose?: () => void;
  onSaveSuccess?: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

// Helper components moved outside to prevent re-mounting on every render
const InputField = ({ label, value, onChange, placeholder, type = "text", icon: Icon, readOnly }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />}
      <input
        type={type}
        value={value || ''}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} py-3 rounded-xl text-sm font-bold transition-all ${
          readOnly 
            ? 'bg-slate-50 border-transparent text-slate-900 cursor-default' 
            : 'bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900'
        }`}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, readOnly }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label}
    </label>
    <textarea
      value={value || ''}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        readOnly 
          ? 'bg-slate-50 border-transparent text-slate-800 cursor-default resize-none' 
          : 'bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900'
      }`}
    />
  </div>
);

const AmbulatoryCard: React.FC<AmbulatoryCardProps> = ({ 
  patientUid, 
  iin, 
  initialData, 
  mode: initialMode, 
  userRole,
  onClose,
  onSaveSuccess,
  showToast 
}) => {
  const [card, setCard] = useState<AmbulatoryCardType | null>(null);
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'medical' | 'history' | 'specialists' | 'labs' | 'final'>('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Get current doctor specialty from initialData or localStorage
  const currentSpecialty = initialData?.userSpecialty || '';
  const [activeSpecialty, setActiveSpecialty] = useState<string>(currentSpecialty || 'Терапевт');
  const [showFullCard, setShowFullCard] = useState(userRole !== 'doctor');

  // Auto-focus on doctor's specialty if in edit mode
  useEffect(() => {
    if (initialMode === 'edit' && currentSpecialty) {
      setActiveTab('specialists');
      setActiveSpecialty(currentSpecialty);
    }
  }, [initialMode, currentSpecialty]);

  // Specialties list for the UI (расширенный список согласно п.14 Приказа)
  const SPECIALTIES = [
    'Терапевт', 'Хирург', 'Невропатолог', 'Оториноларинголог', 
    'Офтальмолог', 'Дерматовенеролог', 'Гинеколог', 'Психиатр', 'Нарколог',
    'Рентгенолог', 'Врач по функциональной диагностике', 'Врач-лаборант',
    'Стоматолог', 'Кардиолог', 'Аллерголог', 'Эндокринолог', 'Фтизиатр', 'Гематолог',
    'Профпатолог' // Председатель комиссии
  ];

  // Can this specific user edit this card?
  const canUserEdit = userRole === 'doctor' || userRole === 'registration' || userRole === 'clinic';

  useEffect(() => {
    const loadCard = async () => {
      setIsLoading(true);
      try {
        const data = await apiGetAmbulatoryCard({ patientUid, iin });
        if (data) {
          // Ensure all objects exist
          setCard({
            ...data,
            specialistEntries: data.specialistEntries || {},
            labResults: data.labResults || {},
          });
        } else {
          // Initialize empty card with basic info
          const newCard: AmbulatoryCardType = {
            patientUid,
            iin,
            general: {
              fullName: initialData?.name || '',
              dob: initialData?.dob || '',
              gender: initialData?.gender === 'Ж' ? 'female' : 'male',
              age: 0,
              residentType: 'city',
              address: '',
              workPlace: initialData?.clientName || '',
              position: initialData?.position || '',
              education: '',
              citizenship: 'РК',
              compensationType: '',
              socialStatus: '',
              visitReason: 'Периодический медосмотр',
            },
            medical: {
              anthropometry: {
                height: '',
                weight: '',
                bmi: '',
                pressure: '',
                pulse: '',
              },
              bloodGroup: '',
              rhFactor: '',
              allergies: '',
              pregnancyStatus: '',
              screeningResults: '',
              badHabits: '',
              vaccinations: '',
              diseaseHistory: '',
              currentProblems: '',
              dynamicObservation: '',
              disabilityGroup: '',
              currentMedications: '',
              fallRisk: '',
              painScore: '',
            },
            communication: {
              language: 'русский',
              livingConditions: '',
            },
            specialistEntries: {},
            labResults: {}
          };
          setCard(newCard);
        }
      } catch (error) {
        console.error('Error loading ambulatory card:', error);
        showToast('error', 'Ошибка при загрузке медицинской карты');
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, [patientUid, iin, initialData, showToast]);

  const handleSave = async () => {
    if (!card) return;
    setIsSaving(true);
    try {
      console.log('AmbulatoryCard: Saving card for patient:', card.patientUid);
      await apiUpsertAmbulatoryCard(card);
      showToast('success', 'Медицинская карта успешно сохранена');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      // Не закрываем сразу, даем пользователю увидеть статус "Сохранено"
      setTimeout(() => {
        setMode('view');
      }, 500);
    } catch (error) {
      console.error('Error saving ambulatory card:', error);
      showToast('error', 'Ошибка при сохранении медицинской карты');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (!card) return null;

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
          {mode === 'view' ? (
            <>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-bold text-sm"
              >
                <PrinterIcon className="w-4 h-4" />
                Печать
              </button>
              {canUserEdit && (
                <button 
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-500/20"
                >
                  <EditIcon className="w-4 h-4" />
                  Редактировать
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SaveIcon className="w-4 h-4" />}
              Сохранить
            </button>
          )}
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
          {showFullCard ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-4 px-4 py-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Рабочий стол: {currentSpecialty}
              </span>
              <button 
                onClick={() => setShowFullCard(true)}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 underline transition-all"
              >
                Показать всю карту
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
        {!showFullCard ? (
          <div className="flex flex-col h-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <UserMdIcon className="w-8 h-8 text-blue-500" />
                Ваш протокол осмотра: {currentSpecialty}
              </h3>
              {card.specialistEntries?.[currentSpecialty] && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  Раздел заполнен
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Анамнез и жалобы</h4>
                <TextAreaField 
                  label="Жалобы" 
                  value={card.specialistEntries?.[currentSpecialty]?.complaints}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), complaints: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
                <TextAreaField 
                  label="Анамнез" 
                  value={card.specialistEntries?.[currentSpecialty]?.anamnesis}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), anamnesis: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Объективные данные</h4>
                <TextAreaField 
                  label="Status Praesens" 
                  value={card.specialistEntries?.[currentSpecialty]?.objective}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), objective: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                  rows={6}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Диагноз (МКБ-10)" 
                  value={card.specialistEntries?.[currentSpecialty]?.diagnosis}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), diagnosis: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Заключение о профпригодности</label>
                  <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-100">
                    {[
                      { id: 'fit', label: 'Годен', color: 'emerald' },
                      { id: 'unfit', label: 'Не годен', color: 'red' },
                      { id: 'needs_observation', label: 'Нужд. в набл.', color: 'amber' }
                    ].map(status => (
                      <button
                        key={status.id}
                        disabled={mode === 'view'}
                        onClick={() => {
                          const entries = {...(card.specialistEntries || {})};
                          entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), fitnessStatus: status.id as any };
                          setCard({...card, specialistEntries: entries});
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                          card.specialistEntries?.[currentSpecialty]?.fitnessStatus === status.id 
                            ? `bg-${status.color}-500 text-white shadow-lg` 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <TextAreaField 
                label="Рекомендации" 
                value={card.specialistEntries?.[currentSpecialty]?.recommendations}
                readOnly={mode === 'view'}
                onChange={(val: string) => {
                  const entries = {...(card.specialistEntries || {})};
                  entries[currentSpecialty] = { ...(entries[currentSpecialty] || { date: new Date().toISOString() }), recommendations: val };
                  setCard({...card, specialistEntries: entries});
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'general' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="ФИО пациента" 
                value={card.general.fullName}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, general: {...card.general, fullName: val}})}
                icon={UserIcon}
                placeholder="Иванов Иван Иванович"
              />
              <InputField 
                label="Дата рождения" 
                type="date"
                value={card.general.dob}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, general: {...card.general, dob: val}})}
                icon={CalendarIcon}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Пол</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                  <button 
                    disabled={mode === 'view'}
                    onClick={() => setCard({...card, general: {...card.general, gender: 'male'}})}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                      card.general.gender === 'male' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400'
                    }`}
                  >
                    Мужской
                  </button>
                  <button 
                    disabled={mode === 'view'}
                    onClick={() => setCard({...card, general: {...card.general, gender: 'female'}})}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                      card.general.gender === 'female' ? 'bg-white text-pink-600 shadow-sm border border-pink-100' : 'text-slate-400'
                    }`}
                  >
                    Женский
                  </button>
                </div>
              </div>
              <InputField 
                label="Возраст" 
                type="number"
                value={card.general.age}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, general: {...card.general, age: parseInt(val)}})}
                placeholder="Полных лет"
              />
              <InputField 
                label="Национальность" 
                value={card.general.nationality}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, general: {...card.general, nationality: val}})}
              />
              <InputField 
                label="Гражданство" 
                value={card.general.citizenship}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, general: {...card.general, citizenship: val}})}
              />
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Житель</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                  <button 
                    disabled={mode === 'view'}
                    onClick={() => setCard({...card, general: {...card.general, residentType: 'city'}})}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                      card.general.residentType === 'city' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Города
                  </button>
                  <button 
                    disabled={mode === 'view'}
                    onClick={() => setCard({...card, general: {...card.general, residentType: 'village'}})}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                      card.general.residentType === 'village' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Села
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-blue-500" />
                Контактная информация
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <InputField 
                  label="Адрес проживания" 
                  value={card.general.address}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, address: val}})}
                  icon={MapPinIcon}
                  placeholder="Область, город, улица, дом, квартира"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-blue-500" />
                Социальный статус и работа
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Место работы / учебы" 
                  value={card.general.workPlace}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, workPlace: val}})}
                  icon={BriefcaseIcon}
                />
                <InputField 
                  label="Должность" 
                  value={card.general.position}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, position: val}})}
                />
                <InputField 
                  label="Образование" 
                  value={card.general.education}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, education: val}})}
                />
                <InputField 
                  label="Страховая компания" 
                  value={card.general.insuranceCompany}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, insuranceCompany: val}})}
                />
                <InputField 
                  label="№ страхового полиса" 
                  value={card.general.insurancePolicyNumber}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, insurancePolicyNumber: val}})}
                />
                <InputField 
                  label="Тип возмещения" 
                  value={card.general.compensationType}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, compensationType: val}})}
                />
                <InputField 
                  label="Социальный статус" 
                  value={card.general.socialStatus}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, socialStatus: val}})}
                  placeholder="Работающий, пенсионер, студент..."
                />
                <InputField 
                  label="Повод обращения" 
                  value={card.general.visitReason}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, general: {...card.general, visitReason: val}})}
                  placeholder="Профосмотр, заболевание..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <ActivityIcon className="w-5 h-5" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Антропометрия</h3>
                </div>
                <InputField 
                  label="Рост (см)" 
                  value={card.medical.anthropometry?.height}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, anthropometry: {...card.medical.anthropometry, height: val}}})}
                />
                <InputField 
                  label="Вес (кг)" 
                  value={card.medical.anthropometry?.weight}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, anthropometry: {...card.medical.anthropometry, weight: val}}})}
                />
                <InputField 
                  label="ИМТ" 
                  value={card.medical.anthropometry?.bmi}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, anthropometry: {...card.medical.anthropometry, bmi: val}}})}
                  placeholder="Авторасчет"
                />
              </div>

              <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                  <HeartIcon className="w-5 h-5" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Витальные знаки</h3>
                </div>
                <InputField 
                  label="АД (мм рт.ст.)" 
                  value={card.medical.anthropometry?.pressure}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, anthropometry: {...card.medical.anthropometry, pressure: val}}})}
                  placeholder="120/80"
                />
                <InputField 
                  label="Пульс (уд/мин)" 
                  value={card.medical.anthropometry?.pulse}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, anthropometry: {...card.medical.anthropometry, pulse: val}}})}
                />
                <InputField 
                  label="Оценка боли (0-10)" 
                  value={card.medical.painScore}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, painScore: val}})}
                />
                <InputField 
                  label="Риск падения" 
                  value={card.medical.fallRisk}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, fallRisk: val}})}
                />
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-slate-600 mb-2">
                  <ShieldIcon className="w-5 h-5" />
                  <h3 className="font-black text-sm uppercase tracking-widest">Группа крови</h3>
                </div>
                <InputField 
                  label="Группа крови" 
                  value={card.medical.bloodGroup}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, bloodGroup: val}})}
                  placeholder="O(I), A(II), B(III), AB(IV)"
                />
                <InputField 
                  label="Резус-фактор" 
                  value={card.medical.rhFactor}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, rhFactor: val}})}
                  placeholder="Rh+, Rh-"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <InputField 
                label="Физиологическое состояние (беременность)" 
                value={card.medical.pregnancyStatus}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, pregnancyStatus: val}})}
              />
              <TextAreaField 
                label="Результаты скрининга" 
                value={card.medical.screeningResults}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, screeningResults: val}})}
              />
              <TextAreaField 
                label="Аллергические реакции" 
                value={card.medical.allergies}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, allergies: val}})}
                placeholder="Лекарственные средства, продукты питания..."
              />
              <TextAreaField 
                label="Принимаемые препараты" 
                value={card.medical.currentMedications}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, currentMedications: val}})}
                placeholder="Список лекарств, дозировка, кратность..."
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 gap-6">
              <TextAreaField 
                label="Анамнез жизни и болезней" 
                value={card.medical.diseaseHistory}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, diseaseHistory: val}})}
                placeholder="Перенесенные заболевания, операции..."
              />
              <TextAreaField 
                label="Список текущих проблем" 
                value={card.medical.currentProblems}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, medical: {...card.medical, currentProblems: val}})}
                placeholder="Хронические заболевания, жалобы..."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <TextAreaField 
                  label="Вредные привычки" 
                  value={card.medical.badHabits}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, badHabits: val}})}
                  placeholder="Курение, алкоголь..."
                />
                <TextAreaField 
                  label="Профилактические прививки" 
                  value={card.medical.vaccinations}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, vaccinations: val}})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <InputField 
                  label="Группа инвалидности" 
                  value={card.medical.disabilityGroup}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, disabilityGroup: val}})}
                />
                <InputField 
                  label="Динамическое наблюдение" 
                  value={card.medical.dynamicObservation}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, medical: {...card.medical, dynamicObservation: val}})}
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-blue-500" />
                  Коммуникация и быт
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Язык общения" 
                    value={card.communication?.language}
                    readOnly={mode === 'view'}
                    onChange={(val: string) => setCard({...card, communication: {...card.communication, language: val}})}
                  />
                  <TextAreaField 
                    label="Жилищно-бытовые условия" 
                    value={card.communication?.livingConditions}
                    readOnly={mode === 'view'}
                    onChange={(val: string) => setCard({...card, communication: {...card.communication, livingConditions: val}})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <TextAreaField 
                  label="Инструктаж пациента / Комментарии" 
                  value={card.patientInstruction}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, patientInstruction: val})}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specialists' && (
          <div className="flex gap-8 h-full animate-fade-in-up">
            {/* Sidebar for specialists */}
            <div className="w-64 shrink-0 flex flex-col gap-2">
              {SPECIALTIES.map(spec => {
                const isMySpecialty = spec === currentSpecialty;
                const isFilled = !!card.specialistEntries?.[spec];
                
                return (
                  <button
                    key={spec}
                    disabled={mode === 'edit' && !isMySpecialty && userRole === 'doctor'}
                    onClick={() => setActiveSpecialty(spec)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeSpecialty === spec 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : isMySpecialty
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    } ${mode === 'edit' && !isMySpecialty && userRole === 'doctor' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-start">
                      <span>{spec}</span>
                      {isMySpecialty && <span className="text-[8px] opacity-70">Ваш раздел</span>}
                    </div>
                    {isFilled && (
                      <CheckCircleIcon className={`w-4 h-4 ${activeSpecialty === spec ? 'text-white' : 'text-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Specialist Entry Form */}
            <div className="flex-1 bg-slate-50/50 rounded-[24px] border border-slate-100 p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <UserMdIcon className="w-6 h-6 text-blue-500" />
                  Осмотр: {activeSpecialty}
                </h3>
                {card.specialistEntries?.[activeSpecialty] && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                    Дата записи: {new Date(card.specialistEntries[activeSpecialty].date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="space-y-6">
                <InputField 
                  label="Врач" 
                  value={card.specialistEntries?.[activeSpecialty]?.doctorName}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), doctorName: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                  placeholder="ФИО врача"
                />
                <TextAreaField 
                  label="Жалобы" 
                  value={card.specialistEntries?.[activeSpecialty]?.complaints}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), complaints: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
                <TextAreaField 
                  label="Анамнез" 
                  value={card.specialistEntries?.[activeSpecialty]?.anamnesis}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), anamnesis: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
                <TextAreaField 
                  label="Объективные данные" 
                  value={card.specialistEntries?.[activeSpecialty]?.objective}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), objective: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                  placeholder="Status Praesens, результаты осмотра..."
                />
                <InputField 
                  label="Диагноз (МКБ-10)" 
                  value={card.specialistEntries?.[activeSpecialty]?.diagnosis}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), diagnosis: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />
                <TextAreaField 
                  label="Рекомендации" 
                  value={card.specialistEntries?.[activeSpecialty]?.recommendations}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => {
                    const entries = {...(card.specialistEntries || {})};
                    entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), recommendations: val };
                    setCard({...card, specialistEntries: entries});
                  }}
                />

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Заключение о профпригодности</label>
                  <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-100">
                    {[
                      { id: 'fit', label: 'Годен', color: 'emerald' },
                      { id: 'unfit', label: 'Не годен', color: 'red' },
                      { id: 'needs_observation', label: 'Нужд. в набл.', color: 'amber' }
                    ].map(status => (
                      <button
                        key={status.id}
                        disabled={mode === 'view'}
                        onClick={() => {
                          const entries = {...(card.specialistEntries || {})};
                          entries[activeSpecialty] = { ...(entries[activeSpecialty] || { date: new Date().toISOString() }), fitnessStatus: status.id as any };
                          setCard({...card, specialistEntries: entries});
                        }}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                          card.specialistEntries?.[activeSpecialty]?.fitnessStatus === status.id 
                            ? `bg-${status.color}-500 text-white shadow-lg shadow-${status.color}-500/20` 
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-8 animate-fade-in-up">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {['Общий анализ крови', 'Общий анализ мочи', 'ЭКГ', 'Флюорография', 'Биохимия'].map(test => (
                 <div key={test} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">{test}</h3>
                     {card.labResults?.[test] && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{card.labResults[test].date}</span>
                     )}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <InputField 
                        label="Результат" 
                        value={card.labResults?.[test]?.value}
                        readOnly={mode === 'view'}
                        onChange={(val: string) => {
                          const labs = {...(card.labResults || {})};
                          labs[test] = { ...(labs[test] || { date: new Date().toLocaleDateString() }), value: val };
                          setCard({...card, labResults: labs});
                        }}
                      />
                      <InputField 
                        label="Норма" 
                        value={card.labResults?.[test]?.norm}
                        readOnly={mode === 'view'}
                        onChange={(val: string) => {
                          const labs = {...(card.labResults || {})};
                          labs[test] = { ...(labs[test] || { date: new Date().toLocaleDateString() }), norm: val };
                          setCard({...card, labResults: labs});
                        }}
                      />
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'final' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up py-8">
            <div className="text-center space-y-2 mb-12">
              <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto mb-4">
                <CheckShieldIcon className="text-white w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Итоговое медицинское заключение</h3>
              <p className="text-slate-400 text-sm font-medium">Заключение врачебной комиссии согласно п. 115 Приказа</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 space-y-8">
              <InputField 
                label="Председатель комиссии" 
                value={card.finalConclusion?.chairmanName}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, finalConclusion: {...(card.finalConclusion || { date: new Date().toISOString(), healthGroup: 'I', isFit: true, nextExamDate: '' }), chairmanName: val}})}
                placeholder="ФИО председателя"
              />

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Группа здоровья</label>
                <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100">
                  {['I', 'II', 'III', 'IV', 'V'].map(group => (
                    <button
                      key={group}
                      disabled={mode === 'view'}
                      onClick={() => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), isFit: true, nextExamDate: '' }), healthGroup: group as any}})}
                      className={`flex-1 py-3 rounded-xl font-black transition-all ${
                        card.finalConclusion?.healthGroup === group 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                          : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Итог медосмотра</label>
                  <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100">
                    <button 
                      disabled={mode === 'view'}
                      onClick={() => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), healthGroup: 'I', nextExamDate: '' }), isFit: true}})}
                      className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        card.finalConclusion?.isFit === true ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'
                      }`}
                    >
                      Годен
                    </button>
                    <button 
                      disabled={mode === 'view'}
                      onClick={() => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), healthGroup: 'I', nextExamDate: '' }), isFit: false}})}
                      className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                        card.finalConclusion?.isFit === false ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400'
                      }`}
                    >
                      Не годен
                    </button>
                  </div>
                </div>
                <InputField 
                  label="Дата следующего осмотра" 
                  type="date"
                  value={card.finalConclusion?.nextExamDate}
                  readOnly={mode === 'view'}
                  onChange={(val: string) => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), healthGroup: 'I', isFit: true }), nextExamDate: val}})}
                />
              </div>

              <TextAreaField 
                label="Медицинские ограничения / рекомендации" 
                value={card.finalConclusion?.restrictions}
                readOnly={mode === 'view'}
                onChange={(val: string) => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), healthGroup: 'I', isFit: true, nextExamDate: '' }), restrictions: val}})}
                placeholder="Укажите ограничения по труду, если есть..."
              />

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Классификация работника (п.21 Приказа)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'healthy', label: '1. Здоровые работники, не нуждающиеся в реабилитации', color: 'emerald' },
                    { id: 'practically_healthy', label: '2. Практически здоровые работники, имеющие нестойкие функциональные изменения', color: 'blue' },
                    { id: 'initial_diseases', label: '3. Работники, имеющие начальные формы общих заболеваний', color: 'amber' },
                    { id: 'expressed_diseases', label: '4. Работники, имеющие выраженные формы общих заболеваний', color: 'orange' },
                    { id: 'harmful_factors', label: '5. Работники, имеющие признаки воздействия на организм вредных производственных факторов', color: 'red' },
                    { id: 'occupational_diseases', label: '6. Работники, имеющие признаки профессиональных заболеваний', color: 'red' }
                  ].map(category => (
                    <button
                      key={category.id}
                      disabled={mode === 'view'}
                      onClick={() => setCard({...card, finalConclusion: {...(card.finalConclusion || { chairmanName: '', date: new Date().toISOString(), healthGroup: 'I', isFit: true, nextExamDate: '' }), workerCategory: category.id as any}})}
                      className={`text-left p-4 rounded-xl font-medium text-sm transition-all border-2 ${
                        card.finalConclusion?.workerCategory === category.id
                          ? `bg-${category.color}-50 border-${category.color}-300 text-${category.color}-900`
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Footer / Status */}
      <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <ClockIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Последнее обновление: {new Date(card.updatedAt || new Date()).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Электронная карта активна</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulatoryCard;

