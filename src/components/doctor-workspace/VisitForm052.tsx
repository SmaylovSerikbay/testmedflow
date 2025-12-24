import React, { useState, useEffect } from 'react';
import { DoctorVisit, DEFAULT_NORMAL_VALUES } from '../../types/medical-forms';
import ConfigurableObjectiveForm from './ConfigurableObjectiveForm';
import DiagnosisPanel from './partials/DiagnosisPanel';
import { getFormConfig } from '../../config/specialtyForms';
import { SaveIcon, XIcon, CheckCircleIcon } from '../../../components/Icons';

interface VisitForm052Props {
  patient: {
    id: string;
    name: string;
    iin: string;
  };
  specialty: DoctorVisit['specialty'];
  doctorId: string;
  doctorName?: string;
  initialData?: Partial<DoctorVisit>;
  onSave: (visit: DoctorVisit) => Promise<void>;
  onClose?: () => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const VisitForm052: React.FC<VisitForm052Props> = ({
  patient,
  specialty,
  doctorId,
  doctorName,
  initialData,
  onSave,
  onClose,
  showToast
}) => {
  const [visit, setVisit] = useState<DoctorVisit>({
    patientId: patient.id,
    doctorId,
    specialty,
    complaints: initialData?.complaints || '',
    anamnesis: initialData?.anamnesis || '',
    objectiveData: initialData?.objectiveData || {},
    icd10Code: initialData?.icd10Code || '',
    conclusion: initialData?.conclusion || 'FIT',
    recommendations: initialData?.recommendations || '',
    visitDate: initialData?.visitDate || new Date().toISOString(),
    doctorName: initialData?.doctorName || doctorName || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Обновляем состояние при изменении initialData
  useEffect(() => {
    if (initialData) {
      console.log('VisitForm052: Updating from initialData', initialData);
      setVisit(prev => ({
        ...prev,
        complaints: initialData.complaints ?? prev.complaints,
        anamnesis: initialData.anamnesis ?? prev.anamnesis,
        objectiveData: initialData.objectiveData ?? prev.objectiveData,
        icd10Code: initialData.icd10Code ?? prev.icd10Code,
        conclusion: initialData.conclusion ?? prev.conclusion,
        recommendations: initialData.recommendations ?? prev.recommendations,
        visitDate: initialData.visitDate ?? prev.visitDate,
        doctorName: initialData.doctorName ?? prev.doctorName
      }));
    }
  }, [initialData]);

  // Функция "Заполнить нормой" - КРИТИЧНО для скорости
  const handleFillNormal = () => {
    const normalValues = DEFAULT_NORMAL_VALUES[specialty];
    if (!normalValues) {
      showToast?.('info', 'Нормативные значения для данной специальности не найдены');
      return;
    }

    setVisit(prev => ({
      ...prev,
      complaints: normalValues.complaints || '',
      anamnesis: normalValues.anamnesis || '',
      objectiveData: normalValues.objectiveData ? JSON.parse(normalValues.objectiveData) : {}
    }));

    showToast?.('success', 'Поля заполнены нормативными значениями');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('VisitForm052: Saving visit', visit);
      await onSave(visit);
      // Не показываем toast здесь, так как onSave уже показывает его
    } catch (error) {
      console.error('Ошибка сохранения визита:', error);
      showToast?.('error', `Ошибка при сохранении данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const specialtyLabels: Record<DoctorVisit['specialty'], string> = {
    THERAPIST: 'Терапевт',
    SURGEON: 'Хирург',
    NEUROLOGIST: 'Невропатолог',
    ENT: 'Оториноларинголог',
    OPHTHALMOLOGIST: 'Офтальмолог',
    DERMATOLOGIST: 'Дерматовенеролог',
    GYNECOLOGIST: 'Гинеколог',
    PSYCHIATRIST: 'Психиатр',
    NARCOLOGIST: 'Нарколог'
  };

  return (
    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full max-h-[90vh] animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircleIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white font-black text-xl tracking-tight">
              Форма осмотра: {specialtyLabels[specialty]}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest bg-blue-500/20 px-2 py-0.5 rounded">
                Пациент: {patient.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ИИН: {patient.iin}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFillNormal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-emerald-500/20"
            title="Заполнить все поля нормативными значениями"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Заполнить нормой
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            Сохранить
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* СЕКЦИЯ A: Субъективные данные */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black">
                A
              </div>
              Субъективные данные
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Жалобы
                </label>
                <textarea
                  value={visit.complaints}
                  onChange={(e) => setVisit({...visit, complaints: e.target.value})}
                  placeholder="Жалобы пациента..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Анамнез
                </label>
                <textarea
                  value={visit.anamnesis}
                  onChange={(e) => setVisit({...visit, anamnesis: e.target.value})}
                  placeholder="Анамнез заболевания и жизни..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ B: Объективные данные */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-black">
                B
              </div>
              Объективные данные (Status Praesens)
            </h3>
            
            <ConfigurableObjectiveForm
              specialty={specialty}
              data={visit.objectiveData}
              onChange={(data) => setVisit({...visit, objectiveData: data})}
            />
          </div>

          {/* СЕКЦИЯ C: Заключение */}
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-black">
                C
              </div>
              Заключение
            </h3>
            
            <DiagnosisPanel
              icd10Code={visit.icd10Code}
              conclusion={visit.conclusion}
              recommendations={visit.recommendations}
              onIcd10Change={(code) => setVisit({...visit, icd10Code: code})}
              onConclusionChange={(conclusion) => setVisit({...visit, conclusion})}
              onRecommendationsChange={(rec) => setVisit({...visit, recommendations: rec})}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitForm052;

