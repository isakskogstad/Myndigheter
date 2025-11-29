import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Database, ExternalLink, Building2, Users, TrendingUp, Map, Filter } from 'lucide-react';

const IntroSection = ({ agencyCount, activeCount, dissolvedCount }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage for user preference, default to expanded on first visit
    const stored = localStorage.getItem('introCollapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('introCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const features = [
    { icon: Building2, text: `Utforska ${agencyCount || 978} myndigheter (${activeCount || 618} aktiva, ${dissolvedCount || 356} nedlagda)` },
    { icon: TrendingUp, text: 'Se utvecklingen 1978-2025 med historiska trender' },
    { icon: Users, text: 'Jämför med befolkning, BNP och könsfördelning' },
    { icon: Map, text: 'Analysera per departement, region och kategori' },
    { icon: Filter, text: 'Sök och filtrera i myndighetsregistret' },
  ];

  const dataSources = [
    { name: 'Civic Tech Sweden', description: 'Grundläggande myndighetsdata', url: 'https://github.com/civictechsweden/myndighetsdata' },
    { name: 'ESV', description: 'Ekonomistyrningsverket - anställningsstatistik', url: 'https://www.esv.se/' },
    { name: 'SCB', description: 'Statistiska centralbyrån - befolkning, BNP', url: 'https://www.scb.se/' },
    { name: 'Statskontoret', description: 'Organisationsstruktur', url: 'https://www.statskontoret.se/' },
    { name: 'Wikidata', description: 'Start/slutdatum, Wikipedia-länkar', url: 'https://www.wikidata.org/' },
    { name: 'SFS', description: 'Svensk författningssamling - instruktioner', url: 'https://svenskforfattningssamling.se/' },
  ];

  return (
    <div className="intro-section rounded-xl mb-6 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors"
        aria-expanded={!isCollapsed}
        aria-controls="intro-content"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-lg text-neutral-900 dark:text-neutral-100">
              Svenska Myndigheter
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Interaktivt verktyg för att utforska Sveriges myndigheter
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span className="text-sm hidden sm:inline">
            {isCollapsed ? 'Visa mer' : 'Dölj'}
          </span>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      <div
        id="intro-content"
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[1000px] opacity-100'
        }`}
      >
        <div className="px-6 pb-6 space-y-6">
          {/* Features */}
          <div>
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Vad du kan göra
            </h3>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  <feature.icon className="w-4 h-4 mt-0.5 text-primary-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary-500" />
              Datakällor
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dataSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 flex items-center gap-1">
                      {source.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                      {source.description}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-primary-100 dark:border-primary-900/30">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Data uppdateras regelbundet. Cachad lokalt i 24 timmar för snabbare laddning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroSection;
