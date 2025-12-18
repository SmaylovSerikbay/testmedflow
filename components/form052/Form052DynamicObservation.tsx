import React, { useState, useEffect } from 'react';
import { DynamicObservation } from '../../types/form052';
import { PlusIcon, TrashIcon } from '../Icons';
import CollapsibleSection from './CollapsibleSection';

interface Form052DynamicObservationProps {
  data?: DynamicObservation;
  onChange: (data: DynamicObservation) => void;
  editMode: boolean;
}

const Form052DynamicObservation: React.FC<Form052DynamicObservationProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<DynamicObservation>(data);
  
  // Синхронизируем локальное состояние с пропсами только если данные действительно изменились
  useEffect(() => {
    if (data && JSON.stringify(data) !== JSON.stringify(formData)) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (field: keyof DynamicObservation, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    console.log('📝 Form052DynamicObservation - handleChange:', { field, value, newData });
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof DynamicObservation, { ...sectionData, [field]: value });
  };

  const addService = () => {
    const services = [...(formData.observationPlan?.services || []), {}];
    handleNestedChange('observationPlan', 'services', services);
  };

  const updateService = (index: number, field: string, value: any) => {
    const services = [...(formData.observationPlan?.services || [])];
    services[index] = { ...services[index], [field]: value };
    handleNestedChange('observationPlan', 'services', services);
  };

  const removeService = (index: number) => {
    const services = formData.observationPlan?.services?.filter((_, i) => i !== index) || [];
    handleNestedChange('observationPlan', 'services', services);
  };

  const addAssistant = () => {
    const assistants = [...(formData.operationProtocol?.assistants || []), {}];
    handleNestedChange('operationProtocol', 'assistants', assistants);
  };

  const updateAssistant = (index: number, field: string, value: any) => {
    const assistants = [...(formData.operationProtocol?.assistants || [])];
    assistants[index] = { ...assistants[index], [field]: value };
    handleNestedChange('operationProtocol', 'assistants', assistants);
  };

  const removeAssistant = (index: number) => {
    const assistants = formData.operationProtocol?.assistants?.filter((_, i) => i !== index) || [];
    handleNestedChange('operationProtocol', 'assistants', assistants);
  };

  return (
    <div className="space-y-4">
      {/* Запись о леченном случае */}
      <CollapsibleSection title="Запись о леченном случае" defaultExpanded={false}>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Примечание:</strong> Внесение данных о леченном случае производится в день завершения амбулаторного лечения. 
            Внесенные данные после подтверждения не подлежат исправлению, за исключением результатов гистологических и патолого-анатомических исследований.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              4. Анамнез жизни
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.anamnesis || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'anamnesis', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.anamnesis || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5. Анамнез заболевания
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.diseaseAnamnesis || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'diseaseAnamnesis', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.diseaseAnamnesis || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              6. Объективные данные
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.objectiveData || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'objectiveData', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.objectiveData || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              7. Интерпретация результатов лабораторных анализов, дополнительных исследований
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.labResultsInterpretation || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'labResultsInterpretation', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.labResultsInterpretation || '—'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                8. Диагноз (код)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.treatedCase?.diagnosis?.code || ''}
                  onChange={(e) => handleNestedChange('treatedCase', 'diagnosis', { ...formData.treatedCase?.diagnosis, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Код диагноза"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.treatedCase?.diagnosis?.code || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Диагноз (наименование)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.treatedCase?.diagnosis?.name || ''}
                  onChange={(e) => handleNestedChange('treatedCase', 'diagnosis', { ...formData.treatedCase?.diagnosis, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Наименование диагноза"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.treatedCase?.diagnosis?.name || '—'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              9. Назначение необходимых услуг и лекарственных средств
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.prescribedServices || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'prescribedServices', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.prescribedServices || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              10. Идентификатор врача, ФИО (при его наличии)
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.treatedCase?.doctorFullName || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'doctorFullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Введите ФИО врача"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.treatedCase?.doctorFullName || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              11. Записи консилиумов (содержат согласованную позицию по диагнозу, рекомендации обследованию и лечению)
            </label>
            {editMode ? (
              <textarea
                value={formData.treatedCase?.consultations || ''}
                onChange={(e) => handleNestedChange('treatedCase', 'consultations', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.treatedCase?.consultations || '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Протокол операции/процедуры/афереза */}
      <CollapsibleSection title="Протокол операции/процедуры/афереза" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Дата и время
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.operationProtocol?.date || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'date', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={formData.operationProtocol?.time || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'time', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.operationProtocol?.date && formData.operationProtocol?.time
                  ? `${new Date(formData.operationProtocol.date).toLocaleDateString('ru-RU')} ${formData.operationProtocol.time}`
                  : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. Показания к операции/процедуре/аферезу
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.indications || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'indications', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.indications || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Клинический Диагноз
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.clinicalDiagnosis || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'clinicalDiagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.clinicalDiagnosis || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              4. Анестезиологическое пособие
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.anestheticManagement || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'anestheticManagement', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.anestheticManagement || '—'}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-slate-800">5. Протокол операции включая, как минимум:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                5.1 Дата и время начала операции/процедуры/афереза
              </label>
              {editMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.operationProtocol?.startDate || ''}
                    onChange={(e) => handleNestedChange('operationProtocol', 'startDate', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={formData.operationProtocol?.startTime || ''}
                    onChange={(e) => handleNestedChange('operationProtocol', 'startTime', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">
                  {formData.operationProtocol?.startDate && formData.operationProtocol?.startTime
                    ? `${new Date(formData.operationProtocol.startDate).toLocaleDateString('ru-RU')} ${formData.operationProtocol.startTime}`
                    : '—'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                5.1 Дата и время окончания операции/процедуры/афереза
              </label>
              {editMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.operationProtocol?.endDate || ''}
                    onChange={(e) => handleNestedChange('operationProtocol', 'endDate', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={formData.operationProtocol?.endTime || ''}
                    onChange={(e) => handleNestedChange('operationProtocol', 'endTime', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">
                  {formData.operationProtocol?.endDate && formData.operationProtocol?.endTime
                    ? `${new Date(formData.operationProtocol.endDate).toLocaleDateString('ru-RU')} ${formData.operationProtocol.endTime}`
                    : '—'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.2 Течение (описание) операции/процедуры/афереза, включая технику выполнения
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.course || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'course', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={5}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.course || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.3 Участие консультантов во время операции/процедуры/афереза, рекомендации
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.consultants || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'consultants', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.consultants || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.4 Проведение дополнительных методов исследования и лабораторных исследований
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.additionalResearch || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'additionalResearch', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.additionalResearch || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.5 Исход операции, осложнения во время операции (если не было, необходимо указать "осложнений во время операции/процедуры/афереза не было")
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.outcome || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'outcome', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Если осложнений не было, укажите: 'осложнений во время операции/процедуры/афереза не было'"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.outcome || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.6 Количество кровопотери (мл)
            </label>
            {editMode ? (
              <input
                type="number"
                value={formData.operationProtocol?.bloodLoss || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'bloodLoss', parseInt(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Введите количество кровопотери в мл"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.bloodLoss ? `${formData.operationProtocol.bloodLoss} мл` : '—'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                5.7 Код операции/процедуры/афереза
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.operationProtocol?.operationCode || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'operationCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.operationCode || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Наименование операции/процедуры/афереза
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.operationProtocol?.operationName || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'operationName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.operationName || '—'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.8 Диагноз после операции/процедуры/афереза
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.postOpDiagnosis || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'postOpDiagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.postOpDiagnosis || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5.9 Рекомендации
            </label>
            {editMode ? (
              <textarea
                value={formData.operationProtocol?.recommendations || ''}
                onChange={(e) => handleNestedChange('operationProtocol', 'recommendations', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.operationProtocol?.recommendations || '—'}</p>
            )}
          </div>
        </div>

        {/* Медицинский персонал */}
        <div className="space-y-4 mt-6">
          <h4 className="font-semibold text-slate-800">5.10 Идентификатор и ФИО медицинского персонала</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Оперирующий врач (ID, ФИО)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.operationProtocol?.operatingSurgeon?.fullName || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'operatingSurgeon', { ...formData.operationProtocol?.operatingSurgeon, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите ФИО оперирующего врача"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.operatingSurgeon?.fullName || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Анестезиолог (ID, ФИО)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.operationProtocol?.anesthesiologist?.fullName || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'anesthesiologist', { ...formData.operationProtocol?.anesthesiologist, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите ФИО анестезиолога"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.anesthesiologist?.fullName || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Средний медицинский работник (ID, ФИО)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.operationProtocol?.midLevelWorker?.fullName || ''}
                  onChange={(e) => handleNestedChange('operationProtocol', 'midLevelWorker', { ...formData.operationProtocol?.midLevelWorker, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите ФИО СМР"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.operationProtocol?.midLevelWorker?.fullName || '—'}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Ассистенты
              </label>
              {editMode && (
                <button onClick={addAssistant} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <PlusIcon className="w-4 h-4" />
                  Добавить ассистента
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(formData.operationProtocol?.assistants || []).length > 0 ? (
                formData.operationProtocol.assistants!.map((assistant, index) => (
                  <div key={index} className="flex gap-3">
                    {editMode ? (
                      <>
                        <input
                          type="text"
                          value={assistant.fullName || ''}
                          onChange={(e) => updateAssistant(index, 'fullName', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="ФИО ассистента"
                        />
                        <button onClick={() => removeAssistant(index)} className="text-red-600 hover:text-red-800">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <p className="flex-1 px-3 py-2 bg-slate-50 rounded-lg">{assistant.fullName || '—'}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет ассистентов</p>
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* План наблюдения */}
      <CollapsibleSection title="План наблюдения" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Дата и время осмотра
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.observationPlan?.examinationDate || ''}
                  onChange={(e) => handleNestedChange('observationPlan', 'examinationDate', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.observationPlan?.examinationDate ? new Date(formData.observationPlan.examinationDate).toLocaleDateString('ru-RU') : '—'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Диагноз (код)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.observationPlan?.diagnosis?.code || ''}
                  onChange={(e) => handleNestedChange('observationPlan', 'diagnosis', { ...formData.observationPlan?.diagnosis, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.observationPlan?.diagnosis?.code || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Диагноз (наименование)
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={formData.observationPlan?.diagnosis?.name || ''}
                  onChange={(e) => handleNestedChange('observationPlan', 'diagnosis', { ...formData.observationPlan?.diagnosis, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.observationPlan?.diagnosis?.name || '—'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Дата начала плана наблюдения
              </label>
              {editMode ? (
                <input
                  type="date"
                  value={formData.observationPlan?.planStartDate || ''}
                  onChange={(e) => handleNestedChange('observationPlan', 'planStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">
                  {formData.observationPlan?.planStartDate ? new Date(formData.observationPlan.planStartDate).toLocaleDateString('ru-RU') : '—'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Дата окончания плана наблюдения
              </label>
              {editMode ? (
                <input
                  type="date"
                  value={formData.observationPlan?.planEndDate || ''}
                  onChange={(e) => handleNestedChange('observationPlan', 'planEndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-slate-50 rounded-lg">
                  {formData.observationPlan?.planEndDate ? new Date(formData.observationPlan.planEndDate).toLocaleDateString('ru-RU') : '—'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              Услуги из тарификатора
            </label>
            {editMode && (
              <button onClick={addService} className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <PlusIcon className="w-4 h-4" />
                Добавить услугу
              </button>
            )}
          </div>
          <div className="space-y-3">
            {(formData.observationPlan?.services || []).length > 0 ? (
              formData.observationPlan.services!.map((service, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-slate-300 rounded-lg">
                  {editMode ? (
                    <>
                      <input
                        type="text"
                        value={service.service || ''}
                        onChange={(e) => updateService(index, 'service', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Услуга из тарификатора"
                      />
                      <input
                        type="date"
                        value={service.plannedDate || ''}
                        onChange={(e) => updateService(index, 'plannedDate', e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Планируемая дата"
                      />
                      <div className="flex gap-3">
                        <input
                          type="date"
                          value={service.completionDate || ''}
                          onChange={(e) => updateService(index, 'completionDate', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Дата выполнения"
                        />
                        <button onClick={() => removeService(index)} className="text-red-600 hover:text-red-800">
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{service.service || '—'}</p>
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {service.plannedDate ? new Date(service.plannedDate).toLocaleDateString('ru-RU') : '—'}
                      </p>
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {service.completionDate ? new Date(service.completionDate).toLocaleDateString('ru-RU') : '—'}
                      </p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет услуг</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Рекомендации
          </label>
          {editMode ? (
            <textarea
              value={formData.observationPlan?.recommendations || ''}
              onChange={(e) => handleNestedChange('observationPlan', 'recommendations', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.observationPlan?.recommendations || '—'}</p>
            )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052DynamicObservation;
