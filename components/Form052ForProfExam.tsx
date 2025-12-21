import React, { useState } from 'react';
import { Employee, AmbulatoryCard, Contract } from '../types';
import { PassportData, MinimalMedicalData } from '../types/form052';
import Form052GeneralPart from './form052/Form052GeneralPart';
import CollapsibleSection from './form052/CollapsibleSection';
import { CheckShieldIcon, SaveIcon, FileTextIcon } from './Icons';

interface Form052ForProfExamProps {
  employee: Employee;
  card: AmbulatoryCard;
  contract: Contract;
  currentSpecialty: string;
  onSave: (data: any) => void;
  isSaving: boolean;
}

/**
 * Форма 052/у для профосмотров
 * Упрощенная версия полной формы 052/у "Медицинская карта амбулаторного пациента"
 * Адаптирована для периодических медицинских осмотров работников
 */
const Form052ForProfExam: React.FC<Form052ForProfExamProps> = ({
  employee,
  card,
  contract,
  currentSpecialty,
  onSave,
  isSaving
}) => {
  // Паспортные данные из формы 052
  const [passportData, setPassportData] = useState<PassportData>({
    iin: employee.id,
    fullName: employee.name,
    dateOfBirth: employee.dob,
    gender: employee.gender === 'М' ? 'male' : 'female',
    workplace: contract.clientName,
    position: employee.position,
    address: card.personalInfo?.address,
  });

  // Минимальные медицинские данные
  const [minimalData, setMinimalData] = useState<MinimalMedicalData>({
    bloodGroup: card.personalInfo?.bloodType,
    rhFactor: card.personalInfo?.rhFactor,
    allergicReactions: card.anamnesis?.allergies ? [{ name: card.anamnesis.allergies }] : [],
    harmfulHabits: card.anamnesis?.badHabits,
    diseaseHistory: card.anamnesis?.pastDiseases,
    currentHealthProblems: card.anamnesis?.chronicDiseases,
    anthropometricData: {
      height: card.vitals?.height,
      weight: card.vitals?.weight,
      bmi: card.vitals?.bmi,
    },
  });

  // Данные текущего осмотра врача
  const [examinationData, setExaminationData] = useState({
    complaints: card.examinations[currentSpecialty]?.complaints || '',
    objectiveExamination: card.examinations[currentSpecialty]?.objectiveExamination || '',
    diagnosis: card.examinations[currentSpecialty]?.diagnosis || '',
    conclusion: card.examinations[currentSpecialty]?.conclusion || '',
    recommendations: card.examinations[currentSpecialty]?.recommendations || '',
    isFit: card.examinations[currentSpecialty]?.isFit !== false,
  });

  const handlePassportAndMinimalChange = (passport: PassportData, minimal: MinimalMedicalData) => {
    setPassportData(passport);
    setMinimalData(minimal);
  };

  const handleSaveExamination = () => {
    onSave({
      passportData,
      minimalData,
      examination: examinationData,
    });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок формы */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Форма № 052/у
            </h2>
            <p className="text-sm text-slate-600">
              Медицинская карта амбулаторного пациента
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Периодический медицинский осмотр работника
            </p>
          </div>
          <div className="text-right">
            <FileTextIcon className="w-12 h-12 text-blue-600 mb-2" />
            <p className="text-xs text-slate-500">
              Приказ МЗ РК
            </p>
          </div>
        </div>
      </div>

      {/* 1. Общая часть формы 052 (паспортные данные) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <h3 className="text-lg font-bold text-slate-900">
            1. Паспортная часть (форма 052/у)
          </h3>
        </div>
        <div className="p-6">
          <Form052GeneralPart
            data={passportData}
            minimalData={minimalData}
            onChange={handlePassportAndMinimalChange}
            editMode={false}
          />
        </div>
      </div>

      {/* 2. Анамнез и вредные факторы */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
          <h3 className="text-lg font-bold text-slate-900">
            2. Профессиональный анамнез
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Вредные производственные факторы
            </label>
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 font-medium">
                {employee.harmfulFactor || '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Общий стаж работы
              </label>
              <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                {employee.totalExperience || '—'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Стаж работы в данной должности
              </label>
              <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
                {employee.positionExperience || '—'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Дата последнего медосмотра
            </label>
            <p className="px-4 py-3 bg-slate-50 rounded-xl text-slate-900">
              {employee.lastMedDate ? new Date(employee.lastMedDate).toLocaleDateString('ru-RU') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Осмотр текущего специалиста */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
          <h3 className="text-lg font-bold text-slate-900">
            3. Осмотр: {currentSpecialty}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Дата: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Жалобы пациента
            </label>
            <textarea
              value={examinationData.complaints}
              onChange={(e) => setExaminationData({ ...examinationData, complaints: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              rows={3}
              placeholder="Жалобы пациента на момент осмотра..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Объективный осмотр
            </label>
            <textarea
              value={examinationData.objectiveExamination}
              onChange={(e) => setExaminationData({ ...examinationData, objectiveExamination: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              rows={5}
              placeholder="Результаты объективного осмотра..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Диагноз
              </label>
              <input
                type="text"
                value={examinationData.diagnosis}
                onChange={(e) => setExaminationData({ ...examinationData, diagnosis: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Диагноз по МКБ-10..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Заключение специалиста
              </label>
              <input
                type="text"
                value={examinationData.conclusion}
                onChange={(e) => setExaminationData({ ...examinationData, conclusion: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                placeholder="Заключение врача..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Рекомендации
            </label>
            <textarea
              value={examinationData.recommendations}
              onChange={(e) => setExaminationData({ ...examinationData, recommendations: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              rows={2}
              placeholder="Рекомендации специалиста..."
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border-2 border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={examinationData.isFit}
                onChange={(e) => setExaminationData({ ...examinationData, isFit: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <span className="text-sm font-bold text-slate-700">
                Годен к работе по специальности "{currentSpecialty}"
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveExamination}
            disabled={isSaving}
            className="group relative w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Сохранение в форму 052/у...
              </>
            ) : (
              <>
                <CheckShieldIcon className="w-5 h-5" />
                Сохранить в медицинскую карту (форма 052/у)
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. История осмотров в карте 052 */}
      {card.examinations && Object.keys(card.examinations).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <h3 className="text-lg font-bold text-slate-900">
              4. История осмотров в карте 052/у
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Все предыдущие осмотры специалистов
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(card.examinations).map(([specialty, exam]: [string, any]) => (
                <div key={specialty} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-900">{specialty}</h4>
                    <span className="text-xs text-slate-500">
                      {exam.date ? new Date(exam.date).toLocaleDateString('ru-RU') : ''}
                    </span>
                  </div>
                  {exam.diagnosis && (
                    <p className="text-sm text-slate-700 mb-1">
                      <span className="font-semibold">Диагноз:</span> {exam.diagnosis}
                    </p>
                  )}
                  {exam.conclusion && (
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Заключение:</span> {exam.conclusion}
                    </p>
                  )}
                  {exam.isFit !== undefined && (
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        exam.isFit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {exam.isFit ? 'Годен' : 'Не годен'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Информационный блок */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-800">
          <span className="font-bold">Примечание:</span> Форма № 052/у "Медицинская карта амбулаторного пациента" 
          является основным медицинским документом. Все осмотры специалистов вносятся в единую карту пациента.
          Для полной формы 052/у с детальными разделами используйте соответствующий компонент.
        </p>
      </div>
    </div>
  );
};

export default Form052ForProfExam;

