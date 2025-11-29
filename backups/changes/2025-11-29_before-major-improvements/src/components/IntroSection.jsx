import React, { useState, useEffect } from 'react';
import { Landmark, Database, Users, Calendar } from 'lucide-react';

const IntroSection = ({ agencyCount, activeCount }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('introCollapsed');
    return stored !== null ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('introCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="mb-8">
      <div 
        className={`bg-white rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-20 cursor-pointer hover:shadow-md' : 'max-h-[500px]'
        }`}
        onClick={() => isCollapsed && setIsCollapsed(false)}
      >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-stone-900 pointer-events-none">
          <Landmark className="w-64 h-64" />
        </div>

        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Svensk Statsförvaltning i Siffror</h2>
              <p className={`text-stone-500 leading-relaxed transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100 mb-4'}`}>
                Utforska hur den svenska statsapparaten förändrats från 1978 till idag. 
                Data hämtas direkt från <span className="font-medium text-stone-800">ESV</span>, <span className="font-medium text-stone-800">SCB</span> och <span class="font-medium text-stone-800">Wikidata</span>.
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
              className="text-stone-400 hover:text-stone-600 text-xs font-medium uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full hover:bg-stone-100 transition-colors"
            >
              {isCollapsed ? 'Visa mer' : 'Dölj'}
            </button>
          </div>

          <div className={`flex gap-6 text-xs font-medium text-stone-500 transition-all duration-300 ${isCollapsed ? 'mt-0' : 'mt-2'}`}>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sage-500" /> 
              {agencyCount || 342} Myndigheter
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sage-500" /> 
              ~270k Anställda
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sage-500" /> 
              Uppdaterad idag
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;