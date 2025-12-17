import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import DoctorDashboard from './components/DoctorDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { AppState, UserProfile } from './types';
import { rtdb, ref, get } from './services/firebase';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Проверяем существование пользователя при загрузке
  useEffect(() => {
    const checkUser = async () => {
      const uid = localStorage.getItem('medflow_uid');
      if (!uid) {
        setIsCheckingUser(false);
        return;
      }

      try {
        // Проверка существования пользователя в Realtime Database
        const userRef = ref(rtdb, `users/${uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = { uid, ...snapshot.val() } as UserProfile;
          setCurrentUser(userData);
          
          // Определяем состояние приложения в зависимости от роли
          if (userData.role === 'doctor') {
            setAppState(AppState.DOCTOR_DASHBOARD);
          } else if (userData.role === 'employee') {
            setAppState(AppState.EMPLOYEE_DASHBOARD);
          } else {
            setAppState(AppState.DASHBOARD);
          }
        } else {
          // Пользователь не найден - очищаем localStorage
          localStorage.removeItem('medflow_uid');
          localStorage.removeItem('medflow_phone');
        }
      } catch (error: any) {
        console.error("Error checking user:", error);
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

  const handleAuthSuccess = () => {
    // После успешной авторизации проверяем роль пользователя
    const uid = localStorage.getItem('medflow_uid');
    if (uid) {
      const userRef = ref(rtdb, `users/${uid}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = { uid, ...snapshot.val() } as UserProfile;
          setCurrentUser(userData);
          
          if (userData.role === 'doctor') {
            setAppState(AppState.DOCTOR_DASHBOARD);
          } else if (userData.role === 'employee') {
            setAppState(AppState.EMPLOYEE_DASHBOARD);
          } else {
            setAppState(AppState.DASHBOARD);
          }
        }
      });
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
      
      {appState === AppState.DOCTOR_DASHBOARD && currentUser && (
        <DoctorDashboard currentUser={currentUser} />
      )}
      
      {appState === AppState.EMPLOYEE_DASHBOARD && currentUser && (
        <EmployeeDashboard currentUser={currentUser} />
      )}
    </div>
  );
};

export default App;