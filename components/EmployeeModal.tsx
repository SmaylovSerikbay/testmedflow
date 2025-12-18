import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Employee } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  isEditing: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<void>;
  onOpenHarmfulFactorModal: () => void;
  onFieldChange: (field: keyof Employee, value: string) => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = React.memo(({
  isOpen,
  employee,
  isEditing,
  onClose,
  onSave,
  onOpenHarmfulFactorModal,
  onFieldChange,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [shouldFocus, setShouldFocus] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setIsSaving(false);
      setShouldFocus(false);
    } else {
      // Устанавливаем фокус только при первом открытии
      setShouldFocus(true);
    }
  }, [isOpen]);

  useEffect(() => {
    // Фокус только при первом открытии модального окна
    if (shouldFocus && nameInputRef.current && isOpen) {
      // Небольшая задержка для корректного фокуса
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        setShouldFocus(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldFocus, isOpen]);

  // Функции конвертации дат между форматами ДД.ММ.ГГГГ и YYYY-MM-DD
  const formatDateToInput = useCallback((dateStr: string): string => {
    if (!dateStr) return '';
    // Если уже в формате YYYY-MM-DD, возвращаем как есть
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Если в формате ДД.ММ.ГГГГ, конвертируем
    const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
    return '';
  }, []);

  const formatDateFromInput = useCallback((dateStr: string): string => {
    if (!dateStr) return '';
    // Если в формате YYYY-MM-DD, конвертируем в ДД.ММ.ГГГГ
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}.${month}.${year}`;
    }
    // Если уже в формате ДД.ММ.ГГГГ, возвращаем как есть
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
    return dateStr;
  }, []);

  const validate = useCallback((emp: Employee | null): boolean => {
    if (!emp) return false;
    const newErrors: Record<string, string> = {};
    
    if (!emp.name?.trim()) {
      newErrors.name = 'Обязательное поле';
    }
    
    // Валидация даты рождения - принимаем оба формата
    if (emp.dob && !/^\d{2}\.\d{2}\.\d{4}$/.test(emp.dob) && !/^\d{4}-\d{2}-\d{2}$/.test(emp.dob)) {
      newErrors.dob = 'Формат: ДД.ММ.ГГГГ или выберите из календаря';
    }
    
    // Валидация даты последнего медосмотра - принимаем оба формата
    if (emp.lastMedDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(emp.lastMedDate) && !/^\d{4}-\d{2}-\d{2}$/.test(emp.lastMedDate)) {
      newErrors.lastMedDate = 'Формат: ДД.ММ.ГГГГ или выберите из календаря';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const handleSave = useCallback(async () => {
    if (!employee) return;
    
    if (!validate(employee)) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(employee);
    } finally {
      setIsSaving(false);
    }
  }, [employee, onSave, validate]);

  const handleFieldChange = useCallback((field: keyof Employee) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let value = e.target.value;
      
      // Для полей дат конвертируем из формата input type="date" (YYYY-MM-DD) в формат ДД.ММ.ГГГГ
      if ((field === 'dob' || field === 'lastMedDate') && value) {
        // Если значение в формате YYYY-MM-DD (из календаря), конвертируем
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          value = formatDateFromInput(value);
        }
        // Если значение уже в формате ДД.ММ.ГГГГ, оставляем как есть
        // Если пустое, оставляем пустым
      }
      
      onFieldChange(field, value);
      // Очищаем ошибку при изменении поля
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };
  }, [errors, onFieldChange, formatDateFromInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  }, [onClose, handleSave]);

  if (!isOpen || !employee) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Редактирование' : 'Новый сотрудник'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Обновите информацию о сотруднике' : 'Заполните данные сотрудника'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Основная информация */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Основная информация
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    ФИО <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={employee.name || ''}
                    onChange={handleFieldChange('name')}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Иванов Иван Иванович"
                    autoComplete="off"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Дата рождения
                    </label>
                    <input
                      type="date"
                      value={formatDateToInput(employee.dob || '')}
                      onChange={handleFieldChange('dob')}
                      className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.dob ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                      }`}
                      placeholder="01.01.1980"
                      autoComplete="off"
                      title="Выберите дату из календаря или введите в формате ДД.ММ.ГГГГ"
                    />
                    {errors.dob && (
                      <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Выберите из календаря или введите вручную (ДД.ММ.ГГГГ)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Пол
                    </label>
                    <select
                      value={employee.gender || 'М'}
                      onChange={(e) => {
                        const newValue = e.target.value === 'Ж' ? 'Ж' : 'М';
                        onFieldChange('gender', newValue);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="М">Мужской</option>
                      <option value="Ж">Женский</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Рабочая информация */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Рабочая информация
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Участок
                    </label>
                    <input
                      type="text"
                      value={employee.site || ''}
                      onChange={handleFieldChange('site')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Цех 1"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Должность
                    </label>
                    <input
                      type="text"
                      value={employee.position || ''}
                      onChange={handleFieldChange('position')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Слесарь"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Общий стаж
                    </label>
                    <input
                      type="text"
                      value={employee.totalExperience || ''}
                      onChange={handleFieldChange('totalExperience')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Стаж по должности
                    </label>
                    <input
                      type="text"
                      value={employee.positionExperience || ''}
                      onChange={handleFieldChange('positionExperience')}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="5"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Дата посл. МО
                    </label>
                    <input
                      type="date"
                      value={formatDateToInput(employee.lastMedDate || '')}
                      onChange={handleFieldChange('lastMedDate')}
                      className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.lastMedDate ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                      }`}
                      placeholder="01.01.2023"
                      autoComplete="off"
                      title="Выберите дату из календаря или введите в формате ДД.ММ.ГГГГ"
                    />
                    {errors.lastMedDate && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastMedDate}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Выберите из календаря или введите вручную (ДД.ММ.ГГГГ)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Вредные факторы */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Вредные факторы
              </h3>
              <div>
                {employee.harmfulFactor ? (
                  <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 mb-2">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {employee.harmfulFactor}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 mb-2">
                    <p className="text-sm text-slate-400 text-center">Не выбрано</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onOpenHarmfulFactorModal}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  {employee.harmfulFactor ? 'Изменить выбор' : 'Выбрать вредные факторы'}
                </button>
              </div>
            </section>

            {/* Примечание */}
            <section>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Примечание
              </label>
              <input
                type="text"
                value={employee.note || ''}
                onChange={handleFieldChange('note')}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Дополнительная информация (необязательно)"
                autoComplete="off"
              />
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            disabled={isSaving}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !employee.name?.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Сохранение...
              </span>
            ) : (
              'Сохранить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

EmployeeModal.displayName = 'EmployeeModal';

export default EmployeeModal;
