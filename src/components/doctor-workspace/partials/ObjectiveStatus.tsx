import React from 'react';
import { DoctorVisit } from '../../../types/medical-forms';

interface ObjectiveStatusProps {
  specialty: DoctorVisit['specialty'];
  objectiveData: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}

const ObjectiveStatus: React.FC<ObjectiveStatusProps> = ({
  specialty,
  objectiveData,
  onChange
}) => {
  const updateField = (key: string, value: string) => {
    onChange({ ...objectiveData, [key]: value });
  };

  // Рендер полей для Терапевта
  const renderTherapistFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Общее состояние
        </label>
        <input
          type="text"
          value={objectiveData.general_condition || ''}
          onChange={(e) => updateField('general_condition', e.target.value)}
          placeholder="удовлетворительное"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Сознание
        </label>
        <input
          type="text"
          value={objectiveData.consciousness || ''}
          onChange={(e) => updateField('consciousness', e.target.value)}
          placeholder="ясное"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Кожные покровы
        </label>
        <input
          type="text"
          value={objectiveData.skin || ''}
          onChange={(e) => updateField('skin', e.target.value)}
          placeholder="чистые, нормальной окраски"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Лимфоузлы
        </label>
        <input
          type="text"
          value={objectiveData.lymph_nodes || ''}
          onChange={(e) => updateField('lymph_nodes', e.target.value)}
          placeholder="не увеличены"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Органы дыхания
        </label>
        <input
          type="text"
          value={objectiveData.respiratory_system || ''}
          onChange={(e) => updateField('respiratory_system', e.target.value)}
          placeholder="дыхание везикулярное, хрипов нет"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Сердечно-сосудистая система
        </label>
        <input
          type="text"
          value={objectiveData.cardiovascular_system || ''}
          onChange={(e) => updateField('cardiovascular_system', e.target.value)}
          placeholder="тоны сердца ясные, ритмичные"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Живот
        </label>
        <input
          type="text"
          value={objectiveData.abdomen || ''}
          onChange={(e) => updateField('abdomen', e.target.value)}
          placeholder="мягкий, безболезненный"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Печень
        </label>
        <input
          type="text"
          value={objectiveData.liver || ''}
          onChange={(e) => updateField('liver', e.target.value)}
          placeholder="не увеличена"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Селезенка
        </label>
        <input
          type="text"
          value={objectiveData.spleen || ''}
          onChange={(e) => updateField('spleen', e.target.value)}
          placeholder="не увеличена"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
    </div>
  );

  // Рендер полей для ЛОРа
  const renderENTFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Уши
        </label>
        <input
          type="text"
          value={objectiveData.ears || ''}
          onChange={(e) => updateField('ears', e.target.value)}
          placeholder="без особенностей"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Носовое дыхание
        </label>
        <input
          type="text"
          value={objectiveData.nose_breathing || ''}
          onChange={(e) => updateField('nose_breathing', e.target.value)}
          placeholder="свободное"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Зев
        </label>
        <input
          type="text"
          value={objectiveData.zeva || ''}
          onChange={(e) => updateField('zeva', e.target.value)}
          placeholder="спокоен, розовый"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Миндалины
        </label>
        <input
          type="text"
          value={objectiveData.tonsils || ''}
          onChange={(e) => updateField('tonsils', e.target.value)}
          placeholder="не увеличены"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Гортань
        </label>
        <input
          type="text"
          value={objectiveData.larynx || ''}
          onChange={(e) => updateField('larynx', e.target.value)}
          placeholder="без особенностей"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
    </div>
  );

  // Рендер полей для Хирурга
  const renderSurgeonFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Кожные покровы
        </label>
        <input
          type="text"
          value={objectiveData.skin || ''}
          onChange={(e) => updateField('skin', e.target.value)}
          placeholder="чистые, без патологических изменений"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Вены
        </label>
        <input
          type="text"
          value={objectiveData.veins || ''}
          onChange={(e) => updateField('veins', e.target.value)}
          placeholder="варикозного расширения нет"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Живот
        </label>
        <input
          type="text"
          value={objectiveData.abdomen || ''}
          onChange={(e) => updateField('abdomen', e.target.value)}
          placeholder="мягкий, безболезненный"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Грыжи
        </label>
        <input
          type="text"
          value={objectiveData.hernias || ''}
          onChange={(e) => updateField('hernias', e.target.value)}
          placeholder="нет"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          Суставы
        </label>
        <input
          type="text"
          value={objectiveData.joints || ''}
          onChange={(e) => updateField('joints', e.target.value)}
          placeholder="подвижность сохранена"
          className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
        />
      </div>
    </div>
  );

  // Выбор полей в зависимости от специальности
  const renderFields = () => {
    switch (specialty) {
      case 'THERAPIST':
        return renderTherapistFields();
      case 'ENT':
        return renderENTFields();
      case 'SURGEON':
        return renderSurgeonFields();
      case 'NEUROLOGIST':
      case 'OPHTHALMOLOGIST':
      case 'DERMATOLOGIST':
      case 'GYNECOLOGIST':
      case 'PSYCHIATRIST':
      case 'NARCOLOGIST':
      default:
        // Для остальных специальностей - универсальное текстовое поле
        return (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Объективные данные
            </label>
            <textarea
              value={objectiveData.general || ''}
              onChange={(e) => updateField('general', e.target.value)}
              placeholder="Опишите объективные данные осмотра..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-50 rounded-[24px] border border-slate-100 p-6">
      {renderFields()}
    </div>
  );
};

export default ObjectiveStatus;

