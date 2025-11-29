import React from 'react';
import { Check, RefreshCcw, Percent, BarChart2, Users } from 'lucide-react';

const SeriesSelector = ({
  activeSeries,
  setActiveSeries,
  normalizeData,
  setNormalizeData,
  perCapita,
  setPerCapita,
  baseYear = 1978,
  onReset,
  genderMode,
  setGenderMode // 'count' | 'share'
}) => {
  const seriesOptions = [
    { id: 'agencies', label: 'Antal Myndigheter', color: '#57534e' },
    { id: 'employees', label: 'Antal Anställda', color: '#84a59d' },
    { id: 'population', label: 'Befolkning', color: '#a8a29e' },
    { id: 'gdp', label: 'BNP', color: '#d97706' },
    { id: 'women', label: 'Kvinnor', color: '#be185d' },
    { id: 'men', label: 'Män', color: '#4f46e5' },
  ];

  const toggleSeries = (id) => {
    setActiveSeries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activeCount = Object.values(activeSeries).filter(Boolean).length;
  const hasGender = activeSeries.women || activeSeries.men;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {seriesOptions.map(series => {
            const isActive = activeSeries[series.id];
            return (
              <button
                key={series.id}
                onClick={() => toggleSeries(series.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 border
                  ${isActive 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <div 
                  className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-white' : ''}`}
                  style={{ backgroundColor: isActive ? undefined : series.color }}
                />
                {series.label}
                {isActive && <Check className="w-3 h-3 ml-1" />}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-auto"
        >
          <RefreshCcw className="w-3 h-3" /> Rensa val
        </button>
      </div>

      {/* Advanced Controls Row */}
      {(activeCount >= 1) && (
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 animate-fade-in">
          
          {/* Index Toggle */}
          {activeCount >= 2 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jämförelse:</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setNormalizeData(false)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all
                    ${!normalizeData ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Absoluta tal
                </button>
                <button
                  onClick={() => setNormalizeData(true)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all
                    ${normalizeData ? 'bg-primary-100 text-primary-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Index ({baseYear}=100)
                </button>
              </div>
            </div>
          )}

          {/* Per Capita Toggle */}
          {!normalizeData && (activeSeries.agencies || activeSeries.employees) && (
            <div className="flex items-center gap-2">
              {activeCount >= 2 && <div className="h-4 w-px bg-slate-200 mx-2"></div>}
              <button
                onClick={() => setPerCapita(!perCapita)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 border
                  ${perCapita 
                    ? 'bg-primary-50 text-primary-700 border-primary-100 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <Users className="w-3 h-3" /> Per 100k invånare
              </button>
            </div>
          )}

          {/* Gender Mode Toggle */}
          {hasGender && !normalizeData && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-slate-200 mx-2"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Könsvisning:</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setGenderMode('count')}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1
                    ${genderMode === 'count' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <BarChart2 className="w-3 h-3" /> Antal
                </button>
                <button
                  onClick={() => setGenderMode('share')}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1
                    ${genderMode === 'share' ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Percent className="w-3 h-3" /> Andel (%)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeriesSelector;

// Helper function to normalize data (re-added)
export const normalizeSeriesData = (data, activeSeries, baseYear = 1978) => {
  const baseValues = {};
  const baseYearData = data.find(d => d.year === baseYear) || data[0];

  if (!baseYearData) return data;

  const seriesKeys = ['count', 'emp', 'population', 'gdp', 'w', 'm'];
  seriesKeys.forEach(key => {
    if (baseYearData[key]) {
      baseValues[key] = baseYearData[key];
    }
  });

  return data.map(d => {
    const normalized = { year: d.year };
    seriesKeys.forEach(key => {
      if (d[key] && baseValues[key]) {
        normalized[key] = (d[key] / baseValues[key]) * 100;
      }
    });
    return normalized;
  });
};