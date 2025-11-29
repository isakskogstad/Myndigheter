import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { deptColors } from '../../data/constants';
import DeptHistoryChart from '../charts/DeptHistoryChart';
import ds from '../../styles/designSystem';

const getShortDeptName = (dept) => dept.replace('departementet', '').trim();

const DepartmentsView = ({ agencies, departments, departmentStats, onDepartmentClick }) => {
  return (
    <div className={ds.cn('space-y-8 animate-fade-in')}>

      {/* Current Distribution */}
      <div className={ds.cn('bg-white', ds.cardPadding.lg, ds.radius.lg, ds.shadows.card, 'border relative overflow-hidden')} style={{ borderColor: ds.colors.slate[200] }}>
        <div className="mb-8">
          <h3 className={ds.cn('font-serif', ds.typography.sizes['2xl'], 'text-slate-900', ds.typography.weights.semibold)}>Myndigheter per Departement</h3>
          <p className={ds.cn('text-slate-500 mt-1')}>Klicka på en stapel för att se detaljerad lista</p>
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
      <div className={ds.cn('bg-white', ds.cardPadding.lg, ds.radius.lg, ds.shadows.card, 'border')} style={{ borderColor: ds.colors.slate[200] }}>
        <div className="mb-6">
          <h3 className={ds.cn('font-serif', ds.typography.sizes.xl, 'text-slate-900', ds.typography.weights.semibold)}>Historisk utveckling</h3>
          <p className={ds.cn(ds.typography.sizes.sm, 'text-slate-500')}>Förändring av departementsstruktur över tid</p>
        </div>
        <DeptHistoryChart agencies={agencies} yearRange={[1978, 2025]} />
      </div>
    </div>
  );
};

export default DepartmentsView;