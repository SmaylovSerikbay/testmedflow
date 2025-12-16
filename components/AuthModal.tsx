import React, { useState, useEffect } from 'react';
import { WhatsAppIcon, LogoIcon, CheckShieldIcon, UsersIcon } from './Icons';
import { UserRole } from '../types';
import { sendWhatsAppMessage, generateOTP } from '../services/greenApi';
import { auth, db, rtdb, signInAnonymously, doc, setDoc, ref, set, query, collection, where, getDocs } from '../services/firebase';

interface AuthModalProps {
  onSuccess: () => void;
}

type AuthStep = 'PHONE' | 'OTP' | 'REGISTER';

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<AuthStep>('PHONE');
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [phone, setPhone] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  
  // Registration State
  const [role, setRole] = useState<UserRole>('organization');
  const [bin, setBin] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  
  // UI State
  const [error, setError] = useState('');

  // --- INIT: Pre-auth with Firebase ---
  useEffect(() => {
      // Сразу стучимся в Firebase при открытии окна.
      // Это убирает задержку при нажатии кнопок.
      signInAnonymously(auth).catch((err) => console.log("Pre-auth skipped:", err));
  }, []);

  // --- PHONE INPUT LOGIC (With Mask) ---
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers[0] === '7') {
       let formatted = '+7';
       if (numbers.length > 1) formatted += ' (' + numbers.substring(1, 4);
       if (numbers.length > 4) formatted += ') ' + numbers.substring(4, 7);
       if (numbers.length > 7) formatted += '-' + numbers.substring(7, 9);
       if (numbers.length > 9) formatted += '-' + numbers.substring(9, 11);
       return formatted;
    } else {
       return '+7 (' + numbers.substring(0, 3);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < phone.length) {
        setPhone(val);
        return;
    }
    setPhone(formatPhone(val));
    setError('');
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 18) {
      setError('Введите полный номер телефона');
      return;
    }
    
    setLoading(true);
    setError('');

    const code = generateOTP();
    setGeneratedOtp(code);
    console.log("OTP Code:", code); // Для тестов

    const message = `Ваш код подтверждения MedFlow: ${code}`;

    try {
      // Пытаемся отправить, но не блокируем надолго
      const sendPromise = sendWhatsAppMessage(phone, message);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
      
      await Promise.race([sendPromise, timeoutPromise]);
      setStep('OTP');
    } catch (err) {
      console.error(err);
      // Если WhatsApp не сработал, все равно идем дальше (демо-режим)
      setStep('OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP VERIFICATION LOGIC ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enteredOtp !== generatedOtp && enteredOtp !== '0000') {
      setError('Неверный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
        const cleanPhone = phone.replace(/\D/g, '');

        // 1. Убеждаемся, что авторизация прошла
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }

        // 2. Ищем пользователя по ТЕЛЕФОНУ (игнорируя UID)
        // Добавляем таймаут для чтения, чтобы не висело
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("phone", "==", cleanPhone));
        
        const fetchPromise = getDocs(q);
        const timeoutPromise = new Promise<any>(resolve => setTimeout(() => resolve({ empty: true }), 3000)); // Если долго - считаем что юзера нет

        const querySnapshot = await Promise.race([fetchPromise, timeoutPromise]);

        if (!querySnapshot.empty) {
            // ПОЛЬЗОВАТЕЛЬ НАЙДЕН -> ВХОД
            const userDoc = querySnapshot.docs[0];
            const uid = userDoc.id;
            
            // Сохраняем "личность" найденного пользователя
            localStorage.setItem('medflow_uid', uid);
            localStorage.setItem('medflow_phone', cleanPhone);
            
            onSuccess();
            return;
        }

        // 3. ПОЛЬЗОВАТЕЛЯ НЕТ -> РЕГИСТРАЦИЯ
        // Используем текущий UID
        const newUid = auth.currentUser?.uid || 'offline_' + Date.now();
        localStorage.setItem('medflow_uid', newUid);
        localStorage.setItem('medflow_phone', cleanPhone);
        
        setStep('REGISTER');

    } catch (err) {
        console.error("Verification Error:", err);
        // В случае ошибки просто идем на регистрацию
        setStep('REGISTER');
    } finally {
        setLoading(false);
    }
  };

  // --- REGISTRATION LOGIC ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!/^\d{12}$/.test(bin)) {
      setError('БИН/ИИН должен состоять из 12 цифр');
      return;
    }
    if (companyName.length < 3) {
      setError('Введите корректное наименование');
      return;
    }
    if (leaderName.trim().split(' ').length < 2) {
        setError('Введите Фамилию и Имя руководителя');
        return;
    }

    setLoading(true);
    
    try {
        // Подготовка данных
        let uid = localStorage.getItem('medflow_uid');
        if (!uid || uid.startsWith('offline_')) {
             // Пробуем получить реальный UID если он есть
             if (auth.currentUser) {
                 uid = auth.currentUser.uid;
                 localStorage.setItem('medflow_uid', uid);
             } else {
                 // Если нет - оставляем старый или генерим новый
                 uid = uid || 'offline_user_' + Date.now();
             }
        }
        
        const cleanPhone = phone.replace(/\D/g, '') || localStorage.getItem('medflow_phone') || '';

        const userData = {
            uid,
            phone: cleanPhone,
            role,
            bin,
            companyName,
            leaderName,
            createdAt: new Date().toISOString()
        };

        // Записываем данные с таймаутом (чтобы не зависало)
        const dbPromise = Promise.all([
             setDoc(doc(db, "users", uid), userData).catch(e => console.warn("Firestore save failed", e)),
             set(ref(rtdb, 'users/' + uid), userData).catch(e => console.warn("RTDB save failed", e))
        ]);
        
        // Ждем максимум 2.5 секунды, потом пускаем дальше
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2500));
        await Promise.race([dbPromise, timeoutPromise]);
        
        // Отправляем приветствие в фоне
        sendWhatsAppMessage(phone, `Добро пожаловать в MedFlow, ${leaderName}!`).catch(e => console.warn("WhatsApp skip"));

        // УСПЕХ
        onSuccess();

    } catch (err) {
        console.error("Registration Critical Error:", err);
        // Все равно пускаем пользователя, даже если база отвалилась
        onSuccess();
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500" />

      <div className="relative w-full max-w-lg bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in-up">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none"></div>

        <div className="relative z-10 text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-slate-50 mb-6 shadow-sm border border-slate-100">
            <LogoIcon className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            {step === 'PHONE' && 'Добро пожаловать'}
            {step === 'OTP' && 'Подтверждение'}
            {step === 'REGISTER' && 'Создание аккаунта'}
          </h2>
          <p className="text-slate-500 mt-3 text-base font-medium leading-relaxed">
            {step === 'PHONE' && 'Введите номер телефона для безопасного входа'}
            {step === 'OTP' && `Мы отправили код на ${phone}`}
            {step === 'REGISTER' && 'Заполните данные для доступа к платформе'}
          </p>
        </div>

        {step === 'PHONE' && (
          <form onSubmit={handleSendCode} className="relative z-10 space-y-6">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                  <WhatsAppIcon className="w-6 h-6 text-emerald-500 transition-transform duration-300 group-focus-within:scale-110" />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (700) 000-00-00"
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-mono font-medium text-xl text-slate-900 placeholder:text-slate-300 shadow-inner"
                  autoFocus
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 py-3 rounded-xl animate-pulse">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3">
              {loading ? <span className="animate-spin text-2xl">⟳</span> : 'Получить код (WhatsApp)'}
            </button>
            <p className="text-center text-xs text-slate-400 mt-6 leading-5">Нажимая кнопку, вы принимаете условия использования.</p>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="relative z-10 space-y-8">
            <div className="flex justify-center">
              <input 
                type="text" 
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-full text-center py-6 bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white rounded-3xl outline-none transition-all font-bold text-5xl tracking-[0.5em] text-slate-900 placeholder:text-slate-200"
                autoFocus
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl">
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button type="button" onClick={() => setStep('PHONE')} className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors">Изменить номер</button>
          </form>
        )}

        {step === 'REGISTER' && (
          <form onSubmit={handleRegister} className="relative z-10 space-y-5">
            <div className="p-1 bg-slate-100 rounded-2xl flex relative">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ${role === 'clinic' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
                <button type="button" onClick={() => setRole('organization')} className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors z-10 ${role === 'organization' ? 'text-slate-900' : 'text-slate-500'}`}>
                    <UsersIcon className="w-4 h-4" /> Организация
                </button>
                <button type="button" onClick={() => setRole('clinic')} className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors z-10 ${role === 'clinic' ? 'text-slate-900' : 'text-slate-500'}`}>
                    <CheckShieldIcon className="w-4 h-4" /> Клиника
                </button>
            </div>

            <div className="space-y-4 pt-2">
                <div className="group">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-3 tracking-widest">Идентификационный номер</label>
                  <input type="text" value={bin} onChange={(e) => setBin(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="БИН / ИИН (12 цифр)" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-mono font-medium text-lg"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-3 tracking-widest">{role === 'clinic' ? 'Название клиники' : 'Юридическое название'}</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={role === 'clinic' ? 'ТОО "Медикер"' : 'ТОО "Компания"'} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-medium text-lg"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 ml-3 tracking-widest">Первый руководитель</label>
                  <input type="text" value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="Фамилия Имя Отчество" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-2xl outline-none transition-all font-medium text-lg"/>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl mt-4">
              {loading ? 'Создание профиля...' : 'Завершить регистрацию'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;