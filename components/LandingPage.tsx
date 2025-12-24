import React, { useEffect, useState } from 'react';
import { CheckShieldIcon, UsersIcon, SparklesIcon, WhatsAppIcon, LoaderIcon, XIcon, SendIcon, FileTextIcon, ActivityIcon, ShieldIcon, ClockIcon, UserMdIcon, UploadIcon } from './Icons';
import BrandLogo from './BrandLogo';
import { sendWhatsAppMessage } from '../services/greenApi';

interface LandingPageProps {
  onGetStarted: () => void;
}

const CountdownTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 text-xl md:text-2xl font-medium tracking-tight">
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{String(timeLeft.days).padStart(2, '0')}</span>
      <span className="text-[#86868B] font-light text-sm">д</span>
      <span className="text-[#86868B] mx-1.5">:</span>
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="text-[#86868B] font-light text-sm">ч</span>
      <span className="text-[#86868B] mx-1.5">:</span>
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="text-[#86868B] font-light text-sm">м</span>
      <span className="text-[#86868B] mx-1.5">:</span>
      <span className="tabular-nums bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{String(timeLeft.seconds).padStart(2, '0')}</span>
      <span className="text-[#86868B] font-light text-sm">с</span>
    </div>
  );
};

const PreOrderModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  initialPlan: string;
  bookedCount: number;
  onIncrementCount: () => void;
}> = ({ isOpen, onClose, initialPlan, bookedCount, onIncrementCount }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    plan: initialPlan,
    employees: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, plan: initialPlan }));
  }, [initialPlan]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    let result = '+7';
    let digits = numbers;
    if (numbers.startsWith('7') || numbers.startsWith('8')) {
      digits = numbers.substring(1);
    }
    if (digits.length > 0) result += ' (' + digits.substring(0, 3);
    if (digits.length > 3) result += ') ' + digits.substring(3, 6);
    if (digits.length > 6) result += '-' + digits.substring(6, 8);
    if (digits.length > 8) result += '-' + digits.substring(8, 10);
    return result;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length < formData.phone.length) {
      setFormData(prev => ({ ...prev, phone: val }));
      return;
    }
    setFormData(prev => ({ ...prev, phone: formatPhone(val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.company) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsSending(true);
    try {
      const planPrices: Record<string, { original: number; discount: number }> = {
        'Старт': { original: 25000, discount: 17500 },
        'Профессиональный': { original: 95000, discount: 66500 },
        'Корпоративный': { original: 290000, discount: 203000 }
      };
      
      const prices = planPrices[formData.plan] || planPrices['Профессиональный'];
      
      const message = `🚀 *НОВАЯ ЗАЯВКА НА ПРЕДЗАКАЗ (-30%)*\n\n` +
        `📦 *Тариф:* ${formData.plan}\n` +
        `💰 *Цена:* ${prices.original.toLocaleString()} ₸ → *${prices.discount.toLocaleString()} ₸* (скидка 30%)\n` +
        `👤 *Имя:* ${formData.name}\n` +
        `🏢 *Компания:* ${formData.company}\n` +
        `👥 *Количество сотрудников:* ${formData.employees || 'не указано'}\n` +
        `📞 *Телефон:* ${formData.phone}\n\n` +
        `_Отправлено с сайта medwork.digital_`;

      await sendWhatsAppMessage('77776875411', message);
      // Увеличиваем счетчик при успешной отправке
      onIncrementCount();
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', company: '', phone: '', plan: initialPlan, employees: '' });
      }, 2000);
    } catch (err) {
      alert('Ошибка при отправке. Попробуйте позже или свяжитесь напрямую: +7 777 687 5411');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const planPrices: Record<string, { original: number; discount: number }> = {
    'Старт': { original: 25000, discount: 17500 },
    'Профессиональный': { original: 95000, discount: 66500 },
    'Корпоративный': { original: 290000, discount: 203000 }
  };
  const prices = planPrices[formData.plan] || planPrices['Профессиональный'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-[#1D1D1F] mb-1">Предзаказ системы</h3>
              <p className="text-sm text-[#86868B] mb-3">Отправьте запрос на предзаказ до запуска системы и платформы — получите <span className="font-semibold text-red-700">скидку 30%</span></p>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-xs font-semibold text-red-700">Только первые 50 заявок</span>
                  <span className="text-xs text-[#86868B]">•</span>
                  <span className="text-xs text-[#86868B]">Скидка 6 месяцев</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-300 rounded-lg">
                  <span className="text-xs font-semibold text-[#1D1D1F]">Забронировано:</span>
                  <span className="text-sm font-bold text-red-700">{bookedCount}</span>
                  <span className="text-xs text-[#86868B]">из 50</span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-1">
                    <div 
                      className="h-full bg-red-700 rounded-full transition-all duration-500"
                      style={{ width: `${(bookedCount / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <XIcon className="w-5 h-5 text-[#86868B]" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckShieldIcon className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-bold text-[#1D1D1F] mb-2">Заявка отправлена!</h4>
              <p className="text-sm text-[#86868B]">Мы свяжемся с вами в ближайшее время</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Тарифный план</label>
                <select
                  className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#1D1D1F] focus:border-[#0071E3] transition-all"
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value })}
                >
                  <option value="Старт">Старт — 25 000 ₸ → 17 500 ₸</option>
                  <option value="Профессиональный">Профессиональный — 95 000 ₸ → 66 500 ₸</option>
                  <option value="Корпоративный">Корпоративный — 290 000 ₸ → 203 000 ₸</option>
                </select>
                <div className="mt-2 text-xs text-[#86868B]">
                  <span className="line-through">{prices.original.toLocaleString()} ₸</span>
                  <span className="ml-2 font-bold text-red-700">{prices.discount.toLocaleString()} ₸/мес</span>
                  <span className="ml-2 text-red-700 font-semibold">(-30%)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Ваше имя *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#1D1D1F] focus:border-[#0071E3] transition-all"
                  placeholder="Иван Иванов"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Название организации *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#1D1D1F] focus:border-[#0071E3] transition-all"
                  placeholder="ТОО «Компания»"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Количество сотрудников</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#1D1D1F] focus:border-[#0071E3] transition-all"
                  placeholder="Пример: 150"
                  value={formData.employees}
                  onChange={e => setFormData({ ...formData, employees: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2">Номер телефона *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-medium text-[#1D1D1F] focus:border-[#0071E3] transition-all"
                  placeholder="+7 (___) ___-__-__"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>

              <button
                disabled={isSending}
                className="w-full mt-6 py-4 px-6 bg-[#1D1D1F] text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {isSending ? (
                  <>
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    Отправить заявку
                    <SendIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const [preOrderModal, setPreOrderModal] = useState<{ isOpen: boolean; plan: string }>({ isOpen: false, plan: 'Профессиональный' });
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);
  
  // Дата старта проекта: 19 января
  const getLaunchDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const launchDate = new Date(currentYear, 0, 19); // 19 января текущего года
    
    // Если дата уже прошла в этом году, берем следующий год
    if (now > launchDate) {
      return new Date(currentYear + 1, 0, 19);
    }
    return launchDate;
  };
  
  const launchDate = getLaunchDate();
  const isPreOrderActive = new Date() < launchDate;
  
  // Счетчик забронированных мест - сохраняется в localStorage
  const [bookedCount, setBookedCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('medwork_booked_count');
      if (saved) {
        const count = parseInt(saved, 10);
        return isNaN(count) ? 0 : Math.min(count, 50);
      }
    }
    // Начальное значение, если нет сохраненных данных
    return 0;
  });
  
  // Сохраняем счетчик в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medwork_booked_count', bookedCount.toString());
    }
  }, [bookedCount]);
  
  // Функция для увеличения счетчика при отправке заявки
  const incrementBookedCount = () => {
    setBookedCount(prev => Math.min(prev + 1, 50));
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden selection:bg-[#0071E3] selection:text-white">
      
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.165,0.84,0.44,1)] ${scrolled ? 'bg-white/70 backdrop-blur-xl border-b border-gray-200/50 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
          <div className="group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior: 'smooth'})}>
            <BrandLogo size="sm" />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-xs font-medium text-[#1D1D1F] hover:opacity-60 transition-opacity hidden sm:block">Решения</button>
            <button className="text-xs font-medium text-[#1D1D1F] hover:opacity-60 transition-opacity hidden sm:block">Безопасность</button>
            <button 
              onClick={onGetStarted}
              className="text-xs font-medium bg-[#1D1D1F] text-white px-4 py-2 rounded-full hover:bg-black transition-all transform hover:scale-105 active:scale-95"
            >
              Войти
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - All-in-One Infographic */}
      <section className="relative pt-28 pb-20 px-6 max-w-[1400px] mx-auto w-full overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        </div>

        <div className="relative z-10 w-full">
          {/* Title Section */}
          <div className="text-center mb-20 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold tracking-tight mb-4 md:mb-6 leading-[1.05] text-[#1D1D1F] px-4">
              Автоматизация медицинских осмотров
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#86868B] max-w-3xl mx-auto font-light mb-8 md:mb-12 leading-relaxed px-4">
              Система, которая автоматизирует медосмотры сотрудников. Сама определяет, каких врачей нужно пройти, отправляет маршруты в WhatsApp, ведет электронные медицинские карты и формирует отчеты для HR-отдела.
            </p>
            
            {/* Countdown Timer - Minimal */}
            {isPreOrderActive && (
              <div className="mb-12">
                <div className="text-center mb-6">
                  <p className="text-lg md:text-xl text-[#1D1D1F] font-medium mb-2">
                    Запуск системы и платформы через
                  </p>
                  <div className="mb-4">
                    <CountdownTimer targetDate={launchDate} />
                  </div>
                  <p className="text-base text-[#86868B] font-light mb-3">
                    Отправьте запрос на предзаказ сейчас и получите <span className="font-medium text-red-700">скидку 30%</span>
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3 px-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-red-50 border border-red-200 rounded-full">
                      <span className="text-xs md:text-sm font-semibold text-red-700">Только первые 50 заявок</span>
                      <span className="text-xs text-[#86868B] hidden sm:inline">•</span>
                      <span className="text-xs md:text-sm text-[#86868B]">Скидка 6 месяцев</span>
                    </div>
                  </div>
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white border border-red-300 rounded-full max-w-full mx-4">
                    <span className="text-xs md:text-sm font-semibold text-[#1D1D1F]">Забронировано:</span>
                    <span className="text-base md:text-lg font-bold text-red-700">{bookedCount}</span>
                    <span className="text-xs md:text-sm text-[#86868B]">из 50</span>
                    <div className="w-16 md:w-24 h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-500"
                        style={{ width: `${(bookedCount / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
              {isPreOrderActive ? (
                <>
                  <button 
                    onClick={() => setPreOrderModal({ isOpen: true, plan: 'Профессиональный' })}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-red-700 to-red-800 text-white rounded-full font-medium text-sm hover:from-red-800 hover:to-red-900 transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/40"
                  >
                    Предзаказ со скидкой 30%
                  </button>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-white text-[#1D1D1F] border border-gray-300 rounded-full font-medium text-sm hover:bg-gray-50 transition-all"
                  >
                    Узнать больше
                  </button>
                </>
              ) : (
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-[#1D1D1F] text-white rounded-full font-medium text-sm hover:bg-black transition-all"
                >
                  Войти в систему
                </button>
              )}
            </div>
          </div>

          {/* Process Flow - Premium Infographic */}
          <div className="max-w-7xl mx-auto mb-12 md:mb-20 px-4">
            <div className="relative">
              <div className="text-center mb-8 md:mb-12">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1D1D1F] mb-2 md:mb-3 tracking-tight">Процесс работы</h3>
                <p className="text-sm md:text-base text-[#86868B] font-light">От импорта данных до готовых отчетов</p>
              </div>
              
              {/* Timeline Container */}
              <div className="relative">
                {/* Background Flow Line */}
                <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-4 relative">
                  {[
                    { 
                      step: '01', 
                      title: 'Импорт контингента', 
                      desc: 'Excel, 1С, HR-системы', 
                      Icon: UploadIcon,
                      gradient: 'from-blue-500/10 to-indigo-500/10'
                    },
                    { 
                      step: '02', 
                      title: 'AI-анализ факторов', 
                      desc: '200+ вредных факторов', 
                      Icon: ActivityIcon,
                      gradient: 'from-emerald-500/10 to-teal-500/10'
                    },
                    { 
                      step: '03', 
                      title: 'Маршрутизация', 
                      desc: 'WhatsApp сотрудникам', 
                      Icon: WhatsAppIcon,
                      gradient: 'from-amber-500/10 to-orange-500/10'
                    },
                    { 
                      step: '04', 
                      title: 'Цифровая карта', 
                      desc: 'Электронная медкарта', 
                      Icon: FileTextIcon,
                      gradient: 'from-purple-500/10 to-pink-500/10'
                    },
                    { 
                      step: '05', 
                      title: 'Аналитика', 
                      desc: 'Отчеты для руководства', 
                      Icon: SparklesIcon,
                      gradient: 'from-slate-500/10 to-gray-500/10'
                    },
                  ].map((item, i) => (
                    <div key={i} className="relative group">
                      {/* Connecting Arrow (Desktop) */}
                      {i < 4 && (
                        <div className="hidden md:block absolute top-24 left-full w-full h-0.5 z-0">
                          <div className="relative h-full">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-0 h-0 border-l-[6px] border-l-gray-300 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Step Card */}
                      <div className={`relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105 ${item.gradient} bg-gradient-to-br flex flex-col h-full min-h-[220px] md:min-h-[280px]`}>
                        {/* Step Number Badge */}
                        <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <span className="text-xs font-semibold text-white">{item.step}</span>
                        </div>
                        
                        {/* Icon Container */}
                        <div className="mb-4 md:mb-6 mt-2 flex-shrink-0">
                          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-blue-500/50">
                            <item.Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="text-center flex-grow flex flex-col justify-center">
                          <h4 className="text-base md:text-lg font-semibold text-[#1D1D1F] mb-1 md:mb-2 tracking-tight">{item.title}</h4>
                          <p className="text-xs md:text-sm text-[#86868B] font-light leading-relaxed">{item.desc}</p>
                        </div>
                        
                        {/* Decorative Element */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                  ))}
                </div>
                
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Features Detail Section - Interactive Roadmap */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] mb-4 tracking-tight">Возможности платформы</h2>
            <p className="text-base text-[#86868B] max-w-2xl mx-auto font-light">Автоматизация медицинских осмотров на всех этапах</p>
          </div>

          {/* Interactive Roadmap */}
          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[
                  { 
                    Icon: FileTextIcon, 
                    title: 'Автоматическая маршрутизация', 
                    desc: 'Система анализирует условия работы сотрудника и автоматически определяет, каких врачей и какие анализы нужно пройти',
                    features: ['Интеллектуальное сопоставление', 'Проверка готовности клиники', 'Уведомления о недостающих специалистах'],
                    step: '01'
                  },
                  { 
                    Icon: WhatsAppIcon, 
                    title: 'WhatsApp-маршрутизация', 
                    desc: 'Каждый сотрудник получает персональный маршрутный лист с указанием номеров кабинетов и фамилий врачей',
                    features: ['Мгновенная отправка', 'Обновления в реальном времени', 'Автоматические напоминания'],
                    step: '02'
                  },
                  { 
                    Icon: ActivityIcon, 
                    title: 'Электронная медицинская карта', 
                    desc: 'Цифровая карта пациента. Врачи заполняют свои разделы онлайн, можно распечатать в любой момент',
                    features: ['Разделы для каждого специалиста', 'Автоматическое заполнение данных', 'Печать оригинала'],
                    step: '03'
                  },
                  { 
                    Icon: ShieldIcon, 
                    title: 'Синхронизация в реальном времени', 
                    desc: 'HR-отдел видит прогресс прохождения медосмотра каждым сотрудником. Клиника планирует нагрузку',
                    features: ['WebSocket обновления', 'Дашборд для HR', 'Автоматические отчеты'],
                    step: '04'
                  },
                  { 
                    Icon: ClockIcon, 
                    title: 'Экономия времени', 
                    desc: 'Регистратор тратит 2-3 минуты вместо 10-15. Клиника обслуживает в 2-3 раза больше пациентов',
                    features: ['Ускорение регистрации в 5 раз', 'Автоподстановка данных', 'Пропускная способность +40-60%'],
                    step: '05'
                  },
                  { 
                    Icon: UserMdIcon, 
                    title: 'Рабочее место врача', 
                    desc: 'Удобная очередь пациентов с автоматическим обновлением. Интерфейс максимально упрощен',
                    features: ['Цифровая очередь', 'Специализированные формы', 'Обучение 15 минут'],
                    step: '06'
                  },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveFeatureIndex(activeFeatureIndex === i ? null : i)}
                    className={`relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 border transition-all duration-300 cursor-pointer group ${
                      activeFeatureIndex === i 
                        ? 'border-blue-500/50 shadow-xl scale-[1.01] md:scale-[1.02] bg-gradient-to-br from-blue-50/30 to-indigo-50/20' 
                        : 'border-gray-200/50 shadow-sm hover:shadow-lg hover:border-blue-200/50 hover:bg-gradient-to-br hover:from-blue-50/10 hover:to-indigo-50/5'
                    }`}
                  >
                    {/* Step Number */}
                    <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      activeFeatureIndex === i 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 scale-110 shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400'
                    }`}>
                      <span className={`text-xs font-semibold transition-colors ${
                        activeFeatureIndex === i ? 'text-white' : 'text-[#86868B]'
                      }`}>{item.step}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-all duration-300 ${
                      activeFeatureIndex === i 
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 scale-110 shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-50 group-hover:to-indigo-50'
                    }`}>
                      <item.Icon className={`w-6 h-6 md:w-7 md:h-7 transition-colors ${
                        activeFeatureIndex === i ? 'text-white' : 'text-[#1D1D1F] group-hover:text-blue-600'
                      }`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-semibold text-[#1D1D1F] mb-2 md:mb-3 tracking-tight">{item.title}</h3>
                    
                    {/* Description */}
                    <p className={`text-xs md:text-sm text-[#86868B] mb-4 md:mb-6 leading-relaxed font-light transition-all duration-300 ${
                      activeFeatureIndex === i ? 'opacity-100' : 'opacity-80'
                    }`}>{item.desc}</p>

                    {/* Features List - Animated */}
                    <div className={`overflow-hidden transition-all duration-300 ${
                      activeFeatureIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <ul className="space-y-2.5 pt-4 border-t border-blue-100/50">
                        {item.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-3 text-sm text-[#86868B] animate-fade-in-up" style={{ animationDelay: `${j * 50}ms` }}>
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-colors ${
                              activeFeatureIndex === i ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-300'
                            }`}></div>
                            <span className="font-light">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expand Indicator */}
                    <div className={`mt-4 flex items-center gap-2 text-xs text-[#86868B] transition-all ${
                      activeFeatureIndex === i ? 'opacity-0' : 'opacity-100'
                    }`}>
                      <span>Нажмите для подробностей</span>
                      <span className={`transition-transform ${activeFeatureIndex === i ? 'rotate-180' : ''}`}>↓</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-24 px-4 md:px-6 bg-[#F5F5F7] border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 md:mb-16">
            {isPreOrderActive && (
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-700 to-red-800 rounded-full mb-3 shadow-lg shadow-red-500/30">
                  <span className="text-xs font-semibold text-white uppercase tracking-[0.15em]">Предзаказ: скидка 30%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[#86868B] text-center">
                    Только первые <span className="font-semibold text-red-700">50 заявок</span> получат скидку на <span className="font-semibold text-red-700">6 месяцев</span>
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 rounded-full">
                    <span className="text-sm font-semibold text-[#1D1D1F]">Забронировано:</span>
                    <span className="text-base font-bold text-red-700">{bookedCount}</span>
                    <span className="text-sm text-[#86868B]">из 50</span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden ml-2">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full transition-all duration-500"
                        style={{ width: `${(bookedCount / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1D1D1F] mb-3 md:mb-4 tracking-tight">Тарифные планы</h2>
            <p className="text-sm md:text-base text-[#86868B] max-w-2xl mx-auto font-light">Выберите подходящий план для вашего бизнеса</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Start Plan */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col border border-gray-200/50 transition-all hover:shadow-xl group">
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-semibold text-[#1D1D1F] mb-1 md:mb-2 tracking-tight">Старт</h3>
                <p className="text-xs md:text-sm text-[#86868B] font-light">Для малого бизнеса и клиник</p>
              </div>
              <div className="mb-6 md:mb-8">
                <div className="flex items-baseline gap-1 mb-2">
                  {isPreOrderActive ? (
                    <>
                      <span className="text-xs md:text-sm text-[#86868B] line-through mr-2 font-light">25 000</span>
                      <span className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight">17 500</span>
                    </>
                  ) : (
                    <span className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight">25 000</span>
                  )}
                  <span className="text-lg md:text-xl font-medium text-[#1D1D1F] ml-1">₸</span>
                </div>
                <div className="text-xs md:text-sm text-[#86868B] font-light">в месяц</div>
                {isPreOrderActive && <div className="text-xs text-red-700 font-semibold mt-2">Скидка 30%</div>}
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">До 100 сотрудников</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Полная база факторов</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Электронные медицинские карты</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Базовая отчетность</span>
                </li>
              </ul>
              <button 
                onClick={() => isPreOrderActive ? setPreOrderModal({ isOpen: true, plan: 'Старт' }) : onGetStarted()}
                className="w-full py-4 bg-white text-[#1D1D1F] border border-gray-300 rounded-2xl font-medium text-sm transition-all hover:bg-gray-50 hover:border-gray-400"
              >
                {isPreOrderActive ? 'Предзаказ' : 'Подключить'}
              </button>
            </div>

            {/* Business Plan */}
            <div className="bg-[#1D1D1F] rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col border border-gray-800 text-white transition-all hover:shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-white text-[#1D1D1F] text-[9px] md:text-[10px] font-semibold px-4 md:px-5 py-1.5 md:py-2 rounded-bl-xl md:rounded-bl-2xl uppercase tracking-[0.15em]">Популярный</div>
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-semibold mb-1 md:mb-2 text-white tracking-tight">Профессиональный</h3>
                <p className="text-xs md:text-sm text-gray-400 font-light">Для средних и крупных компаний</p>
              </div>
              <div className="mb-6 md:mb-8">
                <div className="flex items-baseline gap-1 mb-2">
                  {isPreOrderActive ? (
                    <>
                      <span className="text-xs md:text-sm text-gray-400 line-through mr-2 font-light">95 000</span>
                      <span className="text-4xl md:text-5xl font-semibold text-white tracking-tight">66 500</span>
                    </>
                  ) : (
                    <span className="text-4xl md:text-5xl font-semibold text-white tracking-tight">95 000</span>
                  )}
                  <span className="text-lg md:text-xl font-medium text-white ml-1">₸</span>
                </div>
                <div className="text-xs md:text-sm text-gray-400 font-light">в месяц</div>
                {isPreOrderActive && <div className="text-xs text-red-300 font-semibold mt-2">Скидка 30%</div>}
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">До 1 000 сотрудников</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">WhatsApp-маршрутизация</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Автоматическое формирование документов</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Приоритетная поддержка 24/7</span>
                </li>
              </ul>
              <button 
                onClick={() => isPreOrderActive ? setPreOrderModal({ isOpen: true, plan: 'Профессиональный' }) : onGetStarted()}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-medium text-sm transition-all hover:from-blue-700 hover:to-indigo-800 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {isPreOrderActive ? 'Предзаказ' : 'Выбрать этот план'}
              </button>
            </div>

            {/* Corporation Plan */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 flex flex-col border border-gray-200/50 transition-all hover:shadow-xl group">
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-semibold text-[#1D1D1F] mb-1 md:mb-2 tracking-tight">Корпоративный</h3>
                <p className="text-xs md:text-sm text-[#86868B] font-light">Для сетей и крупных холдингов</p>
              </div>
              <div className="mb-6 md:mb-8">
                <div className="flex items-baseline gap-1 mb-2">
                  {isPreOrderActive ? (
                    <>
                      <span className="text-xs md:text-sm text-[#86868B] line-through mr-2 font-light">290 000</span>
                      <span className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight">203 000</span>
                    </>
                  ) : (
                    <span className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight">290 000</span>
                  )}
                  <span className="text-lg md:text-xl font-medium text-[#1D1D1F] ml-1">₸</span>
                </div>
                <div className="text-xs md:text-sm text-[#86868B] font-light">в месяц</div>
                {isPreOrderActive && <div className="text-xs text-red-700 font-semibold mt-2">Скидка 30%</div>}
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Безлимитное количество сотрудников</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">Полная интеграция через API</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">White-label решение</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#1D1D1F]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1D1D1F] mt-1.5 flex-shrink-0"></div>
                  <span className="font-light">On-premise установка</span>
                </li>
              </ul>
              <button 
                onClick={() => isPreOrderActive ? setPreOrderModal({ isOpen: true, plan: 'Корпоративный' }) : onGetStarted()}
                className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl font-medium text-sm transition-all hover:from-slate-800 hover:to-slate-950 shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30"
              >
                {isPreOrderActive ? 'Предзаказ' : 'Индивидуальный расчет'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold text-center mb-16 text-[#1D1D1F] tracking-tight">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Как система помогает в прохождении профосмотра?",
                a: "MedWork автоматически определяет список врачей и анализов на основе вредных факторов работы, формирует цифровой маршрутный лист и отправляет его сотруднику в WhatsApp."
              },
              {
                q: "Соответствуют ли электронные карты требованиям?",
                a: "Да, наши электронные медицинские карты полностью соответствуют всем требованиям и позволяют распечатывать их в любой момент."
              },
              {
                q: "Нужна ли установка специального ПО?",
                a: "Нет, MedWork — это облачная SaaS-платформа. Вам нужен только браузер и доступ в интернет. Для сотрудников регистрация не обязательна, они получают информацию в WhatsApp."
              },
              {
                q: "Как обеспечивается безопасность данных?",
                a: "Мы используем современные протоколы шифрования и соблюдаем все требования по защите персональных данных."
              },
              {
                q: "Сколько времени занимает внедрение?",
                a: "Базовое внедрение занимает 1-2 дня. Обучение персонала — 30 минут для регистратора, 15 минут для врача. Мы предоставляем видео-инструкции и онлайн-поддержку."
              },
              {
                q: "Можно ли интегрировать с существующими системами?",
                a: "Да, MedWork может работать параллельно с вашей МИС или интегрироваться через API. Мы фокусируемся на специфике профосмотров, которую общие системы часто реализуют не полностью."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all">
                <h3 className="font-semibold text-base md:text-lg text-[#1D1D1F] mb-2 md:mb-3 tracking-tight">{item.q}</h3>
                <p className="text-xs md:text-sm text-[#86868B] leading-relaxed font-light">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-xs font-medium text-[#86868B] border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between gap-8">
             <div className="flex-1 max-w-sm">
                 <div className="mb-4">
                    <BrandLogo size="sm" variant="monochrome" />
                 </div>
                 <p className="mb-4 leading-relaxed">
                     Инновационная SaaS-платформа для управления процессами медицинских осмотров. Мы помогаем предприятиям Казахстана автоматизировать контроль здоровья сотрудников, снижать риски и повышать эффективность взаимодействия с клиниками.
                 </p>
                 <p className="text-xs text-[#86868B] mt-4">
                     Разработано с заботой о здоровье нации <span className="font-semibold text-[#1D1D1F]">AVR Group</span>
                 </p>
             </div>
             <div>
                 <h4 className="font-bold text-[#1D1D1F] mb-4">Продукт</h4>
                 <ul className="space-y-3">
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Для Бизнеса</a></li>
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Для Клиник</a></li>
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Цены</a></li>
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">API</a></li>
                 </ul>
             </div>
             <div>
                 <h4 className="font-bold text-[#1D1D1F] mb-4">Ресурсы</h4>
                 <ul className="space-y-3">
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">База знаний</a></li>
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Соответствие требованиям</a></li>
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Блог</a></li>
                 </ul>
             </div>
             <div>
                 <h4 className="font-bold text-[#1D1D1F] mb-4">Контакты</h4>
                 <ul className="space-y-3">
                     <li>info@medwork.digital</li>
                     <li>+77776875411</li>
                     <li>г. Астана</li>
                 </ul>
             </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2024 AVR Group</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-[#1D1D1F]">Конфиденциальность</a>
                <a href="#" className="hover:text-[#1D1D1F]">Оферта</a>
            </div>
        </div>
      </footer>

      {isPreOrderActive && (
        <PreOrderModal 
          isOpen={preOrderModal.isOpen} 
          onClose={() => setPreOrderModal({ ...preOrderModal, isOpen: false })} 
          initialPlan={preOrderModal.plan}
          bookedCount={bookedCount}
          onIncrementCount={incrementBookedCount}
        />
      )}

        <style>{`
         @keyframes fadeInUp {
           from { opacity: 0; transform: translateY(30px); }
           to { opacity: 1; transform: translateY(0); }
         }
         @keyframes slideUp {
           from { 
             opacity: 0; 
             transform: translateY(40px) scale(0.95); 
           }
           to { 
             opacity: 1; 
             transform: translateY(0) scale(1); 
           }
         }
         @keyframes gradientShift {
           0%, 100% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
         }
         @keyframes pulseSlow {
           0%, 100% { opacity: 0.3; transform: scale(1); }
           50% { opacity: 0.5; transform: scale(1.1); }
         }
         @keyframes spinSlow {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
         }
         @keyframes circleProgress {
           from { stroke-dashoffset: 565.48; }
           to { stroke-dashoffset: 141.37; }
         }
         @keyframes float {
           0%, 100% { transform: translateY(0px); }
           50% { transform: translateY(-10px); }
         }
         .animate-spin-slow {
           animation: spinSlow 20s linear infinite;
         }
         .animate-circle-progress {
           animation: circleProgress 2s ease-out forwards;
         }
         .animate-float {
           animation: float 3s ease-in-out infinite;
         }
         @keyframes scan {
           0% { top: 0; opacity: 0; }
           10% { opacity: 1; }
           90% { opacity: 1; }
           100% { top: 100%; opacity: 0; }
         }
         @keyframes countUp {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
         }
         @keyframes barFill {
           from { height: 0; }
           to { height: var(--target-height); }
         }
         @keyframes progress {
           from { width: 0; }
           to { width: var(--target-width); }
         }
         .animate-bar-fill {
           animation: barFill 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
         }
         .animate-progress {
           animation: progress 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
         }
         .animate-fade-in-up {
           animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
           opacity: 0;
         }
         .animate-slide-up {
           animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
         }
         .animate-gradient-shift {
           animation: gradientShift 3s ease infinite;
         }
         .animate-pulse-slow {
           animation: pulseSlow 4s ease-in-out infinite;
         }
         .animate-scan {
           animation: scan 3s linear infinite;
         }
         .animate-count-up {
           animation: countUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
           opacity: 0;
         }
         .delay-100 { animation-delay: 0.1s; }
         .delay-200 { animation-delay: 0.2s; }
         .delay-300 { animation-delay: 0.3s; }
         .delay-500 { animation-delay: 0.5s; }
         .delay-700 { animation-delay: 0.7s; }
         .delay-900 { animation-delay: 0.9s; }
         .delay-1000 { animation-delay: 1s; }
       `}</style>
    </div>
  );
};

export default LandingPage;