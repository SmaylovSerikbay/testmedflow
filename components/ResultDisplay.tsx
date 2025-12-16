import React from 'react';
import { AnalysisResult, GroundingChunk } from '../types';
import { LinkIcon } from './Icons';

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  // Simple markdown-to-JSX parser for safe rendering
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-serif font-bold text-brand-900 mt-6 mb-4">{line.replace('# ', '')}</h1>;
      }
      // Bullet points
      if (line.trim().startsWith('- ')) {
        return (
          <li key={index} className="ml-4 list-disc pl-1 text-slate-700 leading-relaxed my-1">
            {formatBold(line.replace('- ', ''))}
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
         return (
          <div key={index} className="ml-4 flex gap-2 text-slate-700 leading-relaxed my-1">
            <span className="font-semibold text-brand-700">{line.match(/^\d+\./)?.[0]}</span>
            <span>{formatBold(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }
      // Standard paragraph
      return <p key={index} className="text-slate-700 leading-relaxed mb-2">{formatBold(line)}</p>;
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Analysis Result</h2>
        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-medium">Gemini 2.5 Flash</span>
      </div>
      
      <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
        <div className="prose prose-slate max-w-none">
          {renderMarkdown(result.text)}
        </div>

        {/* Sources / Grounding */}
        {result.groundingChunks && result.groundingChunks.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Sources Referenced
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {result.groundingChunks.map((chunk, idx) => {
                if (!chunk.web?.uri) return null;
                return (
                  <a 
                    key={idx}
                    href={chunk.web.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors group"
                  >
                    <span className="text-sm font-medium text-slate-700 truncate pr-4">{chunk.web.title || chunk.web.uri}</span>
                    <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;