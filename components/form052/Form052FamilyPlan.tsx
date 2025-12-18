import React, { useState } from 'react';
import { FamilyWorkPlan } from '../../types/form052';
import { PlusIcon, TrashIcon } from '../Icons';
import CollapsibleSection from './CollapsibleSection';

interface Form052FamilyPlanProps {
  data?: FamilyWorkPlan;
  onChange: (data: FamilyWorkPlan) => void;
  editMode: boolean;
}

const Form052FamilyPlan: React.FC<Form052FamilyPlanProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<FamilyWorkPlan>(data);

  const handleChange = (field: keyof FamilyWorkPlan, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleChildChange = (index: number, field: string, value: any) => {
    const children = [...(formData.children || [])];
    if (!children[index]) {
      children[index] = {};
    }
    children[index] = { ...children[index], [field]: value };
    handleChange('children', children);
  };

  const addChild = () => {
    const children = [...(formData.children || []), {}];
    handleChange('children', children);
  };

  const removeChild = (index: number) => {
    const children = formData.children?.filter((_, i) => i !== index) || [];
    handleChange('children', children);
  };

  const handleFamilyMemberChange = (index: number, field: string, value: any) => {
    const members = [...(formData.familyMembers || [])];
    if (!members[index]) {
      members[index] = {};
    }
    members[index] = { ...members[index], [field]: value };
    handleChange('familyMembers', members);
  };

  const addFamilyMember = () => {
    const members = [...(formData.familyMembers || []), {}];
    handleChange('familyMembers', members);
  };

  const removeFamilyMember = (index: number) => {
    const members = formData.familyMembers?.filter((_, i) => i !== index) || [];
    handleChange('familyMembers', members);
  };

  const handleExternalRepChange = (index: number, field: string, value: any) => {
    const reps = [...(formData.externalRepresentatives || [])];
    if (!reps[index]) {
      reps[index] = {};
    }
    reps[index] = { ...reps[index], [field]: value };
    handleChange('externalRepresentatives', reps);
  };

  const addExternalRep = () => {
    const reps = [...(formData.externalRepresentatives || []), {}];
    handleChange('externalRepresentatives', reps);
  };

  const removeExternalRep = (index: number) => {
    const reps = formData.externalRepresentatives?.filter((_, i) => i !== index) || [];
    handleChange('externalRepresentatives', reps);
  };

  return (
    <div className="space-y-4">
      {/* Общая информация */}
      <CollapsibleSection title="Общая информация" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              15. Коммуникационный менеджмент (язык общения, жилищно-бытовые условия)
            </label>
            {editMode ? (
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите язык общения и жилищно-бытовые условия"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">—</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              16. Инструктаж пациента
            </label>
            {editMode ? (
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Опишите проведенный инструктаж"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">—</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Идентификатор, ФИО (при его наличии) врача
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.socialWorker?.fullName || ''}
                onChange={(e) => handleChange('socialWorker', { ...formData.socialWorker, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ФИО врача"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.socialWorker?.fullName || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Идентификатор, ФИО (при его наличии) среднего медицинского работника
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.midLevelWorker?.fullName || ''}
                onChange={(e) => handleChange('midLevelWorker', { ...formData.midLevelWorker, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ФИО среднего медицинского работника"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.midLevelWorker?.fullName || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Данные организации и плана */}
      <CollapsibleSection title="Данные организации и плана" defaultExpanded={false}>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Организация
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.organization || ''}
                onChange={(e) => handleChange('organization', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите название организации"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.organization || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              № Участка
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.siteNumber || ''}
                onChange={(e) => handleChange('siteNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите номер участка"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.siteNumber || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ФИО социального работника, работающего с семьей
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.socialWorker?.fullName || ''}
                onChange={(e) => handleChange('socialWorker', { ...formData.socialWorker, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ФИО социального работника"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.socialWorker?.fullName || '—'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дата начала реализации Плана
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.planStartDate || ''}
                onChange={(e) => handleChange('planStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.planStartDate ? new Date(formData.planStartDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дата завершения реализации Плана
            </label>
            {editMode ? (
              <input
                type="date"
                value={formData.planEndDate || ''}
                onChange={(e) => handleChange('planEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.planEndDate ? new Date(formData.planEndDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Адрес проживания семьи
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.familyAddress || ''}
                onChange={(e) => handleChange('familyAddress', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите адрес проживания семьи"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-900">
                {formData.familyAddress || '—'}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Личные данные ребенка (детей) */}
      <CollapsibleSection title="Личные данные ребенка (детей)" defaultExpanded={false}>
        <div className="space-y-4">
          {editMode && (
            <div className="flex justify-end mb-4">
              <button
                onClick={addChild}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Добавить ребенка
              </button>
            </div>
          )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Имя ребенка</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Фамилия ребенка</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Дата рождения (или ожидаемая дата рождения)</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Пол</th>
                {editMode && <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {(formData.children || []).length > 0 ? (
                formData.children!.map((child, index) => (
                  <tr key={index}>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={child.firstName || ''}
                          onChange={(e) => handleChildChange(index, 'firstName', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{child.firstName || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={child.lastName || ''}
                          onChange={(e) => handleChildChange(index, 'lastName', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{child.lastName || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="date"
                          value={child.dateOfBirth || ''}
                          onChange={(e) => handleChildChange(index, 'dateOfBirth', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('ru-RU') : '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`gender-${index}`}
                              value="male"
                              checked={child.gender === 'male'}
                              onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                              className="w-4 h-4"
                            />
                            <span>Мужской</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`gender-${index}`}
                              value="female"
                              checked={child.gender === 'female'}
                              onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                              className="w-4 h-4"
                            />
                            <span>Женский</span>
                          </label>
                        </div>
                      ) : (
                        <span>{child.gender === 'male' ? 'Мужской' : child.gender === 'female' ? 'Женский' : '—'}</span>
                      )}
                    </td>
                    {editMode && (
                      <td className="border border-slate-300 px-4 py-2">
                        <button
                          onClick={() => removeChild(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={editMode ? 5 : 4} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                    Нет данных о детях
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </CollapsibleSection>

      {/* Члены семьи */}
      <CollapsibleSection title="Члены семьи" defaultExpanded={false}>
        <div className="space-y-4">
          {editMode && (
            <div className="flex justify-end mb-4">
              <button
                onClick={addFamilyMember}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Добавить члена семьи
              </button>
            </div>
          )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">ФИО (при его наличии)</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Кем приходится ребенку</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Контактные данные</th>
                {editMode && <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {(formData.familyMembers || []).length > 0 ? (
                formData.familyMembers!.map((member, index) => (
                  <tr key={index}>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={member.fullName || ''}
                          onChange={(e) => handleFamilyMemberChange(index, 'fullName', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{member.fullName || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={member.relationship || ''}
                          onChange={(e) => handleFamilyMemberChange(index, 'relationship', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Например: мать, отец, опекун"
                        />
                      ) : (
                        <span>{member.relationship || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={member.contactDetails || ''}
                          onChange={(e) => handleFamilyMemberChange(index, 'contactDetails', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Телефон, email и т.д."
                        />
                      ) : (
                        <span>{member.contactDetails || '—'}</span>
                      )}
                    </td>
                    {editMode && (
                      <td className="border border-slate-300 px-4 py-2">
                        <button
                          onClick={() => removeFamilyMember(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={editMode ? 4 : 3} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                    Нет данных о членах семьи
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </CollapsibleSection>

      {/* Представители внешних организаций */}
      <CollapsibleSection title="Представители внешних организаций" defaultExpanded={false}>
        <div className="space-y-4">
          {editMode && (
            <div className="flex justify-end mb-4">
              <button
                onClick={addExternalRep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Добавить представителя
              </button>
            </div>
          )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">ФИО (при его наличии)</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Организация</th>
                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Контактные данные</th>
                {editMode && <th className="border border-slate-300 px-4 py-2 text-left text-sm font-medium">Действия</th>}
              </tr>
            </thead>
            <tbody>
              {(formData.externalRepresentatives || []).length > 0 ? (
                formData.externalRepresentatives!.map((rep, index) => (
                  <tr key={index}>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={rep.fullName || ''}
                          onChange={(e) => handleExternalRepChange(index, 'fullName', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{rep.fullName || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={rep.organization || ''}
                          onChange={(e) => handleExternalRepChange(index, 'organization', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{rep.organization || '—'}</span>
                      )}
                    </td>
                    <td className="border border-slate-300 px-4 py-2">
                      {editMode ? (
                        <input
                          type="text"
                          value={rep.contactDetails || ''}
                          onChange={(e) => handleExternalRepChange(index, 'contactDetails', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{rep.contactDetails || '—'}</span>
                      )}
                    </td>
                    {editMode && (
                      <td className="border border-slate-300 px-4 py-2">
                        <button
                          onClick={() => removeExternalRep(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={editMode ? 4 : 3} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                    Нет данных о представителях
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052FamilyPlan;
