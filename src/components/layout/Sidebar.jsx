import React from 'react';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Table2,
  Info,
  Moon,
  Github,
  X,
  PieChart
} from 'lucide-react';

const NavItem = ({ id, label, icon: Icon, active, onClick }) => (
  <a 
    href="#" 
    onClick={(e) => { e.preventDefault(); onClick(id); }}
    className={`flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl group mb-1 relative overflow-hidden
      ${active 
        ? 'bg-white text-slate-900 shadow-card ring-1 ring-slate-900/5' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl" />}
    <Icon className={`w-5 h-5 mr-3 transition-colors ${active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span className="font-medium">{label}</span>
  </a>
);

const Sidebar = ({
  activeTab,
  onTabChange,
  showIntro,
  onToggleIntro,
  isDark,
  onToggleDark,
  isOpen,
  onClose
}) => {
  const navItems = [
    { id: 'overview', label: 'Översikt', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analys', icon: PieChart },
    { id: 'departments', label: 'Departement', icon: Building2 },
    { id: 'regions', label: 'Regioner', icon: MapPin },
    { id: 'list', label: 'Register', icon: Table2 },
  ];
  return (
    <aside 
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 bg-slate-50/95 backdrop-blur-xl border-r border-slate-200 flex-col justify-between transition-transform duration-300 ease-in-out static inset-auto"
    >
      <div>
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-slate-900/20">
              <span className="relative -top-0.5">S</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-slate-900 tracking-tight leading-none">Myndigheter</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Statistik 1978-2025</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 -mr-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-0.5">
          {navItems.map(item => (
            <NavItem 
              key={item.id}
              {...item}
              active={activeTab === item.id}
              onClick={onTabChange}
            />
          ))}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={onToggleIntro}
          className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all text-xs font-medium mb-4
            ${showIntro 
              ? 'bg-primary-50 text-primary-700 border border-primary-100' 
              : 'text-slate-500 hover:bg-slate-100'}
          `}
        >
          <span>Om tjänsten</span>
          <Info className="w-4 h-4" />
        </button>
        
        <div className="flex justify-between items-center px-2 pt-2">
          <span className="text-[10px] font-mono text-slate-400">v3.0.0</span>
          <div className="flex gap-1">
            <button 
              onClick={onToggleDark}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Växla tema"
            >
              <Moon className="w-4 h-4" />
            </button>
            <a 
              href="https://github.com/isakskogstad/myndigheter" 
              target="_blank" 
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;