import React from 'react';
import { Activity, BarChart3, LineChart } from 'lucide-react';

const seriesMetadata = {
  agencies: { label: 'Myndigheter', key: 'agencies' },
  employees: { label: 'Anställda', key: 'employees' },
  women: { label: 'Kvinnor', key: 'women' },
  men: { label: 'Män', key: 'men' },
  population: { label: 'Befolkning', key: 'population' },
  gdp: { label: 'BNP', key: 'gdp' }
};

const ChartTypeButton = ({ type, currentType, onClick, Icon, title }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-all ${
      currentType === type
        ? 'bg-slate-900 shadow text-white'
        : 'bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200'
    }`}
    title={title}
  >
    <Icon className="w-3.5 h-3.5" />
  </button>
);

const SeriesChartTypeSelector = ({ activeSeries, seriesChartTypes, setSeriesChartTypes }) => {
  const activeSeriesList = Object.entries(activeSeries)
    .filter(([_, isActive]) => isActive)
    .map(([key]) => key);

  if (activeSeriesList.length === 0) return null;

  const handleChartTypeChange = (seriesKey, chartType) => {
    setSeriesChartTypes(prev => ({
      ...prev,
      [seriesKey]: chartType
    }));
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Diagramtyp per variabel:
      </span>

      {activeSeriesList.map(seriesKey => {
        const metadata = seriesMetadata[seriesKey];
        if (!metadata) return null;

        return (
          <div
            key={seriesKey}
            className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <span className="text-xs font-medium text-slate-700 px-2">
              {metadata.label}
            </span>
            <div className="flex items-center gap-1">
              <ChartTypeButton
                type="area"
                currentType={seriesChartTypes[seriesKey]}
                onClick={() => handleChartTypeChange(seriesKey, 'area')}
                Icon={Activity}
                title="Ytdiagram"
              />
              <ChartTypeButton
                type="bar"
                currentType={seriesChartTypes[seriesKey]}
                onClick={() => handleChartTypeChange(seriesKey, 'bar')}
                Icon={BarChart3}
                title="Stapeldiagram"
              />
              <ChartTypeButton
                type="line"
                currentType={seriesChartTypes[seriesKey]}
                onClick={() => handleChartTypeChange(seriesKey, 'line')}
                Icon={LineChart}
                title="Linjediagram"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeriesChartTypeSelector;
