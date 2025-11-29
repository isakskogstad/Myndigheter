import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import RegionHistoryChart from '../charts/RegionHistoryChart';

const RegionsView = ({ regionStats, agencies }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Current Distribution */}
      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="font-serif text-2xl text-stone-900 mb-6">Geografisk fördelning</h3>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e7e5e4', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-serif text-stone-800 font-medium">
                {agencies.filter(a => !a.e).length}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {regionStats.map(r => (
              <div key={r.name} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-medium text-stone-700">{r.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-stone-800 old-style-nums">{r.value}</span>
                  <span className="text-stone-400 text-xs ml-2 font-mono">
                    {Math.round((r.value / agencies.filter(a => !a.e).length) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl flex gap-3 text-sm text-blue-800">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <p>Majoriteten av myndigheterna är lokaliserade i Stockholmsområdet, men trenden går mot ökad spridning genom utlokaliseringar.</p>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="font-serif text-xl text-stone-900 mb-6">Historisk utveckling (1978-2025)</h3>
        <RegionHistoryChart
          agencies={agencies}
          yearRange={[1978, 2025]}
        />
      </div>
    </div>
  );
};

export default RegionsView;
