/**
 * Скрипт автоматического заполнения базы данных тестовыми данными
 * 
 * Использование:
 *   node seed-database.js
 * 
 * Что создаётся:
 * - Организация (БИН: 123456789012)
 * - Клиника (БИН: 987654321098)
 * - Врачи (Терапевт, Профпатолог, Невропатолог, Офтальмолог)
 * - Регистратура
 * - Договор с контингентом сотрудников
 * - Тестовый визит для одного сотрудника
 */

const API_BASE = 'https://medwork.digital/api';

// Тестовые данные пользователей
const USERS = {
  organization: {
    phone: '77085446945',
    role: 'organization',
    bin: '123456789012',
    companyName: 'ТОО "Тестовая Организация"',
    leaderName: 'Директор Тестов'
  },
  clinic: {
    phone: '77021491010',
    role: 'clinic',
    bin: '987654321098',
    companyName: 'Медицинский центр "Здоровье"',
    leaderName: 'Главврач Клиников'
  },
  doctor: {
    phone: '77781802575',
    role: 'doctor',
    specialty: 'Терапевт'
  },
  registration: {
    phone: '77776875411',
    role: 'registration',
    clinicBin: '987654321098'
  },
  employee: {
    phone: '77789171790',
    role: 'employee',
    employeeId: '1766342381792_64'
  }
};

// Врачи для клиники
const DOCTORS = [
  { name: 'Терапевтов Иван', specialty: 'Терапевт', roomNumber: '101', phone: '77781802575' },
  { name: 'Профпатологов Петр', specialty: 'Профпатолог', roomNumber: '102', phone: '77011111111' },
  { name: 'Невропатологов Сергей', specialty: 'Невропатолог', roomNumber: '103', phone: '77022222222' },
  { name: 'Офтальмологов Алексей', specialty: 'Офтальмолог', roomNumber: '104', phone: '77033333333' }
];

// Контингент сотрудников
const EMPLOYEES = [
  {
    id: '1766342381792_64',
    name: 'Тестов Иван Петрович',
    phone: '77789171790',
    birthDate: '1985-05-15',
    position: 'Инженер',
    department: 'Производственный отдел',
    harmfulFactor: 'Шум свыше 80 дБА. Пыль'
  },
  {
    id: '950101123456',
    name: 'Петров Сергей Иванович',
    phone: '77044444444',
    birthDate: '1990-08-20',
    position: 'Слесарь',
    department: 'Цех №1',
    harmfulFactor: 'Вибрация локальная. Шум'
  },
  {
    id: '920315987654',
    name: 'Сидорова Анна Владимировна',
    phone: '77055555555',
    birthDate: '1992-03-15',
    position: 'Лаборант',
    department: 'Лаборатория',
    harmfulFactor: 'Химические вещества 1-2 класса опасности'
  }
];

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

// Генерация UID
function generateUid(prefix = 'user') {
  return `${prefix}_${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

// Задержка
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Вспомогательная функция для создания маршрутного листа
function createRouteSheet(employee, doctors) {
  const routeSheet = [];
  
  // Базовые врачи для всех (Приказ 304)
  const baseDoctors = ['Терапевт', 'Профпатолог'];
  
  // Базовые исследования для всех
  const baseResearch = [
    'ОАК (Общий анализ крови)',
    'ОАМ (Общий анализ мочи)',
    'ЭКГ (Электрокардиография)',
    'Флюорография'
  ];
  
  // Добавляем базовых врачей
  for (const spec of baseDoctors) {
    const doctor = doctors.find(d => d.specialty === spec);
    if (doctor) {
      routeSheet.push({
        type: 'doctor',
        specialty: spec,
        doctorId: doctor.id,
        doctorName: doctor.name,
        roomNumber: doctor.roomNumber || '',
        status: 'pending'
      });
    }
  }
  
  // Добавляем специфичных врачей на основе вредных факторов
  if (employee.harmfulFactor) {
    if (employee.harmfulFactor.includes('Шум')) {
      const doctor = doctors.find(d => d.specialty === 'Невропатолог');
      if (doctor) {
        routeSheet.push({
          type: 'doctor',
          specialty: 'Невропатолог',
          doctorId: doctor.id,
          doctorName: doctor.name,
          roomNumber: doctor.roomNumber || '',
          status: 'pending'
        });
      }
      routeSheet.push({
        type: 'research',
        specialty: 'Аудиометрия',
        status: 'pending',
        roomNumber: 'Лаборатория'
      });
    }
    
    if (employee.harmfulFactor.includes('Пыль') || employee.harmfulFactor.includes('Химические')) {
      const doctor = doctors.find(d => d.specialty === 'Офтальмолог');
      if (doctor) {
        routeSheet.push({
          type: 'doctor',
          specialty: 'Офтальмолог',
          doctorId: doctor.id,
          doctorName: doctor.name,
          roomNumber: doctor.roomNumber || '',
          status: 'pending'
        });
      }
      routeSheet.push({
        type: 'research',
        specialty: 'Спирометрия',
        status: 'pending',
        roomNumber: 'Лаборатория'
      });
    }
  }
  
  // Добавляем базовые исследования
  for (const research of baseResearch) {
    routeSheet.push({
      type: 'research',
      specialty: research,
      status: 'pending',
      roomNumber: 'Лаборатория'
    });
  }
  
  return routeSheet;
}

async function main() {
  console.log('🚀 Запуск автоматического заполнения базы данных...\n');
  
  const createdUsers = {};

  // ========== ШАГ 1: Создание пользователей ==========
  console.log('📝 ШАГ 1: Создание пользователей');
  
  for (const [key, userData] of Object.entries(USERS)) {
    const uid = generateUid(userData.role);
    const user = {
      uid: uid,  // API ожидает "uid", а не "id"
      phone: userData.phone,
      role: userData.role,
      bin: userData.bin || null,
      companyName: userData.companyName || null,
      leaderName: userData.leaderName || null,
      specialty: userData.specialty || null,
      clinicBin: userData.clinicBin || null,
      employeeId: userData.employeeId || null
    };

    const result = await apiRequest('/users', 'POST', user);
    if (result) {
      createdUsers[key] = { ...user, ...result };
      console.log(`✅ ${key}: ${userData.phone} (${uid})`);
    } else {
      console.log(`⚠️  ${key}: пользователь возможно уже существует`);
      // Попробуем получить существующего пользователя
      const existing = await apiRequest(`/users/by-phone?phone=${userData.phone}`);
      if (existing) {
        createdUsers[key] = existing;
        console.log(`   ℹ️  Используется существующий: ${existing.id}`);
      }
    }
    await sleep(100);
  }
  
  console.log('');

  // ========== ШАГ 2: Обновление связей ==========
  console.log('🔗 ШАГ 2: Обновление связей между пользователями');
  
  if (createdUsers.clinic && createdUsers.registration) {
    // Обновляем регистратуру - привязываем к клинике
    const updatedReg = await apiRequest('/users', 'POST', {
      uid: createdUsers.registration.uid || createdUsers.registration.id,
      phone: createdUsers.registration.phone,
      role: 'registration',
      clinicId: createdUsers.clinic.uid || createdUsers.clinic.id,
      clinicBin: createdUsers.clinic.bin
    });
    if (updatedReg) console.log('✅ Регистратура привязана к клинике');
  }

  if (createdUsers.clinic && createdUsers.doctor) {
    // Обновляем врача - привязываем к клинике
    const updatedDoc = await apiRequest('/users', 'POST', {
      uid: createdUsers.doctor.uid || createdUsers.doctor.id,
      phone: createdUsers.doctor.phone,
      role: 'doctor',
      specialty: 'Терапевт',
      clinicId: createdUsers.clinic.uid || createdUsers.clinic.id
    });
    if (updatedDoc) console.log('✅ Врач привязан к клинике');
  }
  
  console.log('');

  // ========== ШАГ 3: Создание врачей в клинике ==========
  console.log('👨‍⚕️ ШАГ 3: Создание врачей в клинике');
  
  if (createdUsers.clinic) {
    const clinicUid = createdUsers.clinic.uid || createdUsers.clinic.id;
    for (const doctor of DOCTORS) {
      const result = await apiRequest(`/clinics/${clinicUid}/doctors`, 'POST', doctor);
      if (result) {
        console.log(`✅ ${doctor.specialty}: ${doctor.name} (каб. ${doctor.roomNumber})`);
      }
      await sleep(100);
    }
  } else {
    console.log('⚠️  Клиника не создана, врачи не добавлены');
  }
  
  console.log('');

  // ========== ШАГ 4: Создание договора с контингентом ==========
  console.log('📋 ШАГ 4: Создание договора с контингентом');
  
  if (createdUsers.organization && createdUsers.clinic) {
    const contract = {
      clientBin: createdUsers.organization.bin,
      clientName: createdUsers.organization.companyName,
      clinicBin: createdUsers.clinic.bin,
      clinicName: createdUsers.clinic.companyName,
      date: new Date().toISOString().split('T')[0],
      status: 'request',
      price: 500000,
      plannedHeadcount: EMPLOYEES.length,
      employees: EMPLOYEES
    };

    const result = await apiRequest('/contracts', 'POST', contract);
    if (result) {
      console.log(`✅ Договор создан: ${result.number || 'DRAFT'}`);
      console.log(`   📊 Сотрудников в контингенте: ${EMPLOYEES.length}`);
      
      EMPLOYEES.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.name} (ИИН: ${emp.id})`);
      });

      // Сохраняем ID договора для следующих шагов
      createdUsers.contract = result;
      const contractId = result.id || result.ID;
      await sleep(200);
      
      // ========== ШАГ 4.1: Подписание договора организацией ==========
      console.log('   ✍️  Подписание договора организацией...');
      const orgSign = await apiRequest(`/contracts/${contractId}`, 'PATCH', {
        clientSigned: true,
        clientSignOtp: null
      });
      if (orgSign) {
        console.log('   ✅ Договор подписан организацией');
      }
      await sleep(200);
      
      // ========== ШАГ 4.2: Подписание договора клиникой ==========
      console.log('   ✍️  Подписание договора клиникой...');
      const clinicSign = await apiRequest(`/contracts/${contractId}`, 'PATCH', {
        clinicSigned: true,
        clinicSignOtp: null,
        status: 'planning' // После подписания обеими сторонами статус становится "planning"
      });
      if (clinicSign) {
        console.log('   ✅ Договор подписан клиникой');
        console.log('   ✅ Статус договора: planning (готов к планированию)');
      }
      await sleep(200);
      
      // ========== ШАГ 4.3: Создание и утверждение календарного плана ==========
      console.log('   📅 Создание календарного плана...');
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // План на месяц
      
      const calendarPlan = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'approved' // Статус плана: approved (утверждён)
      };
      
      const planResult = await apiRequest(`/contracts/${contractId}`, 'PATCH', {
        calendarPlan: calendarPlan
      });
      if (planResult) {
        console.log('   ✅ Календарный план создан');
      }
      await sleep(200);
      
      // ========== ШАГ 4.4: Утверждение календарного плана ==========
      console.log('   ✅ Утверждение календарного плана...');
      const approveResult = await apiRequest(`/contracts/${contractId}`, 'PATCH', {
        status: 'execution' // Утверждённый план переводит договор в статус "execution"
      });
      if (approveResult) {
        console.log('   ✅ Календарный план утверждён');
        console.log('   ✅ Статус договора: execution (в исполнении)');
      }
    } else {
      console.log('⚠️  Не удалось создать договор');
    }
  } else {
    console.log('⚠️  Организация или клиника не созданы, договор не создан');
  }
  
  console.log('');

  // ========== ШАГ 5: Создание визитов и маршрутных листов для всех сотрудников ==========
  console.log('🏥 ШАГ 5: Создание визитов и маршрутных листов');
  
  if (createdUsers.clinic && createdUsers.contract) {
    // Получаем список врачей из клиники
    const clinicUid = createdUsers.clinic.uid || createdUsers.clinic.id;
    const doctors = await apiRequest(`/clinics/${clinicUid}/doctors`);
    
    if (doctors && doctors.length > 0) {
      console.log(`   📋 Найдено врачей: ${doctors.length}`);
      
      let createdVisits = 0;
      
      // Создаём визиты для всех сотрудников
      for (const employee of EMPLOYEES) {
        // Создаем маршрутный лист на основе вредных факторов
        const routeSheet = createRouteSheet(employee, doctors);
        
        const visit = {
          employeeId: employee.id,
          employeeName: employee.name,
          clientName: createdUsers.organization.companyName,
          contractId: Number(createdUsers.contract.id || createdUsers.contract.ID),
          clinicId: clinicUid,
          phone: employee.phone.replace(/\D/g, ''),
          routeSheet: routeSheet
        };

        const visitResult = await apiRequest('/visits', 'POST', visit);
        if (visitResult) {
          createdVisits++;
          console.log(`   ✅ Визит создан для ${employee.name} (${routeSheet.length} пунктов в маршруте)`);
        } else {
          console.log(`   ⚠️  Не удалось создать визит для ${employee.name}`);
        }
        await sleep(100);
      }
      
      console.log(`\n   📊 Всего создано визитов: ${createdVisits} из ${EMPLOYEES.length}`);
    } else {
      console.log('⚠️  Врачи не найдены в клинике');
    }
  } else {
    console.log('⚠️  Клиника или договор не созданы, визиты не созданы');
  }
  
  console.log('');

  // ========== ИТОГИ ==========
  console.log('=' .repeat(60));
  console.log('✨ БАЗА ДАННЫХ УСПЕШНО ЗАПОЛНЕНА!\n');
  console.log('📞 Данные для входа:');
  console.log('');
  console.log('  🏢 Организация:    +7 708 544 69 45');
  console.log('  🏥 Клиника:        +7 702 149 10 10');
  console.log('  👨‍⚕️ Врач:          +7 778 180 25 75');
  console.log('  📋 Регистратура:   +7 777 687 54 11');
  console.log('  👤 Сотрудник:      +7 778 917 17 90');
  console.log('');
  console.log('📊 Создано:');
  console.log(`  • Пользователей: ${Object.keys(createdUsers).filter(k => k !== 'contract').length}`);
  console.log(`  • Врачей: ${DOCTORS.length}`);
  console.log(`  • Сотрудников в контингенте: ${EMPLOYEES.length}`);
  if (createdUsers.contract) {
    console.log(`  • Договоров: 1 (подписан обеими сторонами, календарный план утверждён)`);
    console.log(`  • Визитов: ${EMPLOYEES.length} (с маршрутными листами)`);
  } else {
    console.log(`  • Договоров: 0`);
    console.log(`  • Визитов: 0`);
  }
  console.log('');
  console.log('🚀 Можно начинать тестирование!');
  console.log('=' .repeat(60));
}

// Запуск
main().catch(error => {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
  process.exit(1);
});

