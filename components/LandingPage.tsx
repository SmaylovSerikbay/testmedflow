import React, { useEffect, useState } from 'react';
import { CheckShieldIcon, UsersIcon, SparklesIcon, LogoIcon, WhatsAppIcon, LoaderIcon } from './Icons';

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
        <div className="max-w-[1000px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top:0, behavior: 'smooth'})}>
            <LogoIcon className="w-5 h-5 text-[#1D1D1F]" />
            <span className="font-semibold text-lg tracking-tight text-[#1D1D1F]">MedFlow</span>
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

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-[1200px] mx-auto w-full text-center">
        
        <div className="animate-fade-in-up flex flex-col items-center">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0071E3]/30 bg-blue-50/50 text-[#0071E3] text-[10px] font-bold uppercase tracking-wider mb-8">
              <span>Новое</span>
              <span className="w-1 h-1 rounded-full bg-[#0071E3]"></span>
              <span>Gemini 2.5 Flash Integration</span>
           </div>

           <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter mb-6 leading-[1.05] text-[#1D1D1F]">
            Медицинский комплаенс.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2c3e50] to-[#4ca1af]">Совершенно новый уровень.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#86868B] max-w-xl mx-auto mb-10 leading-relaxed font-medium animate-fade-in-up delay-100">
            Платформа на базе ИИ, которая превращает хаос в документах в структурированные данные согласно приказу № ҚР ДСМ-7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
            <button 
              onClick={onGetStarted}
              className="px-8 py-3.5 bg-[#0071E3] text-white rounded-full font-medium text-base hover:bg-[#0077ED] transition-all shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5"
            >
              Подключить организацию
            </button>
            <button className="px-8 py-3.5 text-[#0071E3] bg-white border border-gray-200 rounded-full font-medium text-base hover:bg-gray-50 transition-all">
              Узнать больше
            </button>
          </div>
        </div>

        {/* Hero Visual - Dashboard Simulation */}
        <div className="mt-20 relative max-w-4xl mx-auto animate-fade-in-up delay-300 group cursor-default">
           {/* Glow Layer */}
           <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
           
           <div className="relative bg-white rounded-[2rem] shadow-2xl border border-gray-200 overflow-hidden ring-1 ring-black/5">
              {/* Fake Window Header */}
              <div className="h-12 bg-gray-50/80 backdrop-blur-md border-b border-gray-200 flex items-center px-6 gap-2">
                  <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                     <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                     <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-gray-200/50 rounded-md text-[10px] font-medium text-gray-500 flex items-center gap-2">
                     <CheckShieldIcon className="w-3 h-3" />
                     medflow-dashboard.app
                  </div>
              </div>

              {/* Interface Content */}
              <div className="p-8 md:p-12 bg-white relative min-h-[400px]">
                  {/* Background Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>

                  <div className="flex flex-col gap-6 relative z-10">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="text-2xl font-bold text-[#1D1D1F]">Список сотрудников</div>
                              <div className="text-sm text-gray-400 mt-1">ТОО "KazPetrol" • Обновлено только что</div>
                          </div>
                          <div className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-black/20">
                              <SparklesIcon className="w-4 h-4" />
                              AI Analysis Active
                          </div>
                      </div>

                      {/* Data Table Mockup */}
                      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                              <div className="w-1/4">ФИО</div>
                              <div className="w-1/4">Должность</div>
                              <div className="w-1/4">Фактор</div>
                              <div className="w-1/4">Статус</div>
                          </div>
                          
                          {/* Row 1 - Processed */}
                          <div className="px-6 py-4 flex items-center gap-4 border-b border-gray-50 bg-white hover:bg-gray-50 transition-colors">
                              <div className="w-1/4 font-medium text-gray-900 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">АС</div>
                                  Алия Смаилова
                              </div>
                              <div className="w-1/4 text-gray-500 text-sm">Главный бухгалтер</div>
                              <div className="w-1/4 text-gray-400 text-sm">-</div>
                              <div className="w-1/4"><span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">ГОДЕН</span></div>
                          </div>

                          {/* Row 2 - Scanning Animation */}
                          <div className="relative px-6 py-4 flex items-center gap-4 bg-blue-50/30 overflow-hidden">
                              {/* Scanning Beam */}
                              <div className="absolute top-0 bottom-0 w-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-scan z-20"></div>
                              
                              <div className="w-1/4 font-medium text-gray-900 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">ИИ</div>
                                  Иванов Иван
                              </div>
                              <div className="w-1/4 text-gray-500 text-sm">Электрогазосварщик</div>
                              <div className="w-1/4">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold animate-pulse">
                                     Шум, Аэрозоли
                                  </span>
                              </div>
                              <div className="w-1/4 text-xs text-blue-600 font-medium">Обработка...</div>
                          </div>

                          {/* Row 3 - Blur */}
                          <div className="px-6 py-4 flex items-center gap-4 opacity-50 filter blur-[1px]">
                              <div className="w-1/4 font-medium text-gray-900 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                                  Петров Сергей
                              </div>
                              <div className="w-1/4 text-gray-500 text-sm">Водитель</div>
                              <div className="w-1/4 text-gray-400 text-sm">Вибрация</div>
                              <div className="w-1/4"><div className="h-4 w-16 bg-gray-100 rounded-full"></div></div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* Partners / Trust */}
      <section className="py-10 border-b border-gray-200 bg-white">
          <div className="max-w-[1000px] mx-auto text-center px-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Выбор лидеров индустрии</p>
              <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-60">
                  {/* CSS Placeholders for Logos to keep code clean */}
                  <div className="text-xl font-bold text-gray-800 font-serif italic">KazPetrol</div>
                  <div className="text-xl font-bold text-gray-800 tracking-tighter">MEDIKER</div>
                  <div className="text-xl font-bold text-gray-800 uppercase flex items-center gap-1"><div className="w-4 h-4 bg-gray-800 rounded-full"></div>Q-Med</div>
                  <div className="text-xl font-bold text-gray-800 font-mono">BI Group</div>
              </div>
          </div>
      </section>

      {/* Comparison Section */}
      <section className="py-32 px-6 bg-[#F5F5F7]">
          <div className="max-w-[1000px] mx-auto">
             <div className="grid md:grid-cols-2 gap-16 items-center">
                 <div>
                     <h2 className="text-4xl font-semibold mb-6 text-[#1D1D1F]">Забудьте про Excel.</h2>
                     <p className="text-lg text-[#86868B] leading-relaxed mb-8">
                         Ручное заполнение Приложения 3 отнимает до 40 часов в месяц у HR-отдела. Ошибки в факторах вредности приводят к штрафам.
                     </p>
                     <ul className="space-y-4">
                         <li className="flex items-center gap-3 text-gray-500">
                             <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">✕</span>
                             Ручной ввод данных
                         </li>
                         <li className="flex items-center gap-3 text-gray-500">
                             <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">✕</span>
                             Поиск кодов вредности в справочниках
                         </li>
                         <li className="flex items-center gap-3 text-gray-500">
                             <span className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs">✕</span>
                             Потеря бумажных направлений
                         </li>
                     </ul>
                 </div>
                 <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 relative">
                     <div className="absolute -top-6 -right-6 bg-[#0071E3] text-white px-6 py-3 rounded-2xl shadow-lg font-bold z-10">
                         MedFlow Way
                     </div>
                     <div className="space-y-6">
                         <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                             <div className="p-2 bg-white rounded-lg text-green-600 shadow-sm"><SparklesIcon className="w-5 h-5" /></div>
                             <div>
                                 <h4 className="font-bold text-gray-900">ИИ Обработка</h4>
                                 <p className="text-sm text-gray-600 mt-1">Загрузите любой список. Система сама расставит вредные факторы.</p>
                             </div>
                         </div>
                         <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                             <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><UsersIcon className="w-5 h-5" /></div>
                             <div>
                                 <h4 className="font-bold text-gray-900">Единая база</h4>
                                 <p className="text-sm text-gray-600 mt-1">Клиника видит списки мгновенно. Результаты подгружаются в реальном времени.</p>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      </section>

      {/* Bento Grid Features */}
      <section className="bg-white py-32 px-6 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-6">Вся мощь в деталях.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 grid-rows-2 gap-6 h-auto md:h-[600px]">
             
             {/* Feature 1: Compliance (Wide) */}
             <div className="md:col-span-4 bg-[#F5F5F7] rounded-[2rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
                <div className="z-10 max-w-sm">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                        <CheckShieldIcon className="w-6 h-6 text-gray-900" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-[#1D1D1F]">100% Legal</h3>
                    <p className="text-[#86868B] font-medium leading-relaxed">
                        Алгоритмы MedFlow обновляются синхронно с базой Adilet.zan.kz. Гарантия отсутствия штрафов при проверках.
                    </p>
                </div>
                {/* Visual Graphic */}
                <div className="absolute right-0 bottom-8 w-1/3 flex flex-col gap-3 opacity-80 group-hover:translate-x-2 transition-transform duration-500">
                    <div className="h-2 bg-gray-200 rounded-l-full w-full"></div>
                    <div className="h-2 bg-gray-200 rounded-l-full w-3/4 self-end"></div>
                    <div className="h-2 bg-[#0071E3] rounded-l-full w-full self-end shadow-lg shadow-blue-500/20"></div>
                    <div className="h-2 bg-gray-200 rounded-l-full w-5/6 self-end"></div>
                </div>
             </div>

             {/* Feature 2: Analytics (Tall) */}
             <div className="md:col-span-2 md:row-span-2 bg-black text-white rounded-[2rem] p-8 md:p-10 flex flex-col relative overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                 <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Аналитика</h3>
                    <p className="text-gray-400 font-medium text-sm">Здоровье компании на ладони.</p>
                 </div>
                 
                 <div className="mt-auto flex items-end justify-between gap-2 h-40">
                     {[35, 60, 45, 80, 55].map((h, i) => (
                         <div key={i} className="w-full bg-gray-800 rounded-t-md relative overflow-hidden group-hover:bg-gray-700 transition-colors">
                             <div 
                                style={{height: `${h}%`}} 
                                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-out"
                             />
                         </div>
                     ))}
                 </div>
             </div>

             {/* Feature 3: WhatsApp (Box) */}
             <div className="md:col-span-2 bg-[#E8F8F0] rounded-[2rem] p-8 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-500">
                 <div>
                    <h3 className="text-xl font-bold mb-2 text-[#006038]">WhatsApp API</h3>
                    <p className="text-[#006038]/70 text-sm font-medium">Уведомления сотрудникам.</p>
                 </div>
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-600 mt-4 border border-[#006038]/10">
                     Здравствуйте! Ваш медосмотр запланирован на 12.12 в 09:00.
                 </div>
             </div>

             {/* Feature 4: Cloud (Box) */}
             <div className="md:col-span-2 bg-blue-50 rounded-[2rem] p-8 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-500 border border-blue-100">
                 <div>
                    <h3 className="text-xl font-bold mb-2 text-blue-900">Облако</h3>
                    <p className="text-blue-700/70 text-sm font-medium">Доступ 24/7 с любого устройства.</p>
                 </div>
                 <div className="flex -space-x-3 mt-4">
                     <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"></div>
                     <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300"></div>
                     <div className="w-10 h-10 rounded-full border-2 border-white bg-[#0071E3] flex items-center justify-center text-white text-[10px] font-bold">+4k</div>
                 </div>
             </div>

          </div>
        </div>
      </section>
      
      {/* Pre-Footer CTA */}
      <section className="bg-[#F5F5F7] py-24 text-center px-6">
          <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold mb-6">Готовы автоматизировать рутину?</h2>
              <p className="text-[#86868B] mb-10 text-lg">Присоединяйтесь к 500+ компаниям, которые уже используют MedFlow для управления охраной труда.</p>
              <button 
                  onClick={onGetStarted}
                  className="px-10 py-4 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl"
              >
                  Начать бесплатно
              </button>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-xs font-medium text-[#86868B] border-t border-gray-200">
        <div className="max-w-[1000px] mx-auto px-6 grid md:grid-cols-4 gap-8">
             <div className="col-span-1">
                 <div className="flex items-center gap-2 mb-4 text-[#1D1D1F]">
                    <LogoIcon className="w-5 h-5" />
                    <span className="font-semibold text-base">MedFlow AI</span>
                 </div>
                 <p className="mb-4 leading-relaxed">
                     Платформа №1 в Казахстане для автоматизации медицинских осмотров и интеграции с клиниками.
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
                     <li>support@medflow.kz</li>
                     <li>+7 (700) 123-45-67</li>
                     <li>г. Астана, пр. Мангилик Ел, 55</li>
                 </ul>
             </div>
        </div>
        <div className="max-w-[1000px] mx-auto px-6 mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2024 MedFlow Inc.</p>
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
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
};

export default LandingPage;