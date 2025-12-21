import React from 'react';
import { AmbulatoryCard, Contract, Doctor } from '../types';
import { FileTextIcon, CheckShieldIcon, AlertCircleIcon, ClockIcon } from './Icons';

interface AmbulatoryCardViewProps {
  card: AmbulatoryCard;
  contract: Contract;
  doctors: Doctor[];
}

const AmbulatoryCardView: React.FC<AmbulatoryCardViewProps> = ({ card, contract, doctors }) => {
  // Проверяем, что карта имеет необходимую структуру
  if (!card || !card.personalInfo) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="text-center py-8">
          <p className="text-slate-500">Амбулаторная карта не найдена или повреждена</p>
          <p className="text-sm text-slate-400 mt-2">Обратитесь к врачу для создания карты</p>
        </div>
      </div>
    );
  }
  
  const getDoctorName = (specialty: string) => {
    const doctor = doctors.find(d => d.specialty === specialty);
    return doctor ? doctor.name : specialty;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fit':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-700">
            <CheckShieldIcon className="w-4 h-4 mr-2" />
            Годен к работе
          </span>
        );
      case 'unfit':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-700">
            <AlertCircleIcon className="w-4 h-4 mr-2" />
            Не годен к работе
          </span>
        );
      case 'needs_observation':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
            <ClockIcon className="w-4 h-4 mr-2" />
            Требуется наблюдение
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-slate-100 text-slate-600">
            <ClockIcon className="w-4 h-4 mr-2" />
            В процессе осмотра
          </span>
        );
    }
  };


  const completedExams = Object.values(card.examinations).filter((e: any) => e.status === 'completed').length;
  const totalExams = Object.keys(card.examinations).length;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Форма № 052/у — Медицинская карта амбулаторного пациента
          </h2>
          <p className="text-sm text-slate-600">
            Номер карты: {card.cardNumber || '—'} • Создана {formatDate(card.createdAt)}
          </p>
        </div>

        {/* Прогресс осмотров */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Прогресс осмотров
            </span>
            <span className="text-sm font-bold text-slate-900">
              {completedExams} из {totalExams}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${totalExams > 0 ? (completedExams / totalExams) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Паспортная часть */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileTextIcon className="w-5 h-5" />
          Паспортная часть
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">ФИО</p>
            <p className="font-medium text-slate-900">{card.personalInfo?.fullName || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500">Дата рождения</p>
            <p className="font-medium text-slate-900">{formatDate(card.personalInfo?.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-slate-500">Пол</p>
            <p className="font-medium text-slate-900">{card.personalInfo?.gender === 'М' ? 'Мужской' : card.personalInfo?.gender === 'Ж' ? 'Женский' : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500">Телефон</p>
            <p className="font-medium text-slate-900">{card.personalInfo?.phone || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Место работы</p>
            <p className="font-medium text-slate-900">{card.personalInfo?.workplace || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Должность</p>
            <p className="font-medium text-slate-900">{card.personalInfo?.position || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-500">Вредные факторы</p>
            <p className="font-medium text-amber-600">{card.personalInfo?.harmfulFactors || '—'}</p>
          </div>
        </div>
      </div>

      {/* Анамнез */}
      {card.anamnesis && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Анамнез</h3>
          <div className="space-y-3 text-sm">
            {card.anamnesis.chronicDiseases && (
              <div>
                <p className="text-slate-500 mb-1">Хронические заболевания</p>
                <p className="text-slate-900">{card.anamnesis.chronicDiseases}</p>
              </div>
            )}
            {card.anamnesis.pastDiseases && (
              <div>
                <p className="text-slate-500 mb-1">Перенесенные заболевания</p>
                <p className="text-slate-900">{card.anamnesis.pastDiseases}</p>
              </div>
            )}
            {card.anamnesis.allergies && (
              <div>
                <p className="text-slate-500 mb-1">Аллергии</p>
                <p className="text-slate-900">{card.anamnesis.allergies}</p>
              </div>
            )}
            {card.anamnesis.badHabits && (
              <div>
                <p className="text-slate-500 mb-1">Вредные привычки</p>
                <p className="text-slate-900">{card.anamnesis.badHabits}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Антропометрия */}
      {card.vitals && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Антропометрия</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {card.vitals.height && (
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Рост</p>
                <p className="text-2xl font-bold text-slate-900">{card.vitals.height}</p>
                <p className="text-xs text-slate-500">см</p>
              </div>
            )}
            {card.vitals.weight && (
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Вес</p>
                <p className="text-2xl font-bold text-slate-900">{card.vitals.weight}</p>
                <p className="text-xs text-slate-500">кг</p>
              </div>
            )}
            {card.vitals.bloodPressure && (
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">АД</p>
                <p className="text-2xl font-bold text-slate-900">{card.vitals.bloodPressure}</p>
                <p className="text-xs text-slate-500">мм рт.ст.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Осмотры врачей */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Осмотры врачей-специалистов</h3>
        <div className="space-y-4">
          {Object.entries(card.examinations).map(([specialty, examination]) => {
            const exam = examination as import('../types').DoctorExamination;
            return (
            <div key={specialty} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{getDoctorName(specialty)}</h4>
                {exam.status === 'completed' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <CheckShieldIcon className="w-3 h-3 mr-1" />
                    Завершен
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Ожидает
                  </span>
                )}
              </div>

              {exam.status === 'completed' && (
                <div className="space-y-2 text-sm">
                  <p className="text-xs text-slate-500">
                    Дата осмотра: {formatDate(exam.date)}
                  </p>

                  {exam.complaints && (
                    <div>
                      <p className="text-slate-500 font-medium">Жалобы:</p>
                      <p className="text-slate-900">{exam.complaints}</p>
                    </div>
                  )}

                  {exam.objectiveExamination && (
                    <div>
                      <p className="text-slate-500 font-medium">Объективный осмотр:</p>
                      <p className="text-slate-900">{exam.objectiveExamination}</p>
                    </div>
                  )}

                  {exam.diagnosis && (
                    <div>
                      <p className="text-slate-500 font-medium">Диагноз:</p>
                      <p className="text-slate-900 font-semibold">{exam.diagnosis}</p>
                    </div>
                  )}

                  {exam.conclusion && (
                    <div>
                      <p className="text-slate-500 font-medium">Заключение:</p>
                      <p className="text-slate-900">{exam.conclusion}</p>
                    </div>
                  )}

                  {exam.recommendations && (
                    <div>
                      <p className="text-slate-500 font-medium">Рекомендации:</p>
                      <p className="text-slate-900">{exam.recommendations}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Годен к работе: </span>
                    <span className={`font-bold ${exam.isFit ? 'text-green-600' : 'text-red-600'}`}>
                      {exam.isFit ? 'ДА' : 'НЕТ'}
                    </span>
                  </div>
                </div>
              )}

              {exam.status === 'pending' && (
                <p className="text-sm text-slate-500 italic">Ожидает осмотра</p>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Финальное заключение */}
      {card.finalConclusion && (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckShieldIcon className="w-5 h-5" />
            Заключение врачебной комиссии
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Статус:</span>
              {getStatusBadge(card.finalConclusion.status)}
            </div>

            {card.finalConclusion.diagnosis && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Диагноз</p>
                <p className="text-base font-semibold text-slate-900">{card.finalConclusion.diagnosis}</p>
              </div>
            )}

            {card.finalConclusion.recommendations && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Рекомендации</p>
                <p className="text-base text-slate-900">{card.finalConclusion.recommendations}</p>
              </div>
            )}

            {card.finalConclusion.restrictions && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Ограничения</p>
                <p className="text-base text-slate-900">{card.finalConclusion.restrictions}</p>
              </div>
            )}

            {card.finalConclusion.nextExamDate && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Дата следующего осмотра</p>
                <p className="text-base font-medium text-slate-900">{formatDate(card.finalConclusion.nextExamDate)}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Председатель комиссии</p>
              <p className="text-base font-medium text-slate-900">{card.finalConclusion.doctorName || getDoctorName('Профпатолог')}</p>
              <p className="text-xs text-slate-500 mt-1">Дата: {formatDate(card.finalConclusion.date)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulatoryCardView;
