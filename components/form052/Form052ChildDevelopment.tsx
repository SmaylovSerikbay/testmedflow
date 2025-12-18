import React, { useState } from 'react';
import { ChildDevelopmentAssessment } from '../../types/form052';
import CollapsibleSection from './CollapsibleSection';

interface Form052ChildDevelopmentProps {
  data?: ChildDevelopmentAssessment;
  onChange: (data: ChildDevelopmentAssessment) => void;
  editMode: boolean;
}

const Form052ChildDevelopment: React.FC<Form052ChildDevelopmentProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<ChildDevelopmentAssessment>(data);

  const handleChange = (field: keyof ChildDevelopmentAssessment, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof ChildDevelopmentAssessment, { ...sectionData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Основные данные осмотра */}
      <CollapsibleSection title="Основные данные осмотра" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Дата осмотра</label>
            {editMode ? (
              <input
                type="date"
                value={formData.examinationDate || ''}
                onChange={(e) => handleChange('examinationDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.examinationDate ? new Date(formData.examinationDate).toLocaleDateString('ru-RU') : '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Возраст</label>
            {editMode ? (
              <input type="text" value={formData.age || ''} onChange={(e) => handleChange('age', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.age || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Температура</label>
            {editMode ? (
              <input type="number" step="0.1" value={formData.temperature || ''} onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.temperature ? `${formData.temperature} °C` : '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Вес (кг)</label>
            {editMode ? (
              <input type="number" step="0.01" value={formData.weight || ''} onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.weight ? `${formData.weight} кг` : '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Рост (см)</label>
            {editMode ? (
              <input type="number" value={formData.height || ''} onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.height ? `${formData.height} см` : '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ИМТ</label>
            {editMode ? (
              <input type="number" step="0.1" value={formData.bmi || ''} onChange={(e) => handleChange('bmi', parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.bmi || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Окружность головы (см)</label>
            {editMode ? (
              <input type="number" step="0.1" value={formData.headCircumference || ''} onChange={(e) => handleChange('headCircumference', parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.headCircumference ? `${formData.headCircumference} см` : '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Жалобы и осмотр */}
      <CollapsibleSection title="Жалобы и осмотр" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Оцените физическое развитие, используя графики</label>
            {editMode ? (
              <textarea value={formData.physicalDevelopment || ''} onChange={(e) => handleChange('physicalDevelopment', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={2} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.physicalDevelopment || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Жалобы матери</label>
            {editMode ? (
              <textarea value={formData.motherComplaints || ''} onChange={(e) => handleChange('motherComplaints', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.motherComplaints || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Осмотр ребенка</label>
            {editMode ? (
              <textarea value={formData.childExamination || ''} onChange={(e) => handleChange('childExamination', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.childExamination || '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Физический осмотр */}
      <CollapsibleSection title="Физический осмотр" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['skin', 'umbilicus', 'oralMucosa', 'pharynx', 'conjunctivae', 'largeFontanelle'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {field === 'skin' ? 'Кожа' :
                 field === 'umbilicus' ? 'Пуповина' :
                 field === 'oralMucosa' ? 'Слизистые ротовой полости' :
                 field === 'pharynx' ? 'Зев' :
                 field === 'conjunctivae' ? 'Конъюнктивы' :
                 'Большой родничок'}
              </label>
              {editMode ? (
                <textarea
                  value={(formData as any)[field] || ''}
                  onChange={(e) => handleChange(field as keyof ChildDevelopmentAssessment, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{(formData as any)[field] || '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Органы дыхания</label>
          {editMode ? (
            <textarea value={formData.respiratoryOrgans || ''} onChange={(e) => handleChange('respiratoryOrgans', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={2} />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.respiratoryOrgans || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Частота дыхания</label>
          {editMode ? (
            <input type="number" value={formData.respiratoryRate || ''} onChange={(e) => handleChange('respiratoryRate', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.respiratoryRate ? `${formData.respiratoryRate} /мин` : '—'}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ЧСС</label>
            {editMode ? (
              <input type="number" value={formData.cardiovascularSystem?.heartRate || ''} onChange={(e) => handleNestedChange('cardiovascularSystem', 'heartRate', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.cardiovascularSystem?.heartRate || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Сердечный ритм</label>
            {editMode ? (
              <input type="text" value={formData.cardiovascularSystem?.heartRhythm || ''} onChange={(e) => handleNestedChange('cardiovascularSystem', 'heartRhythm', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.cardiovascularSystem?.heartRhythm || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Сердечные шумы</label>
            {editMode ? (
              <input type="text" value={formData.cardiovascularSystem?.heartMurmurs || ''} onChange={(e) => handleNestedChange('cardiovascularSystem', 'heartMurmurs', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.cardiovascularSystem?.heartMurmurs || '—'}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['abdomen', 'liver', 'spleen'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {field === 'abdomen' ? 'Живот' : field === 'liver' ? 'Печень' : 'Селезенка'}
              </label>
              {editMode ? (
                <textarea
                  value={formData.digestiveOrgans?.[field as keyof typeof formData.digestiveOrgans] || ''}
                  onChange={(e) => handleNestedChange('digestiveOrgans', field, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={2}
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.digestiveOrgans?.[field as keyof typeof formData.digestiveOrgans] || '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Мочеиспускание</label>
            {editMode ? (
              <input type="text" value={formData.urination || ''} onChange={(e) => handleChange('urination', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.urination || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Стул</label>
            {editMode ? (
              <input type="text" value={formData.stool || ''} onChange={(e) => handleChange('stool', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.stool || '—'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Диагноз</label>
          {editMode ? (
            <textarea value={formData.diagnosis || ''} onChange={(e) => handleChange('diagnosis', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={2} />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.diagnosis || '—'}</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Оценка кормления */}
      <CollapsibleSection title="Оценка кормления" defaultExpanded={false}>
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Есть ли у Вас трудности при кормлении?</label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="feedingDifficulties" checked={formData.feedingAssessment?.hasDifficulties === true} onChange={() => handleNestedChange('feedingAssessment', 'hasDifficulties', true)} className="w-4 h-4" />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="feedingDifficulties" checked={formData.feedingAssessment?.hasDifficulties === false} onChange={() => handleNestedChange('feedingAssessment', 'hasDifficulties', false)} className="w-4 h-4" />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg">{formData.feedingAssessment?.hasDifficulties === true ? 'Да' : formData.feedingAssessment?.hasDifficulties === false ? 'Нет' : '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ребенок кормится грудью?</label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isBreastfed" checked={formData.feedingAssessment?.isBreastfed === true} onChange={() => handleNestedChange('feedingAssessment', 'isBreastfed', true)} className="w-4 h-4" />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="isBreastfed" checked={formData.feedingAssessment?.isBreastfed === false} onChange={() => handleNestedChange('feedingAssessment', 'isBreastfed', false)} className="w-4 h-4" />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg">{formData.feedingAssessment?.isBreastfed === true ? 'Да' : formData.feedingAssessment?.isBreastfed === false ? 'Нет' : '—'}</p>
            )}
          </div>

          {formData.feedingAssessment?.isBreastfed && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Если Да, сколько раз за 24 часа?</label>
                {editMode ? (
                  <input type="number" value={formData.feedingAssessment?.feedingFrequency24h || ''} onChange={(e) => handleNestedChange('feedingAssessment', 'feedingFrequency24h', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.feedingAssessment?.feedingFrequency24h ? `${formData.feedingAssessment.feedingFrequency24h} раз` : '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Вы кормите грудью ночью?</label>
                {editMode ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="feedsAtNight" checked={formData.feedingAssessment?.feedsAtNight === true} onChange={() => handleNestedChange('feedingAssessment', 'feedsAtNight', true)} className="w-4 h-4" />
                      <span>Да</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="feedsAtNight" checked={formData.feedingAssessment?.feedsAtNight === false} onChange={() => handleNestedChange('feedingAssessment', 'feedsAtNight', false)} className="w-4 h-4" />
                      <span>Нет</span>
                    </label>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.feedingAssessment?.feedsAtNight === true ? 'Да' : formData.feedingAssessment?.feedsAtNight === false ? 'Нет' : '—'}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Получает ли ребенок другую пищу или жидкости?</label>
            {editMode ? (
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="receivesOtherFood" checked={formData.feedingAssessment?.receivesOtherFood === true} onChange={() => handleNestedChange('feedingAssessment', 'receivesOtherFood', true)} className="w-4 h-4" />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="receivesOtherFood" checked={formData.feedingAssessment?.receivesOtherFood === false} onChange={() => handleNestedChange('feedingAssessment', 'receivesOtherFood', false)} className="w-4 h-4" />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg mb-2">{formData.feedingAssessment?.receivesOtherFood === true ? 'Да' : formData.feedingAssessment?.receivesOtherFood === false ? 'Нет' : '—'}</p>
            )}
            
            {formData.feedingAssessment?.receivesOtherFood && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editMode ? (
                  <>
                    <input type="number" value={formData.feedingAssessment?.otherFoodFrequency || ''} onChange={(e) => handleNestedChange('feedingAssessment', 'otherFoodFrequency', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Сколько раз в сутки" />
                    <input type="text" value={formData.feedingAssessment?.otherFoodDetails || ''} onChange={(e) => handleNestedChange('feedingAssessment', 'otherFoodDetails', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Чем кормите" />
                  </>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.feedingAssessment?.otherFoodFrequency && formData.feedingAssessment?.otherFoodDetails ? `${formData.feedingAssessment.otherFoodFrequency} раз в сутки, ${formData.feedingAssessment.otherFoodDetails}` : '—'}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Прикорм (для детей старше 6 месяцев) */}
        {formData.feedingAssessment?.receivesOtherFood && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4 mt-4">
            <h4 className="font-semibold text-slate-800">Прикорм (для детей старше 6 месяцев)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Сколько основных приемов пищи для ПРИКОРМА в день?</label>
                {editMode ? (
                  <input type="number" value={formData.complementaryFeeding?.mainMealsPerDay || ''} onChange={(e) => handleNestedChange('complementaryFeeding', 'mainMealsPerDay', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.mainMealsPerDay || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Сколько перекусов за день?</label>
                {editMode ? (
                  <input type="number" value={formData.complementaryFeeding?.snacksPerDay || ''} onChange={(e) => handleNestedChange('complementaryFeeding', 'snacksPerDay', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.snacksPerDay || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ценность перекусов</label>
                {editMode ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="snackValue" value="nutritious" checked={formData.complementaryFeeding?.snackValue === 'nutritious'} onChange={(e) => handleNestedChange('complementaryFeeding', 'snackValue', e.target.value)} className="w-4 h-4" />
                      <span>Питательная</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="snackValue" value="non-nutritious" checked={formData.complementaryFeeding?.snackValue === 'non-nutritious'} onChange={(e) => handleNestedChange('complementaryFeeding', 'snackValue', e.target.value)} className="w-4 h-4" />
                      <span>Непитательная</span>
                    </label>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.snackValue === 'nutritious' ? 'Питательная' : formData.complementaryFeeding?.snackValue === 'non-nutritious' ? 'Непитательная' : '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Какое количество пищи съедает за один прием? (мл)</label>
                {editMode ? (
                  <input type="number" value={formData.complementaryFeeding?.amountPerMeal || ''} onChange={(e) => handleNestedChange('complementaryFeeding', 'amountPerMeal', parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.amountPerMeal ? `${formData.complementaryFeeding.amountPerMeal} мл` : '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Какова густота пищи?</label>
                {editMode ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="consistency" value="thick" checked={formData.complementaryFeeding?.consistency === 'thick'} onChange={(e) => handleNestedChange('complementaryFeeding', 'consistency', e.target.value)} className="w-4 h-4" />
                      <span>Густая</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="consistency" value="thin" checked={formData.complementaryFeeding?.consistency === 'thin'} onChange={(e) => handleNestedChange('complementaryFeeding', 'consistency', e.target.value)} className="w-4 h-4" />
                      <span>Негустая</span>
                    </label>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.consistency === 'thick' ? 'Густая' : formData.complementaryFeeding?.consistency === 'thin' ? 'Негустая' : '—'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">На прошлой неделе ребенок ел:</label>
              {editMode ? (
                <div className="space-y-2">
                  {['meatFish', 'legumes', 'vegetablesFruits'].map((food) => (
                    <div key={food} className="flex items-center gap-4">
                      <span className="text-sm w-48">
                        {food === 'meatFish' ? 'Мясо/рыбу/субпродукты' :
                         food === 'legumes' ? 'Бобовые' :
                         'Темно-зеленые и желтые овощи и фрукты'}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.complementaryFeeding?.lastWeekFoods?.[food as keyof typeof formData.complementaryFeeding.lastWeekFoods]?.yes || false} onChange={(e) => {
                          const foods = formData.complementaryFeeding?.lastWeekFoods || {};
                          handleNestedChange('complementaryFeeding', 'lastWeekFoods', {
                            ...foods,
                            [food]: { ...foods[food as keyof typeof foods], yes: e.target.checked }
                          });
                        }} className="w-4 h-4" />
                        <span>Да</span>
                      </label>
                      <input type="number" value={formData.complementaryFeeding?.lastWeekFoods?.[food as keyof typeof formData.complementaryFeeding.lastWeekFoods]?.days || ''} onChange={(e) => {
                        const foods = formData.complementaryFeeding?.lastWeekFoods || {};
                        handleNestedChange('complementaryFeeding', 'lastWeekFoods', {
                          ...foods,
                          [food]: { ...foods[food as keyof typeof foods], days: parseInt(e.target.value) || undefined }
                        });
                      }} className="w-24 px-2 py-1 border border-slate-300 rounded-lg" placeholder="дней" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.complementaryFeeding?.lastWeekFoods && Object.keys(formData.complementaryFeeding.lastWeekFoods).length > 0 ? (
                    Object.entries(formData.complementaryFeeding.lastWeekFoods).map(([key, value]: [string, any]) => (
                      <p key={key} className="px-3 py-2 bg-white rounded-lg">
                        {key === 'meatFish' ? 'Мясо/рыбу/субпродукты' :
                         key === 'legumes' ? 'Бобовые' :
                         'Темно-зеленые и желтые овощи и фрукты'}: {value?.yes ? `Да, ${value?.days || 0} дней` : 'Нет'}
                      </p>
                    ))
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg">—</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Даете ли Вы ребенку чай?</label>
              {editMode ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="teaGiven" checked={formData.complementaryFeeding?.teaGiven === true} onChange={() => handleNestedChange('complementaryFeeding', 'teaGiven', true)} className="w-4 h-4" />
                    <span>Да</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="teaGiven" checked={formData.complementaryFeeding?.teaGiven === false} onChange={() => handleNestedChange('complementaryFeeding', 'teaGiven', false)} className="w-4 h-4" />
                    <span>Нет</span>
                  </label>
                </div>
              ) : (
                <p className="px-3 py-2 bg-white rounded-lg">{formData.complementaryFeeding?.teaGiven === true ? 'Да' : formData.complementaryFeeding?.teaGiven === false ? 'Нет' : '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Чем Вы пользуетесь при кормлении</label>
              {editMode ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.complementaryFeeding?.feedingMethod?.bottle || false} onChange={(e) => handleNestedChange('complementaryFeeding', 'feedingMethod', { ...formData.complementaryFeeding?.feedingMethod, bottle: e.target.checked })} className="w-4 h-4" />
                    <span>Бутылочкой</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.complementaryFeeding?.feedingMethod?.cup || false} onChange={(e) => handleNestedChange('complementaryFeeding', 'feedingMethod', { ...formData.complementaryFeeding?.feedingMethod, cup: e.target.checked })} className="w-4 h-4" />
                    <span>Чашкой</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.complementaryFeeding?.feedingMethod?.spoon || false} onChange={(e) => handleNestedChange('complementaryFeeding', 'feedingMethod', { ...formData.complementaryFeeding?.feedingMethod, spoon: e.target.checked })} className="w-4 h-4" />
                    <span>Ложкой</span>
                  </label>
                </div>
              ) : (
                <p className="px-3 py-2 bg-white rounded-lg">
                  {(() => {
                    const methods = formData.complementaryFeeding?.feedingMethod;
                    if (!methods) return '—';
                    const methodList = [
                      methods.bottle && 'Бутылочкой',
                      methods.cup && 'Чашкой',
                      methods.spoon && 'Ложкой'
                    ].filter(Boolean);
                    return methodList.length > 0 ? methodList.join(', ') : '—';
                  })()}
                </p>
              )}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Прививочный статус */}
      <CollapsibleSection title="Прививочный статус" defaultExpanded={false}>
        
        <div className="bg-slate-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-3">Подчеркните прививки, которые нужно сделать сегодня:</label>
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'hepatitisB1', label: 'Гепатит В 1-0' },
                { key: 'bcg', label: 'БЦЖ' },
                { key: 'dtpHib1', label: 'АКДС 1+hib 1' },
                { key: 'hepatitisB2', label: 'Гепатит В 2' },
                { key: 'opv1', label: 'ОПВ-1' },
                { key: 'dtpHib2', label: 'АКДС 2+hib 2' },
                { key: 'hepatitisB3', label: 'Гепатит В 3' },
                { key: 'opv2', label: 'ОПВ-2' },
                { key: 'dtpHib3', label: 'АКДС 3+hib 3' },
                { key: 'opv3', label: 'ОПВ-3' },
                { key: 'opv0', label: 'ОПВ-0' },
                { key: 'measlesRubellaMumps', label: 'Корь + краснуха + паротит' },
                { key: 'dtpRevaccination', label: 'АКДС ревакцинация' },
                { key: 'hibRevaccination', label: 'НІВ ревакцинация' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.vaccinations as any)?.[key] || false}
                    onChange={(e) => handleNestedChange('vaccinations', key, e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {formData.vaccinations && Object.keys(formData.vaccinations).filter(k => (formData.vaccinations as any)[k]).length > 0 ? (
                Object.entries(formData.vaccinations).filter(([_, v]) => v).map(([key, _]) => {
                  const labels: Record<string, string> = {
                    hepatitisB1: 'Гепатит В 1-0',
                    bcg: 'БЦЖ',
                    dtpHib1: 'АКДС 1+hib 1',
                    hepatitisB2: 'Гепатит В 2',
                    opv1: 'ОПВ-1',
                    dtpHib2: 'АКДС 2+hib 2',
                    hepatitisB3: 'Гепатит В 3',
                    opv2: 'ОПВ-2',
                    dtpHib3: 'АКДС 3+hib 3',
                    opv3: 'ОПВ-3',
                    opv0: 'ОПВ-0',
                    measlesRubellaMumps: 'Корь + краснуха + паротит',
                    dtpRevaccination: 'АКДС ревакцинация',
                    hibRevaccination: 'НІВ ревакцинация',
                  };
                  return <p key={key} className="px-3 py-2 bg-white rounded-lg">✓ {labels[key] || key}</p>;
                })
              ) : (
                <p className="px-3 py-2 bg-white rounded-lg">—</p>
              )}
            </div>
          )}
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Визит для следующей прививки</label>
            {editMode ? (
              <input type="date" value={formData.vaccinations?.nextVisitDate || ''} onChange={(e) => handleNestedChange('vaccinations', 'nextVisitDate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg">{formData.vaccinations?.nextVisitDate ? new Date(formData.vaccinations.nextVisitDate).toLocaleDateString('ru-RU') : '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Профилактика рахита */}
      <CollapsibleSection title="Профилактика рахита" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Неспецифическая (достаточная инсоляция во время прогулок)</label>
            {editMode ? (
              <textarea value={formData.ricketsPrevention?.nonSpecific || ''} onChange={(e) => handleNestedChange('ricketsPrevention', 'nonSpecific', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={2} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.ricketsPrevention?.nonSpecific || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Специфическая профилактика витамином Д</label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.ricketsPrevention?.specific?.vitaminD || false} onChange={(e) => handleNestedChange('ricketsPrevention', 'specific', { ...formData.ricketsPrevention?.specific, vitaminD: e.target.checked })} className="w-4 h-4" />
                  <span>Назначен витамин Д</span>
                </label>
                <input type="number" step="0.1" value={formData.ricketsPrevention?.specific?.dose || ''} onChange={(e) => handleNestedChange('ricketsPrevention', 'specific', { ...formData.ricketsPrevention?.specific, dose: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Доза" />
                <input type="text" value={formData.ricketsPrevention?.specific?.duration || ''} onChange={(e) => handleNestedChange('ricketsPrevention', 'specific', { ...formData.ricketsPrevention?.specific, duration: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Длительность" />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.ricketsPrevention?.specific?.vitaminD && (
                  <>
                    <p className="px-3 py-2 bg-slate-50 rounded-lg">Витамин Д: Да</p>
                    {formData.ricketsPrevention.specific.dose && <p className="px-3 py-2 bg-slate-50 rounded-lg">Доза: {formData.ricketsPrevention.specific.dose}</p>}
                    {formData.ricketsPrevention.specific.duration && <p className="px-3 py-2 bg-slate-50 rounded-lg">Длительность: {formData.ricketsPrevention.specific.duration}</p>}
                  </>
                )}
                {!formData.ricketsPrevention?.specific?.vitaminD && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Психомоторное развитие */}
      <CollapsibleSection title="Психомоторное развитие" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['do', 'dr', 'pa', 'rpi', 'h', 'e'].map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{key.toUpperCase()}=</label>
              {editMode ? (
                <input type="text" value={formData.psychomotorDevelopment?.[key as keyof typeof formData.psychomotorDevelopment] || ''} onChange={(e) => handleNestedChange('psychomotorDevelopment', key, e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychomotorDevelopment?.[key as keyof typeof formData.psychomotorDevelopment] || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Оценка ухода в целях развития */}
      <CollapsibleSection title="Оценка ухода в целях развития" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Как Вы играете с ребенком?</label>
            {editMode ? (
              <textarea value={formData.developmentalCare?.howPlay || ''} onChange={(e) => handleNestedChange('developmentalCare', 'howPlay', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.developmentalCare?.howPlay || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Как Вы общаетесь с ребенком?</label>
            {editMode ? (
              <textarea value={formData.developmentalCare?.howCommunicate || ''} onChange={(e) => handleNestedChange('developmentalCare', 'howCommunicate', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.developmentalCare?.howCommunicate || '—'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Отстает ли ребенок в развитии?</label>
          {editMode ? (
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="laggingBehind" checked={formData.developmentalCare?.laggingBehind === false} onChange={() => handleNestedChange('developmentalCare', 'laggingBehind', false)} className="w-4 h-4" />
                  <span>Не отстает</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="laggingBehind" checked={formData.developmentalCare?.laggingBehind === true} onChange={() => handleNestedChange('developmentalCare', 'laggingBehind', true)} className="w-4 h-4" />
                  <span>Отстает</span>
                </label>
              </div>
              {formData.developmentalCare?.laggingBehind && (
                <textarea value={formData.developmentalCare?.laggingDetails || ''} onChange={(e) => handleNestedChange('developmentalCare', 'laggingDetails', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={2} placeholder="Опишите, на сколько отстает" />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.developmentalCare?.laggingBehind === false ? 'Не отстает' : formData.developmentalCare?.laggingBehind === true ? 'Отстает' : '—'}</p>
              {formData.developmentalCare?.laggingDetails && (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.developmentalCare.laggingDetails}</p>
              )}
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Оценка ухода */}
      <CollapsibleSection title="Оценка ухода" defaultExpanded={false}>
        <div className="space-y-4">
          {[
            { key: 'knowsCareRules', label: '1. Знает правила ухода за пациентом ребенком и когда необходимо обратиться к медицинскому работнику' },
            { key: 'followsRecommendations', label: '2. Выполняет рекомендации по питанию, развитию и уходу за ребенком согласно данным рекомендациям' },
            { key: 'knowsDangerSigns', label: '3. Знает ли мать признаки опасности' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
              {editMode ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={key} checked={(formData.careAssessment as any)?.[key] === true} onChange={() => handleNestedChange('careAssessment', key, true)} className="w-4 h-4" />
                    <span>Да</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={key} checked={(formData.careAssessment as any)?.[key] === false} onChange={() => handleNestedChange('careAssessment', key, false)} className="w-4 h-4" />
                    <span>Нет</span>
                  </label>
                </div>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{(formData.careAssessment as any)?.[key] === true ? 'Да' : (formData.careAssessment as any)?.[key] === false ? 'Нет' : '—'}</p>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Проблемы ухода</label>
          {editMode ? (
            <textarea value={formData.careProblems || ''} onChange={(e) => handleChange('careProblems', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.careProblems || '—'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Признаки жестокого обращения с ребенком (физическое насилие, пренебрежение, физическая и эмоциональная заброшенность)</label>
          {editMode ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.abuseSigns?.present || false} onChange={(e) => handleNestedChange('abuseSigns', 'present', e.target.checked)} className="w-4 h-4" />
                <span>Признаки обнаружены</span>
              </label>
              {formData.abuseSigns?.present && (
                <textarea value={formData.abuseSigns?.details || ''} onChange={(e) => handleNestedChange('abuseSigns', 'details', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} placeholder="Опишите признаки" />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.abuseSigns?.present ? 'Да' : 'Нет'}</p>
              {formData.abuseSigns?.details && (
                <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.abuseSigns.details}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Тревожные признаки, требующие специализированной помощи</label>
          {editMode ? (
            <textarea value={formData.warningSigns || ''} onChange={(e) => handleChange('warningSigns', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.warningSigns || '—'}</p>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052ChildDevelopment;
