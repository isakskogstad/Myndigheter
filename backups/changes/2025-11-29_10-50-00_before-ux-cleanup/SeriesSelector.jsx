import React from 'react';
import { TrendingUp, Users, Building2 } from 'lucide-react';

const SeriesSelector = ({
  activeSeries,
  setActiveSeries,
  normalizeData,
  setNormalizeData,
  baseYear = 1978
}) => {
  const seriesOptions = [
    { id: 'agencies', label: 'Myndigheter', color: '#0c80f0', icon: Building2, dataKey: 'count' },
    { id: 'employees', label: 'Anställda', color: '#059669', icon: Users, dataKey: 'emp', fromYear: 2005 },
    { id: 'population', label: 'Befolkning', color: '#0d9488', icon: Users, dataKey: 'population' },
    { id: 'gdp', label: 'BNP', color: '#d97706', icon: TrendingUp, dataKey: 'gdp' },
    { id: 'women', label: 'Kvinnor i staten', color: '#be185d', icon: Users, dataKey: 'w', fromYear: 1990 },
    { id: 'men', label: 'Män i staten', color: '#4f46e5', icon: Users, dataKey: 'm', fromYear: 1990 },
  ];

  const toggleSeries = (id) => {
    setActiveSeries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activeCount = Object.values(activeSeries).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Series checkboxes */}
      <div className="flex flex-wrap gap-3">
        <span className="text-sm text-neutral-600 font-medium self-center">Visa:</span>
        {seriesOptions.map(series => (
          <label
            key={series.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all border ${
              activeSeries[series.id]
                ? 'bg-white border-neutral-300 shadow-sm'
                : 'bg-neutral-50 border-transparent hover:bg-neutral-100'
            }`}
          >
            <input
              type="checkbox"
              checked={activeSeries[series.id] || false}
              onChange={() => toggleSeries(series.id)}
              className="sr-only"
            />
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeSeries[series.id] ? series.color : '#a8a29e' }}
            />
            <span className={`text-sm ${activeSeries[series.id] ? 'font-medium text-neutral-800' : 'text-neutral-600'}`}>
              {series.label}
            </span>
            {series.fromYear && (
              <span className="text-xs text-neutral-400">({series.fromYear}+)</span>
            )}
          </label>
        ))}
      </div>

      {/* Normalize toggle - only show when multiple series selected */}
      {activeCount >= 2 && (
        <div className="flex items-center gap-4 pt-3 border-t border-neutral-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={normalizeData}
              onChange={e => setNormalizeData(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">
              Visa som index ({baseYear}=100)
            </span>
          </label>
          {normalizeData && (
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
              Normaliserat för jämförbarhet
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to normalize data
export const normalizeSeriesData = (data, baseSeries, baseYear = 1978) => {
  // Find base values for normalization
  const baseValues = {};
  const baseYearData = data.find(d => d.year === baseYear) || data[0];

  if (!baseYearData) return data;

  // Get base values for all series
  const seriesKeys = ['count', 'emp', 'population', 'gdp', 'w', 'm'];
  seriesKeys.forEach(key => {
    if (baseYearData[key]) {
      baseValues[key] = baseYearData[key];
    }
  });

  // Return normalized data
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

// Series configuration for chart rendering
export const seriesConfig = {
  agencies: { dataKey: 'count', color: '#0c80f0', name: 'Myndigheter' },
  employees: { dataKey: 'emp', color: '#059669', name: 'Anställda' },
  population: { dataKey: 'population', color: '#0d9488', name: 'Befolkning' },
  gdp: { dataKey: 'gdp', color: '#d97706', name: 'BNP' },
  women: { dataKey: 'w', color: '#be185d', name: 'Kvinnor' },
  men: { dataKey: 'm', color: '#4f46e5', name: 'Män' },
};

export default SeriesSelector;
