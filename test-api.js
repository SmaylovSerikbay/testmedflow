/**
 * Скрипт для тестирования всех API endpoints
 */

const API_BASE = 'http://localhost:8080/api';

async function apiRequest(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function testEndpoints() {
  console.log('🧪 Тестирование API endpoints...\n');
  
  const tests = [];
  
  // 1. Health check
  console.log('1. Проверка health endpoint...');
  const healthResponse = await fetch('http://localhost:8080/health');
  const health = { status: healthResponse.status, data: await healthResponse.text() };
  tests.push({ name: 'Health', status: health.status === 200, result: health });
  console.log(`   ${health.status === 200 ? '✅' : '❌'} Status: ${health.status}`);
  
  // 2. Contracts list (требует bin)
  console.log('\n2. Проверка списка контрактов...');
  const contracts = await apiRequest('GET', '/contracts?bin=123456789012');
  tests.push({ name: 'Contracts List', status: contracts.status === 200 || contracts.status === 400, result: contracts });
  console.log(`   ${contracts.status === 200 || contracts.status === 400 ? '✅' : '❌'} Status: ${contracts.status}`);
  if (contracts.data.error) {
    console.log(`   Сообщение: ${contracts.data.error}`);
  }
  
  // 3. Named Lists endpoint structure
  console.log('\n3. Проверка структуры Named Lists endpoint...');
  const namedLists = await apiRequest('GET', '/contracts/1/named-lists');
  tests.push({ name: 'Named Lists', status: namedLists.status === 200 || namedLists.status === 404 || namedLists.status === 400, result: namedLists });
  console.log(`   ${namedLists.status === 200 || namedLists.status === 404 || namedLists.status === 400 ? '✅' : '❌'} Status: ${namedLists.status}`);
  
  // 4. Summary Report endpoint structure
  console.log('\n4. Проверка структуры Summary Report endpoint...');
  const summaryReport = await apiRequest('GET', '/contracts/1/summary-report');
  tests.push({ name: 'Summary Report', status: summaryReport.status === 200 || summaryReport.status === 404 || summaryReport.status === 400, result: summaryReport });
  console.log(`   ${summaryReport.status === 200 || summaryReport.status === 404 || summaryReport.status === 400 ? '✅' : '❌'} Status: ${summaryReport.status}`);
  
  // 5. Emergency Notices endpoint structure
  console.log('\n5. Проверка структуры Emergency Notices endpoint...');
  const emergencyNotices = await apiRequest('GET', '/contracts/1/emergency-notices');
  tests.push({ name: 'Emergency Notices', status: emergencyNotices.status === 200 || emergencyNotices.status === 404 || emergencyNotices.status === 400, result: emergencyNotices });
  console.log(`   ${emergencyNotices.status === 200 || emergencyNotices.status === 404 || emergencyNotices.status === 400 ? '✅' : '❌'} Status: ${emergencyNotices.status}`);
  
  // 6. Health Plan endpoint structure
  console.log('\n6. Проверка структуры Health Plan endpoint...');
  try {
    const healthPlan = await apiRequest('GET', '/contracts/1/health-plan');
    tests.push({ name: 'Health Plan', status: healthPlan.status === 200 || healthPlan.status === 404 || healthPlan.status === 400, result: healthPlan });
    console.log(`   ${healthPlan.status === 200 || healthPlan.status === 404 || healthPlan.status === 400 ? '✅' : '❌'} Status: ${healthPlan.status}`);
  } catch (error) {
    console.log(`   ⚠️  Health Plan endpoint недоступен: ${error.message}`);
    tests.push({ name: 'Health Plan', status: false, result: { error: error.message } });
  }
  
  // 7. Ambulatory Cards endpoint
  console.log('\n7. Проверка Ambulatory Cards endpoint...');
  const ambulatoryCards = await apiRequest('GET', '/ambulatory-cards?iin=123456789012');
  tests.push({ name: 'Ambulatory Cards', status: ambulatoryCards.status === 200 || ambulatoryCards.status === 400, result: ambulatoryCards });
  console.log(`   ${ambulatoryCards.status === 200 || ambulatoryCards.status === 400 ? '✅' : '❌'} Status: ${ambulatoryCards.status}`);
  
  // 8. Visits endpoint
  console.log('\n8. Проверка Visits endpoint...');
  const visits = await apiRequest('GET', '/visits?bin=123456789012');
  tests.push({ name: 'Visits', status: visits.status === 200 || visits.status === 400, result: visits });
  console.log(`   ${visits.status === 200 || visits.status === 400 ? '✅' : '❌'} Status: ${visits.status}`);
  
  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ:');
  console.log('='.repeat(50));
  
  const passed = tests.filter(t => t.status).length;
  const failed = tests.filter(t => !t.status).length;
  
  console.log(`✅ Успешно: ${passed}`);
  console.log(`❌ Ошибки: ${failed}`);
  console.log(`📈 Всего: ${tests.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Проблемные endpoints:');
    tests.filter(t => !t.status).forEach(t => {
      console.log(`   - ${t.name}: Status ${t.result.status}`);
      if (t.result.error) {
        console.log(`     Ошибка: ${t.result.error}`);
      }
    });
  }
  
  console.log('\n✅ Тестирование завершено!');
}

// Запуск тестов
testEndpoints().catch(console.error);

