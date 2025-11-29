import React from 'react';
import { X, ArrowLeftRight } from 'lucide-react';

const CompareFloatingBar = ({ compareList, onClear, onOpenCompare }) => {
  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-slate-900 text-white pl-6 pr-2 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {compareList.map(agency => (
              <div key={agency.n} className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-serif font-bold border-2 border-slate-900">
                {agency.n.charAt(0)}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium">
            {compareList.length} vald{compareList.length !== 1 && 'a'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenCompare}
            disabled={compareList.length < 2}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Jämför <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button 
            onClick={onClear}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareFloatingBar;
