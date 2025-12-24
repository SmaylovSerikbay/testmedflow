import React from 'react';
import { DoctorVisit } from '../../../types/medical-forms';

interface DiagnosisPanelProps {
  icd10Code: string;
  conclusion: DoctorVisit['conclusion'];
  recommendations: string;
  onIcd10Change: (code: string) => void;
  onConclusionChange: (conclusion: DoctorVisit['conclusion']) => void;
  onRecommendationsChange: (recommendations: string) => void;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  icd10Code,
  conclusion,
  recommendations,
  onIcd10Change,
  onConclusionChange,
  onRecommendationsChange
}) => {
  const conclusionLabels = {
    FIT: 'Годен',
    UNFIT: 'Не годен',
    REQUIRES_EXAM: 'Требует обследования'
  };

  const conclusionColors = {
    FIT: 'emerald',
    UNFIT: 'red',
    REQUIRES_EXAM: 'amber'
  };

  return (
    <div className="bg-slate-50 rounded-[24px] border border-slate-100 p-6 space-y-6">
      {/* МКБ-10 */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Диагноз (МКБ-10)
        </label>
        <input
          type="text"
          value={icd10Code}
          onChange={(e) => onIcd10Change(e.target.value)}
          placeholder="Например: Z00.0 - Общее медицинское обследование"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
        <p className="text-[10px] text-slate-400 ml-1">
          Введите код МКБ-10 или описание диагноза
        </p>
      </div>

      {/* Заключение о профпригодности */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Заключение о профпригодности
        </label>
        <div className="flex gap-2 p-1 bg-white rounded-xl border border-slate-100">
          {(Object.keys(conclusionLabels) as Array<keyof typeof conclusionLabels>).map(status => {
            const color = conclusionColors[status];
            return (
              <button
                key={status}
                onClick={() => onConclusionChange(status)}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                  conclusion === status
                    ? `bg-${color}-500 text-white shadow-lg shadow-${color}-500/20`
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {conclusionLabels[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Рекомендации */}
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Рекомендации
        </label>
        <textarea
          value={recommendations}
          onChange={(e) => onRecommendationsChange(e.target.value)}
          placeholder="Рекомендации по лечению, наблюдению, ограничениям..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
    </div>
  );
};

export default DiagnosisPanel;

