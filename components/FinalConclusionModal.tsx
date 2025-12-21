import React, { useState } from 'react';
import { AmbulatoryCard, Employee, Contract } from '../types';
import { apiGetAmbulatoryCard, apiUpdateAmbulatoryCard, apiUpdateContract } from '../services/api';
import { CheckShieldIcon, XIcon, LoaderIcon } from './Icons';

interface FinalConclusionModalProps {
  employee: Employee;
  card: AmbulatoryCard;
  contract: Contract;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onSaved: () => void;
}

const HEALTH_GROUPS = [
  { value: 'fit', label: 'Группа 1: Здоровые', id: 1 },
  { value: 'practically_fit', label: 'Группа 2: Практически здоровые', id: 2 },
  { value: 'early_illness', label: 'Группа 3: Начальные формы общих заболеваний', id: 3 },
  { value: 'expressed_illness', label: 'Группа 4: Выраженные формы общих заболеваний', id: 4 },
  { value: 'factor_effect', label: 'Группа 5: Признаки воздействия вредных факторов', id: 5 },
  { value: 'prof_disease', label: 'Группа 6: Признаки профессиональных заболеваний', id: 6 },
  { value: 'unfit', label: 'Не годен к работе', id: 0 },
];

const FinalConclusionModal: React.FC<FinalConclusionModalProps> = ({
  employee,
  card,
  contract,
  doctorId,
  doctorName,
  onClose,
  onSaved
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    status: (card.finalConclusion?.status || 'fit') as any,
    diagnosis: card.finalConclusion?.diagnosis || '',
    recommendations: card.finalConclusion?.recommendations || '',
    restrictions: card.finalConclusion?.restrictions || '',
    nextExamDate: card.finalConclusion?.nextExamDate || '',
    notes: card.finalConclusion?.notes || '',
    healthGroup: card.finalConclusion?.healthGroup || 1,
  });

  // Проверяем, все ли врачи завершили осмотры
  const allExamsCompleted = Object.values(card.examinations).every((exam: any) => exam.status === 'completed');
  const completedCount = Object.values(card.examinations).filter((exam: any) => exam.status === 'completed').length;
  const totalCount = Object.keys(card.examinations).length;

  const handleSave = async () => {
    if (!allExamsCompleted) {
      alert('Не все врачи завершили осмотры. Финальное заключение можно выставить только после завершения всех осмотров.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedGroup = HEALTH_GROUPS.find(g => g.value === form.status);
      
      const updatedCard: AmbulatoryCard = {
        ...card,
        finalConclusion: {
          status: form.status,
          date: new Date().toISOString(),
          doctorId,
          doctorName,
          diagnosis: form.diagnosis,
          recommendations: form.recommendations,
          restrictions: form.restrictions,
          nextExamDate: form.nextExamDate,
          notes: form.notes,
          healthGroup: selectedGroup?.id as any || 1,
        },
        updatedAt: new Date().toISOString(),
      };
// ... rest of the function remains same

      const contractIdNum = parseInt(contract.id, 10);
      if (!isNaN(contractIdNum)) {
        // Загружаем текущую карту для получения ID
        const currentCard = await apiGetAmbulatoryCard(employee.id, contractIdNum);
        if (currentCard) {
          await apiUpdateAmbulatoryCard(currentCard.id, {
            finalConclusion: updatedCard.finalConclusion,
          });
        }

        // Обновляем статус сотрудника в договоре
        const employeeIndex = contract.employees.findIndex(e => e.id === employee.id);
        if (employeeIndex !== -1) {
          const updatedEmployees = [...contract.employees];
          updatedEmployees[employeeIndex] = {
            ...updatedEmployees[employeeIndex],
            status: form.status,
          };

          await apiUpdateContract(contractIdNum, {
            employees: updatedEmployees,
          });
        }
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving final conclusion:', error);
      alert('Ошибка при сохранении заключения');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Финальное заключение комиссии</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Информация о сотруднике */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-2">{employee.name}</h3>
            <p className="text-sm text-slate-600">{employee.position}</p>
            <p className="text-sm text-amber-600 mt-1">{employee.harmfulFactor}</p>
          </div>

          {/* Прогресс осмотров */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Прогресс осмотров
              </span>
              <span className="text-sm font-bold text-blue-900">
                {completedCount} из {totalCount}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            {!allExamsCompleted && (
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ Не все врачи завершили осмотры. Финальное заключение можно выставить только после завершения всех осмотров.
              </p>
            )}
          </div>

          {/* Форма */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Группа здоровья / Заключение <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!allExamsCompleted}
              >
                {HEALTH_GROUPS.map(group => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Диагноз
              </label>
              <input
                type="text"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Основной диагноз..."
                disabled={!allExamsCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Рекомендации
              </label>
              <textarea
                value={form.recommendations}
                onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Рекомендации комиссии..."
                disabled={!allExamsCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ограничения к работе
              </label>
              <textarea
                value={form.restrictions}
                onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Ограничения (если есть)..."
                disabled={!allExamsCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Дата следующего осмотра
              </label>
              <input
                type="date"
                value={form.nextExamDate}
                onChange={(e) => setForm({ ...form, nextExamDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!allExamsCompleted}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Примечания
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Дополнительные примечания..."
                disabled={!allExamsCompleted}
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={isSaving || !allExamsCompleted}
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoaderIcon className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <CheckShieldIcon className="w-5 h-5" />
                  Сохранить заключение
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalConclusionModal;
