import React, { useState, useMemo } from 'react';
import { FACTOR_RULES, FactorRule, CATEGORY_LABELS } from '../factorRules';

interface HarmfulFactorModalProps {
  selectedFactorKeys: Set<string>;
  setSelectedFactorKeys: (keys: Set<string>) => void;
  onClose: () => void;
  onApply: () => void;
}

const HarmfulFactorModal: React.FC<HarmfulFactorModalProps> = ({
  selectedFactorKeys,
  setSelectedFactorKeys,
  onClose,
  onApply
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<FactorRule['category']>>(new Set());

  // Фильтрация правил по поисковому запросу
  const filteredRules = useMemo(() => {
    if (!searchTerm.trim()) return FACTOR_RULES;
    
    const search = searchTerm.toLowerCase();
    return FACTOR_RULES.filter(rule => 
      rule.title.toLowerCase().includes(search) ||
      rule.keywords.some(keyword => keyword.toLowerCase().includes(search))
    );
  }, [searchTerm]);

  // Группировка по категориям
  const rulesByCategory = useMemo(() => {
    const grouped: Record<FactorRule['category'], FactorRule[]> = {
      chemical: [],
      physical: [],
      biological: [],
      profession: [],
      other: []
    };

    filteredRules.forEach(rule => {
      grouped[rule.category].push(rule);
    });

    return grouped;
  }, [filteredRules]);

  const toggleCategory = (category: FactorRule['category']) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleFactor = (uniqueKey: string) => {
    const newSelected = new Set(selectedFactorKeys);
    if (newSelected.has(uniqueKey)) {
      newSelected.delete(uniqueKey);
    } else {
      newSelected.add(uniqueKey);
    }
    setSelectedFactorKeys(newSelected);
  };

  const handleSelectAll = (category: FactorRule['category']) => {
    const categoryRules = rulesByCategory[category];
    const newSelected = new Set(selectedFactorKeys);
    
    const allSelected = categoryRules.every(rule => newSelected.has(rule.uniqueKey));
    
    if (allSelected) {
      // Убираем все из этой категории
      categoryRules.forEach(rule => newSelected.delete(rule.uniqueKey));
    } else {
      // Добавляем все из этой категории
      categoryRules.forEach(rule => newSelected.add(rule.uniqueKey));
    }
    
    setSelectedFactorKeys(newSelected);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Выбор вредных и опасных факторов
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Выберите факторы согласно Перечню вредных производственных факторов
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Закрыть"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-slate-100">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию или ключевым словам..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {(Object.entries(rulesByCategory) as [FactorRule['category'], FactorRule[]][]).map(([category, rules]) => {
              if (rules.length === 0) return null;
              
              const categoryKey = category as FactorRule['category'];
              const isExpanded = expandedCategories.has(categoryKey);
              const selectedInCategory = rules.filter(rule => selectedFactorKeys.has(rule.uniqueKey)).length;
              const allSelected = selectedInCategory === rules.length;
              const someSelected = selectedInCategory > 0 && selectedInCategory < rules.length;

              return (
                <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryKey)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <svg 
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {CATEGORY_LABELS[categoryKey]}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedInCategory} из {rules.length} выбрано
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(categoryKey)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        allSelected 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                          : someSelected
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {allSelected ? 'Убрать все' : someSelected ? 'Выбрать все' : 'Выбрать все'}
                    </button>
                  </div>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                      {rules.map(rule => (
                        <label
                          key={rule.uniqueKey}
                          className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFactorKeys.has(rule.uniqueKey)}
                            onChange={() => toggleFactor(rule.uniqueKey)}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                п. {rule.id}
                              </span>
                              <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                {rule.title}
                              </span>
                            </div>
                            {rule.keywords && rule.keywords.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {rule.keywords.slice(0, 3).map((keyword, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                                {rule.keywords.length > 3 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{rule.keywords.length - 3} еще
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Выбрано: <span className="font-semibold text-slate-900">{selectedFactorKeys.size}</span> {
              selectedFactorKeys.size === 1 ? 'пункт' : 
              selectedFactorKeys.size < 5 ? 'пункта' : 'пунктов'
            }
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onApply}
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarmfulFactorModal;