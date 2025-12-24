import React from 'react';
import { Form075Data } from '../../types/documents';

interface Form075Props {
  data: Form075Data;
}

const Form075: React.FC<Form075Props> = ({ data }) => {
  return (
    <div className="bg-white p-8 document-print">
      {/* Заголовок документа */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold mb-2">Форма № 075/у</h1>
        <p className="text-lg font-semibold">"Медицинская справка (врачебное профессионально-консультативное заключение)"</p>
      </div>

      {/* Информация о МО */}
      <div className="mb-6 space-y-3 text-sm">
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Наименование МО:</span>
          <span className="border-b border-black flex-1">{data.clinic.name}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">ИИН:</span>
          <span className="border-b border-black flex-1">{data.patient.iin}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Ф.И.О. (при его наличии):</span>
          <span className="border-b border-black flex-1">{data.patient.fullName}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Дата рождения:</span>
          <span className="border-b border-black flex-1">{data.patient.dob}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Пол:</span>
          <span className="flex gap-4">
            <span className={data.patient.gender === 'male' ? 'font-bold' : ''}>мужской</span>
            <span className={data.patient.gender === 'female' ? 'font-bold' : ''}>женский</span>
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Адрес проживания:</span>
          <span className="border-b border-black flex-1">{data.patient.address}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Адрес регистрации:</span>
          <span className="border-b border-black flex-1">{data.patient.registrationAddress || data.patient.address}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Место работы/учебы/детского учреждения:</span>
          <span className="border-b border-black flex-1">{data.patient.jobLocation}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Должность:</span>
          <span className="border-b border-black flex-1">{data.patient.position}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold min-w-[200px]">Дата последнего медицинского обследования:</span>
          <span className="border-b border-black flex-1">{data.lastExamDate || '—'}</span>
        </div>
      </div>

      {/* Заболевания */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-bold">Заболевания, выявленные с момента последнего медосмотра наименование:</span>
        </div>
        <div className="border border-gray-400 p-3 min-h-[60px] text-sm">
          {data.diseasesSinceLastExam || 'Не выявлено'}
        </div>
      </div>

      {/* Заключение терапевта/ВОП */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="mb-3">
          <div className="font-bold mb-2">Заключение терапевта/ВОП</div>
          <div className="text-sm space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">Ф.И.О. (ПРИ ЕГО НАЛИЧИИ), идентификатор:</span>
              <span className="border-b border-black flex-1">{data.therapistConclusion?.doctorName || '—'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">Дата:</span>
              <span className="border-b border-black flex-1">{data.therapistConclusion?.date || '—'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">наименование код:</span>
              <span className="border-b border-black flex-1">{data.therapistConclusion?.diagnosis || '—'}</span>
            </div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Заключение:</div>
              <div className="border border-gray-300 p-2 min-h-[60px] text-sm">
                {data.therapistConclusion?.conclusion || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Заключение нарколога */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="mb-3">
          <div className="font-bold mb-2">Заключение нарколога</div>
          <div className="text-sm space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">Ф.И.О. (ПРИ ЕГО НАЛИЧИИ), идентификатор:</span>
              <span className="border-b border-black flex-1">{data.narcologistConclusion?.doctorName || '—'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">Дата:</span>
              <span className="border-b border-black flex-1">{data.narcologistConclusion?.date || '—'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">наименование код:</span>
              <span className="border-b border-black flex-1">{data.narcologistConclusion?.diagnosis || '—'}</span>
            </div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Заключение:</div>
              <div className="border border-gray-300 p-2 min-h-[60px] text-sm">
                {data.narcologistConclusion?.conclusion || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Исследования жидких биологических сред */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="font-bold mb-2">Исследования жидких биологических сред на наличие психоактивных веществ</div>
        <div className="text-sm space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Дата:</span>
            <span className="border-b border-black flex-1">{data.drugTest?.date || '—'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Результат:</span>
            <span className="border-b border-black flex-1">{data.drugTest?.result || '—'}</span>
          </div>
        </div>
      </div>

      {/* Заключение психиатра */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="mb-3">
          <div className="font-bold mb-2">Заключение психиатра</div>
          <div className="text-sm space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold min-w-[150px]">Ф.И.О. (ПРИ ЕГО НАЛИЧИИ), идентификатор:</span>
              <span className="border-b border-black flex-1">{data.psychiatristConclusion?.doctorName || '—'}</span>
            </div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Заключение:</div>
              <div className="border border-gray-300 p-2 min-h-[60px] text-sm">
                {data.psychiatristConclusion?.conclusion || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Психологическое тестирование */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="font-bold mb-2">Психологическое тестирование:</div>
        <div className="text-sm space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Дата:</span>
            <span className="border-b border-black flex-1">{data.psychologicalTest?.date || '—'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Результат:</span>
            <span className="border-b border-black flex-1">{data.psychologicalTest?.result || '—'}</span>
          </div>
        </div>
      </div>

      {/* Данные рентгенологического обследования */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="font-bold mb-2">Данные рентгенологического (флюорографического) обследования</div>
        <div className="text-sm space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Дата:</span>
            <span className="border-b border-black flex-1">{data.fluorography?.date || '—'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold min-w-[150px]">Результат:</span>
            <span className="border-b border-black flex-1">{data.fluorography?.result || '—'}</span>
          </div>
        </div>
      </div>

      {/* Данные лабораторных исследований */}
      <div className="mb-6 border border-gray-400 p-4">
        <div className="font-bold mb-2">Данные лабораторных исследований</div>
        <div className="border border-gray-300 p-3 min-h-[80px] text-sm">
          {data.labResults || '—'}
        </div>
      </div>

      {/* Врачебное заключение */}
      <div className="mb-6 border-2 border-black p-4">
        <div className="font-bold mb-2">Врачебное заключение о профессиональной пригодности с указанием условий:</div>
        <div className="border border-gray-300 p-3 min-h-[100px] text-sm">
          {data.finalConclusion.fullText || '—'}
        </div>
      </div>

      {/* Подписи */}
      <div className="mt-8 space-y-6">
        <div className="flex justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <span className="font-semibold">Лицо, заполнявшее справку</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm min-w-[100px]">Идентификатор:</span>
              <span className="border-b border-black flex-1"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm min-w-[100px]">Ф.И.О. (при его наличии):</span>
              <span className="border-b border-black flex-1"></span>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex-1">
            <div className="mb-2">
              <span className="font-semibold">Руководитель медицинской организации</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm min-w-[100px]">Идентификатор:</span>
              <span className="border-b border-black flex-1"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm min-w-[100px]">Ф.И.О. (при его наличии):</span>
              <span className="border-b border-black flex-1">{data.clinic.directorName || ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Стили для печати */}
      <style>{`
        @media print {
          .document-print {
            page-break-inside: avoid;
          }
          .document-print table {
            page-break-inside: auto;
          }
          .document-print tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
};

export default Form075;
