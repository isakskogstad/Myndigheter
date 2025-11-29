import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Square, ChevronLeft, ChevronRight } from 'lucide-react';

// Region mapping helper
const getRegionForCity = (city) => {
  if (!city) return 'Övrigt';
  const cityLower = city.toLowerCase();

  if (cityLower.includes('stockholm') || cityLower.includes('solna') ||
      cityLower.includes('sundbyberg') || cityLower.includes('bromma')) {
    return 'Stockholm';
  }
  if (cityLower.includes('göteborg') || cityLower.includes('gothenburg') ||
      cityLower.includes('mölndal')) {
    return 'Göteborg';
  }
  if (cityLower.includes('malmö') || cityLower.includes('lund')) {
    return 'Malmö';
  }
  if (cityLower.includes('uppsala')) {
    return 'Uppsala';
  }
  return 'Övrigt';
};

const regionColors = {
  'Stockholm': '#0c80f0',
  'Göteborg': '#059669',
  'Malmö': '#d97706',
  'Uppsala': '#7c3aed',
  'Övrigt': '#78716c'
};

const RegionHistoryChart = ({ agencies, yearRange = [1978, 2025] }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentYear, setCurrentYear] = useState(yearRange[1]);
  const [showAsPercentage, setShowAsPercentage] = useState(false);

  // Calculate region history data
  const regionHistoryData = useMemo(() => {
    const years = [];
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      const activeAgencies = agencies.filter(a => {
        const startYear = a.s ? parseInt(a.s.split('-')[0]) : 1900;
        const endYear = a.e ? parseInt(a.e.split('-')[0]) : 2100;
        return startYear <= year && endYear >= year;
      });

      const regionCounts = {
        year,
        Stockholm: 0,
        Göteborg: 0,
        Malmö: 0,
        Uppsala: 0,
        Övrigt: 0,
        total: activeAgencies.length
      };

      activeAgencies.forEach(a => {
        const region = getRegionForCity(a.city);
        regionCounts[region]++;
      });

      // Calculate percentages
      if (showAsPercentage && regionCounts.total > 0) {
        Object.keys(regionColors).forEach(region => {
          regionCounts[region] = (regionCounts[region] / regionCounts.total) * 100;
        });
      }

      years.push(regionCounts);
    }
    return years;
  }, [agencies, yearRange, showAsPercentage]);

  // Animation effect
  React.useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentYear(prev => {
        if (prev >= yearRange[1]) {
          setIsAnimating(false);
          return yearRange[1];
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isAnimating, yearRange]);

  const filteredData = regionHistoryData.filter(d => d.year <= currentYear);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAnimating(!isAnimating);
              if (!isAnimating) setCurrentYear(yearRange[0]);
            }}
            className={`p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
              isAnimating ? 'bg-red-500 text-white' : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600'
            }`}
            aria-label={isAnimating ? 'Stoppa' : 'Spela'}
          >
            {isAnimating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setCurrentYear(Math.max(yearRange[0], currentYear - 1))}
            disabled={currentYear <= yearRange[0]}
            className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-lg text-primary-600 dark:text-primary-400 min-w-[60px] text-center">
            {currentYear}
          </span>

          <button
            onClick={() => setCurrentYear(Math.min(yearRange[1], currentYear + 1))}
            disabled={currentYear >= yearRange[1]}
            className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-700 p-1 rounded-lg">
          <button
            onClick={() => setShowAsPercentage(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${!showAsPercentage ? 'bg-white dark:bg-neutral-600 shadow-sm' : 'hover:bg-neutral-50 dark:hover:bg-neutral-600'}`}
          >
            Antal
          </button>
          <button
            onClick={() => setShowAsPercentage(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${showAsPercentage ? 'bg-white dark:bg-neutral-600 shadow-sm' : 'hover:bg-neutral-50 dark:hover:bg-neutral-600'}`}
          >
            Procent
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={showAsPercentage ? (v => `${v.toFixed(0)}%`) : undefined}
            domain={showAsPercentage ? [0, 100] : ['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(v, name) => [
              showAsPercentage ? `${v.toFixed(1)}%` : v,
              name
            ]}
          />
          <Legend />
          {Object.entries(regionColors).map(([region, color]) => (
            <Area
              key={region}
              type="monotone"
              dataKey={region}
              stackId="1"
              fill={color}
              stroke={color}
              name={region}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary for current year */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {Object.entries(regionColors).map(([region, color]) => {
          const yearData = regionHistoryData.find(d => d.year === currentYear);
          const value = yearData ? yearData[region] : 0;
          return (
            <div key={region} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: color }}
              />
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{region}</div>
              <div className="font-bold dark:text-neutral-200">
                {showAsPercentage ? `${value.toFixed(0)}%` : value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegionHistoryChart;
