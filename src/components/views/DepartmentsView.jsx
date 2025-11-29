import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { deptColors } from '../../data/constants';
import DeptHistoryChart from '../charts/DeptHistoryChart';

const getShortDeptName = (dept) => dept.replace('departementet', '').trim();

const DepartmentsView = ({ agencies, departments, departmentStats }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Current Distribution */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="font-serif text-2xl text-stone-900 mb-6">Myndigheter per Departement</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={departmentStats}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e7e5e4" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={180}
                tick={{ fontSize: 12, fill: '#57534e' }}
                tickFormatter={getShortDeptName}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e7e5e4', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {departmentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={deptColors[entry.name] || '#78716c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Trend */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="mb-6">
          <h3 className="font-serif text-xl text-stone-900">Historisk utveckling</h3>
          <p className="text-sm text-stone-500">Förändring av departementsstruktur över tid</p>
        </div>
        <DeptHistoryChart agencies={agencies} yearRange={[1978, 2025]} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departmentStats.map((dept) => (
          <div key={dept.name} className="bg-white p-5 rounded-2xl border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: deptColors[dept.name] }} 
              />
              <h4 className="font-medium text-stone-700 text-sm truncate" title={dept.name}>
                {getShortDeptName(dept.name)}
              </h4>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-serif text-stone-800 old-style-nums">{dept.count}</span>
              <span className="text-xs text-stone-400 uppercase tracking-wide">Myndigheter</span>
            </div>
            <div className="mt-2 pt-2 border-t border-stone-100 flex justify-between text-xs text-stone-500">
              <span>{Math.round(dept.emp / 1000)}k anställda</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsView;
