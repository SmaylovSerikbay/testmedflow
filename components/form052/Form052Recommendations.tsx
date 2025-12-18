import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '../Icons';
import CollapsibleSection from './CollapsibleSection';

interface Form052RecommendationsProps {
  data?: {
    problems?: string[];
    familyPlanning?: string;
    recommendations?: string[];
    specialistConsultation?: {
      date?: string;
      time?: string;
      type?: string;
      complaints?: string;
    };
  };
  onChange: (data: any) => void;
  editMode: boolean;
}

const Form052Recommendations: React.FC<Form052RecommendationsProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState(data);

  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const addProblem = () => {
    const problems = [...(formData.problems || []), ''];
    handleChange('problems', problems);
  };

  const updateProblem = (index: number, value: string) => {
    const problems = [...(formData.problems || [])];
    problems[index] = value;
    handleChange('problems', problems);
  };

  const removeProblem = (index: number) => {
    const problems = formData.problems?.filter((_, i) => i !== index) || [];
    handleChange('problems', problems);
  };

  const addRecommendation = () => {
    const recommendations = [...(formData.recommendations || []), ''];
    handleChange('recommendations', recommendations);
  };

  const updateRecommendation = (index: number, value: string) => {
    const recommendations = [...(formData.recommendations || [])];
    recommendations[index] = value;
    handleChange('recommendations', recommendations);
  };

  const removeRecommendation = (index: number) => {
    const recommendations = formData.recommendations?.filter((_, i) => i !== index) || [];
    handleChange('recommendations', recommendations);
  };

  const standardRecommendations = [
    'Преимущества и практика грудного вскармливания',
    'Обеспечение исключительно грудного вскармливания',
    'Техника сцеживания грудного молока (при наличии)',
    'Оптимальное питание матери',
    'Личная гигиена матери',
    'Требования к помещению и предметам ухода за новорожденным',
    'Безопасная среда (требования к выбору одежды, предметов ухода за новорожденным и игрушек), поведение родителей для профилактики травматизма и несчастного случая',
    'Стимуляция психосоциального развития',
    'Уход за новорожденным, режим прогулок',
    'Профилактика микронутриентной недостаточности (железо, витамин А, йод, цинк)',
    'Оптимальное питание и режим сна/отдыха кормящей матери',
    'Правила поведения и уход при болезни ребенка (опасные признаки, кормление и питьевой режим)',
    'Вакцинация (своевременность проведения, возможные реакции на прививку и поведение родителей, от каких инфекций защищают прививки)',
    'Активное привлечение отца к уходу в целях развития ребенка',
    'Ежемесячный осмотр на приеме у врача',
    'Консультация узких специалистов и лабораторных исследований по показаниям',
  ];

  return (
    <div className="space-y-4">
      {/* Проблемы */}
      <CollapsibleSection title="Проблемы" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={addProblem} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить проблему
            </button>
          </div>
        )}
        <div className="space-y-3">
          {(formData.problems || []).length > 0 ? (
            formData.problems!.map((problem, index) => (
              <div key={index} className="flex gap-3">
                {editMode ? (
                  <>
                    <input
                      type="text"
                      value={problem}
                      onChange={(e) => updateProblem(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Опишите проблему"
                    />
                    <button onClick={() => removeProblem(index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <p className="flex-1 px-3 py-2 bg-slate-50 rounded-lg">{problem || '—'}</p>
                )}
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет проблем</p>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Примечание:</strong> При выявлении тревожных признаков направить на консультацию узкого специалиста 
            для выбора и обеспечения специализированной помощи (психолог, логопед)
          </p>
        </div>
      </CollapsibleSection>

      {/* Консультирование по вопросам планирования семьи */}
      <CollapsibleSection title="Консультирование по вопросам планирования семьи" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Консультирование по вопросам планирования семьи (лактационная аменорея, презервативы, ВМС)
          </label>
          {editMode ? (
            <textarea
              value={formData.familyPlanning || ''}
              onChange={(e) => handleChange('familyPlanning', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Опишите консультирование"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.familyPlanning || '—'}</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Рекомендации */}
      <CollapsibleSection title="Рекомендации" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={addRecommendation} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить рекомендацию
            </button>
          </div>
        )}
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-3">Стандартные рекомендации (можно выбрать):</p>
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {standardRecommendations.map((rec, index) => {
                const isSelected = formData.recommendations?.includes(rec);
                return (
                  <label key={index} className="flex items-start gap-2 cursor-pointer p-2 hover:bg-white rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const recommendations = formData.recommendations || [];
                        if (e.target.checked) {
                          handleChange('recommendations', [...recommendations, rec]);
                        } else {
                          handleChange('recommendations', recommendations.filter(r => r !== rec));
                        }
                      }}
                      className="w-4 h-4 mt-1 text-blue-600"
                    />
                    <span className="text-sm">{rec}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3 mt-4">
            {(formData.recommendations || []).length > 0 ? (
              formData.recommendations!.map((rec, index) => (
                <div key={index} className="flex gap-3">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        value={rec}
                        onChange={(e) => updateRecommendation(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="Введите рекомендацию"
                      />
                      <button onClick={() => removeRecommendation(index)} className="text-red-600 hover:text-red-800">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <p className="flex-1 px-3 py-2 bg-white rounded-lg">{rec}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg text-slate-500">Нет рекомендаций</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Консультация специалиста */}
      <CollapsibleSection title="Консультация специалиста" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Дата и время осмотра
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.specialistConsultation?.date || ''}
                  onChange={(e) => handleChange('specialistConsultation', { ...formData.specialistConsultation, date: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={formData.specialistConsultation?.time || ''}
                  onChange={(e) => handleChange('specialistConsultation', { ...formData.specialistConsultation, time: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.specialistConsultation?.date && formData.specialistConsultation?.time
                  ? `${new Date(formData.specialistConsultation.date).toLocaleDateString('ru-RU')} ${formData.specialistConsultation.time}`
                  : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. Вид консультации
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.specialistConsultation?.type || ''}
                onChange={(e) => handleChange('specialistConsultation', { ...formData.specialistConsultation, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Например: психолог, логопед"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.specialistConsultation?.type || '—'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Жалобы
            </label>
            {editMode ? (
              <textarea
                value={formData.specialistConsultation?.complaints || ''}
                onChange={(e) => handleChange('specialistConsultation', { ...formData.specialistConsultation, complaints: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Опишите жалобы пациента"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.specialistConsultation?.complaints || '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052Recommendations;
