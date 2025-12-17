import { ref, set, get, query, orderByChild, equalTo } from '../services/firebase';
import { rtdb } from '../services/firebase';
import { Employee, UserProfile } from '../types';

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
 * Автоматически регистрирует сотрудника в системе, если в примечании есть телефон
 */
export async function autoRegisterEmployee(
  employee: Employee,
  contractId: string
): Promise<{ userId: string | null; phone: string | null }> {
  const phone = extractPhoneFromNote(employee.note);
  
  if (!phone) {
    return { userId: null, phone: null };
  }
  
  try {
    // Проверяем, существует ли уже пользователь с таким телефоном
    const usersRef = ref(rtdb, 'users');
    const phoneQuery = query(usersRef, orderByChild('phone'), equalTo(phone));
    const snapshot = await get(phoneQuery);
    
    let userId: string;
    
    if (snapshot.exists() && snapshot.val()) {
      // Пользователь уже существует
      const users = snapshot.val();
      userId = Object.keys(users)[0];
      
      // Обновляем данные пользователя, если нужно
      const existingUser = users[userId] as UserProfile;
      if (existingUser.role !== 'employee' || existingUser.employeeId !== employee.id) {
        await set(ref(rtdb, `users/${userId}`), {
          ...existingUser,
          role: 'employee',
          employeeId: employee.id,
          contractId: contractId,
        });
      }
    } else {
      // Создаем нового пользователя
      userId = 'employee_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      const userData: UserProfile = {
        uid: userId,
        role: 'employee',
        phone: phone,
        employeeId: employee.id,
        contractId: contractId,
      };
      
      await set(ref(rtdb, `users/${userId}`), userData);
    }
    
    return { userId, phone };
  } catch (error) {
    console.error('Error auto-registering employee:', error);
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
  const updatedEmployees: Employee[] = [];
  
  for (const employee of employees) {
    // Если у сотрудника уже есть userId, пропускаем
    if (employee.userId) {
      updatedEmployees.push(employee);
      continue;
    }
    
    // Пытаемся извлечь телефон и зарегистрировать
    const { userId, phone } = await autoRegisterEmployee(employee, contractId);
    
    if (userId && phone) {
      updatedEmployees.push({
        ...employee,
        phone: phone,
        userId: userId,
      });
    } else {
      updatedEmployees.push(employee);
    }
  }
  
  return updatedEmployees;
}

