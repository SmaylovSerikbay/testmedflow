import React, { useState, useEffect, useMemo } from 'react';
import { Form052Data } from '../types/form052';
import { SaveIcon, PrinterIcon, EyeIcon, EditIcon } from './Icons';
import Form052GeneralPart from './form052/Form052GeneralPart';
import Form052FamilyPlan from './form052/Form052FamilyPlan';
import Form052NewbornPatronage from './form052/Form052NewbornPatronage';
import Form052ChildDevelopment from './form052/Form052ChildDevelopment';
import Form052Recommendations from './form052/Form052Recommendations';
import Form052DynamicObservation from './form052/Form052DynamicObservation';
import Form052PreventiveMeasures from './form052/Form052PreventiveMeasures';
import Form052AbuseExamination from './form052/Form052AbuseExamination';
import Form052AudiologyExamination from './form052/Form052AudiologyExamination';
import CollapsibleSection from './form052/CollapsibleSection';

interface Form052EditorProps {
  initialData?: Form052Data;
  mode?: 'edit' | 'view';
  onSave?: (data: Form052Data) => void;
  onPrint?: (data: Form052Data) => void;
}

const Form052Editor: React.FC<Form052EditorProps> = ({
  initialData,
  mode = 'edit',
  onSave,
  onPrint
}) => {
  const [formData, setFormData] = useState<Form052Data>(initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  // В режиме просмотра editMode всегда false и не может быть изменен
  const [editMode, setEditMode] = useState(mode === 'edit');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Синхронизируем editMode с mode - в режиме просмотра всегда false
  useEffect(() => {
    if (mode === 'view') {
      setEditMode(false);
    }
  }, [mode]);

  const handleDataChange = (section: keyof Form052Data, data: any) => {
    // В режиме просмотра запрещаем изменения
    if (mode === 'view') {
      console.warn('⚠️ Attempted to change data in view mode, section:', section);
      return;
    }
    // В режиме редактирования разрешаем изменения только если editMode = true
    if (!editMode) {
      console.warn('⚠️ Attempted to change data when editMode is false, section:', section);
      return;
    }
    console.log('✅ Data changed:', { section, data });
    setFormData(prev => ({
      ...prev,
      [section]: data,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      localStorage.setItem('form052_data', JSON.stringify(formData));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(formData);
    } else {
      window.print();
    }
  };

  const sections = [
    { 
      id: 'general', 
      label: 'Общая часть',
      keywords: ['общая', 'паспорт', 'минимальные', 'данные', 'риск', 'боль', 'аллергия', 'вакцинация', 'иин', 'фио', 'адрес']
    },
    { 
      id: 'family', 
      label: 'План работы с семьей',
      keywords: ['семья', 'план', 'работа', 'социальный', 'работник']
    },
    { 
      id: 'newborn', 
      label: 'Патронаж новорожденного',
      keywords: ['новорожденный', 'патронаж', 'ребенок', 'мать', 'грудное', 'вскармливание']
    },
    { 
      id: 'child', 
      label: 'Оценка развития ребенка',
      keywords: ['развитие', 'ребенок', 'психомоторное', 'прикорм', 'кормление']
    },
    { 
      id: 'recommendations', 
      label: 'Рекомендации',
      keywords: ['рекомендации', 'проблемы', 'планирование', 'семьи', 'консультация']
    },
    { 
      id: 'dynamic', 
      label: 'Динамическое наблюдение',
      keywords: ['динамическое', 'наблюдение', 'лечение', 'операция', 'протокол', 'консультация']
    },
    { 
      id: 'preventive', 
      label: 'Профилактические мероприятия',
      keywords: ['профилактика', 'вакцинация', 'прививка', 'диагностика', 'исследование']
    },
    { 
      id: 'abuse', 
      label: 'Осмотр при жестоком обращении',
      keywords: ['жестокое', 'обращение', 'повреждение', 'травма', 'психологическое', 'состояние', 'схема']
    },
    { 
      id: 'audiology', 
      label: 'Сурдологический осмотр',
      keywords: ['сурдологический', 'слух', 'слуховой', 'аппарат', 'имплант']
    },
  ];

  // Фильтрация разделов по поисковому запросу
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => 
      section.label.toLowerCase().includes(query) ||
      section.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  // Автоматически открываем найденные разделы при поиске
  useEffect(() => {
    if (searchQuery && filteredSections.length > 0) {
      const newExpanded = new Set(filteredSections.map(s => s.id));
      setExpandedSections(newExpanded);
    } else if (!searchQuery) {
      // При очистке поиска закрываем все
      setExpandedSections(new Set());
    }
  }, [searchQuery, filteredSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'general':
        return (
          <Form052GeneralPart
            data={formData.passportData}
            minimalData={formData.minimalMedicalData}
            onChange={(passport, minimal) => {
              handleDataChange('passportData', passport);
              handleDataChange('minimalMedicalData', minimal);
            }}
            editMode={editMode}
          />
        );
      case 'family':
        return (
          <Form052FamilyPlan
            data={formData.familyWorkPlan}
            onChange={(data) => handleDataChange('familyWorkPlan', data)}
            editMode={editMode}
          />
        );
      case 'newborn':
        return (
          <Form052NewbornPatronage
            data={formData.newbornPatronage}
            onChange={(data) => handleDataChange('newbornPatronage', data)}
            editMode={editMode}
          />
        );
      case 'child':
        return (
          <Form052ChildDevelopment
            data={formData.childDevelopment}
            onChange={(data) => handleDataChange('childDevelopment', data)}
            editMode={editMode}
          />
        );
      case 'recommendations':
        return (
          <Form052Recommendations
            data={formData.recommendations}
            onChange={(data) => handleDataChange('recommendations', data)}
            editMode={editMode}
          />
        );
      case 'dynamic':
        return (
          <Form052DynamicObservation
            data={formData.dynamicObservation}
            onChange={(data) => {
              console.log('📝 Form052Editor - dynamicObservation onChange:', data);
              handleDataChange('dynamicObservation', data);
            }}
            editMode={editMode}
          />
        );
      case 'preventive':
        return (
          <Form052PreventiveMeasures
            data={formData.preventiveMeasures}
            onChange={(data) => handleDataChange('preventiveMeasures', data)}
            editMode={editMode}
          />
        );
      case 'abuse':
        return (
          <Form052AbuseExamination
            data={formData.abuseExamination}
            onChange={(data) => handleDataChange('abuseExamination', data)}
            editMode={editMode}
          />
        );
      case 'audiology':
        return (
          <Form052AudiologyExamination
            data={formData.audiologyExamination}
            onChange={(data) => handleDataChange('audiologyExamination', data)}
            editMode={editMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Заголовок с кнопками */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Форма № 052/у
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Медицинская карта амбулаторного пациента
              </p>
              {formData.cardNumber && (
                <p className="text-xs text-slate-500 mt-1">
                  № {formData.cardNumber}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Кнопки редактирования и сохранения только в режиме редактирования */}
              {mode === 'edit' && (
                <>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      editMode
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {editMode ? (
                      <>
                        <EyeIcon className="w-4 h-4" />
                        Режим просмотра
                      </>
                    ) : (
                      <>
                        <EditIcon className="w-4 h-4" />
                        Режим редактирования
                      </>
                    )}
                  </button>
                  {editMode && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <SaveIcon className="w-4 h-4" />
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  )}
                </>
              )}
              {/* В режиме просмотра показываем только кнопку печати */}
              {mode === 'view' && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Печать
                </button>
              )}
            </div>
          </div>

          {/* Поиск */}
          <div className="relative max-w-md">
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по разделам формы..."
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-500 mt-2">
              Найдено разделов: {filteredSections.length}
            </p>
          )}
        </div>
      </div>

      {/* Контент формы с аккордеонами */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const isHighlighted = searchQuery && filteredSections.some(s => s.id === section.id);
            const isVisible = !searchQuery || isHighlighted;

            if (!isVisible) return null;

            return (
              <CollapsibleSection
                key={section.id}
                title={section.label}
                expanded={isExpanded}
                onToggle={(expanded) => toggleSection(section.id)}
                defaultExpanded={false}
                highlight={isHighlighted && searchQuery.length > 0}
              >
                {renderSectionContent(section.id)}
              </CollapsibleSection>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Form052Editor;
