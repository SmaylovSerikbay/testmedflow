import React, { useState, useRef } from 'react';
import { InstrumentalStudy } from '../../types/medical-forms';
import { FileTextIcon, UploadIcon, XIcon } from '../../components/Icons';

interface InstrumentalCardProps {
  type: InstrumentalStudy['type'];
  study?: InstrumentalStudy;
  onSave: (study: InstrumentalStudy) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

const InstrumentalCard: React.FC<InstrumentalCardProps> = ({
  type,
  study,
  onSave,
  onDelete,
  readOnly = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resultText, setResultText] = useState(study?.resultText || '');
  const [number, setNumber] = useState(study?.number || '');
  const [date, setDate] = useState(study?.date || new Date().toISOString().split('T')[0]);
  const [fileName, setFileName] = useState(study?.fileName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabels = {
    ECG: 'ЭКГ',
    XRAY: 'Рентгенография',
    ULTRASOUND: 'УЗИ',
    OTHER: 'Другое исследование'
  };

  // Быстрые чипы для добавления текста
  const quickChips: Record<InstrumentalStudy['type'], string[]> = {
    ECG: ['Норма', 'Синусовый ритм', 'Тахикардия', 'Брадикардия', 'Экстрасистолия'],
    XRAY: ['Норма', 'Без патологии', 'Бронхит', 'Пневмония', 'Плеврит'],
    ULTRASOUND: ['Норма', 'Без патологии', 'Гепатомегалия', 'Спленомегалия'],
    OTHER: ['Норма', 'Без патологии']
  };

  const handleChipClick = (chipText: string) => {
    if (readOnly) return;
    setResultText(prev => {
      if (prev) {
        return `${prev}. ${chipText}`;
      }
      return chipText;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Здесь можно добавить логику загрузки файла на сервер
      // Для примера просто сохраняем имя файла
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      // Логика загрузки файла
    }
  };

  const handleSave = () => {
    const newStudy: InstrumentalStudy = {
      id: study?.id || `study-${Date.now()}`,
      type,
      date,
      number,
      resultText,
      fileName,
      fileUrl: study?.fileUrl
    };
    onSave(newStudy);
  };

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between">
        <h3 className="text-white font-black text-lg tracking-tight">
          {typeLabels[type]}
        </h3>
        {study && onDelete && !readOnly && (
          <button
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Дата и номер */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Дата исследования
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              readOnly={readOnly}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Номер исследования
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              readOnly={readOnly}
              placeholder="№12345"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Загрузка файла */}
        {!readOnly && (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Загрузить файл (сканированное изображение или PDF)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600 mb-1">
                {fileName || 'Перетащите файл сюда или нажмите для выбора'}
              </p>
              <p className="text-xs text-slate-400">
                Поддерживаются изображения и PDF файлы
              </p>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-lg">
                <FileTextIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 font-medium">{fileName}</span>
              </div>
            )}
          </div>
        )}

        {/* Результат */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
            Результат исследования
          </label>
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            readOnly={readOnly}
            placeholder="Опишите результаты исследования..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900"
          />
        </div>

        {/* Быстрые чипы */}
        {!readOnly && quickChips[type] && (
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
              Быстрые шаблоны
            </label>
            <div className="flex flex-wrap gap-2">
              {quickChips[type].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  className="px-4 py-2 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg text-sm font-bold transition-all border border-slate-200 hover:border-blue-300"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Кнопка сохранения */}
        {!readOnly && (
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
          >
            Сохранить исследование
          </button>
        )}
      </div>
    </div>
  );
};

export default InstrumentalCard;

