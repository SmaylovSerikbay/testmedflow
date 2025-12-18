import React, { useState, useEffect } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
  badge?: number | string;
  highlight?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  className = '',
  badge,
  highlight = false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (isControlled && controlledExpanded !== undefined) {
      // Управляется извне
    } else {
      setInternalExpanded(defaultExpanded);
    }
  }, [controlledExpanded, defaultExpanded, isControlled]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (isControlled && onToggle) {
      onToggle(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${highlight ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'} ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-4 py-3 transition-colors flex items-center justify-between text-left ${
          highlight ? 'bg-amber-50 hover:bg-amber-100' : 'bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={`font-semibold ${highlight ? 'text-slate-900' : 'text-slate-900'}`}>{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-4 bg-white border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;

