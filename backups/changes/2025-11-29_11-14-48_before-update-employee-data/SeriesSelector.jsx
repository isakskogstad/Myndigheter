import React from 'react';

const SeriesSelector = ({
  activeSeries,
  setActiveSeries,
  normalizeData,
  setNormalizeData,
  baseYear = 1978
}) => {
  const seriesOptions = [
    { id: 'agencies', label: 'Myndigheter', color: '#0c80f0', dataKey: 'count' },
    { id: 'employees', label: 'Anställda', color: '#059669', dataKey: 'emp', fromYear: 2005 },
    { id: 'population', label: 'Befolkning', color: '#0d9488', dataKey: 'population' },
    { id: 'gdp', label: 'BNP', color: '#d97706', dataKey: 'gdp' },
    { id: 'women', label: 'Kvinnor', color: '#be185d', dataKey: 'w', fromYear: 1990 },
    { id: 'men', label: 'Män', color: '#4f46e5', dataKey: 'm', fromYear: 1990 },
  ];

  const toggleSeries = (id) => {
    setActiveSeries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activeCount = Object.values(activeSeries).filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-xs text-neutral-500 font-medium">Visa:</span>
      {seriesOptions.map(series => (
        <label
          key={series.id}
          className="flex items-center gap-1.5 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            checked={activeSeries[series.id] || false}
            onChange={() => toggleSeries(series.id)}
            className="w-3.5 h-3.5 rounded border-neutral-300 focus:ring-1 focus:ring-primary-500"
            style={{ accentColor: series.color }}
          />
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: series.color }}
          />
          <span className={activeSeries[series.id] ? 'text-neutral-800' : 'text-neutral-500'}>
            {series.label}
          </span>
        </label>
      ))}

      {/* Normalize toggle - compact inline */}
      {activeCount >= 2 && (
        <>
          <span className="text-neutral-300">|</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={normalizeData}
              onChange={e => setNormalizeData(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-neutral-300 focus:ring-1 focus:ring-primary-500"
            />
            <span className={normalizeData ? 'text-neutral-800' : 'text-neutral-500'}>
              Index ({baseYear}=100)
            </span>
          </label>
        </>
      )}
    </div>
  );
};

// Helper function to normalize data
export const normalizeSeriesData = (data, baseSeries, baseYear = 1978) => {
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
