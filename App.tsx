import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import DoctorWorkspace from './components/DoctorWorkspace';
import EmployeePortal from './components/EmployeePortal';
import RegistrationDesk from './components/RegistrationDesk';
import { AppState, UserProfile } from './types';
import { apiGetUserByPhone, apiCreateUser } from './services/api';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  
  // Проверяем URL для формы 052
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/form052' || path.startsWith('/form052/')) {
      // Не проверяем пользователя для формы 052 - она доступна отдельно
      setIsCheckingUser(false);
    }
  }, []);

  // Проверяем существование пользователя при загрузке
  useEffect(() => {
    // Пропускаем проверку для формы 052
    if (window.location.pathname === '/form052' || window.location.pathname.startsWith('/form052/')) {
      return;
    }
    
    const checkUser = async () => {
      const phone = localStorage.getItem('medwork_phone');
      if (!phone) {
        setIsCheckingUser(false);
        return;
      }

      try {
        // Проверка существования пользователя через Go API
        const apiUser = await apiGetUserByPhone(phone);
        if (apiUser) {
          // Для врачей: если нет clinicBin, но есть bin, используем его
          const clinicBin = apiUser.clinicBin || (apiUser.role === 'doctor' ? apiUser.bin : undefined);
          
          const userData: UserProfile = {
            uid: apiUser.uid,
            role: apiUser.role,
            bin: apiUser.bin,
            companyName: apiUser.companyName,
            leaderName: apiUser.leaderName,
            phone: apiUser.phone,
            createdAt: apiUser.createdAt || new Date().toISOString(),
            // Загружаем дополнительные поля для врачей
            doctorId: apiUser.doctorId,
            clinicId: apiUser.clinicId,
            specialty: apiUser.specialty,
            clinicBin: clinicBin,
            // Для сотрудников
            employeeId: apiUser.employeeId,
            contractId: apiUser.contractId,
          };
          
          // Если у врача нет clinicBin, но есть bin, обновляем пользователя в базе
          if (apiUser.role === 'doctor' && !apiUser.clinicBin && apiUser.bin) {
            try {
              await apiCreateUser({
                uid: apiUser.uid,
                role: apiUser.role,
                phone: apiUser.phone,
                bin: apiUser.bin,
                companyName: apiUser.companyName,
                leaderName: apiUser.leaderName,
                doctorId: apiUser.doctorId,
                clinicId: apiUser.clinicId,
                specialty: apiUser.specialty,
                clinicBin: apiUser.bin, // Используем bin как clinicBin
                createdAt: apiUser.createdAt,
              } as any);
            } catch (error) {
              console.error('Error updating doctor clinicBin:', error);
            }
          }
          
          setCurrentUser(userData);
          
          // Определяем состояние приложения в зависимости от роли
          if (userData.role === 'doctor') {
            setAppState(AppState.DOCTOR_WORKSPACE);
          } else if (userData.role === 'employee') {
            setAppState(AppState.EMPLOYEE_PORTAL);
          } else if (userData.role === 'registration') {
            setAppState(AppState.REGISTRATION_DESK);
          } else {
            setAppState(AppState.DASHBOARD);
          }
        } else {
          // Пользователь не найден - очищаем localStorage и показываем форму авторизации
          console.warn('User not found in database, phone:', phone);
          localStorage.removeItem('medwork_uid');
          localStorage.removeItem('medwork_phone');
          setAppState(AppState.AUTH);
        }
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error("Error checking user:", error);
        }
        // При любой ошибке просто показываем landing page
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUser();
  }, []);

  // Показываем loader пока проверяем пользователя
  if (isCheckingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          <p className="mt-4 text-slate-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = async () => {
    // После успешной авторизации проверяем роль пользователя через Go API
    const phone = localStorage.getItem('medwork_phone');
    if (!phone) {
      console.error('No phone in localStorage after auth success');
      return;
    }
    
    try {
      const apiUser = await apiGetUserByPhone(phone);
      if (!apiUser) {
        console.error('User not found after auth success, phone:', phone);
        // Очищаем localStorage и показываем форму регистрации
        localStorage.removeItem('medwork_uid');
        localStorage.removeItem('medwork_phone');
        setAppState(AppState.AUTH);
        return;
      }
      
      // Для врачей: если нет clinicBin, но есть bin, используем его
      const clinicBin = apiUser.clinicBin || (apiUser.role === 'doctor' ? apiUser.bin : undefined);
      
      const userData: UserProfile = {
        uid: apiUser.uid,
        role: apiUser.role,
        bin: apiUser.bin,
        companyName: apiUser.companyName,
        leaderName: apiUser.leaderName,
        phone: apiUser.phone,
        createdAt: apiUser.createdAt || new Date().toISOString(),
        // Загружаем дополнительные поля для врачей
        doctorId: apiUser.doctorId,
        clinicId: apiUser.clinicId,
        specialty: apiUser.specialty,
        clinicBin: clinicBin,
        // Для сотрудников
        employeeId: apiUser.employeeId,
        contractId: apiUser.contractId,
      };
      
      // Если у врача нет clinicBin, но есть bin, обновляем пользователя в базе
      if (apiUser.role === 'doctor' && !apiUser.clinicBin && apiUser.bin) {
        try {
          await apiCreateUser({
            uid: apiUser.uid,
            role: apiUser.role,
            phone: apiUser.phone,
            bin: apiUser.bin,
            companyName: apiUser.companyName,
            leaderName: apiUser.leaderName,
            doctorId: apiUser.doctorId,
            clinicId: apiUser.clinicId,
            specialty: apiUser.specialty,
            clinicBin: apiUser.bin, // Используем bin как clinicBin
            createdAt: apiUser.createdAt,
          } as any);
        } catch (error) {
          console.error('Error updating doctor clinicBin:', error);
        }
      }
      
      setCurrentUser(userData);
      
      // Определяем состояние приложения в зависимости от роли
      if (userData.role === 'doctor') {
        setAppState(AppState.DOCTOR_WORKSPACE);
      } else if (userData.role === 'employee') {
        setAppState(AppState.EMPLOYEE_PORTAL);
      } else if (userData.role === 'registration') {
        setAppState(AppState.REGISTRATION_DESK);
      } else {
        setAppState(AppState.DASHBOARD);
      }
    } catch (error: any) {
      console.error("Error loading user after auth:", error);
      // При ошибке очищаем localStorage и показываем форму авторизации
      localStorage.removeItem('medwork_uid');
      localStorage.removeItem('medwork_phone');
      setAppState(AppState.AUTH);
    }
  };


  return (
    // Conditional styling:
    // - Dashboard needs 'h-screen overflow-hidden' to manage its own internal scrolling panels.
    // - Landing Page needs 'min-h-screen' (no overflow hidden) to let the window scroll naturally.
    <div className={`font-sans text-slate-900 bg-slate-50 ${
      appState === AppState.DASHBOARD ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}>
      
      {appState === AppState.LANDING && (
        <LandingPage onGetStarted={() => setAppState(AppState.AUTH)} />
      )}
      
      {appState === AppState.AUTH && (
        <AuthModal onSuccess={handleAuthSuccess} />
      )}
      
      {appState === AppState.DASHBOARD && (
        <Dashboard />
      )}
      
      {appState === AppState.DOCTOR_WORKSPACE && currentUser && (
        <DoctorWorkspace currentUser={currentUser} />
      )}
      
      {appState === AppState.EMPLOYEE_PORTAL && currentUser && (
        <EmployeePortal currentUser={currentUser} />
      )}
      
      {appState === AppState.REGISTRATION_DESK && currentUser && (
        <RegistrationDesk currentUser={currentUser} />
      )}
    </div>
  );
};

export default App;