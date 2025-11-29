import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Users, Briefcase, Calendar, ArrowRight, Zap, Scale } from 'lucide-react';

// --- Sub-components for specific visualizations ---

// 1. Interactive Leaderboard (Horizontal Bars)
const LeaderboardModule = ({ agencies, onSelect }) => {
  const [metric, setMetric] = useState('emp'); // 'emp' | 'fte'

  const data = useMemo(() => {
    return [...agencies]
      .filter(a => !a.e && a[metric] > 0)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 10)
      .map(a => ({
        name: a.n,
        value: a[metric],
        agency: a
      }));
  }, [agencies, metric]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h3 className="font-serif text-xl text-slate-900 font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-current" /> 
            Topplista: Största Myndigheterna
          </h3>
          <p className="text-sm text-slate-500">De 10 största myndigheterna baserat på valt mått.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMetric('emp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${metric === 'emp' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Anställda
          </button>
          <button
            onClick={() => setMetric('fte')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${metric === 'fte' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Årsarbetskrafter (FTE)
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            barCategoryGap={15}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150} 
              tick={{ fontSize: 12, fontWeight: 500, fill: '#475569' }} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm">
                      <div className="font-bold text-slate-900 mb-1">{d.name}</div>
                      <div className="text-slate-500">
                        {metric === 'emp' ? 'Anställda:' : 'FTE:'} <span className="font-mono font-medium text-slate-900">{d.value.toLocaleString('sv-SE')}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 6, 6, 0]} 
              onClick={(data) => onSelect(data.agency)}
              cursor="pointer"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 3 ? '#0f172a' : '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 2. Correlation Chart (Scatter Plot: Age vs Size)
const AgeVsSizeModule = ({ agencies }) => {
  const data = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return agencies
      .filter(a => !a.e && a.s && a.emp > 50) // Filter out tiny ones for cleaner chart
      .map(a => ({
        name: a.n,
        age: currentYear - parseInt(a.s.split('-')[0]),
        size: a.emp,
        dept: a.d
      }))
      .filter(d => !isNaN(d.age));
  }, [agencies]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-1 flex flex-col">
      <div className="mb-6">
        <h3 className="font-serif text-xl text-slate-900 font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-500" /> 
          Storlek vs Ålder
        </h3>
        <p className="text-sm text-slate-500">Är äldre myndigheter större? Varje bubbla är en myndighet.</p>
      </div>

      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="age" 
              name="Ålder" 
              unit=" år" 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              label={{ value: 'Ålder (år)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis 
              type="number" 
              dataKey="size" 
              name="Anställda" 
              tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={40}
            />
            <ZAxis type="number" dataKey="size" range={[20, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-sm z-50">
                      <div className="font-bold text-slate-900 mb-1">{d.name}</div>
                      <div className="text-slate-500 text-xs">{d.dept}</div>
                      <div className="mt-2 flex justify-between gap-4">
                        <span className="text-slate-600">{d.age} år gammal</span>
                        <span className="font-mono text-slate-900">{d.size.toLocaleString()} anst.</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Myndigheter" data={data} fill="#0ea5e9" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 3. Gender Balance (Diverging Bar)
const GenderBalanceModule = ({ agencies, onSelect }) => {
  const data = useMemo(() => {
    return [...agencies]
      .filter(a => !a.e && a.emp > 100 && a.w && a.m) // Significant size
      .sort((a, b) => (b.w / (b.w + b.m)) - (a.w / (a.w + a.m))) // Most women first
      .filter((_, i, arr) => i < 5 || i >= arr.length - 5) // Top 5 and Bottom 5
      .map(a => ({
        name: a.n,
        womenPct: Math.round((a.w / (a.w + a.m)) * 100),
        menPct: Math.round((a.m / (a.w + a.m)) * 100),
        agency: a
      }));
  }, [agencies]);

  const topWomen = data.slice(0, 5);
  const topMen = data.slice(5).reverse(); // Reverse to show highest men pct descending

  const Row = ({ item }) => (
    <div 
      onClick={() => onSelect(item.agency)}
      className="group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
    >
      <div className="flex justify-between text-xs font-medium mb-1.5">
        <span className="text-slate-700 truncate max-w-[180px] group-hover:text-primary-700 transition-colors">{item.name}</span>
        <div className="flex gap-2 text-[10px]">
          <span className="text-pink-600">{item.womenPct}% K</span>
          <span className="text-indigo-600">{item.menPct}% M</span>
        </div>
      </div>
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-slate-100">
        <div className="bg-pink-400 h-full" style={{ width: `${item.womenPct}%` }}></div>
        <div className="bg-indigo-500 h-full" style={{ width: `${item.menPct}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 flex flex-col">
      <div className="mb-6">
        <h3 className="font-serif text-xl text-slate-900 font-bold flex items-center gap-2">
          <Scale className="w-5 h-5 text-pink-500" /> 
          Jämställdhet (Top/Botten)
        </h3>
        <p className="text-sm text-slate-500">Myndigheter med högst andel kvinnor respektive män.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 gap-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Högst andel kvinnor</h4>
          <div className="space-y-1">
            {topWomen.map(item => <Row key={item.name} item={item} />)}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Högst andel män</h4>
          <div className="space-y-1">
            {topMen.map(item => <Row key={item.name} item={item} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Simple List Card (Reusable)
const SimpleListModule = ({ title, icon: Icon, items, valueFormatter, onSelect }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-slate-50 rounded-xl">
        <Icon className="w-5 h-5 text-slate-700" />
      </div>
      <h3 className="font-serif text-lg text-slate-900 font-semibold">{title}</h3>
    </div>
    
    <div className="space-y-1 flex-1">
      {items.map((item, index) => (
        <button
          key={item.n}
          onClick={() => onSelect(item)}
          className="w-full flex items-center justify-between group hover:bg-slate-50 p-2.5 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                {item.n}
              </div>
            </div>
          </div>
          <div className="text-xs font-mono font-medium text-slate-500 ml-4 old-style-nums group-hover:text-slate-900">
            {valueFormatter(item)}
          </div>
        </button>
      ))}
    </div>
  </div>
);

const AnalysisView = ({ agencies, onSelectAgency }) => {
  
  const oldest = useMemo(() => 
    agencies.filter(a => !a.e && a.s).sort((a, b) => a.s.localeCompare(b.s)).slice(0, 5), 
  [agencies]);

  const newest = useMemo(() => 
    agencies.filter(a => !a.e && a.s).sort((a, b) => b.s.localeCompare(a.s)).slice(0, 5), 
  [agencies]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Myndighetsanalys</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Utforska extremvärden, korrelationer och trender i den svenska statsförvaltningen genom interaktiva visualiseringar.
          </p>
        </div>
        {/* Abstract Decor */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-pink-500/20 blur-3xl rounded-full transform translate-y-1/2"></div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Width Leaderboard */}
        <LeaderboardModule agencies={agencies} onSelect={onSelectAgency} />
        
        {/* Gender Balance */}
        <GenderBalanceModule agencies={agencies} onSelect={onSelectAgency} />

        {/* Scatter Plot */}
        <div className="col-span-1 lg:col-span-2">
           <AgeVsSizeModule agencies={agencies} />
        </div>

        {/* Side Lists */}
        <div className="col-span-1 grid grid-cols-1 gap-6">
          <SimpleListModule 
            title="Äldsta (Aktiva)" 
            icon={Calendar} 
            items={oldest} 
            valueFormatter={a => a.s?.split('-')[0]}
            onSelect={onSelectAgency}
          />
          <SimpleListModule 
            title="Nyaste (Aktiva)" 
            icon={ArrowRight} 
            items={newest} 
            valueFormatter={a => a.s?.split('-')[0]}
            onSelect={onSelectAgency}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;