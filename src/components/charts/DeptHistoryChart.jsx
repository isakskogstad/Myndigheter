import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { deptColors } from '../data/constants';

// Department name mapping for historical names
const normalizeDeptName = (dept) => {
  if (!dept) return 'Okänt';

  // Historical mappings - some departments have changed names
  const mappings = {
    // Näringsdepartementet -> Klimat- och näringslivsdepartementet (2022)
    'Näringsdepartementet': 'Klimat- och näringslivsdepartementet',
    'Miljödepartementet': 'Klimat- och näringslivsdepartementet',
    'Miljö- och energidepartementet': 'Klimat- och näringslivsdepartementet',

    // Infrastrukturdepartementet -> Landsbygds- och infrastrukturdepartementet
    'Infrastrukturdepartementet': 'Landsbygds- och infrastrukturdepartementet',
    'Landsbygdsdepartementet': 'Landsbygds- och infrastrukturdepartementet',

    // Shorter variations
    'Justitie': 'Justitiedepartementet',
    'Finans': 'Finansdepartementet',
    'Utbildning': 'Utbildningsdepartementet',
    'Social': 'Socialdepartementet',
    'Kultur': 'Kulturdepartementet',
    'Försvar': 'Försvarsdepartementet',
    'Arbetsmarknad': 'Arbetsmarknadsdepartementet',
    'Utrikes': 'Utrikesdepartementet',
  };

  return mappings[dept] || dept;
};

// Short names for chart labels
const getShortDeptName = (dept) => {
  const shortNames = {
    'Justitiedepartementet': 'Justitie',
    'Finansdepartementet': 'Finans',
    'Utbildningsdepartementet': 'Utbildning',
    'Socialdepartementet': 'Social',
    'Klimat- och näringslivsdepartementet': 'Klimat/Näring',
    'Kulturdepartementet': 'Kultur',
    'Försvarsdepartementet': 'Försvar',
    'Arbetsmarknadsdepartementet': 'Arbetsmarknad',
    'Landsbygds- och infrastrukturdepartementet': 'Landsbygd/Infra',
    'Utrikesdepartementet': 'Utrikes',
    'Statsrådsberedningen': 'Statsrådsber.',
    'Okänt': 'Okänt'
  };
  return shortNames[dept] || dept.replace('departementet', '').trim();
};

// Get all current department names
const currentDepartments = [
  'Justitiedepartementet',
  'Finansdepartementet',
  'Utbildningsdepartementet',
  'Socialdepartementet',
  'Klimat- och näringslivsdepartementet',
  'Kulturdepartementet',
  'Försvarsdepartementet',
  'Arbetsmarknadsdepartementet',
  'Landsbygds- och infrastrukturdepartementet',
  'Utrikesdepartementet',
  'Statsrådsberedningen'
];

const DeptHistoryChart = ({ agencies, yearRange = [1978, 2025] }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentYear, setCurrentYear] = useState(yearRange[1]);
  const [showAsPercentage, setShowAsPercentage] = useState(false);

  // Calculate department history data
  const deptHistoryData = useMemo(() => {
    const years = [];
    for (let year = yearRange[0]; year <= yearRange[1]; year++) {
      const activeAgencies = agencies.filter(a => {
        const startYear = a.s ? parseInt(a.s.split('-')[0]) : 1900;
        const endYear = a.e ? parseInt(a.e.split('-')[0]) : 2100;
        return startYear <= year && endYear >= year;
      });

      // Initialize counts for all departments
      const deptCounts = { year };
      currentDepartments.forEach(dept => {
        deptCounts[dept] = 0;
      });
      deptCounts['Okänt'] = 0;
      deptCounts.total = activeAgencies.length;

      activeAgencies.forEach(a => {
        const rawDept = a.d || 'Okänt';
        const normalizedDept = normalizeDeptName(rawDept);

        if (currentDepartments.includes(normalizedDept)) {
          deptCounts[normalizedDept]++;
        } else if (currentDepartments.includes(rawDept)) {
          deptCounts[rawDept]++;
        } else {
          deptCounts['Okänt']++;
        }
      });

      // Calculate percentages if needed
      if (showAsPercentage && deptCounts.total > 0) {
        currentDepartments.forEach(dept => {
          deptCounts[dept] = (deptCounts[dept] / deptCounts.total) * 100;
        });
        deptCounts['Okänt'] = (deptCounts['Okänt'] / deptCounts.total) * 100;
      }

      years.push(deptCounts);
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
    }, 150);

    return () => clearInterval(interval);
  }, [isAnimating, yearRange]);

  const filteredData = deptHistoryData.filter(d => d.year <= currentYear);

  // Get color for department (with fallback)
  const getDeptColor = (dept) => {
    return deptColors[dept] || '#78716c';
  };

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
      <ResponsiveContainer width="100%" height={400}>
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
              getShortDeptName(name)
            ]}
            labelFormatter={(year) => `År ${year}`}
          />
          <Legend
            formatter={(value) => getShortDeptName(value)}
            wrapperStyle={{ fontSize: '11px' }}
          />
          {currentDepartments.map((dept) => (
            <Area
              key={dept}
              type="monotone"
              dataKey={dept}
              stackId="1"
              fill={getDeptColor(dept)}
              stroke={getDeptColor(dept)}
              name={dept}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary grid for current year */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {currentDepartments.map((dept) => {
          const yearData = deptHistoryData.find(d => d.year === currentYear);
          const value = yearData ? yearData[dept] : 0;
          if (value === 0 && !showAsPercentage) return null; // Hide departments with 0 agencies
          return (
            <div key={dept} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-center">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: getDeptColor(dept) }}
              />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate" title={dept}>
                {getShortDeptName(dept)}
              </div>
              <div className="font-bold text-sm dark:text-neutral-200">
                {showAsPercentage ? `${value.toFixed(0)}%` : value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info text */}
      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
        Historiska departement mappas till nuvarande struktur. Klicka på departement i legenden för att filtrera.
      </p>
    </div>
  );
};

export default DeptHistoryChart;
