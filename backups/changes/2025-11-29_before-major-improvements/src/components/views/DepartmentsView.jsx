import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { deptColors } from '../../data/constants';
import DeptHistoryChart from '../charts/DeptHistoryChart';
import { ArrowRight } from 'lucide-react';

const getShortDeptName = (dept) => dept.replace('departementet', '').trim();

const DepartmentsView = ({ agencies, departments, departmentStats, onDepartmentClick }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Current Distribution */}
      <div className="bg-white p-8 rounded-3xl shadow-card border border-slate-200 relative overflow-hidden">
        <div className="mb-8">
          <h3 className="font-serif text-2xl text-slate-900 font-semibold">Myndigheter per Departement</h3>
          <p className="text-slate-500 mt-1">Klicka på en stapel för att se detaljerad lista</p>
        </div>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              onClick={(e) => {
                if (e?.activePayload) {
                  onDepartmentClick(e.activePayload[0].payload.name);
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={220}
                tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }}
                tickFormatter={getShortDeptName}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc', opacity: 0.8}}
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                  color: '#0f172a'
                }}
                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={32}>
                {departmentStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={deptColors[entry.name] || '#94a3b8'} 
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white p-8 rounded-3xl shadow-card border border-slate-200">
        <div className="mb-6">
          <h3 className="font-serif text-xl text-slate-900 font-semibold">Historisk utveckling</h3>
          <p className="text-sm text-slate-500">Förändring av departementsstruktur över tid</p>
        </div>
        <DeptHistoryChart agencies={agencies} yearRange={[1978, 2025]} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {departmentStats.map((dept) => (
          <button 
            key={dept.name} 
            onClick={() => onDepartmentClick(dept.name)}
            className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all text-left flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${deptColors[dept.name]}15`, color: deptColors[dept.name] }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'currentColor' }} />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors -ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transform duration-300" />
            </div>
            
            <h4 className="font-serif text-lg text-slate-900 font-medium mb-1 leading-tight">
              {getShortDeptName(dept.name)}
            </h4>
            <div className="mt-auto pt-4 flex justify-between items-end">
              <div>
                <div className="text-3xl font-serif text-slate-900 font-semibold old-style-nums">{dept.count}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Myndigheter</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-slate-600 old-style-nums font-medium">
                  {Math.round(dept.emp / 1000)}k
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Anställda</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsView;