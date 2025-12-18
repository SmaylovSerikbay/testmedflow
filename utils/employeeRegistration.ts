import { Employee } from '../types';
import { apiGetUserByPhone, apiCreateUser, apiGetContract, ApiUser } from '../services/api';

/**
 * Извлекает номер телефона из поля примечание
 * Поддерживает различные форматы: +7, 8, 7, без префикса
 */
export function extractPhoneFromNote(note: string | undefined): string | null {
  if (!note) return null;
  
  // Ищем паттерны телефонов
  const phonePatterns = [
    /\+7\s?\(?\d{3}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}/g, // +7 (XXX) XXX-XX-XX
    /8\s?\(?\d{3}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}/g,  // 8 (XXX) XXX-XX-XX
    /7\s?\d{3}\s?\d{3}[- ]?\d{2}[- ]?\d{2}/g,        // 7 XXX XXX-XX-XX
    /\d{10,11}/g,                                      // Просто цифры (10-11 цифр)
  ];
  
  for (const pattern of phonePatterns) {
    const matches = note.match(pattern);
    if (matches && matches.length > 0) {
      // Берем первый найденный номер
      let phone = matches[0].replace(/\D/g, ''); // Убираем все нецифровые символы
      
      // Нормализуем номер
      if (phone.startsWith('8')) {
        phone = '7' + phone.substring(1);
      }
      if (phone.length === 10) {
        phone = '7' + phone;
      }
      if (phone.length === 11 && phone.startsWith('7')) {
        return phone;
      }
    }
  }
  
  return null;
}

/**
 * Автоматически регистрирует сотрудника в системе, если есть телефон в примечании или в поле phone
 */
export async function autoRegisterEmployee(
  employee: Employee,
  contractId: string
): Promise<{ userId: string | null; phone: string | null }> {
  // Сначала проверяем поле phone, если его нет - извлекаем из note
  let phone: string | null = null;
  
  if (employee.phone) {
    // Нормализуем телефон из поля phone
    const normalized = employee.phone.replace(/\D/g, '');
    if (normalized.startsWith('8')) {
      phone = '7' + normalized.substring(1);
    } else if (normalized.length === 10) {
      phone = '7' + normalized;
    } else if (normalized.length === 11 && normalized.startsWith('7')) {
      phone = normalized;
    }
  }
  
  // Если телефона нет в поле phone, пытаемся извлечь из note
  if (!phone) {
    phone = extractPhoneFromNote(employee.note);
  }
  
  if (!phone) {
    return { userId: null, phone: null };
  }
  
  try {
    console.log('🔍 Checking if user exists with phone:', phone);
    
    // Получаем bin организации из договора
    let organizationBin: string | undefined;
    try {
      const contractIdNum = parseInt(contractId, 10);
      if (!isNaN(contractIdNum)) {
        const contract = await apiGetContract(contractIdNum);
        organizationBin = contract.clientBin;
        console.log('📋 Got organization bin from contract:', organizationBin);
      }
    } catch (error) {
      console.warn('⚠️ Could not load contract to get bin:', error);
    }
    
    // Проверяем, существует ли уже пользователь с таким телефоном
    const existingUser = await apiGetUserByPhone(phone);
    
    let userId: string;
    
    if (existingUser) {
      // Пользователь уже существует
      console.log('👤 User already exists:', existingUser);
      userId = existingUser.uid;
      
      // Обновляем данные пользователя, если нужно
      if (existingUser.role !== 'employee' || existingUser.employeeId !== employee.id || existingUser.contractId !== contractId) {
        console.log('🔄 Updating existing user to employee role:', userId, {
          currentRole: existingUser.role,
          currentEmployeeId: existingUser.employeeId,
          newEmployeeId: employee.id,
          currentContractId: existingUser.contractId,
          newContractId: contractId,
        });
        await apiCreateUser({
          uid: userId,
          role: 'employee',
          phone: phone,
          bin: organizationBin || existingUser.bin, // Сохраняем bin из договора
          employeeId: employee.id,
          contractId: contractId,
          createdAt: existingUser.createdAt,
        } as ApiUser);
        console.log('✅ Existing user updated to employee role');
      } else {
        // Обновляем bin, если его нет, но есть в договоре
        if (!existingUser.bin && organizationBin) {
          console.log('📝 Updating user bin from contract:', organizationBin);
          await apiCreateUser({
            uid: userId,
            role: 'employee',
            phone: phone,
            bin: organizationBin,
            employeeId: employee.id,
            contractId: contractId,
            createdAt: existingUser.createdAt,
          } as ApiUser);
        } else {
          console.log('👤 User already exists as employee with correct data:', userId);
        }
      }
    } else {
      // Создаем нового пользователя
      userId = 'employee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const userData: ApiUser = {
        uid: userId,
        role: 'employee',
        phone: phone,
        bin: organizationBin, // Сохраняем bin из договора
        employeeId: employee.id,
        contractId: contractId,
        createdAt: new Date().toISOString(),
      };
      
      console.log('🔥 Creating new employee user:', userData);
      await apiCreateUser(userData);
      console.log('✅ Employee user created successfully via Go API');
    }
    
    return { userId, phone };
  } catch (error) {
    console.error('❌ Error auto-registering employee:', error);
    console.error('Employee data:', { name: employee.name, note: employee.note, phone: employee.phone });
    return { userId: null, phone };
  }
}

/**
 * Обрабатывает список сотрудников и автоматически регистрирует тех, у кого есть телефон в примечании
 */
export async function processEmployeesForAutoRegistration(
  employees: Employee[],
  contractId: string
): Promise<Employee[]> {
  console.log('🔄 Processing employees for auto-registration:', {
    totalEmployees: employees.length,
    contractId,
    employeesWithUserId: employees.filter(e => e.userId).length,
  });
  
  const updatedEmployees: Employee[] = [];
  
  for (const employee of employees) {
    console.log(`\n👤 Processing employee: ${employee.name}`, {
      hasUserId: !!employee.userId,
      hasPhone: !!employee.phone,
      hasNote: !!employee.note,
      note: employee.note,
    });
    
    // Если у сотрудника уже есть userId, проверяем, не нужно ли обновить данные
    if (employee.userId) {
      // Проверяем, есть ли телефон в note, но нет в phone - обновляем phone
      const phoneFromNote = extractPhoneFromNote(employee.note);
      if (phoneFromNote && phoneFromNote !== employee.phone) {
        console.log('📞 Updating phone for employee:', employee.name, 'from note:', phoneFromNote);
        updatedEmployees.push({
          ...employee,
          phone: phoneFromNote,
        });
      } else {
        updatedEmployees.push(employee);
      }
      continue;
    }
    
    // Пытаемся извлечь телефон и зарегистрировать
    console.log('🔍 Attempting to register employee:', employee.name);
    const { userId, phone } = await autoRegisterEmployee(employee, contractId);
    
    if (userId && phone) {
      console.log('✅ Employee registered successfully:', {
        name: employee.name,
        userId,
        phone,
      });
      updatedEmployees.push({
        ...employee,
        phone: phone,
        userId: userId,
      });
    } else {
      // Если телефон не найден, но есть в note - сохраняем его в phone для будущей регистрации
      const phoneFromNote = extractPhoneFromNote(employee.note);
      if (phoneFromNote && phoneFromNote !== employee.phone) {
        console.log('📝 Saving phone from note for future registration:', employee.name, phoneFromNote);
        updatedEmployees.push({
          ...employee,
          phone: phoneFromNote,
        });
      } else {
        console.log('⚠️ No phone found for employee:', employee.name);
        updatedEmployees.push(employee);
      }
    }
  }
  
  console.log('✅ Auto-registration processing complete:', {
    totalProcessed: updatedEmployees.length,
    registered: updatedEmployees.filter(e => e.userId).length,
  });
  
  return updatedEmployees;
}

