import React from 'react';
import { X, Users, Building, ExternalLink } from 'lucide-react';

const CompareModal = ({ compareList, onClose, onRemove }) => {
  if (!compareList || compareList.length === 0) return null;

  // Calculate max values for highlighting
  const maxEmp = Math.max(...compareList.map(a => a.emp || 0));
  const maxFte = Math.max(...compareList.map(a => a.fte || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-slate-50 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-fade-in border border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="font-serif text-2xl text-slate-900 font-bold">Jämförelse</h2>
            <p className="text-slate-500 text-sm mt-1">Jämför {compareList.length} myndigheter sida-vid-sida</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
            <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 bg-slate-50/50">
          <div className="flex gap-6 h-full min-w-max">
            {compareList.map(agency => {
              const isMaxEmp = agency.emp === maxEmp && maxEmp > 0;
              const isMaxFte = agency.fte === maxFte && maxFte > 0;

              return (
                <div key={agency.n} className="w-[320px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 relative group">
                  <button 
                    onClick={() => onRemove(agency)}
                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="p-6 border-b border-slate-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-2xl font-serif font-bold text-slate-900 mb-4 border border-slate-100 shadow-inner">
                      {agency.n.charAt(0)}
                    </div>
                    <h3 className="font-serif text-xl text-slate-900 leading-tight mb-2 min-h-[3.5rem]">
                      {agency.n}
                    </h3>
                    <span className="inline-flex px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                      {agency.d}
                    </span>
                  </div>

                  <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Users className="w-3 h-3" /> Personal
                      </div>
                      <div className={`text-3xl font-serif old-style-nums font-medium transition-colors ${isMaxEmp ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {agency.emp ? agency.emp.toLocaleString('sv-SE') : '–'}
                      </div>
                      {agency.fte && (
                        <div className={`text-sm mt-1 font-medium flex items-center gap-1 ${isMaxFte ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {agency.fte.toLocaleString('sv-SE')} FTE
                          {isMaxFte && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold">Störst</span>}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <Building className="w-3 h-3" /> Organisation
                      </div>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <dt className="text-slate-500">Form</dt>
                          <dd className="font-medium text-slate-900 text-right">{agency.str || '–'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <dt className="text-slate-500">Säte</dt>
                          <dd className="font-medium text-slate-900 text-right">{agency.city || '–'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <dt className="text-slate-500">Bildad</dt>
                          <dd className="font-medium text-slate-900 old-style-nums">{agency.s ? agency.s.split('-')[0] : '–'}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <dt className="text-slate-500">SFS</dt>
                          <dd className="font-mono text-slate-900 text-xs bg-slate-50 px-1.5 rounded border border-slate-200">{agency.sfs || '–'}</dd>
                        </div>
                      </dl>
                    </div>

                    {agency.web && (
                      <div className="mt-auto pt-4">
                        <a 
                          href={agency.web} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-primary-200 hover:text-primary-700 transition-all text-sm font-bold shadow-sm hover:shadow"
                        >
                          Webbplats <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;