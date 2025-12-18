import React from 'react';
import { PassportData, MinimalMedicalData } from '../../types/form052';
import CollapsibleSection from './CollapsibleSection';

interface Form052GeneralPartProps {
  data?: PassportData;
  minimalData?: MinimalMedicalData;
  onChange: (passport: PassportData, minimal: MinimalMedicalData) => void;
  editMode: boolean;
}

const Form052GeneralPart: React.FC<Form052GeneralPartProps> = ({
  data = {},
  minimalData = {},
  onChange,
  editMode
}) => {
  const handlePassportChange = (field: keyof PassportData, value: any) => {
    onChange({ ...data, [field]: value }, minimalData);
  };

  const handleMinimalChange = (field: keyof MinimalMedicalData, value: any) => {
    onChange(data, { ...minimalData, [field]: value });
  };

  const handleAllergicReactionChange = (index: number, field: 'code' | 'name', value: string) => {
    const reactions = [...(minimalData.allergicReactions || [])];
    if (!reactions[index]) {
      reactions[index] = {};
    }
    reactions[index][field] = value;
    handleMinimalChange('allergicReactions', reactions);
  };

  const addAllergicReaction = () => {
    const reactions = [...(minimalData.allergicReactions || []), {}];
    handleMinimalChange('allergicReactions', reactions);
  };

  const removeAllergicReaction = (index: number) => {
    const reactions = minimalData.allergicReactions?.filter((_, i) => i !== index) || [];
    handleMinimalChange('allergicReactions', reactions);
  };

  return (
    <div className="space-y-4">
      {/* Общая информация */}
      <CollapsibleSection title="Общая информация" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. ИИН
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.iin || ''}
                onChange={(e) => handlePassportChange('iin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ИИН"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.iin || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. ФИО (при его наличии)
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.fullName || ''}
                onChange={(e) => handlePassportChange('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ФИО"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.fullName || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Дата рождения (дата месяц год)
            </label>
            {editMode ? (
              <input
                type="date"
                value={data.dateOfBirth || ''}
                onChange={(e) => handlePassportChange('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              4. Пол
            </label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={data.gender === 'male'}
                    onChange={(e) => handlePassportChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Мужской</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={data.gender === 'female'}
                    onChange={(e) => handlePassportChange('gender', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Женский</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.gender === 'male' ? 'Мужской' : data.gender === 'female' ? 'Женский' : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5. Возраст
            </label>
            {editMode ? (
              <input
                type="number"
                value={data.age || ''}
                onChange={(e) => handlePassportChange('age', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите возраст"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.age ? `${data.age} лет` : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              6. Национальность
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.nationality || ''}
                onChange={(e) => handlePassportChange('nationality', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите национальность"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.nationality || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              7. Житель
            </label>
            {editMode ? (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resident"
                    value="city"
                    checked={data.resident === 'city'}
                    onChange={(e) => handlePassportChange('resident', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Города</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resident"
                    value="village"
                    checked={data.resident === 'village'}
                    onChange={(e) => handlePassportChange('resident', e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Села</span>
                </label>
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.resident === 'city' ? 'Города' : data.resident === 'village' ? 'Села' : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              8. Гражданство
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.citizenship || ''}
                onChange={(e) => handlePassportChange('citizenship', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите гражданство"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.citizenship || '—'}
              </p>
            )}
          </div>

        </div>
      </CollapsibleSection>

      {/* Контактные данные */}
      <CollapsibleSection title="Контактные данные" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              9. Адрес проживания
            </label>
            {editMode ? (
              <textarea
                value={data.address || ''}
                onChange={(e) => handlePassportChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Введите адрес проживания"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.address || '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              10. Место работы/учебы/детского учреждения
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.workplace || ''}
                onChange={(e) => handlePassportChange('workplace', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите место работы/учебы"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.workplace || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Должность
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.position || ''}
                onChange={(e) => handlePassportChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите должность"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.position || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Образование
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.education || ''}
                onChange={(e) => handlePassportChange('education', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите образование"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.education || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Страхование */}
      <CollapsibleSection title="Страхование" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              11. Наименование страховой компании
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.insuranceCompany || ''}
                onChange={(e) => handlePassportChange('insuranceCompany', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите название страховой компании"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.insuranceCompany || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              № страхового полиса
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.insurancePolicyNumber || ''}
                onChange={(e) => handlePassportChange('insurancePolicyNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите номер полиса"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.insurancePolicyNumber || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              12. Тип возмещения
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.reimbursementType || ''}
                onChange={(e) => handlePassportChange('reimbursementType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите тип возмещения"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.reimbursementType || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              13. Социальный статус
            </label>
            {editMode ? (
              <input
                type="text"
                value={data.socialStatus || ''}
                onChange={(e) => handlePassportChange('socialStatus', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите социальный статус"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {data.socialStatus || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Повод обращения */}
      <CollapsibleSection title="Повод обращения" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            14. Повод обращения
          </label>
          {editMode ? (
            <textarea
              value={data.reasonForVisit || ''}
              onChange={(e) => handlePassportChange('reasonForVisit', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Введите повод обращения"
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
              {data.reasonForVisit || '—'}
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Группа крови и резус-фактор */}
      <CollapsibleSection title="Группа крови и резус-фактор" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Группа крови
            </label>
            {editMode ? (
              <input
                type="text"
                value={minimalData.bloodGroup || ''}
                onChange={(e) => handleMinimalChange('bloodGroup', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: I, II, III, IV"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.bloodGroup || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Резус-фактор
            </label>
            {editMode ? (
              <select
                value={minimalData.rhFactor || ''}
                onChange={(e) => handleMinimalChange('rhFactor', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Выберите</option>
                <option value="positive">Положительный (+)</option>
                <option value="negative">Отрицательный (-)</option>
              </select>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.rhFactor === 'positive' ? 'Положительный (+)' : 
                 minimalData.rhFactor === 'negative' ? 'Отрицательный (-)' : '—'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. Аллергические реакции (код наименование)
            </label>
            {editMode ? (
              <div className="space-y-3">
                {(minimalData.allergicReactions || []).map((reaction, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <input
                      type="text"
                      value={reaction.code || ''}
                      onChange={(e) => handleAllergicReactionChange(index, 'code', e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Код"
                    />
                    <input
                      type="text"
                      value={reaction.name || ''}
                      onChange={(e) => handleAllergicReactionChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Наименование"
                    />
                    <button
                      onClick={() => removeAllergicReaction(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAllergicReaction}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300 transition-colors"
                >
                  + Добавить аллергическую реакцию
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {(minimalData.allergicReactions || []).length > 0 ? (
                  minimalData.allergicReactions!.map((reaction, index) => (
                    <p key={index} className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                      {reaction.code || ''} {reaction.name || ''}
                    </p>
                  ))
                ) : (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">—</p>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Физиологическое состояние пациента (беременность)
            </label>
            {editMode ? (
              <textarea
                value={minimalData.physiologicalState || ''}
                onChange={(e) => handleMinimalChange('physiologicalState', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Опишите физиологическое состояние"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.physiologicalState || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Скрининг новорожденных */}
      <CollapsibleSection title="Скрининг новорожденных" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            4. Дата проведения и результат скрининга на наследственную патологию новорожденных
          </label>
            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Дата</label>
                  <input
                    type="date"
                    value={minimalData.newbornScreening?.date || ''}
                    onChange={(e) => handleMinimalChange('newbornScreening', {
                      ...minimalData.newbornScreening,
                      date: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Фенилкетонурия</label>
                  <input
                    type="text"
                    value={minimalData.newbornScreening?.phenylketonuria || ''}
                    onChange={(e) => handleMinimalChange('newbornScreening', {
                      ...minimalData.newbornScreening,
                      phenylketonuria: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Врожденный гипотиреоз</label>
                  <input
                    type="text"
                    value={minimalData.newbornScreening?.congenitalHypothyroidism || ''}
                    onChange={(e) => handleMinimalChange('newbornScreening', {
                      ...minimalData.newbornScreening,
                      congenitalHypothyroidism: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Аудиологический скрининг</label>
                  <input
                    type="text"
                    value={minimalData.newbornScreening?.audiologicalScreening || ''}
                    onChange={(e) => handleMinimalChange('newbornScreening', {
                      ...minimalData.newbornScreening,
                      audiologicalScreening: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.newbornScreening?.date ? (
                  <div>
                    <p>Дата: {new Date(minimalData.newbornScreening.date).toLocaleDateString('ru-RU')}</p>
                    {minimalData.newbornScreening.phenylketonuria && (
                      <p>Фенилкетонурия: {minimalData.newbornScreening.phenylketonuria}</p>
                    )}
                    {minimalData.newbornScreening.congenitalHypothyroidism && (
                      <p>Врожденный гипотиреоз: {minimalData.newbornScreening.congenitalHypothyroidism}</p>
                    )}
                    {minimalData.newbornScreening.audiologicalScreening && (
                      <p>Аудиологический скрининг: {minimalData.newbornScreening.audiologicalScreening}</p>
                    )}
                  </div>
                ) : '—'}
              </div>
            )}
        </div>
      </CollapsibleSection>

      {/* Вредные привычки */}
      <CollapsibleSection title="Вредные привычки и риски для здоровья" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            5. Вредные привычки и риски для здоровья (при наличии)
          </label>
            {editMode ? (
              <textarea
                value={minimalData.harmfulHabits || ''}
                onChange={(e) => handleMinimalChange('harmfulHabits', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите вредные привычки и риски"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.harmfulHabits || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Профилактические мероприятия */}
      <CollapsibleSection title="Профилактические мероприятия" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            6. Профилактические мероприятия, в том числе профилактические прививки
          </label>
            {editMode ? (
              <textarea
                value={minimalData.preventiveMeasures || ''}
                onChange={(e) => handleMinimalChange('preventiveMeasures', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите профилактические мероприятия"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.preventiveMeasures || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* История болезней */}
      <CollapsibleSection title="История болезней и нарушений" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            7. История болезней и нарушений
          </label>
            {editMode ? (
              <textarea
                value={minimalData.diseaseHistory || ''}
                onChange={(e) => handleMinimalChange('diseaseHistory', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите историю болезней"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.diseaseHistory || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Текущие проблемы со здоровьем */}
      <CollapsibleSection title="Текущие проблемы со здоровьем" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            8. Список текущих проблем со здоровьем
          </label>
            {editMode ? (
              <textarea
                value={minimalData.currentHealthProblems || ''}
                onChange={(e) => handleMinimalChange('currentHealthProblems', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите текущие проблемы со здоровьем"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.currentHealthProblems || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Динамическое наблюдение */}
      <CollapsibleSection title="Динамическое наблюдение" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            9. Динамическое наблюдение
          </label>
            {editMode ? (
              <textarea
                value={minimalData.dynamicObservation || ''}
                onChange={(e) => handleMinimalChange('dynamicObservation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите динамическое наблюдение"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.dynamicObservation || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Группа инвалидности */}
      <CollapsibleSection title="Группа инвалидности" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              10. Группа инвалидности
            </label>
            {editMode ? (
              <input
                type="text"
                value={minimalData.disabilityGroup || ''}
                onChange={(e) => handleMinimalChange('disabilityGroup', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Например: I, II, III"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.disabilityGroup || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Лекарственные средства */}
      <CollapsibleSection title="Лекарственные средства" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            11. Список принимаемых в настоящее время лекарственных средств
          </label>
            {editMode ? (
              <textarea
                value={minimalData.currentMedications || ''}
                onChange={(e) => handleMinimalChange('currentMedications', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Перечислите принимаемые лекарственные средства"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900 whitespace-pre-wrap">
                {minimalData.currentMedications || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Антропометрические данные */}
      <CollapsibleSection title="Антропометрические данные" defaultExpanded={false}>
        <div>
          <h4 className="text-md font-semibold text-slate-800 mb-3">
            12. Антропометрические данные
          </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Рост (см)</label>
                {editMode ? (
                  <input
                    type="number"
                    value={minimalData.anthropometricData?.height || ''}
                    onChange={(e) => handleMinimalChange('anthropometricData', {
                      ...minimalData.anthropometricData,
                      height: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    {minimalData.anthropometricData?.height ? `${minimalData.anthropometricData.height} см` : '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Вес (кг)</label>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={minimalData.anthropometricData?.weight || ''}
                    onChange={(e) => handleMinimalChange('anthropometricData', {
                      ...minimalData.anthropometricData,
                      weight: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    {minimalData.anthropometricData?.weight ? `${minimalData.anthropometricData.weight} кг` : '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">ИМТ</label>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={minimalData.anthropometricData?.bmi || ''}
                    onChange={(e) => handleMinimalChange('anthropometricData', {
                      ...minimalData.anthropometricData,
                      bmi: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    {minimalData.anthropometricData?.bmi || '—'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Окружность головы (см)</label>
                {editMode ? (
                  <input
                    type="number"
                    step="0.1"
                    value={minimalData.anthropometricData?.headCircumference || ''}
                    onChange={(e) => handleMinimalChange('anthropometricData', {
                      ...minimalData.anthropometricData,
                      headCircumference: parseFloat(e.target.value) || undefined
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                    {minimalData.anthropometricData?.headCircumference ? `${minimalData.anthropometricData.headCircumference} см` : '—'}
                  </p>
                )}
              </div>
            </div>
        </div>
      </CollapsibleSection>

      {/* Оценка риска падения */}
      <CollapsibleSection title="Оценка риска падения" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            13. Оценка риска падения
          </label>
            {editMode ? (
              <textarea
                value={minimalData.fallRiskAssessment || ''}
                onChange={(e) => handleMinimalChange('fallRiskAssessment', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Опишите оценку риска падения"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.fallRiskAssessment || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Оценка боли */}
      <CollapsibleSection title="Оценка боли" defaultExpanded={false}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            14. Оценка боли
          </label>
            {editMode ? (
              <textarea
                value={minimalData.painAssessment || ''}
                onChange={(e) => handleMinimalChange('painAssessment', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Опишите оценку боли"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {minimalData.painAssessment || '—'}
              </p>
            )}
        </div>
      </CollapsibleSection>

      {/* Список сокращений */}
      <CollapsibleSection title="Список сокращений формы № 052/у" defaultExpanded={false}>
        
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">АКДС:</span>
                <span className="text-slate-700">адсорбированная, коклюшно-дифтерийно-столбнячная вакцина</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">АДС:</span>
                <span className="text-slate-700">адсорбированный дифтерийно-столбнячный анатоксин</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">АДС-М:</span>
                <span className="text-slate-700">анатоксин – адсорбированный дифтерийно-столбнячный анатоксин с уменьшенным содержанием антигенов</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">АД:</span>
                <span className="text-slate-700">адсорбированный дифтерийный анатоксин</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">АС:</span>
                <span className="text-slate-700">адсорбированный столбнячный анатоксин</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">БЦЖ:</span>
                <span className="text-slate-700">Вакцина против туберкулеза</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">К:</span>
                <span className="text-slate-700">коклюшная вакцина</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">ИИН:</span>
                <span className="text-slate-700">Индивидуальный идентификационный номер</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">МИС:</span>
                <span className="text-slate-700">Медицинская информационная система</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">МО:</span>
                <span className="text-slate-700">Медицинская организация</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">ПМСП:</span>
                <span className="text-slate-700">Первичная медико-санитарная помощь</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">ФИО:</span>
                <span className="text-slate-700">Фамилия, имя, отчество (при его наличии)</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">НПО:</span>
                <span className="text-slate-700">Неправительственные организации</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">ИМТ:</span>
                <span className="text-slate-700">Индекс массы тела</span>
              </div>
              <div className="flex gap-4">
                <span className="font-semibold text-slate-900 w-16">ССС:</span>
                <span className="text-slate-700">Сердечно-сосудистая система</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052GeneralPart;

