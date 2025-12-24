import React, { useState, useEffect } from 'react';
import { LabParameter, LabTemplate } from '../../types/medical-forms';
import { CheckCircleIcon } from '../../components/Icons';

interface LabResultsTableProps {
  template: LabTemplate;
  onSave?: (parameters: LabParameter[]) => void;
  readOnly?: boolean;
}

const LabResultsTable: React.FC<LabResultsTableProps> = ({
  template,
  onSave,
  readOnly = false
}) => {
  const [parameters, setParameters] = useState<LabParameter[]>(template.parameters);

  // Автоматический расчет isAbnormal при изменении значения
  useEffect(() => {
    setParameters(prev => prev.map(param => {
      const numValue = parseFloat(param.value);
      const isAbnormal = param.value !== '' && (
        isNaN(numValue) || numValue < param.refMin || numValue > param.refMax
      );
      return { ...param, isAbnormal };
    }));
  }, [parameters.map(p => p.value).join(',')]);

  const handleValueChange = (id: string, value: string) => {
    const updated = parameters.map(param => {
      if (param.id === id) {
        const numValue = parseFloat(value);
        const isAbnormal = value !== '' && (
          isNaN(numValue) || numValue < param.refMin || numValue > param.refMax
        );
        return { ...param, value, isAbnormal };
      }
      return param;
    });
    setParameters(updated);
    
    if (onSave) {
      onSave(updated);
    }
  };

  // Функция "Заполнить все нормальными значениями"
  const handleFillAllNormal = () => {
    const updated = parameters.map(param => {
      const normalValue = ((param.refMin + param.refMax) / 2).toFixed(2);
      return { ...param, value: normalValue, isAbnormal: false };
    });
    setParameters(updated);
    
    if (onSave) {
      onSave(updated);
    }
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <h3 className="text-white font-black text-lg tracking-tight">
          {template.name}
        </h3>
        {!readOnly && (
          <button
            onClick={handleFillAllNormal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Заполнить все нормой
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Показатель
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Значение
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Ед. изм.
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                Референсные значения
              </th>
              <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                Статус
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parameters.map((param) => (
              <tr
                key={param.id}
                className={`hover:bg-slate-50 transition-colors ${
                  param.isAbnormal ? 'bg-red-50/50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-900">{param.name}</span>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => handleValueChange(param.id, e.target.value)}
                    readOnly={readOnly}
                    className={`w-24 px-3 py-2 rounded-lg text-sm font-bold transition-all outline-none ${
                      param.isAbnormal
                        ? 'bg-red-50 border-2 border-red-500 text-red-900 focus:ring-4 focus:ring-red-500/20'
                        : readOnly
                        ? 'bg-slate-50 border-transparent text-slate-900 cursor-default'
                        : 'bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900'
                    }`}
                    placeholder="—"
                  />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600 font-medium">{param.unit}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-500 font-medium">
                    {param.refMin} - {param.refMax}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {param.value && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                        param.isAbnormal
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {param.isAbnormal ? 'Отклонение' : 'Норма'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 font-medium">
          Значения вне референсного диапазона выделены красным цветом
        </p>
      </div>
    </div>
  );
};

export default LabResultsTable;

