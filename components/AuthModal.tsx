import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { sendWhatsAppMessage, generateOTP } from '../services/greenApi';
import { apiGetUserByPhone, apiCreateUser } from '../services/api';

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

  // --- INIT ---
  useEffect(() => {
    // В новой архитектуре Go + Postgres отдельная аутентификация не требуется на этом шаге
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
    if (import.meta.env.DEV) {
      console.log('🔐 Сгенерированный OTP код:', code);
      console.log('📱 Отправка на номер:', phone);
    }

    const message = `Ваш код подтверждения MedFlow: ${code}`;

    try {
      // Отправляем сообщение и ждем результат
      if (import.meta.env.DEV) {
        console.log('Отправка OTP на WhatsApp:', phone, 'Код:', code);
      }
      const result = await sendWhatsAppMessage(phone, message);
      if (import.meta.env.DEV) {
        console.log('WhatsApp message sent successfully:', result);
      }
      
      // Переходим к вводу OTP только после успешной отправки
      setStep('OTP');
    } catch (err: any) {
      console.error("Ошибка отправки WhatsApp:", err);
      setError('Не удалось отправить код на WhatsApp. Проверьте номер телефона и попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP VERIFICATION LOGIC ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enteredOtp !== generatedOtp) {
      setError('Неверный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\D/g, '');

      // Запрос пользователя с обработкой ошибок
      let existing: Awaited<ReturnType<typeof apiGetUserByPhone>> | null = null;
      try {
        existing = await apiGetUserByPhone(cleanPhone);
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error('Error fetching user:', err);
        }
        setError('Ошибка соединения с сервером. Попробуйте еще раз.');
        setLoading(false);
        return;
      }

      if (existing) {
        // --- ПОЛЬЗОВАТЕЛЬ НАЙДЕН ---
        console.log('✅ User found:', existing);
        localStorage.setItem('medflow_uid', existing.uid);
        localStorage.setItem('medflow_phone', cleanPhone);
        setLoading(false);
        onSuccess();
        return;
      }
      
      // Пользователь не найден
      console.log('⚠️ User not found for phone:', cleanPhone);

      // --- ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН (РЕГИСТРАЦИЯ) ---
      const newUid = 'user_' + Date.now();
      localStorage.setItem('medflow_uid', newUid);
      localStorage.setItem('medflow_phone', cleanPhone);

      setStep('REGISTER');
      setLoading(false);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Verification Critical Error:", err);
      }
      setError("Ошибка соединения с сервером. Попробуйте еще раз.");
      setLoading(false);
    }
  };

  // --- REGISTRATION LOGIC ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanBin = bin.replace(/\D/g, '');
    
    // Validation
    if (cleanBin.length !== 12) {
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
        // UID уже сохранен после проверки OTP
        let uid = localStorage.getItem('medflow_uid');
        if (!uid) {
          uid = 'user_' + Date.now();
          localStorage.setItem('medflow_uid', uid);
        }
        
        const cleanPhone = phone.replace(/\D/g, '');

        const userData = {
          uid,
          phone: cleanPhone,
          role,
          bin: cleanBin,
          companyName,
          leaderName,
          createdAt: new Date().toISOString()
        };

        // Сохраняем пользователя в новом бэкенде
        await apiCreateUser(userData as any);
        
        // WhatsApp отправляем асинхронно, НЕ блокируем переход
        sendWhatsAppMessage(phone, `Добро пожаловать в MedFlow, ${leaderName}!`).catch(e => console.warn("WhatsApp skip"));

        // Убираем loading перед переходом
        setLoading(false);
        onSuccess();

    } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Registration Error:", err);
        }
        // Если пользователь уже существует (дубликат), это не ошибка - просто входим
        if (err?.message?.includes('duplicate') || err?.message?.includes('23505')) {
          // Пользователь уже создан, просто входим
          setLoading(false);
          onSuccess();
          return;
        }
        setError("Не удалось создать аккаунт. Проверьте интернет.");
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500" />

      <div className="relative w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="relative z-10 text-center mb-8">
          <p className="text-sm text-slate-500 mb-4 font-mono tracking-wide">medflow.kz</p>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            {step === 'PHONE' && 'Добро пожаловать'}
            {step === 'OTP' && 'Подтверждение'}
            {step === 'REGISTER' && 'Создание аккаунта'}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {step === 'PHONE' && 'Введите номер телефона для входа'}
            {step === 'OTP' && `Код отправлен на ${phone}`}
            {step === 'REGISTER' && 'Заполните данные для доступа'}
          </p>
        </div>

        {step === 'PHONE' && (
          <form onSubmit={handleSendCode} className="relative z-10 space-y-5">
            <div>
              <input 
                type="tel" 
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (700) 000-00-00"
                className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl outline-none transition-all font-mono text-base text-slate-900 placeholder:text-slate-400"
                autoFocus
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2.5 px-4 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-base hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              Код будет отправлен в WhatsApp
            </p>
          </form>
        )}

        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="relative z-10 space-y-5">
            {/* Временное отображение кода для тестирования (только в dev режиме) */}
            {generatedOtp && import.meta.env.DEV && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-xs text-yellow-800 mb-1">🔐 Код для тестирования (DEV):</p>
                <p className="text-2xl font-mono font-bold text-yellow-900">{generatedOtp}</p>
                <p className="text-xs text-yellow-700 mt-1">Проверьте также WhatsApp на номер {phone}</p>
              </div>
            )}
            <div className="flex justify-center">
              <input 
                type="text" 
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-full text-center py-4 bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl outline-none transition-all font-mono font-semibold text-3xl tracking-[0.3em] text-slate-900 placeholder:text-slate-300"
                autoFocus
                maxLength={4}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2.5 px-4 rounded-lg border border-red-100">
                {error}
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading || enteredOtp.length !== 4} 
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-base hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep('PHONE')} 
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors py-2"
            >
              Изменить номер
            </button>
          </form>
        )}

        {step === 'REGISTER' && (
          <form onSubmit={handleRegister} className="relative z-10 space-y-5">
            <div className="p-1 bg-slate-100 rounded-xl flex relative">
                <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ${role === 'clinic' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
                <button 
                  type="button" 
                  onClick={() => setRole('organization')} 
                  className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors z-10 ${role === 'organization' ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  Организация
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('clinic')} 
                  className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors z-10 ${role === 'clinic' ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  Клиника
                </button>
            </div>

            <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Идентификационный номер</label>
                  <input 
                    type="text" 
                    value={bin} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setBin(val);
                      if (val.length === 12 && error.includes('12 цифр')) {
                         setError('');
                      }
                    }} 
                    placeholder="БИН / ИИН (12 цифр)" 
                    className={`w-full px-4 py-3 bg-white border ${bin.length > 0 && bin.length < 12 ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' : 'border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'} rounded-xl outline-none transition-all font-mono text-base`}
                  />
                  {bin.length > 0 && bin.length < 12 && (
                     <p className="text-red-600 text-xs mt-1.5 font-medium">
                        Неполный номер: {bin.length}/12 цифр
                     </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {role === 'clinic' ? 'Название клиники' : 'Юридическое название'}
                  </label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder={role === 'clinic' ? 'ТОО "Медикер"' : 'ТОО "Компания"'} 
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl outline-none transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Первый руководитель</label>
                  <input 
                    type="text" 
                    value={leaderName} 
                    onChange={(e) => setLeaderName(e.target.value)} 
                    placeholder="Фамилия Имя Отчество" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-xl outline-none transition-all text-base"
                  />
                </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2.5 px-4 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-semibold text-base hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Создание профиля...' : 'Завершить регистрацию'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;