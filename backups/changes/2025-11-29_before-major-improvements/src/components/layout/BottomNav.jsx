import React from 'react';
import { LayoutDashboard, PieChart, Table2, Building2, MapPin } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'overview', label: 'Översikt', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analys', icon: PieChart },
    { id: 'list', label: 'Register', icon: Table2 },
    { id: 'departments', label: 'Dept.', icon: Building2 },
    { id: 'regions', label: 'Karta', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 lg:hidden z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-primary-100' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
