import { AmbulatoryCard, Contract, Doctor } from '../types';

/**
 * Генерация HTML для формы 052у (Медицинская карта амбулаторного пациента)
 */
export const generateForm052HTML = (
  card: AmbulatoryCard,
  contract: Contract,
  doctors: Doctor[]
): string => {
  // Проверяем, что карта имеет необходимую структуру
  if (!card || !card.personalInfo) {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Ошибка - Форма № 052/у</title>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>Ошибка</h1>
    <p>Амбулаторная карта не найдена или повреждена.</p>
    <p>Обратитесь к врачу для создания карты.</p>
  </div>
</body>
</html>
    `.trim();
  }
  const getDoctorName = (specialty: string): string => {
    const doctor = doctors.find(d => d.specialty === specialty);
    return doctor?.name || specialty;
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

  const calculateAge = (dob?: string): string => {
    if (!dob) return '—';
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return `${age} лет`;
    } catch {
      return '—';
    }
  };

  const calculateBMI = (): string => {
    if (card.vitals?.height && card.vitals?.weight) {
      const heightM = card.vitals.height / 100;
      const bmi = card.vitals.weight / (heightM * heightM);
      return bmi.toFixed(1);
    }
    return '—';
  };

  // Генерация HTML
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Форма № 052/у - ${card.personalInfo.fullName}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      margin: 0;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .header h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 5px 0;
    }
    
    .header .card-number {
      font-size: 14pt;
      margin: 10px 0;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    
    .field {
      margin-bottom: 8px;
    }
    
    .field-label {
      font-weight: bold;
      display: inline-block;
      min-width: 200px;
    }
    
    .field-value {
      display: inline;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    table, th, td {
      border: 1px solid #000;
    }
    
    th, td {
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    
    .examination-block {
      margin: 15px 0;
      padding: 10px;
      border: 1px solid #ccc;
      page-break-inside: avoid;
    }
    
    .examination-header {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 10px;
      color: #333;
    }
    
    .conclusion-block {
      margin-top: 20px;
      padding: 15px;
      border: 2px solid #000;
      background-color: #f9f9f9;
      page-break-inside: avoid;
    }
    
    .signature-line {
      margin-top: 30px;
      border-top: 1px solid #000;
      width: 300px;
      padding-top: 5px;
    }
    
    .footer {
      margin-top: 40px;
      font-size: 10pt;
      color: #666;
      text-align: center;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- Заголовок -->
  <div class="header">
    <h1>МЕДИЦИНСКАЯ КАРТА АМБУЛАТОРНОГО ПАЦИЕНТА</h1>
    <h1>Форма № 052/у</h1>
    <div class="card-number">№ ${card.cardNumber || '—'}</div>
    <div style="margin-top: 10px; font-size: 11pt;">
      ${contract.clinicName}<br>
      БИН: ${contract.clinicBin}
    </div>
  </div>

  <!-- Паспортная часть -->
  <div class="section">
    <div class="section-title">1. ПАСПОРТНАЯ ЧАСТЬ</div>
    
    <div class="field">
      <span class="field-label">ФИО:</span>
      <span class="field-value">${card.personalInfo?.fullName || '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Дата рождения:</span>
      <span class="field-value">${formatDate(card.personalInfo?.dateOfBirth)} (${calculateAge(card.personalInfo?.dateOfBirth)})</span>
    </div>
    
    <div class="field">
      <span class="field-label">Пол:</span>
      <span class="field-value">${card.personalInfo?.gender === 'М' ? 'Мужской' : card.personalInfo?.gender === 'Ж' ? 'Женский' : '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Адрес:</span>
      <span class="field-value">${card.personalInfo?.address || '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Телефон:</span>
      <span class="field-value">${card.personalInfo?.phone || '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Место работы:</span>
      <span class="field-value">${card.personalInfo?.workplace || '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Должность:</span>
      <span class="field-value">${card.personalInfo?.position || '—'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Вредные факторы:</span>
      <span class="field-value">${card.personalInfo?.harmfulFactors || '—'}</span>
    </div>
    
    ${card.personalInfo.bloodType ? `
    <div class="field">
      <span class="field-label">Группа крови:</span>
      <span class="field-value">${card.personalInfo.bloodType} ${card.personalInfo.rhFactor || ''}</span>
    </div>
    ` : ''}
    
    ${card.personalInfo.snils ? `
    <div class="field">
      <span class="field-label">СНИЛС:</span>
      <span class="field-value">${card.personalInfo.snils}</span>
    </div>
    ` : ''}
  </div>

  <!-- Анамнез -->
  ${card.anamnesis ? `
  <div class="section">
    <div class="section-title">2. АНАМНЕЗ</div>
    
    ${card.anamnesis.chronicDiseases ? `
    <div class="field">
      <span class="field-label">Хронические заболевания:</span>
      <div class="field-value">${card.anamnesis.chronicDiseases}</div>
    </div>
    ` : ''}
    
    ${card.anamnesis.pastDiseases ? `
    <div class="field">
      <span class="field-label">Перенесенные заболевания:</span>
      <div class="field-value">${card.anamnesis.pastDiseases}</div>
    </div>
    ` : ''}
    
    ${card.anamnesis.allergies ? `
    <div class="field">
      <span class="field-label">Аллергологический анамнез:</span>
      <div class="field-value">${card.anamnesis.allergies}</div>
    </div>
    ` : ''}
    
    ${card.anamnesis.badHabits ? `
    <div class="field">
      <span class="field-label">Вредные привычки:</span>
      <div class="field-value">${card.anamnesis.badHabits}</div>
    </div>
    ` : ''}
    
    ${card.anamnesis.heredity ? `
    <div class="field">
      <span class="field-label">Наследственность:</span>
      <div class="field-value">${card.anamnesis.heredity}</div>
    </div>
    ` : ''}
    
    ${card.anamnesis.occupationalHistory ? `
    <div class="field">
      <span class="field-label">Профессиональный маршрут:</span>
      <div class="field-value">${card.anamnesis.occupationalHistory}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Антропометрия -->
  ${card.vitals ? `
  <div class="section">
    <div class="section-title">3. АНТРОПОМЕТРИЯ И ВИТАЛЬНЫЕ ПОКАЗАТЕЛИ</div>
    
    <table>
      <tr>
        <th>Показатель</th>
        <th>Значение</th>
        <th>Норма</th>
      </tr>
      ${card.vitals.height ? `
      <tr>
        <td>Рост</td>
        <td>${card.vitals.height} см</td>
        <td>—</td>
      </tr>
      ` : ''}
      ${card.vitals.weight ? `
      <tr>
        <td>Вес</td>
        <td>${card.vitals.weight} кг</td>
        <td>—</td>
      </tr>
      ` : ''}
      ${card.vitals.height && card.vitals.weight ? `
      <tr>
        <td>ИМТ (индекс массы тела)</td>
        <td>${calculateBMI()}</td>
        <td>18.5-24.9</td>
      </tr>
      ` : ''}
      ${card.vitals.bloodPressure ? `
      <tr>
        <td>Артериальное давление</td>
        <td>${card.vitals.bloodPressure} мм рт.ст.</td>
        <td>120/80</td>
      </tr>
      ` : ''}
      ${card.vitals.pulse ? `
      <tr>
        <td>Пульс</td>
        <td>${card.vitals.pulse} уд/мин</td>
        <td>60-80</td>
      </tr>
      ` : ''}
    </table>
    
    ${card.vitals.measuredAt ? `
    <div style="font-size: 10pt; color: #666; margin-top: 5px;">
      Дата измерения: ${formatDate(card.vitals.measuredAt)}
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Лабораторные исследования -->
  ${card.labTests && (card.labTests.bloodTest || card.labTests.biochemistry || card.labTests.urineTest || card.labTests.ecg || card.labTests.fluorography) ? `
  <div class="section">
    <div class="section-title">4. ЛАБОРАТОРНЫЕ И ФУНКЦИОНАЛЬНЫЕ ИССЛЕДОВАНИЯ</div>
    
    <table>
      <tr>
        <th>Исследование</th>
        <th>Дата</th>
        <th>Результат</th>
        <th>Заключение</th>
      </tr>
      ${card.labTests.bloodTest ? `
      <tr>
        <td>Общий анализ крови</td>
        <td>${formatDate(card.labTests.bloodTest.date)}</td>
        <td>${card.labTests.bloodTest.result}</td>
        <td>${card.labTests.bloodTest.conclusion || '—'}</td>
      </tr>
      ` : ''}
      ${card.labTests.biochemistry ? `
      <tr>
        <td>Биохимический анализ крови</td>
        <td>${formatDate(card.labTests.biochemistry.date)}</td>
        <td>${card.labTests.biochemistry.result}</td>
        <td>${card.labTests.biochemistry.conclusion || '—'}</td>
      </tr>
      ` : ''}
      ${card.labTests.urineTest ? `
      <tr>
        <td>Общий анализ мочи</td>
        <td>${formatDate(card.labTests.urineTest.date)}</td>
        <td>${card.labTests.urineTest.result}</td>
        <td>${card.labTests.urineTest.conclusion || '—'}</td>
      </tr>
      ` : ''}
      ${card.labTests.ecg ? `
      <tr>
        <td>ЭКГ</td>
        <td>${formatDate(card.labTests.ecg.date)}</td>
        <td>${card.labTests.ecg.result}</td>
        <td>${card.labTests.ecg.conclusion || '—'}</td>
      </tr>
      ` : ''}
      ${card.labTests.fluorography ? `
      <tr>
        <td>Флюорография</td>
        <td>${formatDate(card.labTests.fluorography.date)}</td>
        <td>${card.labTests.fluorography.result}</td>
        <td>${card.labTests.fluorography.conclusion || '—'}</td>
      </tr>
      ` : ''}
      ${card.labTests.other && card.labTests.other.length > 0 ? card.labTests.other.map(test => `
      <tr>
        <td>${test.testName}</td>
        <td>${formatDate(test.date)}</td>
        <td>${test.result}</td>
        <td>${test.conclusion || '—'}</td>
      </tr>
      `).join('') : ''}
    </table>
  </div>
  ` : ''}

  <!-- Осмотры врачей -->
  <div class="section">
    <div class="section-title">5. ОСМОТРЫ ВРАЧЕЙ-СПЕЦИАЛИСТОВ</div>
    
    ${Object.entries(card.examinations).map(([specialty, exam]) => `
    <div class="examination-block">
      <div class="examination-header">${getDoctorName(specialty)}</div>
      <div style="font-size: 10pt; color: #666; margin-bottom: 10px;">
        Дата осмотра: ${formatDate(exam.date)}
      </div>
      
      ${exam.complaints ? `
      <div class="field">
        <span class="field-label">Жалобы:</span>
        <div class="field-value">${exam.complaints}</div>
      </div>
      ` : ''}
      
      ${exam.objectiveExamination ? `
      <div class="field">
        <span class="field-label">Объективный осмотр:</span>
        <div class="field-value">${exam.objectiveExamination}</div>
      </div>
      ` : ''}
      
      ${exam.diagnosis ? `
      <div class="field">
        <span class="field-label">Диагноз:</span>
        <div class="field-value"><strong>${exam.diagnosis}</strong></div>
      </div>
      ` : ''}
      
      ${exam.conclusion ? `
      <div class="field">
        <span class="field-label">Заключение:</span>
        <div class="field-value">${exam.conclusion}</div>
      </div>
      ` : ''}
      
      ${exam.recommendations ? `
      <div class="field">
        <span class="field-label">Рекомендации:</span>
        <div class="field-value">${exam.recommendations}</div>
      </div>
      ` : ''}
      
      <div class="field" style="margin-top: 10px;">
        <span class="field-label">Годен к работе:</span>
        <span class="field-value"><strong>${exam.isFit ? 'ДА' : 'НЕТ'}</strong></span>
      </div>
    </div>
    `).join('')}
  </div>

  <!-- Заключение комиссии -->
  ${card.finalConclusion ? `
  <div class="section">
    <div class="section-title">6. ЗАКЛЮЧЕНИЕ ВРАЧЕБНОЙ КОМИССИИ</div>
    
    <div class="conclusion-block">
      <div class="field">
        <span class="field-label">Дата заключения:</span>
        <span class="field-value">${formatDate(card.finalConclusion.date)}</span>
      </div>
      
      ${card.finalConclusion.diagnosis ? `
      <div class="field">
        <span class="field-label">Диагноз:</span>
        <div class="field-value"><strong>${card.finalConclusion.diagnosis}</strong></div>
      </div>
      ` : ''}
      
      <div class="field">
        <span class="field-label">Заключение:</span>
        <div class="field-value">
          <strong style="font-size: 14pt;">
            ${card.finalConclusion.status === 'fit' ? 'ГОДЕН К РАБОТЕ' : 
              card.finalConclusion.status === 'unfit' ? 'НЕ ГОДЕН К РАБОТЕ' : 
              'ТРЕБУЕТСЯ НАБЛЮДЕНИЕ'}
          </strong>
        </div>
      </div>
      
      ${card.finalConclusion.restrictions ? `
      <div class="field">
        <span class="field-label">Ограничения:</span>
        <div class="field-value">${card.finalConclusion.restrictions}</div>
      </div>
      ` : ''}
      
      ${card.finalConclusion.recommendations ? `
      <div class="field">
        <span class="field-label">Рекомендации:</span>
        <div class="field-value">${card.finalConclusion.recommendations}</div>
      </div>
      ` : ''}
      
      ${card.finalConclusion.nextExamDate ? `
      <div class="field">
        <span class="field-label">Дата следующего осмотра:</span>
        <span class="field-value">${formatDate(card.finalConclusion.nextExamDate)}</span>
      </div>
      ` : ''}
      
      ${card.finalConclusion.notes ? `
      <div class="field">
        <span class="field-label">Примечания:</span>
        <div class="field-value">${card.finalConclusion.notes}</div>
      </div>
      ` : ''}
      
      <div style="margin-top: 30px;">
        <div class="field">
          <span class="field-label">Председатель комиссии:</span>
          <span class="field-value">${card.finalConclusion.doctorName || getDoctorName('Профпатолог')}</span>
        </div>
        <div class="signature-line">
          Подпись: _______________________
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Футер -->
  <div class="footer">
    <p>Документ сформирован автоматически ${formatDate(new Date().toISOString())}</p>
    <p>Договор № ${contract.number} от ${formatDate(contract.date)}</p>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Открытие формы 052у в новом окне для печати
 */
export const printForm052 = (
  card: AmbulatoryCard,
  contract: Contract,
  doctors: Doctor[]
): void => {
  const html = generateForm052HTML(card, contract, doctors);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Ждем загрузки и запускаем печать
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } else {
    alert('Не удалось открыть окно печати. Проверьте настройки браузера.');
  }
};
