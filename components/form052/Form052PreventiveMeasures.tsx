import React, { useState } from 'react';
import { PreventiveMeasures } from '../../types/form052';
import { PlusIcon, TrashIcon } from '../Icons';
import CollapsibleSection from './CollapsibleSection';

interface Form052PreventiveMeasuresProps {
  data?: PreventiveMeasures;
  onChange: (data: PreventiveMeasures) => void;
  editMode: boolean;
}

const Form052PreventiveMeasures: React.FC<Form052PreventiveMeasuresProps> = ({ data = {}, onChange, editMode }) => {
  const [formData, setFormData] = useState<PreventiveMeasures>(data);

  const handleChange = (field: keyof PreventiveMeasures, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  const handleNestedChange = (section: string, field: string, value: any) => {
    const sectionData = (formData as any)[section] || {};
    handleChange(section as keyof PreventiveMeasures, { ...sectionData, [field]: value });
  };

  const addVaccination = () => {
    const vaccinations = [...(formData.vaccinations || []), {}];
    handleChange('vaccinations', vaccinations);
  };

  const updateVaccination = (index: number, field: string, value: any) => {
    const vaccinations = [...(formData.vaccinations || [])];
    vaccinations[index] = { ...vaccinations[index], [field]: value };
    handleChange('vaccinations', vaccinations);
  };

  const removeVaccination = (index: number) => {
    const vaccinations = formData.vaccinations?.filter((_, i) => i !== index) || [];
    handleChange('vaccinations', vaccinations);
  };

  const addDiagnosticService = () => {
    const services = [...(formData.diagnosticServices || []), {}];
    handleChange('diagnosticServices', services);
  };

  const updateDiagnosticService = (index: number, field: string, value: any) => {
    const services = [...(formData.diagnosticServices || [])];
    services[index] = { ...services[index], [field]: value };
    handleChange('diagnosticServices', services);
  };

  const removeDiagnosticService = (index: number) => {
    const services = formData.diagnosticServices?.filter((_, i) => i !== index) || [];
    handleChange('diagnosticServices', services);
  };

  return (
    <div className="space-y-4">
      {/* Основные данные осмотра */}
      <CollapsibleSection title="Основные данные осмотра" defaultExpanded={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1. Дата и время осмотра
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.examinationDate || ''}
                  onChange={(e) => handleChange('examinationDate', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={formData.examinationTime || ''}
                  onChange={(e) => handleChange('examinationTime', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">
                {formData.examinationDate && formData.examinationTime
                  ? `${new Date(formData.examinationDate).toLocaleDateString('ru-RU')} ${formData.examinationTime}`
                  : '—'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              2. Услуга (из тарификатора)
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.service || ''}
                onChange={(e) => handleChange('service', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Введите услугу из тарификатора"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.service || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              3. Осмотр специалиста, ФИО (при его наличии), идентификатор
            </label>
            {editMode ? (
              <input
                type="text"
                value={formData.specialistFullName || ''}
                onChange={(e) => handleChange('specialistFullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Введите ФИО специалиста"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg">{formData.specialistFullName || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              4. Проведенные диагностические исследования
            </label>
            {editMode ? (
              <textarea
                value={formData.diagnosticExaminations || ''}
                onChange={(e) => handleChange('diagnosticExaminations', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.diagnosticExaminations || '—'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              5. Проведенные инструментальные исследования
            </label>
            {editMode ? (
              <textarea
                value={formData.instrumentalExaminations || ''}
                onChange={(e) => handleChange('instrumentalExaminations', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{formData.instrumentalExaminations || '—'}</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Вакцинация */}
      <CollapsibleSection title="Вакцинация" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={addVaccination} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить вакцинацию
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.vaccinations || []).length > 0 ? (
            formData.vaccinations!.map((vaccination, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800">Вакцинация #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeVaccination(index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Наименование заболевания, против которого применена вакцина (МКБ10)
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.diseaseName || ''}
                        onChange={(e) => updateVaccination(index, 'diseaseName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.diseaseName || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Страна производитель (Справочник стран)
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.manufacturerCountry || ''}
                        onChange={(e) => updateVaccination(index, 'manufacturerCountry', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.manufacturerCountry || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Номер партии
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.batchNumber || ''}
                        onChange={(e) => updateVaccination(index, 'batchNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.batchNumber || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Номер серии
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.seriesNumber || ''}
                        onChange={(e) => updateVaccination(index, 'seriesNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.seriesNumber || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Название препарата вакцины, анатоксина и прочие
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.vaccineName || ''}
                        onChange={(e) => updateVaccination(index, 'vaccineName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.vaccineName || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Способ применения
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.administrationMethod || ''}
                        onChange={(e) => updateVaccination(index, 'administrationMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Например: внутримышечно"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.administrationMethod || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Дозировка
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          step="0.1"
                          value={vaccination.dosage?.amount || ''}
                          onChange={(e) => updateVaccination(index, 'dosage', { ...vaccination.dosage, amount: parseFloat(e.target.value) || undefined })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Количество"
                        />
                        <input
                          type="text"
                          value={vaccination.dosage?.unit || ''}
                          onChange={(e) => updateVaccination(index, 'dosage', { ...vaccination.dosage, unit: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="ед.изм."
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {vaccination.dosage?.amount && vaccination.dosage?.unit
                          ? `${vaccination.dosage.amount} ${vaccination.dosage.unit}`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Дата и время прививки
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={vaccination.vaccinationDate || ''}
                          onChange={(e) => updateVaccination(index, 'vaccinationDate', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="time"
                          value={vaccination.vaccinationTime || ''}
                          onChange={(e) => updateVaccination(index, 'vaccinationTime', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {vaccination.vaccinationDate && vaccination.vaccinationTime
                          ? `${new Date(vaccination.vaccinationDate).toLocaleDateString('ru-RU')} ${vaccination.vaccinationTime}`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Побочная реакция или нежелательное явление
                    </label>
                    {editMode ? (
                      <textarea
                        value={vaccination.adverseReaction || ''}
                        onChange={(e) => updateVaccination(index, 'adverseReaction', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{vaccination.adverseReaction || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Классификатор побочной / нежелательной реакции
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={vaccination.reactionClassifier || ''}
                        onChange={(e) => updateVaccination(index, 'reactionClassifier', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{vaccination.reactionClassifier || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о вакцинациях</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Диагностические исследования/услуги */}
      <CollapsibleSection title="Диагностические исследования/услуги" defaultExpanded={false}>
        {editMode && (
          <div className="flex justify-end mb-4">
            <button onClick={addDiagnosticService} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" />
              Добавить исследование
            </button>
          </div>
        )}
        <div className="space-y-4">
          {(formData.diagnosticServices || []).length > 0 ? (
            formData.diagnosticServices!.map((service, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800">Исследование #{index + 1}</h4>
                  {editMode && (
                    <button onClick={() => removeDiagnosticService(index)} className="text-red-600 hover:text-red-800">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      1. Дата и время проведения
                    </label>
                    {editMode ? (
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={service.date || ''}
                          onChange={(e) => updateDiagnosticService(index, 'date', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="time"
                          value={service.time || ''}
                          onChange={(e) => updateDiagnosticService(index, 'time', e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">
                        {service.date && service.time
                          ? `${new Date(service.date).toLocaleDateString('ru-RU')} ${service.time}`
                          : '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      2. Наименование услуги из тарификатора
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={service.serviceName || ''}
                        onChange={(e) => updateDiagnosticService(index, 'serviceName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{service.serviceName || '—'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      3. Данные описания проведенного исследования
                    </label>
                    {editMode ? (
                      <textarea
                        value={service.description || ''}
                        onChange={(e) => updateDiagnosticService(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{service.description || '—'}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      4. Заключение
                    </label>
                    {editMode ? (
                      <textarea
                        value={service.conclusion || ''}
                        onChange={(e) => updateDiagnosticService(index, 'conclusion', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg whitespace-pre-wrap">{service.conclusion || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      5. Идентификатор и ФИО (при его наличии) медицинского работника
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={service.medicalWorkerFullName || ''}
                        onChange={(e) => updateDiagnosticService(index, 'medicalWorkerFullName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите ФИО медицинского работника"
                      />
                    ) : (
                      <p className="px-3 py-2 bg-slate-50 rounded-lg">{service.medicalWorkerFullName || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-2 bg-slate-50 rounded-lg text-slate-500">Нет данных о диагностических исследованиях</p>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default Form052PreventiveMeasures;
