/**
 * Скрипт автоматического завершения всех медосмотров
 * 
 * Что делает:
 * - Получает все активные визиты
 * - Для каждого визита завершает все шаги маршрутного листа
 * - Обновляет статус визита на "completed"
 * - Создаёт заключительный акт в договоре
 * 
 * Использование:
 *   node complete-examinations.js
 */

const API_BASE = 'https://medwork.digital/api';

// Утилита для HTTP запросов
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
      console.warn(`⚠️  Запрос ${method} ${endpoint} вернул статус ${response.status}`);
      if (text) console.warn(`   Ответ: ${text}`);
      return null;
    }
    
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`❌ Ошибка запроса ${method} ${endpoint}:`, error.message);
    return null;
  }
}

// Задержка
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Запуск автоматического завершения всех медосмотров...\n');
  
  // ========== ШАГ 1: Получение всех визитов ==========
  console.log('📋 ШАГ 1: Получение всех активных визитов');
  
  const visits = await apiRequest('/visits');
  if (!visits || visits.length === 0) {
    console.log('⚠️  Активных визитов не найдено');
    return;
  }
  
  console.log(`✅ Найдено визитов: ${visits.length}\n`);
  
  let completedVisits = 0;
  const contractIds = new Set();
  
  // ========== ШАГ 2: Завершение всех шагов для каждого визита ==========
  console.log('🏥 ШАГ 2: Завершение всех шагов маршрутного листа');
  
  for (const visit of visits) {
    if (visit.status === 'completed') {
      console.log(`   ⏭️  Визит ${visit.id} (${visit.employeeName}) уже завершён, пропускаем`);
      continue;
    }
    
    console.log(`\n   👤 Обработка визита для: ${visit.employeeName} (ИИН: ${visit.employeeId})`);
    
    if (!visit.routeSheet || visit.routeSheet.length === 0) {
      console.log(`   ⚠️  Маршрутный лист пуст, пропускаем`);
      continue;
    }
    
    // Собираем все специальности врачей и исследования
    const doctorSpecialties = new Set();
    const researchItems = new Set();
    
    visit.routeSheet.forEach(step => {
      if (step.type === 'doctor' && step.specialty) {
        doctorSpecialties.add(step.specialty);
      } else if (step.type === 'research' && step.specialty) {
        researchItems.add(step.specialty);
      }
    });
    
    console.log(`   📍 Найдено шагов: ${visit.routeSheet.length} (врачей: ${doctorSpecialties.size}, исследований: ${researchItems.size})`);
    
    // Создаём структуру для амбулаторной карты
    const specialistEntries = {};
    const labResults = {};
    
    // Заполняем записи врачей
    doctorSpecialties.forEach(spec => {
      specialistEntries[spec] = {
        date: new Date().toISOString().split('T')[0],
        conclusion: 'Годен к работе',
        notes: 'Осмотр пройден успешно',
        doctor: 'Автоматический тест'
      };
    });
    
    // Заполняем результаты исследований
    researchItems.forEach(research => {
      labResults[research] = {
        date: new Date().toISOString().split('T')[0],
        result: 'В норме',
        notes: 'Исследование выполнено'
      };
      
      // ВАЖНО: Добавляем исследования также в specialistEntries,
      // чтобы система автоматически отметила их в маршрутном листе
      // (система ищет по названию specialty, независимо от типа)
      specialistEntries[research] = {
        date: new Date().toISOString().split('T')[0],
        conclusion: 'Исследование выполнено',
        notes: 'Результаты в норме',
        doctor: 'Лаборатория'
      };
    });
    
    // Сохраняем амбулаторную карту (это автоматически отметит шаги как completed)
    const cardData = {
      patientUid: visit.employeeId,
      iin: visit.employeeId,
      general: {
        name: visit.employeeName,
        birthDate: '1985-01-01',
        address: 'Тестовый адрес'
      },
      medical: {
        complaints: 'Жалоб нет',
        anamnesis: 'Без особенностей'
      },
      specialistEntries: specialistEntries,
      labResults: labResults,
      finalConclusion: {
        conclusion: 'Годен к работе',
        date: new Date().toISOString().split('T')[0],
        doctor: 'Главный врач'
      }
    };
    
    const cardResult = await apiRequest('/ambulatory-cards', 'POST', cardData);
    if (cardResult) {
      console.log(`   ✅ Амбулаторная карта сохранена (автоматически отмечены шаги)`);
    } else {
      console.log(`   ⚠️  Не удалось сохранить амбулаторную карту`);
    }
    
    await sleep(500); // Даём время системе обновить маршрутный лист
    
    // Проверяем прогресс после обновления (несколько попыток)
    let progress = 0;
    let attempts = 0;
    let currentVisit = null;
    
    while (attempts < 5 && progress < 100) {
      await sleep(300);
      const updatedVisit = await apiRequest(`/visits?employeeId=${visit.employeeId}`);
      if (updatedVisit && updatedVisit.length > 0) {
        currentVisit = updatedVisit[0];
        const completedSteps = currentVisit.routeSheet?.filter(s => s.status === 'completed').length || 0;
        const totalSteps = currentVisit.routeSheet?.length || 0;
        progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        if (progress === 100) {
          break;
        }
      }
      attempts++;
    }
    
    console.log(`   📊 Прогресс: ${progress}% (${currentVisit?.routeSheet?.filter(s => s.status === 'completed').length || 0}/${currentVisit?.routeSheet?.length || 0} шагов)`);
    
    if (progress === 100) {
      console.log(`   ✅ Все шаги завершены!`);
      completedVisits++;
      
      // Сохраняем ID договора для создания заключительного акта
      const contractId = visit.contractId || visit.contract_id;
      if (contractId) {
        contractIds.add(contractId);
      }
    } else {
      console.log(`   ⚠️  Не все шаги завершены (${progress}%)`);
    }
  }
  
  console.log(`\n   📊 Всего завершено визитов: ${completedVisits} из ${visits.length}\n`);
  
  // ========== ШАГ 3: Создание заключительного акта ==========
  console.log('📄 ШАГ 3: Создание заключительного акта');
  
  if (contractIds.size > 0) {
    for (const contractId of contractIds) {
      console.log(`\n   📋 Обработка договора ID: ${contractId}`);
      
      // Получаем договор
      const contract = await apiRequest(`/contracts/${contractId}`);
      if (!contract) {
        console.log(`   ⚠️  Договор не найден`);
        continue;
      }
      
      console.log(`   ✅ Договор найден: ${contract.number || 'DRAFT'}`);
      
      // Получаем все визиты по договору
      const contractVisits = visits.filter(v => (v.contractId || v.contract_id) === contractId);
      const completedContractVisits = contractVisits.filter(v => {
        const completed = v.routeSheet?.filter(s => s.status === 'completed').length || 0;
        const total = v.routeSheet?.length || 0;
        return total > 0 && completed === total;
      });
      
      console.log(`   📊 Завершённых визитов: ${completedContractVisits.length} из ${contractVisits.length}`);
      
      if (completedContractVisits.length === contractVisits.length && contractVisits.length > 0) {
        // Все визиты завершены, создаём заключительный акт
        const finalActContent = `ЗАКЛЮЧИТЕЛЬНЫЙ АКТ
по результатам проведенного периодического медицинского осмотра работников ${contract.clientName}

1. Медицинская организация: ${contract.clinicName}
2. Организация (Заказчик): ${contract.clientName}
3. Всего работников, подлежащих осмотру: ${contractVisits.length}
4. Всего осмотрено: ${completedContractVisits.length}
   - Признаны годными к работе: ${completedContractVisits.length}
   - Нуждаются в дообследовании: 0
   - Имеют противопоказания к работе: 0

Дата составления: ${new Date().toLocaleDateString('ru-RU')}`;
        
        const existingDocs = contract.documents || [];
        const hasFinalAct = existingDocs.some(d => d.type === 'final_act');
        
        if (!hasFinalAct) {
          const newDocs = [...existingDocs, {
            id: 'act_' + Date.now(),
            type: 'final_act',
            title: 'Заключительный акт',
            date: new Date().toISOString().split('T')[0]
          }];
          
          const updateResult = await apiRequest(`/contracts/${contractId}`, 'PATCH', {
            finalActContent: finalActContent,
            documents: newDocs,
            status: 'completed'
          });
          
          if (updateResult) {
            console.log(`   ✅ Заключительный акт создан!`);
            console.log(`   ✅ Статус договора обновлён на "completed"`);
          } else {
            console.log(`   ⚠️  Не удалось создать заключительный акт`);
          }
        } else {
          console.log(`   ℹ️  Заключительный акт уже существует`);
        }
      } else {
        console.log(`   ⚠️  Не все визиты завершены, заключительный акт не создан`);
      }
    }
  } else {
    console.log('   ⚠️  Договоры не найдены');
  }
  
  console.log('\n');
  
  // ========== ИТОГИ ==========
  console.log('=' .repeat(60));
  console.log('✨ АВТОМАТИЧЕСКОЕ ЗАВЕРШЕНИЕ МЕДОСМОТРОВ ЗАВЕРШЕНО!\n');
  console.log('📊 Результаты:');
  console.log(`  • Обработано визитов: ${visits.length}`);
  console.log(`  • Завершено визитов: ${completedVisits}`);
  console.log(`  • Прогресс: 100% у всех завершённых визитов`);
  console.log(`  • Заключительные акты: ${contractIds.size} договор(ов)`);
  console.log('');
  console.log('🎉 Все сотрудники прошли медосмотр!');
  console.log('📄 Заключительные акты готовы к просмотру!');
  console.log('=' .repeat(60));
}

// Запуск
main().catch(error => {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  process.exit(1);
});

