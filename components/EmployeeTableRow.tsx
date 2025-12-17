import React, { memo, useCallback } from 'react';
import { Employee } from '../types';

interface EmployeeTableRowProps {
  employee: Employee;
  onToggleStatus: (id: string) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  index?: number;
  showActionsColumn?: boolean; // Если true, статус и действия в разных колонках
}

const EmployeeTableRow: React.FC<EmployeeTableRowProps> = memo(({
  employee,
  onToggleStatus,
  onEdit,
  onDelete,
  index,
  showActionsColumn = false,
}) => {
  const handleToggle = useCallback(() => {
    onToggleStatus(employee.id);
  }, [employee.id, onToggleStatus]);

  const handleEdit = useCallback(() => {
    onEdit(employee);
  }, [employee, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(employee.id);
  }, [employee.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50">
      {index !== undefined && (
        <td className="px-2 py-2 text-slate-400 text-[11px] font-medium">{index}</td>
      )}
      <td className="px-2 py-2 font-medium text-[11px] truncate" title={employee.name}>{employee.name}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] whitespace-nowrap">{employee.dob || '-'}</td>
      <td className="px-1 py-2 text-slate-500 text-[11px]">{employee.gender}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] truncate" title={employee.site}>{employee.site || '-'}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] truncate" title={employee.position}>{employee.position || '-'}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] whitespace-nowrap">{employee.totalExperience || '-'}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] whitespace-nowrap">{employee.positionExperience || '-'}</td>
      <td className="px-2 py-2 text-slate-500 text-[11px] whitespace-nowrap">{employee.lastMedDate || '-'}</td>
      <td className="px-2 py-2 text-amber-600 text-[11px] truncate" title={employee.harmfulFactor || undefined}>
        {employee.harmfulFactor || '-'}
      </td>
      <td className="px-2 py-2 text-slate-500 text-[11px] truncate" title={employee.note || undefined}>
        {employee.note || '-'}
      </td>
      <td className="px-2 py-2 whitespace-nowrap">
        <button 
          onClick={handleToggle}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
            employee.status === 'fit' ? 'bg-green-100 text-green-700' :
            employee.status === 'unfit' ? 'bg-red-100 text-red-700' :
            employee.status === 'needs_observation' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {employee.status === 'fit' ? 'Годен' :
           employee.status === 'unfit' ? 'Не годен' :
           employee.status === 'needs_observation' ? 'Набл.' : 'Ожидание'}
        </button>
      </td>
      {showActionsColumn && (
        <td className="px-2 py-2 space-x-0.5 whitespace-nowrap">
          <button
            type="button"
            onClick={handleEdit}
            className="px-1.5 py-0.5 border border-slate-300 rounded text-[9px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Ред.
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-1.5 py-0.5 border border-red-200 rounded text-[9px] font-semibold text-red-500 hover:bg-red-50"
          >
            Уд.
          </button>
        </td>
      )}
      {!showActionsColumn && (
        <td className="px-6 py-3 space-x-1 whitespace-nowrap">
          <button
            type="button"
            onClick={handleEdit}
            className="px-2 py-1 border border-slate-300 rounded text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Редакт.
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-2 py-1 border border-red-200 rounded text-[10px] font-semibold text-red-500 hover:bg-red-50"
          >
            Удал.
          </button>
        </td>
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  return (
    prevProps.employee.id === nextProps.employee.id &&
    prevProps.employee.name === nextProps.employee.name &&
    prevProps.employee.status === nextProps.employee.status &&
    prevProps.employee.dob === nextProps.employee.dob &&
    prevProps.employee.gender === nextProps.employee.gender &&
    prevProps.employee.site === nextProps.employee.site &&
    prevProps.employee.position === nextProps.employee.position &&
    prevProps.employee.totalExperience === nextProps.employee.totalExperience &&
    prevProps.employee.positionExperience === nextProps.employee.positionExperience &&
    prevProps.employee.lastMedDate === nextProps.employee.lastMedDate &&
    prevProps.employee.harmfulFactor === nextProps.employee.harmfulFactor &&
    prevProps.employee.note === nextProps.employee.note
  );
});

EmployeeTableRow.displayName = 'EmployeeTableRow';

export default EmployeeTableRow;

