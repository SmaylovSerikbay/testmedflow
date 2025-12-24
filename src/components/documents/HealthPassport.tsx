import React from 'react';
import { HealthPassportData } from '../../types/documents';

interface HealthPassportProps {
  data: HealthPassportData;
}

const HealthPassport: React.FC<HealthPassportProps> = ({ data }) => {
  return (
    <div className="bg-white p-8 document-print">
      {/* Заголовок */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold mb-2">ПАСПОРТ ЗДОРОВЬЯ</h1>
        <p className="text-lg font-semibold">Работника, занятого на работах с вредными и (или) опасными производственными факторами</p>
      </div>

      {/* Фото и базовая информация */}
      <div className="mb-6 flex gap-6">
        <div className="w-32 h-40 border-2 border-gray-400 flex items-center justify-center">
          {data.employeePhoto ? (
            <img src={data.employeePhoto} alt="Фото" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">Фото</span>
          )}
        </div>
        <div className="flex-1 space-y-2 text-sm">
          <div>
            <span className="font-semibold">Группа крови:</span> {data.baseInfo.bloodType || '—'}
          </div>
          <div>
            <span className="font-semibold">Аллергические реакции:</span> {data.baseInfo.allergies || 'Не выявлено'}
          </div>
        </div>
      </div>

      {/* Условия труда */}
      <div className="mb-6 border border-gray-300 p-4">
        <h2 className="font-bold text-lg mb-3">Условия труда:</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-semibold">Организация:</span> {data.workConditions.companyName}
          </div>
          <div>
            <span className="font-semibold">Отдел:</span> {data.workConditions.department}
          </div>
          <div>
            <span className="font-semibold">Профессия:</span> {data.workConditions.profession}
          </div>
          <div>
            <span className="font-semibold">Стаж во вредных условиях:</span> {data.workConditions.hazardExperienceYears} лет
          </div>
        </div>
        
        {/* Вредные факторы */}
        <div className="mt-4">
          <span className="font-semibold">Вредные и опасные производственные факторы:</span>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {Array.isArray(data.workConditions.harmfulFactors) 
              ? data.workConditions.harmfulFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm">{factor}</li>
                ))
              : (typeof data.workConditions.harmfulFactors === 'string' && data.workConditions.harmfulFactors
                  ? data.workConditions.harmfulFactors.split(',').map((factor, idx) => (
                      <li key={idx} className="text-sm">{factor.trim()}</li>
                    ))
                  : <li className="text-sm text-slate-400">Не указано</li>
                )
            }
          </ul>
        </div>
      </div>

      {/* Текущий медосмотр */}
      <div className="mb-6 border border-gray-300 p-4">
        <h2 className="font-bold text-lg mb-3">Результаты периодического медицинского осмотра {data.currentCheckup.year} года:</h2>
        
        {/* Заключения врачей */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Заключения специалистов:</h3>
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left">Специальность</th>
                <th className="border border-gray-400 px-3 py-2 text-left">ФИО врача</th>
                <th className="border border-gray-400 px-3 py-2 text-left">Заключение</th>
              </tr>
            </thead>
            <tbody>
              {data.currentCheckup.doctors.map((doctor, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 px-3 py-2">{doctor.specialty}</td>
                  <td className="border border-gray-400 px-3 py-2">{doctor.doctorName}</td>
                  <td className="border border-gray-400 px-3 py-2">{doctor.verdictShort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Заключение профпатолога */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Заключение профпатолога:</h3>
          <p className="text-sm border border-gray-300 p-3 bg-gray-50">
            {data.currentCheckup.profpathologistConclusion}
          </p>
        </div>

        {/* Рекомендации */}
        {data.currentCheckup.recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Рекомендации:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {data.currentCheckup.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Подпись и печать */}
      <div className="mt-8 flex justify-between text-sm border-t-2 border-black pt-4">
        <div>
          <p>М.П.</p>
          <p className="mt-8">Подпись председателя комиссии: ___________</p>
        </div>
        <div className="text-right">
          <p>Дата: {new Date().toLocaleDateString('ru-RU')}</p>
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

export default HealthPassport;

