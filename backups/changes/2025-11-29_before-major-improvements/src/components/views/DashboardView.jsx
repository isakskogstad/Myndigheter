import React, { useMemo } from 'react';
import { 
  Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceArea, ComposedChart, Legend, Label, LabelList
} from 'recharts';
import { Building2, Users, Play, Square, ArrowUp, ArrowDown, Minus, Download } from 'lucide-react';
import SeriesSelector, { normalizeSeriesData } from '../SeriesSelector';
import SeriesChartTypeSelector from '../SeriesChartTypeSelector';
import RangeSlider from '../ui/RangeSlider';
import { governmentPeriods, timeSeriesData, genderHistoryData } from '../../data/constants';
import { getStatsByYear } from '../../data/swedenStats';

const AnimatedNumber = ({ value, prefix = '', suffix = '', className = '' }) => (
  <span className={className}>{prefix}{value?.toLocaleString('sv-SE', { maximumFractionDigits: 1 })}{suffix}</span>
);

const TrendArrow = ({ current, previous, className = '' }) => {
  if (!previous || !current) return <Minus className={`w-4 h-4 text-slate-400 ${className}`} />; 
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.5) return <Minus className={`w-4 h-4 text-slate-400 ${className}`} />; 
  if (diff > 0) return <div className={`flex items-center text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold ${className}`}><ArrowUp className="w-3 h-3 mr-1" /> {diff.toFixed(1)}%</div>;
  return <div className={`flex items-center text-red-700 bg-red-100 px-2 py-0.5 rounded-full text-xs font-bold ${className}`}><ArrowDown className="w-3 h-3 mr-1" /> {Math.abs(diff).toFixed(1)}%</div>;
};

const StatCard = ({ title, value, subValue, icon: Icon, trend, colorClass = "bg-white" }) => (
  <div className={`${colorClass} p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      {trend}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-serif text-slate-900 font-semibold old-style-nums tracking-tight">
        {value}
      </h3>
      {subValue && <p className="text-sm text-slate-500 mt-1 font-medium">{subValue}</p>}
    </div>
  </div>
);

const DashboardView = ({
  activeSeries,
  setActiveSeries,
  normalizeData,
  setNormalizeData,
  yearRange,
  setYearRange,
  isAnimating,
  setIsAnimating,
  animationYear,
  seriesChartTypes,
  setSeriesChartTypes,
  genderMode,
  setGenderMode,
  perCapita,
  setPerCapita,
  onReset
}) => {

  // Derived stats
  const currentYearData = timeSeriesData.find(d => d.year === (isAnimating ? animationYear : yearRange[1]));
  const prevYearData = timeSeriesData.find(d => d.year === (isAnimating ? animationYear : yearRange[1]) - 1);
  
  const currentGenderData = genderHistoryData.find(d => d.year === Math.min((isAnimating ? animationYear : yearRange[1]), 2024));
  const pctWomen = currentGenderData ? Math.round((currentGenderData.w / (currentGenderData.w + currentGenderData.m)) * 100) : 0;

  // Prepare Chart Data
  const chartData = useMemo(() => {
    let data = timeSeriesData
      .filter(d => d.year >= yearRange[0] && d.year <= (isAnimating ? animationYear : yearRange[1]))
      .map(d => {
        const sData = getStatsByYear(d.year);
        const gData = genderHistoryData.find(g => g.year === d.year);
        
        const item = {
          ...d,
          population: sData?.population,
          gdp: sData?.gdp,
          w: gData?.w,
          m: gData?.m
        };

        if (perCapita && item.population) {
          if (item.count) item.count = (item.count / item.population) * 100000;
          if (item.emp) item.emp = (item.emp / item.population) * 100000;
        }

        if (genderMode === 'share' && item.w && item.m) {
          const total = item.w + item.m;
          item.w = (item.w / total) * 100;
          item.m = (item.m / total) * 100;
        }

        return item;
      });

    if (normalizeData) {
      data = normalizeSeriesData(data, activeSeries, yearRange[0]);
    }
    return data;
  }, [yearRange, isAnimating, animationYear, normalizeData, activeSeries, perCapita, genderMode]);

  const handleExportChart = () => {
    const headers = ['År', 'Myndigheter', 'Anställda', 'Befolkning', 'BNP (MSEK)', 'Kvinnor', 'Män'];
    const csvContent = [
      headers.join(';'),
      ...chartData.map(d => [
        d.year,
        d.count?.toFixed(2),
        d.emp?.toFixed(2),
        d.population,
        d.gdp,
        d.w?.toFixed(2),
        d.m?.toFixed(2)
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `myndighetsutveckling-${yearRange[0]}-${yearRange[1]}.csv`;
    link.click();
  };

  const formatYAxis = (value) => {
    if (normalizeData) return value.toFixed(0);
    if (genderMode === 'share' && (activeSeries.women || activeSeries.men)) return `${value}%`;
    if (perCapita) return value.toFixed(1);
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
  };

  // Dynamic Chart Component Generator
  const renderSeries = (key, name, color, axis = 'left', strokeDash = '', chartType = 'area') => {
    const commonProps = {
      yAxisId: normalizeData ? 'left' : axis,
      dataKey: key,
      name: name,
      fill: color,
      stroke: color,
      strokeWidth: 2,
      animationDuration: 500,
    };

    if (chartType === 'bar') {
      return (
        <Bar {...commonProps} radius={[4, 4, 0, 0]}>
          {chartData.length < 20 && (
             <LabelList
               dataKey={key}
               position="top"
               style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
               formatter={(v) => {
                 if (normalizeData) return v.toFixed(0);
                 if (genderMode === 'share' && (key === 'w' || key === 'm')) return `${v.toFixed(0)}%`;
                 if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                 if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                 return Math.round(v);
               }}
             />
          )}
        </Bar>
      );
    }
    
    if (chartType === 'line') {
      return (
        <Line {...commonProps} type="monotone" dot={false} activeDot={{ r: 6 }} strokeDasharray={strokeDash} strokeWidth={3} />
      );
    }

    // Area (default)
    return (
      <Area {...commonProps} type="monotone" fillOpacity={0.3} activeDot={{ r: 6 }} />
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <RangeSlider
            min={1978}
            max={2025}
            value={yearRange}
            onChange={setYearRange}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <SeriesSelector
            activeSeries={activeSeries}
            setActiveSeries={setActiveSeries}
            normalizeData={normalizeData}
            setNormalizeData={setNormalizeData}
            perCapita={perCapita}
            setPerCapita={setPerCapita}
            baseYear={yearRange[0]}
            onReset={onReset}
            genderMode={genderMode}
            setGenderMode={setGenderMode}
          />
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`p-3 rounded-full transition-all shadow-sm flex items-center gap-2 ${isAnimating ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              {isAnimating ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span className="text-sm font-bold tabular-nums">{isAnimating ? animationYear : "Spela upp"}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <SeriesChartTypeSelector
            activeSeries={activeSeries}
            seriesChartTypes={seriesChartTypes}
            setSeriesChartTypes={setSeriesChartTypes}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="font-serif text-2xl text-slate-900 font-semibold">Utveckling över tid</h3>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {normalizeData ? `Indexerad utveckling (${yearRange[0]}=100)` : perCapita ? 'Per 100 000 invånare' : 'Absoluta tal'}
            </p>
          </div>

          <button
            onClick={handleExportChart}
            className="p-3 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 bg-white shadow-sm flex items-center gap-2"
            title="Ladda ner CSV"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportera</span>
          </button>
        </div>

        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#475569" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                hide={false}
                tickFormatter={formatYAxis}
                domain={normalizeData || genderMode === 'share' ? ['auto', 'auto'] : [0, 'auto']}
                tick={{fill: '#475569', fontSize: 12, fontWeight: 600}}
                axisLine={false}
                tickLine={false}
                width={60}
              >
                <Label value={normalizeData ? "Index" : "Vänster axel"} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 }} />
              </YAxis>
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                hide={normalizeData || genderMode === 'share' ? true : (!activeSeries.population && !activeSeries.gdp)}
                tickFormatter={formatYAxis}
                tick={{fill: '#d97706', fontSize: 12, fontWeight: 600}}
                axisLine={false}
                tickLine={false}
                width={60}
              >
                 <Label value={normalizeData ? "" : "Höger axel"} angle={90} position="insideRight" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 }} />
              </YAxis>
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  padding: '16px',
                  color: '#0f172a'
                }}
                itemStyle={{ padding: '4px 0', fontWeight: 500, fontSize: '13px' }}
                formatter={(value, name) => {
                  if (normalizeData) return [value.toFixed(1), name];
                  if (genderMode === 'share' && (name === 'Kvinnor' || name === 'Män')) return [`${value.toFixed(1)}%`, name];
                  if (name === 'Befolkning') return [value.toLocaleString('sv-SE'), name];
                  if (name === 'BNP') return [`${value.toLocaleString('sv-SE')} MSEK`, name];
                  return [value.toLocaleString('sv-SE', { maximumFractionDigits: 1 }), name];
                }}
              />
              <Legend wrapperStyle={{paddingTop: '20px', fontSize: '13px', fontWeight: 500}} iconType="circle" />
              
              {governmentPeriods
                .filter(p => p.end > yearRange[0] && p.start < yearRange[1])
                .map((p, i) => (
                  <ReferenceArea
                    key={i}
                    x1={Math.max(p.start, yearRange[0])}
                    x2={Math.min(p.end, isAnimating ? animationYear : yearRange[1])}
                    fill={p.party === 'S' ? '#fee2e2' : '#e0f2fe'}
                    fillOpacity={0.4}
                    yAxisId="left"
                  />
                ))
              }

              {/* Dynamic Series Rendering */}
              {activeSeries.agencies && renderSeries('count', 'Antal Myndigheter', '#475569', 'left', '', seriesChartTypes.agencies)}
              {activeSeries.employees && renderSeries('emp', 'Antal Anställda', '#84a59d', 'left', '5 5', seriesChartTypes.employees)}
              {activeSeries.population && renderSeries('population', 'Befolkning', '#94a3b8', 'right', '3 3', seriesChartTypes.population)}
              {activeSeries.gdp && renderSeries('gdp', 'BNP', '#d97706', 'right', '', seriesChartTypes.gdp)}
              {activeSeries.women && renderSeries('w', 'Kvinnor', '#be185d', 'left', '', seriesChartTypes.women)}
              {activeSeries.men && renderSeries('m', 'Män', '#4f46e5', 'left', '', seriesChartTypes.men)}

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Myndigheter" 
          value={currentYearData?.count || 0} 
          icon={Building2} 
          trend={<TrendArrow current={currentYearData?.count} previous={prevYearData?.count} />} 
        />
        
        <StatCard 
          title="Anställda" 
          value={<AnimatedNumber value={Math.round((currentYearData?.emp || 0)/1000)} suffix="k" />} 
          subValue="i statlig sektor"
          icon={Users} 
          trend={<TrendArrow current={currentYearData?.emp} previous={prevYearData?.emp} />} 
        />

        <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jämställdhet</p>
              <h3 className="text-2xl font-serif text-slate-900 font-medium">{isAnimating ? animationYear : yearRange[1]}</h3>
            </div>
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-pink-600">{pctWomen}% Kvinnor</span>
              <span className="text-indigo-600">{100 - pctWomen}% Män</span>
            </div>
          </div>
          
          <div className="w-full bg-indigo-50 h-4 rounded-full overflow-hidden flex">
            <div className="bg-pink-500 h-full transition-all duration-500 ease-out relative group" style={{ width: `${pctWomen}%` }}>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="bg-indigo-500 h-full flex-1 transition-all duration-500 ease-out relative group">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Summary Card */}
      {isAnimating && (() => {
        const startYearData = timeSeriesData.find(d => d.year === yearRange[0]);
        const currentAnimYearData = currentYearData;
        const startGenderData = genderHistoryData.find(d => d.year === yearRange[0]);
        const currentAnimGenderData = currentGenderData;

        const agenciesDiff = (currentAnimYearData?.count || 0) - (startYearData?.count || 0);
        const agenciesPct = startYearData?.count ? ((agenciesDiff / startYearData.count) * 100) : 0;

        const employeesDiff = (currentAnimYearData?.emp || 0) - (startYearData?.emp || 0);
        const employeesPct = startYearData?.emp ? ((employeesDiff / startYearData.emp) * 100) : 0;

        const womenDiff = (currentAnimGenderData?.w || 0) - (startGenderData?.w || 0);
        const startWomenShare = startGenderData ? Math.round((startGenderData.w / (startGenderData.w + startGenderData.m)) * 100) : 0;
        const currentWomenShare = pctWomen;

        return (
          <div className="bg-gradient-to-br from-sky-50 to-white p-6 rounded-2xl border border-sky-200 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Play className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-slate-900 font-semibold">
                  Utveckling {yearRange[0]}–{animationYear}
                </h4>
                <p className="text-xs text-slate-500">Förändring sedan animeringsstart</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Myndigheter</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-serif font-semibold ${agenciesDiff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {agenciesDiff >= 0 ? '+' : ''}{agenciesDiff}
                  </span>
                  <span className={`text-sm font-medium ${agenciesPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ({agenciesPct >= 0 ? '+' : ''}{agenciesPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anställda</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-serif font-semibold ${employeesDiff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {employeesDiff >= 0 ? '+' : ''}{Math.round(employeesDiff / 1000)}k
                  </span>
                  <span className={`text-sm font-medium ${employeesPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ({employeesPct >= 0 ? '+' : ''}{employeesPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kvinnor</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-serif font-semibold ${womenDiff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {womenDiff >= 0 ? '+' : ''}{Math.round(womenDiff / 1000)}k
                  </span>
                  <span className="text-sm font-medium text-pink-600">
                    [{startWomenShare}% → {currentWomenShare}%]
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DashboardView;