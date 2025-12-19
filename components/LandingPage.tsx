import React, { useEffect, useState } from 'react';
import { CheckShieldIcon, UsersIcon, SparklesIcon, WhatsAppIcon, LoaderIcon } from './Icons';
import BrandLogo from './BrandLogo';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

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
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1] text-[#1D1D1F]">
              Автоматизация медицинских осмотров
            </h1>
            <p className="text-lg md:text-xl text-[#86868B] max-w-2xl mx-auto font-light mb-3">
              Соответствие требованиям приказа № ҚР ДСМ-7
            </p>
            <p className="text-sm text-[#86868B] max-w-xl mx-auto">
              Экономьте время, исключайте ошибки, соблюдайте требования
            </p>
          </div>

          {/* Main Content Grid - 3 Columns */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Column 1: Stats Circle */}
            <div className="relative flex items-center">
              <div className="relative w-full max-w-xs mx-auto aspect-square">
                <svg className="w-full h-full transform -rotate-90 animate-spin-slow" viewBox="0 0 400 400">
                  <circle cx="200" cy="200" r="180" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="none"
                    stroke="#0071E3"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 180}`}
                    strokeDashoffset={`${2 * Math.PI * 180 * 0.25}`}
                    className="animate-circle-progress"
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl md:text-5xl font-bold text-[#1D1D1F] mb-1 animate-count-up">100%</div>
                  <div className="text-sm text-[#86868B] font-medium">Соответствие</div>
                  <div className="text-[10px] text-[#86868B] mt-1">требованиям</div>
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 animate-float">
                  <div className="text-xl font-bold text-[#0071E3]">200+</div>
                  <div className="text-[10px] text-[#86868B]">Факторов</div>
                </div>
                <div className="absolute bottom-0 left-0 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 animate-float delay-500">
                  <div className="text-xl font-bold text-green-600">24/7</div>
                  <div className="text-[10px] text-[#86868B]">Доступ</div>
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-2xl p-3 shadow-xl border border-gray-100 animate-float delay-1000">
                  <div className="text-xl font-bold text-purple-600">0</div>
                  <div className="text-[10px] text-[#86868B]">Штрафов</div>
                </div>
              </div>
            </div>

            {/* Column 2: Process & Features */}
            <div className="flex flex-col space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg">
                <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">Как это работает</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F] mb-1">Загрузка списка</div>
                      <div className="text-xs text-[#86868B]">Загрузите список сотрудников</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F] mb-1">Автоопределение</div>
                      <div className="text-xs text-[#86868B]">Система определяет факторы</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F] mb-1">Готовые документы</div>
                      <div className="text-xs text-[#86868B]">Маршрутные листы готовы</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">Возможности</h3>
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center gap-3">
                    <CheckShieldIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F]">Автоопределение</div>
                      <div className="text-xs text-[#86868B]">200+ вредных факторов</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F]">Синхронизация</div>
                      <div className="text-xs text-[#86868B]">Организация ↔ Клиника</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <WhatsAppIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-[#1D1D1F]">Уведомления</div>
                      <div className="text-xs text-[#86868B]">WhatsApp сотрудникам</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Stats & CTA */}
            <div className="flex flex-col space-y-4">
              <div className="bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] rounded-2xl p-5 text-white shadow-xl">
                <h3 className="text-lg font-bold mb-3">Результаты</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Обработано</span>
                      <span className="text-lg font-bold">12,543</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-progress" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Экономия</span>
                      <span className="text-lg font-bold text-green-400">40ч/мес</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full animate-progress" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Компаний</span>
                      <span className="text-lg font-bold">500+</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full animate-progress" style={{width: '95%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={onGetStarted}
                className="w-full group relative px-5 py-3.5 bg-red-700 text-white rounded-xl font-semibold text-sm overflow-hidden transition-all duration-300 hover:scale-105 active:scale-100 shadow-2xl hover:bg-red-800"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Подключить организацию
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </button>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg flex-grow flex flex-col">
                <h3 className="text-lg font-bold text-[#1D1D1F] mb-3">Преимущества</h3>
                <div className="space-y-2 text-sm flex-grow">
                  <div className="flex items-center gap-2 text-[#86868B]">
                    <span className="text-green-500">✓</span>
                    <span>100% соответствие приказу</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#86868B]">
                    <span className="text-green-500">✓</span>
                    <span>Автоматическое формирование</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#86868B]">
                    <span className="text-green-500">✓</span>
                    <span>Синхронизация в реальном времени</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#86868B]">
                    <span className="text-green-500">✓</span>
                    <span>Экономия 40 часов в месяц</span>
                  </div>
                </div>
              </div>
            </div>
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
                     Платформа №1 в Казахстане для автоматизации медицинских осмотров и интеграции с клиниками.
                 </p>
                 <p className="text-xs text-[#86868B] mt-4">
                     Платформа powered by <span className="font-semibold text-[#1D1D1F]">AVR Group</span>
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
                     <li><a href="#" className="hover:text-[#0071E3] transition-colors">Законы (ДСМ-7)</a></li>
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