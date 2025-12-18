import React, { useState } from 'react';
import { AbuseExaminationCard } from '../../types/form052';
import { PlusIcon, TrashIcon } from '../Icons';
import AnatomicalScheme from './AnatomicalScheme';
import CollapsibleSection from './CollapsibleSection';

interface Form052AbuseExaminationProps {
  data?: AbuseExaminationCard;
  onChange: (data: AbuseExaminationCard) => void;
  editMode: boolean;
}

const Form052AbuseExamination: React.FC<Form052AbuseExaminationProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<AbuseExaminationCard>(data);

  const handleChange = (field: keyof AbuseExaminationCard, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof AbuseExaminationCard, { ...sectionData, [field]: value });
  };

  const addInjury = (type: 'abrasions' | 'bruises' | 'wounds' | 'fractures') => {
    const injuries = formData.injuries || {};
    const injuryArray = injuries[type] || [];
    handleNestedChange('injuries', type, [...injuryArray, {}]);
  };

  const updateInjury = (type: 'abrasions' | 'bruises' | 'wounds' | 'fractures', index: number, field: string, value: any) => {
    const injuries = formData.injuries || {};
    const injuryArray = [...(injuries[type] || [])];
    injuryArray[index] = { ...injuryArray[index], [field]: value };
    handleNestedChange('injuries', type, injuryArray);
  };

  const removeInjury = (type: 'abrasions' | 'bruises' | 'wounds' | 'fractures', index: number) => {
    const injuries = formData.injuries || {};
    const injuryArray = injuries[type]?.filter((_, i) => i !== index) || [];
    handleNestedChange('injuries', type, injuryArray);
  };

  return (
    <div className="space-y-4">
      {/* Основные данные осмотра */}
      <CollapsibleSection title="Основные данные осмотра" defaultExpanded={false}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дата и время обращения
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.referralDate || ''}
                  onChange={(e) => handleChange('referralDate', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={formData.referralTime || ''}
                  onChange={(e) => handleChange('referralTime', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.referralDate && formData.referralTime
                  ? `${new Date(formData.referralDate).toLocaleDateString('ru-RU')} ${formData.referralTime}`
                  : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Повод обращения
            </label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="bodily_injury"
                    checked={formData.reason === 'bodily_injury'}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Телесное повреждение</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="psychological_impact"
                    checked={formData.reason === 'psychological_impact'}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Психологическое воздействие</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value="both"
                    checked={formData.reason === 'both'}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Оба</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.reason === 'bodily_injury' ? 'Телесное повреждение' :
                 formData.reason === 'psychological_impact' ? 'Психологическое воздействие' :
                 formData.reason === 'both' ? 'Оба' : '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Жалобы
            </label>
            {editMode ? (
              <textarea
                value={formData.complaints || ''}
                onChange={(e) => handleChange('complaints', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.complaints || '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Жалобы и анамнез */}
      <CollapsibleSection title="Жалобы и анамнез" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сведения о случае применения физического насилия
            </label>
            {editMode ? (
              <textarea
                value={formData.anamnesis?.physicalViolence || ''}
                onChange={(e) => handleNestedChange('anamnesis', 'physicalViolence', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.anamnesis?.physicalViolence || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сведения о случае применения психологического насилия
            </label>
            {editMode ? (
              <textarea
                value={formData.anamnesis?.psychologicalViolence || ''}
                onChange={(e) => handleNestedChange('anamnesis', 'psychologicalViolence', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.anamnesis?.psychologicalViolence || '—'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Время и дата
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.anamnesis?.timeDate || ''}
                  onChange={(e) => handleNestedChange('anamnesis', 'timeDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Укажите время и дату"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.anamnesis?.timeDate || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Применение оружия и (или) предметов, использованных в качестве оружия
              </label>
              {editMode ? (
                <textarea
                  value={formData.anamnesis?.weaponsUsed || ''}
                  onChange={(e) => handleNestedChange('anamnesis', 'weaponsUsed', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.anamnesis?.weaponsUsed || '—'}</p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Описание телесных повреждений - Ссадины */}
      <CollapsibleSection title="Описание ссадин" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={() => addInjury('abrasions')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить ссадину
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.injuries?.abrasions || []).length > 0 ? (
            formData.injuries.abrasions!.map((abrasion, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Ссадина #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeInjury('abrasions', index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Точная анатомическая локализация
                    </label>
                    {editMode ? (
                      <textarea
                        value={abrasion.anatomicalLocation || ''}
                        onChange={(e) => updateInjury('abrasions', index, 'anatomicalLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{abrasion.anatomicalLocation || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Форма
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        {['linear', 'circular', 'oval', 'irregular_oval', 'triangular'].map((shape) => (
                          <label key={shape} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`abrasion-shape-${index}`}
                              checked={abrasion.shape === shape}
                              onChange={() => updateInjury('abrasions', index, 'shape', shape)}
                              className="w-4 h-4"
                            />
                            <span>
                              {shape === 'linear' ? 'Линейная' :
                               shape === 'circular' ? 'Округлая' :
                               shape === 'oval' ? 'Овальная' :
                               shape === 'irregular_oval' ? 'Неправильная овальная' :
                               'Треугольная'}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {abrasion.shape === 'linear' ? 'Линейная' :
                         abrasion.shape === 'circular' ? 'Округлая' :
                         abrasion.shape === 'oval' ? 'Овальная' :
                         abrasion.shape === 'irregular_oval' ? 'Неправильная овальная' :
                         abrasion.shape === 'triangular' ? 'Треугольная' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      3. Направление
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        {['vertical', 'horizontal', 'oblique_vertical'].map((dir) => (
                          <label key={dir} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`abrasion-direction-${index}`}
                              checked={abrasion.direction === dir}
                              onChange={() => updateInjury('abrasions', index, 'direction', dir)}
                              className="w-4 h-4"
                            />
                            <span>
                              {dir === 'vertical' ? 'Вертикальное' :
                               dir === 'horizontal' ? 'Горизонтальное' :
                               'Косо-вертикальное'}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {abrasion.direction === 'vertical' ? 'Вертикальное' :
                         abrasion.direction === 'horizontal' ? 'Горизонтальное' :
                         abrasion.direction === 'oblique_vertical' ? 'Косо-вертикальное' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      4. Размеры (длина × ширина, см)
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.1"
                          value={abrasion.dimensions?.length || ''}
                          onChange={(e) => updateInjury('abrasions', index, 'dimensions', { ...abrasion.dimensions, length: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Длина"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={abrasion.dimensions?.width || ''}
                          onChange={(e) => updateInjury('abrasions', index, 'dimensions', { ...abrasion.dimensions, width: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ширина"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {abrasion.dimensions?.length && abrasion.dimensions?.width
                          ? `${abrasion.dimensions.length} × ${abrasion.dimensions.width} см`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      5. Состояние дна либо покрывающей корочки
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('влажная') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, влажная` : 'влажная')
                                  : current.replace(/,?\s*влажная/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Влажная</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('западает') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, западает по отношению к уровню окружающей кожи` : 'западает по отношению к уровню окружающей кожи')
                                  : current.replace(/,?\s*западает по отношению к уровню окружающей кожи/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Западает по отношению к уровню окружающей кожи</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('на уровне') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}; на уровне окружающей кожи` : 'на уровне окружающей кожи')
                                  : current.replace(/;?\s*на уровне окружающей кожи/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>На уровне окружающей кожи</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('выше уровня') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}; выше уровня окружающей кожи` : 'выше уровня окружающей кожи')
                                  : current.replace(/;?\s*выше уровня окружающей кожи/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Выше уровня окружающей кожи</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('отпадает') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, отпадает по периферии` : 'отпадает по периферии')
                                  : current.replace(/,?\s*отпадает по периферии/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Отпадает по периферии</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('гиперпигментации') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, участок гиперпигментации` : 'участок гиперпигментации')
                                  : current.replace(/,?\s*участок гиперпигментации/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Участок гиперпигментации</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.baseCondition?.includes('гипопигментации') || false}
                              onChange={(e) => {
                                const current = abrasion.baseCondition || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, гипопигментации` : 'гипопигментации')
                                  : current.replace(/,?\s*гипопигментации/g, '').trim();
                                updateInjury('abrasions', index, 'baseCondition', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Гипопигментации</span>
                          </label>
                        </div>
                        <textarea
                          value={abrasion.baseCondition || ''}
                          onChange={(e) => updateInjury('abrasions', index, 'baseCondition', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Дополнительные примечания"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{abrasion.baseCondition || '—'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      6. Особенности состояния окружающих мягких тканей
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.surroundingTissues?.includes('припухлость') || false}
                              onChange={(e) => {
                                const current = abrasion.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, припухлость` : 'припухлость')
                                  : current.replace(/,?\s*припухлость/g, '').trim();
                                updateInjury('abrasions', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Припухлость</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.surroundingTissues?.includes('гиперемированы') || false}
                              onChange={(e) => {
                                const current = abrasion.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, гиперемированы` : 'гиперемированы')
                                  : current.replace(/,?\s*гиперемированы/g, '').trim();
                                updateInjury('abrasions', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Гиперемированы</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.surroundingTissues?.includes('наложением крови') || false}
                              onChange={(e) => {
                                const current = abrasion.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, с наложением крови` : 'с наложением крови')
                                  : current.replace(/,?\s*с наложением крови/g, '').trim();
                                updateInjury('abrasions', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>С наложением крови</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={abrasion.surroundingTissues?.includes('почвы') || false}
                              onChange={(e) => {
                                const current = abrasion.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, почвы` : 'почвы')
                                  : current.replace(/,?\s*почвы/g, '').trim();
                                updateInjury('abrasions', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Почвы</span>
                          </label>
                        </div>
                        <textarea
                          value={abrasion.surroundingTissues || ''}
                          onChange={(e) => updateInjury('abrasions', index, 'surroundingTissues', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Дополнительные примечания"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{abrasion.surroundingTissues || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о ссадинах</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Повреждения - Кровоподтеки */}
      <CollapsibleSection title="Описание кровоподтеков" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={() => addInjury('bruises')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить кровоподтек
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.injuries?.bruises || []).length > 0 ? (
            formData.injuries.bruises!.map((bruise, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Кровоподтек #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeInjury('bruises', index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Точная анатомическая локализация
                    </label>
                    {editMode ? (
                      <textarea
                        value={bruise.anatomicalLocation || ''}
                        onChange={(e) => updateInjury('bruises', index, 'anatomicalLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{bruise.anatomicalLocation || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Форма
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        {['linear', 'circular', 'oval'].map((shape) => (
                          <label key={shape} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`bruise-shape-${index}`}
                              checked={bruise.shape === shape}
                              onChange={() => updateInjury('bruises', index, 'shape', shape)}
                              className="w-4 h-4"
                            />
                            <span>
                              {shape === 'linear' ? 'Линейная' :
                               shape === 'circular' ? 'Округлая' :
                               'Овальная'}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {bruise.shape === 'linear' ? 'Линейная' :
                         bruise.shape === 'circular' ? 'Округлая' :
                         bruise.shape === 'oval' ? 'Овальная' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Цвет
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        {['red_purple', 'bluish_violet', 'brownish', 'greenish', 'yellow'].map((color) => (
                          <label key={color} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`bruise-color-${index}`}
                              checked={bruise.color === color}
                              onChange={() => updateInjury('bruises', index, 'color', color)}
                              className="w-4 h-4"
                            />
                            <span>
                              {color === 'red_purple' ? 'Красно-фиолетовый' :
                               color === 'bluish_violet' ? 'Синевато-фиолетовый' :
                               color === 'brownish' ? 'Коричневатый' :
                               color === 'greenish' ? 'Зеленоватый' :
                               'Желтый'}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {bruise.color === 'red_purple' ? 'Красно-фиолетовый' :
                         bruise.color === 'bluish_violet' ? 'Синевато-фиолетовый' :
                         bruise.color === 'brownish' ? 'Коричневатый' :
                         bruise.color === 'greenish' ? 'Зеленоватый' :
                         bruise.color === 'yellow' ? 'Желтый' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Размеры (длина × ширина, см)
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.1"
                          value={bruise.dimensions?.length || ''}
                          onChange={(e) => updateInjury('bruises', index, 'dimensions', { ...bruise.dimensions, length: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Длина"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={bruise.dimensions?.width || ''}
                          onChange={(e) => updateInjury('bruises', index, 'dimensions', { ...bruise.dimensions, width: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ширина"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {bruise.dimensions?.length && bruise.dimensions?.width
                          ? `${bruise.dimensions.length} × ${bruise.dimensions.width} см`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Особенности состояния окружающих мягких тканей
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bruise.surroundingTissues?.includes('припухлость') || false}
                              onChange={(e) => {
                                const current = bruise.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, припухлость` : 'припухлость')
                                  : current.replace(/,?\s*припухлость/g, '').trim();
                                updateInjury('bruises', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Припухлость</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bruise.surroundingTissues?.includes('гиперемированы') || false}
                              onChange={(e) => {
                                const current = bruise.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, гиперемированы` : 'гиперемированы')
                                  : current.replace(/,?\s*гиперемированы/g, '').trim();
                                updateInjury('bruises', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Гиперемированы</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bruise.surroundingTissues?.includes('наложением крови') || false}
                              onChange={(e) => {
                                const current = bruise.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, с наложением крови` : 'с наложением крови')
                                  : current.replace(/,?\s*с наложением крови/g, '').trim();
                                updateInjury('bruises', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>С наложением крови</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bruise.surroundingTissues?.includes('почвы') || false}
                              onChange={(e) => {
                                const current = bruise.surroundingTissues || '';
                                const updated = e.target.checked 
                                  ? (current ? `${current}, почвы` : 'почвы')
                                  : current.replace(/,?\s*почвы/g, '').trim();
                                updateInjury('bruises', index, 'surroundingTissues', updated);
                              }}
                              className="w-4 h-4"
                            />
                            <span>Почвы</span>
                          </label>
                        </div>
                        <textarea
                          value={bruise.surroundingTissues || ''}
                          onChange={(e) => updateInjury('bruises', index, 'surroundingTissues', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Дополнительные примечания"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{bruise.surroundingTissues || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о кровоподтеках</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Повреждения - Раны */}
      <CollapsibleSection title="Описание ран" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={() => addInjury('wounds')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить рану
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.injuries?.wounds || []).length > 0 ? (
            formData.injuries.wounds!.map((wound, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Рана #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeInjury('wounds', index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Точная анатомическая локализация
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.anatomicalLocation || ''}
                        onChange={(e) => updateInjury('wounds', index, 'anatomicalLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{wound.anatomicalLocation || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Форма раны при зиянии
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`wound-shape-${index}`}
                            checked={wound.shape === 'linear'}
                            onChange={() => updateInjury('wounds', index, 'shape', 'linear')}
                            className="w-4 h-4"
                          />
                          <span>Линейная</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`wound-shape-${index}`}
                            checked={wound.shape === 'spindle_shaped'}
                            onChange={() => updateInjury('wounds', index, 'shape', 'spindle_shaped')}
                            className="w-4 h-4"
                          />
                          <span>Веретенообразная</span>
                        </label>
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {wound.shape === 'linear' ? 'Линейная' : wound.shape === 'spindle_shaped' ? 'Веретенообразная' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Размеры (длина × ширина, см)
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.1"
                          value={wound.dimensions?.length || ''}
                          onChange={(e) => updateInjury('wounds', index, 'dimensions', { ...wound.dimensions, length: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Длина"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={wound.dimensions?.width || ''}
                          onChange={(e) => updateInjury('wounds', index, 'dimensions', { ...wound.dimensions, width: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ширина"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {wound.dimensions?.length && wound.dimensions?.width
                          ? `${wound.dimensions.length} × ${wound.dimensions.width} см`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      3. Наличие дефекта "минус-ткань"
                    </label>
                    {editMode ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wound.tissueDefect || false}
                          onChange={(e) => updateInjury('wounds', index, 'tissueDefect', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span>Да</span>
                      </label>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{wound.tissueDefect ? 'Да' : 'Нет'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      4. Особенности краев
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wound.edges?.abrasion || false}
                            onChange={(e) => updateInjury('wounds', index, 'edges', { ...wound.edges, abrasion: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Осадненность</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wound.edges?.bruising || false}
                            onChange={(e) => updateInjury('wounds', index, 'edges', { ...wound.edges, bruising: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Кровоподтечность</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wound.edges?.detachment || false}
                            onChange={(e) => updateInjury('wounds', index, 'edges', { ...wound.edges, detachment: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Отслоенность</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wound.edges?.contamination || false}
                            onChange={(e) => updateInjury('wounds', index, 'edges', { ...wound.edges, contamination: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Загрязненность</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={wound.edges?.foreignInclusions || false}
                            onChange={(e) => updateInjury('wounds', index, 'edges', { ...wound.edges, foreignInclusions: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Инородные включения</span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {wound.edges?.abrasion && <p className="px-3 py-2 bg-slate-50 rounded-lg">Осадненность</p>}
                        {wound.edges?.bruising && <p className="px-3 py-2 bg-slate-50 rounded-lg">Кровоподтечность</p>}
                        {wound.edges?.detachment && <p className="px-3 py-2 bg-slate-50 rounded-lg">Отслоенность</p>}
                        {wound.edges?.contamination && <p className="px-3 py-2 bg-slate-50 rounded-lg">Загрязненность</p>}
                        {wound.edges?.foreignInclusions && <p className="px-3 py-2 bg-slate-50 rounded-lg">Инородные включения</p>}
                        {!wound.edges && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      5. Рельеф скошенности стенок
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.wallRelief || ''}
                        onChange={(e) => updateInjury('wounds', index, 'wallRelief', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Опишите рельеф стенок (ровные, гладкие, располагаются отвесно, одна стенка скошена, а другая подрыта)"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{wound.wallRelief || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      6. Осадненность концов
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.endsAbrasion || ''}
                        onChange={(e) => updateInjury('wounds', index, 'endsAbrasion', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{wound.endsAbrasion || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      7. Особенности дна
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.bottomFeatures || ''}
                        onChange={(e) => updateInjury('wounds', index, 'bottomFeatures', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Наличие межтканевых соединительно-тканных перемычек, повреждений мышц, костей"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{wound.bottomFeatures || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      8. Особенности повреждения волос в области раны
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.hairDamage || ''}
                        onChange={(e) => updateInjury('wounds', index, 'hairDamage', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Поперечно или косопоперечно пересечены в начальной и средней трети раны, в конечном отрезке волоса, с вывороченными луковицами"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{wound.hairDamage || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      9. Особенности микрорельефа на плоскости разреза, разруба, распила хряща, кости
                    </label>
                    {editMode ? (
                      <textarea
                        value={wound.microrelief || ''}
                        onChange={(e) => updateInjury('wounds', index, 'microrelief', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Ровный, не ровный, зазубренный"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{wound.microrelief || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о ранах</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Повреждения - Переломы */}
      <CollapsibleSection title="Описание переломов" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={() => addInjury('fractures')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить перелом
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.injuries?.fractures || []).length > 0 ? (
            formData.injuries.fractures!.map((fracture, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Перелом #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeInjury('fractures', index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Точная анатомическая локализация
                    </label>
                    {editMode ? (
                      <textarea
                        value={fracture.anatomicalLocation || ''}
                        onChange={(e) => updateInjury('fractures', index, 'anatomicalLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{fracture.anatomicalLocation || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Форма
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-shape-${index}`}
                            checked={fracture.shape === 'linear'}
                            onChange={() => updateInjury('fractures', index, 'shape', 'linear')}
                            className="w-4 h-4"
                          />
                          <span>Линейная</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-shape-${index}`}
                            checked={fracture.shape === 'irregular'}
                            onChange={() => updateInjury('fractures', index, 'shape', 'irregular')}
                            className="w-4 h-4"
                          />
                          <span>Неправильная</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-shape-${index}`}
                            checked={fracture.shape === 'comminuted'}
                            onChange={() => updateInjury('fractures', index, 'shape', 'comminuted')}
                            className="w-4 h-4"
                          />
                          <span>Многооскольчатая</span>
                        </label>
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {fracture.shape === 'linear' ? 'Линейная' :
                         fracture.shape === 'irregular' ? 'Неправильная' :
                         fracture.shape === 'comminuted' ? 'Многооскольчатая' : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      3. Размеры (см)
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={fracture.dimensions || ''}
                        onChange={(e) => updateInjury('fractures', index, 'dimensions', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите размеры"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{fracture.dimensions || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      4. Направление линий перелома (трещин)
                    </label>
                    {editMode ? (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-direction-${index}`}
                            checked={fracture.direction === 'vertical'}
                            onChange={() => updateInjury('fractures', index, 'direction', 'vertical')}
                            className="w-4 h-4"
                          />
                          <span>Вертикальное</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-direction-${index}`}
                            checked={fracture.direction === 'horizontal'}
                            onChange={() => updateInjury('fractures', index, 'direction', 'horizontal')}
                            className="w-4 h-4"
                          />
                          <span>Горизонтальное</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`fracture-direction-${index}`}
                            checked={fracture.direction === 'oblique_vertical'}
                            onChange={() => updateInjury('fractures', index, 'direction', 'oblique_vertical')}
                            className="w-4 h-4"
                          />
                          <span>Косо-вертикальное в направлении сверху вниз, слева направо</span>
                        </label>
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {fracture.direction === 'vertical' ? 'Вертикальное' :
                         fracture.direction === 'horizontal' ? 'Горизонтальное' :
                         fracture.direction === 'oblique_vertical' ? 'Косо-вертикальное' : '—'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      5. Размеры, ориентировка свободных отломков, дефектов, сколов кости и вдавлений
                    </label>
                    {editMode ? (
                      <textarea
                        value={fracture.fragments || ''}
                        onChange={(e) => updateInjury('fractures', index, 'fragments', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{fracture.fragments || '—'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      6. Особенности повреждения позвоночника: локализация и свойства кровоизлияний в окружающих позвоночник тканях, переломов тел, дужек и отростков позвонков, характер их смещения, повреждений связочного аппарата, межпозвонковых дисков, над- и подоболочечных кровоизлияний, спинного мозга
                    </label>
                    {editMode ? (
                      <textarea
                        value={fracture.spineInjury || ''}
                        onChange={(e) => updateInjury('fractures', index, 'spineInjury', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{fracture.spineInjury || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о переломах</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Схема анатомической локализации */}
      <CollapsibleSection title="Схема анатомической локализации" defaultExpanded={false}>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Инструкция:</strong> Кликните на схеме в режиме редактирования, чтобы добавить отметку о повреждении. 
            Отметки можно удалить, кликнув на них.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-700 mb-4">Схема мужчина</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Передний вид</p>
                <AnatomicalScheme
                  gender="male"
                  view="front"
                  markings={formData.anatomicalScheme?.markings?.filter(m => {
                    const desc = m.description.toLowerCase();
                    return desc.includes('мужчина') && desc.includes('передний') || 
                           (desc.includes('мужчина') && !desc.includes('задний') && !desc.includes('женщина'));
                  }) || []}
                  onMarkingAdd={(marking) => {
                    const newMarking = { ...marking, description: `мужчина передний: ${marking.description}` };
                    const markings = [...(formData.anatomicalScheme?.markings || []), newMarking];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, front: 'male-front', markings });
                  }}
                  onMarkingRemove={(id) => {
                    const markings = formData.anatomicalScheme?.markings?.filter(m => m.id !== id) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  onMarkingUpdate={(id, updates) => {
                    const markings = formData.anatomicalScheme?.markings?.map(m => 
                      m.id === id ? { ...m, ...updates } : m
                    ) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  editMode={editMode}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Задний вид</p>
                <AnatomicalScheme
                  gender="male"
                  view="back"
                  markings={formData.anatomicalScheme?.markings?.filter(m => {
                    const desc = m.description.toLowerCase();
                    return desc.includes('мужчина') && desc.includes('задний');
                  }) || []}
                  onMarkingAdd={(marking) => {
                    const newMarking = { ...marking, description: `мужчина задний: ${marking.description}` };
                    const markings = [...(formData.anatomicalScheme?.markings || []), newMarking];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, back: 'male-back', markings });
                  }}
                  onMarkingRemove={(id) => {
                    const markings = formData.anatomicalScheme?.markings?.filter(m => m.id !== id) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  onMarkingUpdate={(id, updates) => {
                    const markings = formData.anatomicalScheme?.markings?.map(m => 
                      m.id === id ? { ...m, ...updates } : m
                    ) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  editMode={editMode}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-4">Схема женщина</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Передний вид</p>
                <AnatomicalScheme
                  gender="female"
                  view="front"
                  markings={formData.anatomicalScheme?.markings?.filter(m => {
                    const desc = m.description.toLowerCase();
                    return desc.includes('женщина') && desc.includes('передний') || 
                           (desc.includes('женщина') && !desc.includes('задний') && !desc.includes('мужчина'));
                  }) || []}
                  onMarkingAdd={(marking) => {
                    const newMarking = { ...marking, description: `женщина передний: ${marking.description}` };
                    const markings = [...(formData.anatomicalScheme?.markings || []), newMarking];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, front: 'female-front', markings });
                  }}
                  onMarkingRemove={(id) => {
                    const markings = formData.anatomicalScheme?.markings?.filter(m => m.id !== id) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  onMarkingUpdate={(id, updates) => {
                    const markings = formData.anatomicalScheme?.markings?.map(m => 
                      m.id === id ? { ...m, ...updates } : m
                    ) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  editMode={editMode}
                />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Задний вид</p>
                <AnatomicalScheme
                  gender="female"
                  view="back"
                  markings={formData.anatomicalScheme?.markings?.filter(m => {
                    const desc = m.description.toLowerCase();
                    return desc.includes('женщина') && desc.includes('задний');
                  }) || []}
                  onMarkingAdd={(marking) => {
                    const newMarking = { ...marking, description: `женщина задний: ${marking.description}` };
                    const markings = [...(formData.anatomicalScheme?.markings || []), newMarking];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, back: 'female-back', markings });
                  }}
                  onMarkingRemove={(id) => {
                    const markings = formData.anatomicalScheme?.markings?.filter(m => m.id !== id) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  onMarkingUpdate={(id, updates) => {
                    const markings = formData.anatomicalScheme?.markings?.map(m => 
                      m.id === id ? { ...m, ...updates } : m
                    ) || [];
                    handleChange('anatomicalScheme', { ...formData.anatomicalScheme, markings });
                  }}
                  editMode={editMode}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Психологическое состояние */}
      <CollapsibleSection title="Психологическое состояние" defaultExpanded={false}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Сознание
            </label>
            {editMode ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.psychologicalState?.consciousness?.clear || false}
                    onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', { ...formData.psychologicalState?.consciousness, clear: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Ясное</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.psychologicalState?.consciousness?.impaired || false}
                    onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', { ...formData.psychologicalState?.consciousness, impaired: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Нарушенное</span>
                </label>
                <div className="ml-6 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.psychologicalState?.consciousness?.disoriented?.time || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', {
                        ...formData.psychologicalState?.consciousness,
                        disoriented: { ...formData.psychologicalState?.consciousness?.disoriented, time: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                    <span>Дезориентация во времени</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.psychologicalState?.consciousness?.disoriented?.place || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', {
                        ...formData.psychologicalState?.consciousness,
                        disoriented: { ...formData.psychologicalState?.consciousness?.disoriented, place: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                    <span>Дезориентация в месте</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.psychologicalState?.consciousness?.disoriented?.personality || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', {
                        ...formData.psychologicalState?.consciousness,
                        disoriented: { ...formData.psychologicalState?.consciousness?.disoriented, personality: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                    <span>Дезориентация в личности</span>
                  </label>
                </div>
                <textarea
                  value={formData.psychologicalState?.consciousness?.additionalInfo || ''}
                  onChange={(e) => handleNestedChange('psychologicalState', 'consciousness', { ...formData.psychologicalState?.consciousness, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  rows={2}
                  placeholder="Дополнительная информация"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.consciousness?.clear && <p className="px-3 py-2 bg-slate-50 rounded-lg">Ясное</p>}
                {formData.psychologicalState?.consciousness?.impaired && <p className="px-3 py-2 bg-slate-50 rounded-lg">Нарушенное</p>}
                {formData.psychologicalState?.consciousness?.disoriented && (
                  <div className="ml-4 space-y-1">
                    {formData.psychologicalState.consciousness.disoriented.time && <p className="px-3 py-2 bg-slate-50 rounded-lg">Дезориентация во времени</p>}
                    {formData.psychologicalState.consciousness.disoriented.place && <p className="px-3 py-2 bg-slate-50 rounded-lg">Дезориентация в месте</p>}
                    {formData.psychologicalState.consciousness.disoriented.personality && <p className="px-3 py-2 bg-slate-50 rounded-lg">Дезориентация в личности</p>}
                  </div>
                )}
                {formData.psychologicalState?.consciousness?.additionalInfo && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState.consciousness.additionalInfo}</p>
                )}
                {!formData.psychologicalState?.consciousness && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Поведение
            </label>
            {editMode ? (
              <div className="space-y-2">
                {['adequate', 'passive', 'stupor', 'agitated', 'fearful', 'tearful'].map((behavior) => (
                  <label key={behavior} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.psychologicalState?.behavior as any)?.[behavior] || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'behavior', {
                        ...formData.psychologicalState?.behavior,
                        [behavior]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span>
                      {behavior === 'adequate' ? 'Адекватное' :
                       behavior === 'passive' ? 'Пассивное' :
                       behavior === 'stupor' ? 'Ступор' :
                       behavior === 'agitated' ? 'Возбужденное' :
                       behavior === 'fearful' ? 'Испуганное' :
                       'Плаксивое'}
                    </span>
                  </label>
                ))}
                <textarea
                  value={formData.psychologicalState?.behavior?.additionalInfo || ''}
                  onChange={(e) => handleNestedChange('psychologicalState', 'behavior', { ...formData.psychologicalState?.behavior, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  rows={2}
                  placeholder="Дополнительная информация"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.behavior && Object.entries(formData.psychologicalState.behavior).filter(([k, v]) => k !== 'additionalInfo' && v).map(([key, _]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg">
                    {key === 'adequate' ? 'Адекватное' :
                     key === 'passive' ? 'Пассивное' :
                     key === 'stupor' ? 'Ступор' :
                     key === 'agitated' ? 'Возбужденное' :
                     key === 'fearful' ? 'Испуганное' :
                     key === 'tearful' ? 'Плаксивое' : key}
                  </p>
                ))}
                {formData.psychologicalState?.behavior?.additionalInfo && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState.behavior.additionalInfo}</p>
                )}
                {!formData.psychologicalState?.behavior && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Настроение
            </label>
            {editMode ? (
              <div className="space-y-2">
                {['even', 'lowered', 'irritable', 'elevated', 'fearAnxiety'].map((mood) => (
                  <label key={mood} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.psychologicalState?.mood as any)?.[mood] || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'mood', {
                        ...formData.psychologicalState?.mood,
                        [mood]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span>
                      {mood === 'even' ? 'Ровное' :
                       mood === 'lowered' ? 'Сниженное' :
                       mood === 'irritable' ? 'Раздражительное' :
                       mood === 'elevated' ? 'Повышенное' :
                       'Страх, тревога'}
                    </span>
                  </label>
                ))}
                <textarea
                  value={formData.psychologicalState?.mood?.additionalInfo || ''}
                  onChange={(e) => handleNestedChange('psychologicalState', 'mood', { ...formData.psychologicalState?.mood, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  rows={2}
                  placeholder="Дополнительная информация"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.mood && Object.entries(formData.psychologicalState.mood).filter(([k, v]) => k !== 'additionalInfo' && v).map(([key, _]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg">
                    {key === 'even' ? 'Ровное' :
                     key === 'lowered' ? 'Сниженное' :
                     key === 'irritable' ? 'Раздражительное' :
                     key === 'elevated' ? 'Повышенное' :
                     key === 'fearAnxiety' ? 'Страх, тревога' : key}
                  </p>
                ))}
                {formData.psychologicalState?.mood?.additionalInfo && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState.mood.additionalInfo}</p>
                )}
                {!formData.psychologicalState?.mood && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Мышление
            </label>
            {editMode ? (
              <div className="space-y-2">
                {['normal', 'slowed', 'accelerated', 'circumstantial', 'incoherent', 'delusional', 'suicidalThoughts'].map((thinking) => (
                  <label key={thinking} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.psychologicalState?.thinking as any)?.[thinking] || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'thinking', {
                        ...formData.psychologicalState?.thinking,
                        [thinking]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span>
                      {thinking === 'normal' ? 'Нормальное' :
                       thinking === 'slowed' ? 'Замедленное' :
                       thinking === 'accelerated' ? 'Ускоренное' :
                       thinking === 'circumstantial' ? 'Обстоятельное' :
                       thinking === 'incoherent' ? 'Разорванное' :
                       thinking === 'delusional' ? 'Бредовое' :
                       'Суицидальные мысли'}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.thinking && Object.entries(formData.psychologicalState.thinking).filter(([_, v]) => v).map(([key, _]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg">
                    {key === 'normal' ? 'Нормальное' :
                     key === 'slowed' ? 'Замедленное' :
                     key === 'accelerated' ? 'Ускоренное' :
                     key === 'circumstantial' ? 'Обстоятельное' :
                     key === 'incoherent' ? 'Разорванное' :
                     key === 'delusional' ? 'Бредовое' :
                     key === 'suicidalThoughts' ? 'Суицидальные мысли' : key}
                  </p>
                ))}
                {!formData.psychologicalState?.thinking && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Память
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.psychologicalState?.memory?.impaired || false}
                    onChange={(e) => handleNestedChange('psychologicalState', 'memory', { impaired: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Нарушена</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState?.memory?.impaired ? 'Нарушена' : '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Внимание
              </label>
              {editMode ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.psychologicalState?.attention?.impaired || false}
                    onChange={(e) => handleNestedChange('psychologicalState', 'attention', { impaired: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Нарушено</span>
                </label>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState?.attention?.impaired ? 'Нарушено' : '—'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Соматовегетативные симптомы
            </label>
            {editMode ? (
              <div className="space-y-2">
                {['rapidHeartbeat', 'sweating', 'tremor', 'muscleTension', 'suffocation', 'chestDiscomfort', 'dizziness', 'weakness', 'numbness'].map((symptom) => (
                  <label key={symptom} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.psychologicalState?.somatovegetative as any)?.[symptom] || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'somatovegetative', {
                        ...formData.psychologicalState?.somatovegetative,
                        [symptom]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span>
                      {symptom === 'rapidHeartbeat' ? 'Учащенное сердцебиение' :
                       symptom === 'sweating' ? 'Потливость' :
                       symptom === 'tremor' ? 'Тремор' :
                       symptom === 'muscleTension' ? 'Мышечное напряжение' :
                       symptom === 'suffocation' ? 'Удушье' :
                       symptom === 'chestDiscomfort' ? 'Дискомфорт в груди' :
                       symptom === 'dizziness' ? 'Головокружение' :
                       symptom === 'weakness' ? 'Слабость' :
                       'Онемение'}
                    </span>
                  </label>
                ))}
                <textarea
                  value={formData.psychologicalState?.somatovegetative?.additionalInfo || ''}
                  onChange={(e) => handleNestedChange('psychologicalState', 'somatovegetative', { ...formData.psychologicalState?.somatovegetative, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  rows={2}
                  placeholder="Дополнительная информация"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.somatovegetative && Object.entries(formData.psychologicalState.somatovegetative).filter(([k, v]) => k !== 'additionalInfo' && v).map(([key, _]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg">
                    {key === 'rapidHeartbeat' ? 'Учащенное сердцебиение' :
                     key === 'sweating' ? 'Потливость' :
                     key === 'tremor' ? 'Тремор' :
                     key === 'muscleTension' ? 'Мышечное напряжение' :
                     key === 'suffocation' ? 'Удушье' :
                     key === 'chestDiscomfort' ? 'Дискомфорт в груди' :
                     key === 'dizziness' ? 'Головокружение' :
                     key === 'weakness' ? 'Слабость' :
                     key === 'numbness' ? 'Онемение' : key}
                  </p>
                ))}
                {formData.psychologicalState?.somatovegetative?.additionalInfo && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState.somatovegetative.additionalInfo}</p>
                )}
                {!formData.psychologicalState?.somatovegetative && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Другие симптомы
            </label>
            {editMode ? (
              <div className="space-y-2">
                {['sleepDisorders', 'appetiteDisorders', 'psychologicalTrauma', 'lossOfInterests', 'secrecy', 'alcoholUse', 'despair', 'hallucinations'].map((symptom) => (
                  <label key={symptom} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.psychologicalState?.otherSymptoms as any)?.[symptom] || false}
                      onChange={(e) => handleNestedChange('psychologicalState', 'otherSymptoms', {
                        ...formData.psychologicalState?.otherSymptoms,
                        [symptom]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span>
                      {symptom === 'sleepDisorders' ? 'Нарушения сна' :
                       symptom === 'appetiteDisorders' ? 'Нарушения аппетита' :
                       symptom === 'psychologicalTrauma' ? 'Психологическая травма' :
                       symptom === 'lossOfInterests' ? 'Потеря интересов' :
                       symptom === 'secrecy' ? 'Скрытность' :
                       symptom === 'alcoholUse' ? 'Употребление алкоголя' :
                       symptom === 'despair' ? 'Отчаяние' :
                       'Галлюцинации'}
                    </span>
                  </label>
                ))}
                <textarea
                  value={formData.psychologicalState?.otherSymptoms?.additionalInfo || ''}
                  onChange={(e) => handleNestedChange('psychologicalState', 'otherSymptoms', { ...formData.psychologicalState?.otherSymptoms, additionalInfo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-2"
                  rows={2}
                  placeholder="Дополнительная информация"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {formData.psychologicalState?.otherSymptoms && Object.entries(formData.psychologicalState.otherSymptoms).filter(([k, v]) => k !== 'additionalInfo' && v).map(([key, _]) => (
                  <p key={key} className="px-3 py-2 bg-slate-50 rounded-lg">
                    {key === 'sleepDisorders' ? 'Нарушения сна' :
                     key === 'appetiteDisorders' ? 'Нарушения аппетита' :
                     key === 'psychologicalTrauma' ? 'Психологическая травма' :
                     key === 'lossOfInterests' ? 'Потеря интересов' :
                     key === 'secrecy' ? 'Скрытность' :
                     key === 'alcoholUse' ? 'Употребление алкоголя' :
                     key === 'despair' ? 'Отчаяние' :
                     key === 'hallucinations' ? 'Галлюцинации' : key}
                  </p>
                ))}
                {formData.psychologicalState?.otherSymptoms?.additionalInfo && (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.psychologicalState.otherSymptoms.additionalInfo}</p>
                )}
                {!formData.psychologicalState?.otherSymptoms && <p className="px-3 py-2 bg-slate-50 rounded-lg">—</p>}
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052AbuseExamination;
