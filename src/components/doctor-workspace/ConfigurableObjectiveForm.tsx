// Универсальный компонент формы на основе конфигурации
import React, { useState, useEffect } from 'react';
import { SpecialtyType, ObjectiveDataPayload } from '../../types/medical-forms';
import { FieldConfig, getFormConfig } from '../../config/specialtyForms';
import { UploadIcon } from '../../../components/Icons';

interface ConfigurableObjectiveFormProps {
  specialty: SpecialtyType;
  data: ObjectiveDataPayload;
  onChange: (data: ObjectiveDataPayload) => void;
}

const ConfigurableObjectiveForm: React.FC<ConfigurableObjectiveFormProps> = ({
  specialty,
  data,
  onChange
}) => {
  const config = getFormConfig(specialty);
  const [localData, setLocalData] = useState<Record<string, any>>(data || {});

  // Синхронизация с внешними данными
  useEffect(() => {
    setLocalData(data || {});
  }, [data]);

  const updateField = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onChange(newData as ObjectiveDataPayload);
  };

  const handleFileUpload = async (key: string, file: File) => {
    // TODO: Реализовать загрузку файла через API
    // Пока просто сохраняем имя файла
    updateField(key, file.name);
    console.log('File upload not implemented yet:', file.name);
  };

  const renderField = (field: FieldConfig) => {
    const value = localData[field.key] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
              />
              {field.unit && (
                <span className="text-sm text-slate-500 whitespace-nowrap">{field.unit}</span>
              )}
            </div>
            {field.helpText && (
              <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step={field.step}
                required={field.required}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
              />
              {field.unit && (
                <span className="text-sm text-slate-500 whitespace-nowrap">{field.unit}</span>
              )}
            </div>
            {field.helpText && (
              <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 resize-y"
            />
            {field.helpText && (
              <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="space-y-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => updateField(field.key, e.target.checked)}
                className="w-5 h-5 rounded border-2 border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {field.helpText && (
              <p className="text-xs text-slate-400 ml-8">{field.helpText}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              required={field.required}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(field.key, file);
                }}
                className="hidden"
                id={`file-${field.key}`}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label
                htmlFor={`file-${field.key}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer"
              >
                <UploadIcon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {value ? `Файл: ${value}` : 'Загрузить файл'}
                </span>
              </label>
            </div>
            {field.helpText && (
              <p className="text-xs text-slate-400 mt-1">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 rounded-[24px] border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{config.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.fields.map((field) => renderField(field))}
      </div>
    </div>
  );
};

export default ConfigurableObjectiveForm;

