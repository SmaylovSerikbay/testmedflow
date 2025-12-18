import React, { useState } from 'react';
import { NewbornPatronage } from '../../types/form052';
import CollapsibleSection from './CollapsibleSection';

interface Form052NewbornPatronageProps {
  data?: NewbornPatronage;
  onChange: (data: NewbornPatronage) => void;
  editMode: boolean;
}

const Form052NewbornPatronage: React.FC<Form052NewbornPatronageProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<NewbornPatronage>(data);

  const handleChange = (field: keyof NewbornPatronage, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof NewbornPatronage, { ...sectionData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Примечание:</strong> В течение первого месяца жизни патронаж новорожденного проводится 1 раз в 7 дней. 
          После первого месяца - 1 раз в месяц, согласно Стандарту организации оказания педиатрической помощи.
        </p>
        <p className="text-sm text-blue-800 mt-2">
          <strong>Задачи осмотра новорожденного:</strong> удостовериться в нормальной адаптации после рождения; 
          проверить на наличие опасных симптомов; оценить рост и развитие; проверить, нет ли врожденных пороков развития.
        </p>
      </div>

      {/* Основные данные осмотра */}
      <CollapsibleSection title="Основные данные осмотра" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дата осмотра
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.examinationDate || ''}
                onChange={(e) => handleChange('examinationDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.examinationDate ? new Date(formData.examinationDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Возраст
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.age || ''}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: 7 дней"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.age || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Температура (°C)
            </label>
            {editMode ? (
              <input
                type="number"
                step="0.1"
                value={formData.temperature || ''}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="36.6"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.temperature ? `${formData.temperature} °C` : '—'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Вес при рождении (кг)
            </label>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                value={formData.birthWeight || ''}
                onChange={(e) => handleChange('birthWeight', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="3.5"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.birthWeight ? `${formData.birthWeight} кг` : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Текущий вес (кг)
            </label>
            {editMode ? (
              <input
                type="number"
                step="0.01"
                value={formData.currentWeight || ''}
                onChange={(e) => handleChange('currentWeight', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="3.8"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.currentWeight ? `${formData.currentWeight} кг` : '—'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Рост (см)
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.height ? `${formData.height} см` : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ИМТ
            </label>
            {editMode ? (
              <input
                type="number"
                step="0.1"
                value={formData.bmi || ''}
                onChange={(e) => handleChange('bmi', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.bmi || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Окружность головы (см)
            </label>
            {editMode ? (
              <input
                type="number"
                step="0.1"
                value={formData.headCircumference || ''}
                onChange={(e) => handleChange('headCircumference', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.headCircumference ? `${formData.headCircumference} см` : '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Жалобы и анамнез */}
      <CollapsibleSection title="Жалобы и анамнез" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Жалобы матери
            </label>
          {editMode ? (
            <textarea
              value={formData.motherComplaints || ''}
              onChange={(e) => handleChange('motherComplaints', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Опишите жалобы матери"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.motherComplaints || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Оцените признаки опасности
          </label>
          {editMode ? (
            <textarea
              value={formData.dangerousSigns || ''}
              onChange={(e) => handleChange('dangerousSigns', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Опишите признаки опасности"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.dangerousSigns || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Отягощенный анамнез
          </label>
          {editMode ? (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="complicatedAnamnesis"
                  checked={formData.complicatedAnamnesis === true}
                  onChange={() => handleChange('complicatedAnamnesis', true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Да</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="complicatedAnamnesis"
                  checked={formData.complicatedAnamnesis === false}
                  onChange={() => handleChange('complicatedAnamnesis', false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Нет</span>
              </label>
            </div>
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
              {formData.complicatedAnamnesis === true ? 'Да' : formData.complicatedAnamnesis === false ? 'Нет' : '—'}
            </p>
          )}
        </div>
        </div>
      </CollapsibleSection>

      {/* Неврологическое обследование */}
      <CollapsibleSection title="Неврологическое обследование" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Оцените функцию черепно-мозговых нервов (движения языка, движения глаз, наличие глоточного рефлекса)
            </label>
          {editMode ? (
            <textarea
              value={formData.cranialNerves || ''}
              onChange={(e) => handleChange('cranialNerves', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Опишите функцию черепно-мозговых нервов"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.cranialNerves || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Проверьте рефлексы (на симметричность)
          </label>
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['rooting', 'sucking', 'grasp', 'moro', 'automaticWalking'].map((reflex) => (
                <div key={reflex}>
                  <label className="block text-xs text-slate-600 mb-1">
                    {reflex === 'rooting' ? 'Поисковый' :
                     reflex === 'sucking' ? 'Сосательный' :
                     reflex === 'grasp' ? 'Хватательный' :
                     reflex === 'moro' ? 'Моро' :
                     'Автоматической походки'}
                  </label>
                  <input
                    type="text"
                    value={formData.reflexes?.[reflex as keyof typeof formData.reflexes] || ''}
                    onChange={(e) => handleNestedChange('reflexes', reflex, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Опишите рефлекс"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {formData.reflexes && Object.keys(formData.reflexes).length > 0 ? (
                Object.entries(formData.reflexes).map(([key, value]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    <strong>{key === 'rooting' ? 'Поисковый' :
                             key === 'sucking' ? 'Сосательный' :
                             key === 'grasp' ? 'Хватательный' :
                             key === 'moro' ? 'Моро' :
                             'Автоматической походки'}:</strong> {value}
                  </p>
                ))
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">—</p>
              )}
            </div>
          )}
        </div>
        </div>
      </CollapsibleSection>

      {/* Осмотр лица */}
      <CollapsibleSection title="Осмотр лица" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Осмотр лица (симметричность, признаки дизморфизма, реакция зрачков на свет, размер, форма, состояние роговицы)
            </label>
          {editMode ? (
            <textarea
              value={formData.faceExamination || ''}
              onChange={(e) => handleChange('faceExamination', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Опишите осмотр лица"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.faceExamination || '—'}
            </p>
          )}
        </div>
        </div>
      </CollapsibleSection>

      {/* Кожа и слизистые */}
      <CollapsibleSection title="Кожа и слизистые" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Кожа (в норме розовая или интенсивно розовая)
            </label>
            {editMode ? (
              <textarea
                value={formData.skin || ''}
                onChange={(e) => handleChange('skin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.skin || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Слизистые ротовой полости
            </label>
            {editMode ? (
              <textarea
                value={formData.oralMucosa || ''}
                onChange={(e) => handleChange('oralMucosa', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.oralMucosa || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Конъюнктивы
            </label>
            {editMode ? (
              <textarea
                value={formData.conjunctivae || ''}
                onChange={(e) => handleChange('conjunctivae', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.conjunctivae || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Мышечный тонус и костная система */}
      <CollapsibleSection title="Мышечный тонус и костная система" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Мышечный тонус (в норме гипертонус верхних и нижних конечностей и гипотонус туловища и шеи)
            </label>
          {editMode ? (
            <textarea
              value={formData.muscleTone || ''}
              onChange={(e) => handleChange('muscleTone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Опишите мышечный тонус"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.muscleTone || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Видимые врожденные пороки
          </label>
          {editMode ? (
            <textarea
              value={formData.visibleCongenitalMalformations || ''}
              onChange={(e) => handleChange('visibleCongenitalMalformations', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Опишите видимые врожденные пороки (если есть)"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.visibleCongenitalMalformations || '—'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Форма головы
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.skeletalSystem?.headShape || ''}
                onChange={(e) => handleNestedChange('skeletalSystem', 'headShape', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.skeletalSystem?.headShape || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Швы
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.skeletalSystem?.sutures || ''}
                onChange={(e) => handleNestedChange('skeletalSystem', 'sutures', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.skeletalSystem?.sutures || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Большой родничок
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.skeletalSystem?.largeFontanelle || ''}
                onChange={(e) => handleNestedChange('skeletalSystem', 'largeFontanelle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.skeletalSystem?.largeFontanelle || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Малый родничок
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.skeletalSystem?.smallFontanelle || ''}
                onChange={(e) => handleNestedChange('skeletalSystem', 'smallFontanelle', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.skeletalSystem?.smallFontanelle || '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Оцените суставы (движения, размер, симметричность, нет ли повреждения плечевого сплетения, ключицы на предмет перелома; нет ли врожденного вывиха бедра, деформация стопы)
            </label>
            {editMode ? (
              <textarea
                value={formData.skeletalSystem?.joints || ''}
                onChange={(e) => handleNestedChange('skeletalSystem', 'joints', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.skeletalSystem?.joints || '—'}
              </p>
            )}
          </div>
        </div>
        </div>
      </CollapsibleSection>

      {/* Органы дыхания */}
      <CollapsibleSection title="Органы дыхания" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Частота дыхания (ЧД) (в норме 30-60/мин)
            </label>
          {editMode ? (
            <input
              type="number"
              value={formData.respiratoryRate || ''}
              onChange={(e) => handleChange('respiratoryRate', parseInt(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Например: 40"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
              {formData.respiratoryRate ? `${formData.respiratoryRate} /мин` : '—'}
            </p>
          )}
        </div>
        </div>
      </CollapsibleSection>

      {/* Органы ССС */}
      <CollapsibleSection title="Органы сердечно-сосудистой системы" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Частота сердечных сокращений (ЧСС) (в норме более 100/мин)
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.heartRate || ''}
                onChange={(e) => handleChange('heartRate', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: 120"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.heartRate ? `${formData.heartRate} /мин` : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сердечный ритм
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.heartRhythm || ''}
                onChange={(e) => handleChange('heartRhythm', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: ритмичный"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.heartRhythm || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сердечные шумы
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.heartMurmurs || ''}
                onChange={(e) => handleChange('heartMurmurs', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Опишите сердечные шумы"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.heartMurmurs || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пальпация бедренного пульса (в норме симметрично с двух сторон)
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.femoralPulse || ''}
                onChange={(e) => handleChange('femoralPulse', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Опишите пальпацию бедренного пульса"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.femoralPulse || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Органы пищеварения */}
      <CollapsibleSection title="Органы пищеварения" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Живот
            </label>
            {editMode ? (
              <textarea
                value={formData.abdomen || ''}
                onChange={(e) => handleChange('abdomen', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.abdomen || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Печень
            </label>
            {editMode ? (
              <textarea
                value={formData.liver || ''}
                onChange={(e) => handleChange('liver', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.liver || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Селезенка
            </label>
            {editMode ? (
              <textarea
                value={formData.spleen || ''}
                onChange={(e) => handleChange('spleen', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.spleen || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Половые органы, пуповина */}
      <CollapsibleSection title="Половые органы и пуповина" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Половые органы (грыжи, признаки половой двойственности)
            </label>
            {editMode ? (
              <textarea
                value={formData.genitals || ''}
                onChange={(e) => handleChange('genitals', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.genitals || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Пуповина (пуповинный остаток начинает спадаться в первые сутки после рождения, затем подсыхает и отпадает обычно после 7-10 дня)
            </label>
            {editMode ? (
              <textarea
                value={formData.umbilicalCord || ''}
                onChange={(e) => handleChange('umbilicalCord', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.umbilicalCord || '—'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Мочеиспускание (в норме частота не менее 6 раз при адекватном вскармливании)
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.urination || ''}
                onChange={(e) => handleChange('urination', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Опишите мочеиспускание"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.urination || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Стул (в норме золотисто-желтый, кашицеобразный, с кисловатым запахом)
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.stool || ''}
                onChange={(e) => handleChange('stool', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Опишите стул"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.stool || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Оценка кормления */}
      <CollapsibleSection title="Оценка кормления" defaultExpanded={false}>
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Есть ли у Вас трудности при кормлении?
            </label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="feedingDifficulties"
                    checked={formData.feedingProblems?.hasDifficulties === true}
                    onChange={() => handleNestedChange('feedingProblems', 'hasDifficulties', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="feedingDifficulties"
                    checked={formData.feedingProblems?.hasDifficulties === false}
                    onChange={() => handleNestedChange('feedingProblems', 'hasDifficulties', false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                {formData.feedingProblems?.hasDifficulties === true ? 'Да' : 
                 formData.feedingProblems?.hasDifficulties === false ? 'Нет' : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ребенок кормится грудью?
            </label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isBreastfed"
                    checked={formData.feedingProblems?.isBreastfed === true}
                    onChange={() => handleNestedChange('feedingProblems', 'isBreastfed', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isBreastfed"
                    checked={formData.feedingProblems?.isBreastfed === false}
                    onChange={() => handleNestedChange('feedingProblems', 'isBreastfed', false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                {formData.feedingProblems?.isBreastfed === true ? 'Да' : 
                 formData.feedingProblems?.isBreastfed === false ? 'Нет' : '—'}
              </p>
            )}
          </div>

          {formData.feedingProblems?.isBreastfed && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Если Да, сколько раз за 24 часа?
                </label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.feedingProblems?.feedingFrequency24h || ''}
                    onChange={(e) => handleNestedChange('feedingProblems', 'feedingFrequency24h', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Например: 8"
                  />
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                    {formData.feedingProblems?.feedingFrequency24h ? `${formData.feedingProblems.feedingFrequency24h} раз` : '—'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Вы кормите грудью ночью?
                </label>
                {editMode ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="feedsAtNight"
                        checked={formData.feedingProblems?.feedsAtNight === true}
                        onChange={() => handleNestedChange('feedingProblems', 'feedsAtNight', true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Да</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="feedsAtNight"
                        checked={formData.feedingProblems?.feedsAtNight === false}
                        onChange={() => handleNestedChange('feedingProblems', 'feedsAtNight', false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Нет</span>
                    </label>
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                    {formData.feedingProblems?.feedsAtNight === true ? 'Да' : 
                     formData.feedingProblems?.feedsAtNight === false ? 'Нет' : '—'}
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Получает ли ребенок другую пищу или жидкости?
            </label>
            {editMode ? (
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="receivesOtherFood"
                    checked={formData.feedingProblems?.receivesOtherFood === true}
                    onChange={() => handleNestedChange('feedingProblems', 'receivesOtherFood', true)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Да</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="receivesOtherFood"
                    checked={formData.feedingProblems?.receivesOtherFood === false}
                    onChange={() => handleNestedChange('feedingProblems', 'receivesOtherFood', false)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Нет</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg text-slate-900 mb-2">
                {formData.feedingProblems?.receivesOtherFood === true ? 'Да' : 
                 formData.feedingProblems?.receivesOtherFood === false ? 'Нет' : '—'}
              </p>
            )}
            
            {formData.feedingProblems?.receivesOtherFood && (
              <div className="mt-2">
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.feedingProblems?.otherFoodFrequency || ''}
                      onChange={(e) => handleNestedChange('feedingProblems', 'otherFoodFrequency', parseInt(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Сколько раз в сутки"
                    />
                    <input
                      type="text"
                      value={formData.feedingProblems?.otherFoodDetails || ''}
                      onChange={(e) => handleNestedChange('feedingProblems', 'otherFoodDetails', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Чем кормите"
                    />
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                    {formData.feedingProblems?.otherFoodFrequency && formData.feedingProblems?.otherFoodDetails
                      ? `${formData.feedingProblems.otherFoodFrequency} раз в сутки, ${formData.feedingProblems.otherFoodDetails}`
                      : '—'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Оценка кормления грудью */}
        {formData.feedingProblems?.isBreastfed && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4 mt-4">
            <h4 className="font-semibold text-slate-800">Оценка кормления грудью</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'chinTouchesBreast', label: 'Подбородок касается груди' },
                { key: 'mouthWideOpen', label: 'Рот широко раскрыт' },
                { key: 'lowerLipTurnedOut', label: 'Нижняя губа вывернута наружу' },
                { key: 'areolaVisibleAbove', label: 'Большая часть ареолы видна сверху, а не снизу рта' },
                { key: 'effectiveSucking', label: 'Эффективно ли сосет младенец (делает медленные глубокие сосательные движения с паузами)?' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                  </label>
                  {editMode ? (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={formData.breastfeedingAssessment?.[key as keyof typeof formData.breastfeedingAssessment] === true}
                          onChange={() => handleNestedChange('breastfeedingAssessment', key, true)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Да</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={key}
                          checked={formData.breastfeedingAssessment?.[key as keyof typeof formData.breastfeedingAssessment] === false}
                          onChange={() => handleNestedChange('breastfeedingAssessment', key, false)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Нет</span>
                      </label>
                    </div>
                  ) : (
                    <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                      {formData.breastfeedingAssessment?.[key as keyof typeof formData.breastfeedingAssessment] === true ? 'Да' : 
                       formData.breastfeedingAssessment?.[key as keyof typeof formData.breastfeedingAssessment] === false ? 'Нет' : '—'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ищите язвы или белые пятна во рту (молочница)
              </label>
              {editMode ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasThrush"
                      checked={formData.oralHealth?.hasThrush === true}
                      onChange={() => handleNestedChange('oralHealth', 'hasThrush', true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Да</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasThrush"
                      checked={formData.oralHealth?.hasThrush === false}
                      onChange={() => handleNestedChange('oralHealth', 'hasThrush', false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Нет</span>
                  </label>
                </div>
              ) : (
                <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                  {formData.oralHealth?.hasThrush === true ? 'Да' : 
                   formData.oralHealth?.hasThrush === false ? 'Нет' : '—'}
                </p>
              )}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Оценка ухода в целях развития */}
      <CollapsibleSection title="Оценка ухода в целях развития" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Как Вы играете с Вашим ребенком?
            </label>
            {editMode ? (
              <textarea
                value={formData.developmentalCare?.howPlay || ''}
                onChange={(e) => handleNestedChange('developmentalCare', 'howPlay', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.developmentalCare?.howPlay || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Как Вы общаетесь с Вашим ребенком?
            </label>
            {editMode ? (
              <textarea
                value={formData.developmentalCare?.howCommunicate || ''}
                onChange={(e) => handleNestedChange('developmentalCare', 'howCommunicate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.developmentalCare?.howCommunicate || '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Проблемы развития
            </label>
            {editMode ? (
              <textarea
                value={formData.developmentalCare?.developmentalProblems || ''}
                onChange={(e) => handleNestedChange('developmentalCare', 'developmentalProblems', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.developmentalCare?.developmentalProblems || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Прививочный статус */}
      <CollapsibleSection title="Прививочный статус младенца" defaultExpanded={false}>
        <div className="bg-slate-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Подчеркните прививки, которые ребенок получает сегодня:
            </label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vaccinationStatus?.hepatitisB1 || false}
                    onChange={(e) => handleNestedChange('vaccinationStatus', 'hepatitisB1', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Гепатит В 1-0</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.vaccinationStatus?.bcg || false}
                    onChange={(e) => handleNestedChange('vaccinationStatus', 'bcg', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>БЦЖ</span>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.vaccinationStatus?.hepatitisB1 && (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">✓ Гепатит В 1-0</p>
                )}
                {formData.vaccinationStatus?.bcg && (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">✓ БЦЖ</p>
                )}
                {!formData.vaccinationStatus?.hepatitisB1 && !formData.vaccinationStatus?.bcg && (
                  <p className="px-3 py-2 bg-white rounded-lg text-slate-900">—</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Визит для следующей прививки
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.vaccinationStatus?.nextVisitDate || ''}
                onChange={(e) => handleNestedChange('vaccinationStatus', 'nextVisitDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-white rounded-lg text-slate-900">
                {formData.vaccinationStatus?.nextVisitDate ? new Date(formData.vaccinationStatus.nextVisitDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Оценка ухода */}
      <CollapsibleSection title="Оценка ухода" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Наличие детской кроватки, предметов ухода, одежды ребенка
            </label>
            {editMode ? (
              <textarea
                value={formData.careAssessment?.cribAndItems || ''}
                onChange={(e) => handleNestedChange('careAssessment', 'cribAndItems', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.careAssessment?.cribAndItems || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Гигиена помещения (регулярность влажной уборки, курение в комнате, светлое, теплое помещение – t не менее 25 °C)
            </label>
            {editMode ? (
              <textarea
                value={formData.careAssessment?.roomHygiene || ''}
                onChange={(e) => handleNestedChange('careAssessment', 'roomHygiene', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.careAssessment?.roomHygiene || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Гигиена ребенка
            </label>
            {editMode ? (
              <textarea
                value={formData.careAssessment?.childHygiene || ''}
                onChange={(e) => handleNestedChange('careAssessment', 'childHygiene', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.careAssessment?.childHygiene || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Проблемы ухода
            </label>
            {editMode ? (
              <textarea
                value={formData.careAssessment?.careProblems || ''}
                onChange={(e) => handleNestedChange('careAssessment', 'careProblems', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {formData.careAssessment?.careProblems || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Оценка здоровья матери */}
      <CollapsibleSection title="Оценка здоровья матери" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Осмотр молочных желез: Проблемы
            </label>
          {editMode ? (
            <textarea
              value={formData.maternalHealth?.breastExamination || ''}
              onChange={(e) => handleNestedChange('maternalHealth', 'breastExamination', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.maternalHealth?.breastExamination || '—'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            2. Симптомы послеродовой депрессии (обращать внимание при каждом визите)
          </label>
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'глубокая тревожность и беспокойство',
                'глубокая печаль',
                'частые слезы',
                'ощущение неспособности заботиться о ребенке',
                'чувство вины',
                'приступы паники',
                'стресс и раздражительность',
                'утомляемость и недостаток энергии',
                'неспособность к сосредоточению внимания',
                'нарушение сна',
                'проблемы с аппетитом',
                'потеря интереса к сексу',
                'ощущение беспомощности и безнадежности',
                'антипатия к ребенку',
              ].map((symptom, index) => (
                <label key={index} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 rounded">
                  <input
                    type="checkbox"
                    checked={formData.maternalHealth?.postpartumDepression?.symptoms?.includes(symptom) || false}
                    onChange={(e) => {
                      const symptoms = formData.maternalHealth?.postpartumDepression?.symptoms || [];
                      const newSymptoms = e.target.checked
                        ? [...symptoms, symptom]
                        : symptoms.filter(s => s !== symptom);
                      handleNestedChange('maternalHealth', 'postpartumDepression', {
                        ...formData.maternalHealth?.postpartumDepression,
                        symptoms: newSymptoms,
                        hasSymptoms: newSymptoms.length > 0
                      });
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">{symptom}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {formData.maternalHealth?.postpartumDepression?.symptoms && formData.maternalHealth.postpartumDepression.symptoms.length > 0 ? (
                formData.maternalHealth.postpartumDepression.symptoms.map((symptom, index) => (
                  <p key={index} className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    • {symptom}
                  </p>
                ))
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">—</p>
              )}
            </div>
          )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Рекомендации */}
      <CollapsibleSection title="Рекомендации" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Рекомендации
            </label>
          {editMode ? (
            <textarea
              value={formData.recommendations || ''}
              onChange={(e) => handleChange('recommendations', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="Введите рекомендации..."
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
              {formData.recommendations || '—'}
            </p>
          )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052NewbornPatronage;
