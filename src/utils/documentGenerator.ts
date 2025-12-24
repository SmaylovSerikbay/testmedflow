import { Form075Data, HealthPassportData, DoctorVerdict } from '../types/documents';
import { AmbulatoryCard } from '../../types';

/**
 * Преобразует данные амбулаторной карты в форму 075/у
 */
export function generateForm075(card: AmbulatoryCard, clinicInfo: {
  name: string;
  address: string;
  bin: string;
  directorName?: string;
}): Form075Data {
  // Извлекаем заключения специалистов
  const therapistEntry = card.specialistEntries?.['Терапевт'] || card.specialistEntries?.['ВОП'];
  const narcologistEntry = card.specialistEntries?.['Нарколог'];
  const psychiatristEntry = card.specialistEntries?.['Психиатр'];

  // Формируем заключение терапевта
  const therapistConclusion = therapistEntry ? {
    doctorName: therapistEntry.doctorName || 'Терапевт',
    date: therapistEntry.date || new Date().toISOString().split('T')[0],
    diagnosis: therapistEntry.diagnosis || '',
    conclusion: therapistEntry.recommendations || 
                (therapistEntry.fitnessStatus === 'fit' ? 'Годен к работе' : 
                 therapistEntry.fitnessStatus === 'unfit' ? 'Не годен к работе' : 
                 'Требует наблюдения')
  } : undefined;

  // Формируем заключение нарколога
  const narcologistConclusion = narcologistEntry ? {
    doctorName: narcologistEntry.doctorName || 'Нарколог',
    date: narcologistEntry.date || new Date().toISOString().split('T')[0],
    diagnosis: narcologistEntry.diagnosis || '',
    conclusion: narcologistEntry.recommendations || 
                (narcologistEntry.fitnessStatus === 'fit' ? 'Годен к работе' : 
                 narcologistEntry.fitnessStatus === 'unfit' ? 'Не годен к работе' : 
                 'Требует наблюдения')
  } : undefined;

  // Формируем заключение психиатра
  const psychiatristConclusion = psychiatristEntry ? {
    doctorName: psychiatristEntry.doctorName || 'Психиатр',
    date: psychiatristEntry.date || new Date().toISOString().split('T')[0],
    diagnosis: psychiatristEntry.diagnosis || '',
    conclusion: psychiatristEntry.recommendations || 
                (psychiatristEntry.fitnessStatus === 'fit' ? 'Годен к работе' : 
                 psychiatristEntry.fitnessStatus === 'unfit' ? 'Не годен к работе' : 
                 'Требует наблюдения')
  } : undefined;

  // Ищем флюорографию
  const fluorographyEntry = card.labResults?.['Флюорография'] || card.labResults?.['ФЛГ'];
  const fluorography = fluorographyEntry ? {
    date: fluorographyEntry.date || '',
    result: `${fluorographyEntry.value || ''} ${fluorographyEntry.norm || 'Норма'}`
  } : undefined;

  // Формируем данные лабораторных исследований
  let labResults = '';
  if (card.labResults) {
    const labEntries: string[] = [];
    Object.entries(card.labResults).forEach(([testName, result]) => {
      if (result && testName !== 'Флюорография' && testName !== 'ФЛГ') {
        const date = result.date || '';
        const value = result.value || '';
        const norm = result.norm || '';
        labEntries.push(`${testName}: ${value} ${norm ? `(${norm})` : ''} ${date ? `от ${date}` : ''}`);
      }
    });
    labResults = labEntries.length > 0 ? labEntries.join('; ') : 'Анализы в пределах нормы';
  }

  // Итоговое заключение
  const finalConclusion = {
    status: (card.finalConclusion?.isFit ? 'FIT' : 'UNFIT') as 'FIT' | 'UNFIT',
    fullText: card.finalConclusion?.restrictions || 
              (card.finalConclusion?.isFit ? 'Годен к работе' : 'Не годен к работе'),
    chairmanName: card.finalConclusion?.chairmanName || 'Не указан'
  };

  return {
    docNumber: `075-${card.patientUid}-${new Date().getFullYear()}`,
    issueDate: card.finalConclusion?.date || new Date().toISOString().split('T')[0],
    clinic: {
      ...clinicInfo,
      directorName: clinicInfo.directorName
    },
    patient: {
      fullName: card.general.fullName || '',
      iin: card.iin || card.patientUid,
      dob: card.general.dob || '',
      gender: card.general.gender || 'male',
      address: card.general.address || '',
      registrationAddress: card.general.address || '', // Используем тот же адрес, если нет отдельного
      jobLocation: card.general.workPlace || '',
      position: card.general.position || ''
    },
    lastExamDate: card.finalConclusion?.date || '',
    diseasesSinceLastExam: 'Не выявлено', // TODO: Получить из истории
    therapistConclusion,
    narcologistConclusion,
    psychiatristConclusion,
    drugTest: undefined, // TODO: Получить из данных нарколога
    psychologicalTest: undefined, // TODO: Получить из данных психиатра
    fluorography,
    labResults: labResults || undefined,
    finalConclusion
  };
}

/**
 * Парсит строку вредных факторов в массив
 */
function parseHarmfulFactorsString(factorString?: string): string[] {
  if (!factorString) return [];
  
  // Разбиваем по запятым и очищаем
  return factorString
    .split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
}

/**
 * Преобразует данные амбулаторной карты в Паспорт здоровья
 */
export function generateHealthPassport(
  card: AmbulatoryCard,
  workConditions: {
    companyName: string;
    department: string;
    profession: string;
    harmfulFactors: string[] | string; // Может быть массивом или строкой
    hazardExperienceYears: number;
  },
  employeePhoto?: string
): HealthPassportData {
  // Нормализуем harmfulFactors
  const harmfulFactors = Array.isArray(workConditions.harmfulFactors)
    ? workConditions.harmfulFactors
    : parseHarmfulFactorsString(workConditions.harmfulFactors);
  // Собираем заключения врачей
  const doctors: DoctorVerdict[] = [];
  
  if (card.specialistEntries) {
    Object.entries(card.specialistEntries).forEach(([specialty, entry]) => {
      if (entry) {
        let verdictShort = '';
        
        // Формируем краткое заключение
        if (entry.objective) {
          // Пытаемся извлечь ключевую информацию из objective
          try {
            const objectiveData = typeof entry.objective === 'string' 
              ? JSON.parse(entry.objective) 
              : entry.objective;
            
            if (typeof objectiveData === 'object') {
              const keyValues = Object.entries(objectiveData)
                .slice(0, 2)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
              verdictShort = keyValues || 'Осмотр проведен';
            } else {
              verdictShort = entry.objective.substring(0, 100);
            }
          } catch {
            verdictShort = entry.objective.substring(0, 100);
          }
        } else {
          verdictShort = entry.fitnessStatus === 'fit' ? 'Годен' : 
                        entry.fitnessStatus === 'unfit' ? 'Не годен' : 
                        'Требует наблюдения';
        }

        doctors.push({
          specialty,
          doctorName: entry.doctorName || specialty,
          verdictShort
        });
      }
    });
  }

  // Заключение профпатолога (берем из финального заключения или ищем профпатолога)
  let profpathologistConclusion = 'Противопоказаний не выявлено';
  const profpathologistEntry = card.specialistEntries?.['Профпатолог'] || 
                               card.specialistEntries?.['Профпатологов'];
  
  if (profpathologistEntry) {
    profpathologistConclusion = profpathologistEntry.recommendations || 
                                profpathologistEntry.diagnosis || 
                                'Противопоказаний не выявлено';
  } else if (card.finalConclusion) {
    profpathologistConclusion = card.finalConclusion.restrictions || 
                                (card.finalConclusion.isFit ? 'Противопоказаний не выявлено' : 'Выявлены противопоказания');
  }

  // Рекомендации
  const recommendations: string[] = [];
  if (card.finalConclusion?.restrictions) {
    recommendations.push(card.finalConclusion.restrictions);
  }

  // Собираем рекомендации от всех врачей
  if (card.specialistEntries) {
    Object.values(card.specialistEntries).forEach(entry => {
      if (entry?.recommendations) {
        const recs = entry.recommendations.split(/[.;]/).filter(r => r.trim());
        recommendations.push(...recs.map(r => r.trim()));
      }
    });
  }

  return {
    employeePhoto: employeePhoto || '',
    baseInfo: {
      bloodType: card.medical.bloodGroup && card.medical.rhFactor 
        ? `${card.medical.bloodGroup} ${card.medical.rhFactor}`
        : card.medical.bloodGroup || 'Не указана',
      allergies: card.medical.allergies || 'Не выявлено'
    },
    workConditions,
    currentCheckup: {
      year: new Date().getFullYear(),
      doctors,
      profpathologistConclusion,
      recommendations: [...new Set(recommendations)] // Убираем дубликаты
    }
  };
}

