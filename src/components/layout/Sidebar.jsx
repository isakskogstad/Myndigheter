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
  PieChart,
  Database,
  Command
} from 'lucide-react';
import ds from '../../styles/designSystem';

const NavItem = ({ id, label, icon: Icon, active, onClick }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(id); }}
    className={ds.cn('flex items-center px-3 py-2.5 mb-1 relative overflow-hidden group', ds.typography.sizes.sm, ds.typography.weights.medium, ds.radius.md, ds.animations.normal, active ? ds.cn('bg-white text-slate-900', ds.shadows.card, 'ring-1 ring-slate-900/5') : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}
  >
    {active && <div className={ds.cn('absolute left-0 top-0 bottom-0 w-1', ds.radius.sm)} style={{ backgroundColor: ds.colors.primary[500] }} />}
    <Icon className={ds.cn(ds.iconSizes.md, 'mr-3', ds.animations.normal)} style={{ color: active ? ds.colors.primary[600] : undefined }} />
    <span className={ds.typography.weights.medium}>{label}</span>
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
  onClose,
  onOpenCommandPalette
}) => {
  const navItems = [
    { id: 'overview', label: 'Översikt', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analys', icon: PieChart },
    { id: 'departments', label: 'Departement', icon: Building2 },
    { id: 'regions', label: 'Regioner', icon: MapPin },
    { id: 'list', label: 'Myndighetsregister', icon: Table2 },
    { id: 'about-data', label: 'Om Data & Källor', icon: Database },
  ];

  return (
    <aside className={ds.cn('hidden lg:flex w-64 bg-slate-50/95 backdrop-blur-xl border-r flex-col justify-between flex-shrink-0 h-screen sticky top-0 z-40')} style={{ borderColor: ds.colors.slate[200] }}>
      <div>
        {/* Brand */}
        <div className={ds.cn('h-20 flex items-center justify-between px-6 border-b')} style={{ borderColor: ds.colors.slate[100] }}>
          <div className={ds.cn('flex items-center', ds.spacing.md)}>
            <div className={ds.cn('w-9 h-9 flex items-center justify-center text-white font-serif text-xl', ds.radius.md, ds.shadows.medium, ds.typography.weights.bold)} style={{ backgroundColor: ds.colors.slate[900] }}>
              <span className="relative -top-0.5">S</span>
            </div>
            <div>
              <h1 className={ds.cn('font-serif text-slate-900 tracking-tight leading-none', ds.typography.sizes.lg, ds.typography.weights.bold)}>Myndigheter</h1>
              <p className={ds.cn('text-slate-400 uppercase tracking-widest mt-0.5', ds.typography.sizes.xs, ds.typography.weights.bold)} style={{ fontSize: '10px' }}>Statistik 1978-2025</p>
            </div>
          </div>
          <button onClick={onClose} className={ds.cn('lg:hidden p-1 -mr-2 text-slate-400 hover:text-slate-600')}>
            <X className={ds.cn(ds.iconSizes.md)} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={ds.cn('mt-6 px-3 space-y-0.5')}>
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
      <div className={ds.cn('p-4 border-t')} style={{ borderColor: ds.colors.slate[200] }}>
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className={ds.cn('flex items-center justify-between w-full p-2.5 mb-2 text-slate-500 hover:bg-slate-100 border border-slate-200', ds.radius.md, ds.animations.normal, ds.typography.sizes.xs, ds.typography.weights.medium)}
        >
          <span className="flex items-center gap-2">
            <Command className={ds.cn(ds.iconSizes.sm)} />
            Sök...
          </span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">⌘K</kbd>
        </button>

        <button
          onClick={onToggleIntro}
          className={ds.cn('flex items-center justify-between w-full p-2.5 mb-4', ds.radius.md, ds.animations.normal, ds.typography.sizes.xs, ds.typography.weights.medium, showIntro ? 'border' : 'text-slate-500 hover:bg-slate-100')}
          style={showIntro ? { backgroundColor: ds.colors.primary[50], color: ds.colors.primary[700], borderColor: ds.colors.primary[100] } : {}}
        >
          <span>Om tjänsten</span>
          <Info className={ds.cn(ds.iconSizes.sm)} />
        </button>

        <div className="flex justify-between items-center px-2 pt-2">
          <span className={ds.cn('font-mono text-slate-400', ds.typography.sizes.xs)} style={{ fontSize: '10px' }}>v3.0.0</span>
          <div className={ds.cn('flex', ds.spacing.xs)}>
            <button
              onClick={onToggleDark}
              className={ds.cn('p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100', ds.radius.md, ds.animations.normal)}
              title="Växla tema"
            >
              <Moon className={ds.cn(ds.iconSizes.sm)} />
            </button>
            <a
              href="https://github.com/isakskogstad/myndigheter"
              target="_blank"
              rel="noreferrer"
              className={ds.cn('p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100', ds.radius.md, ds.animations.normal)}
            >
              <Github className={ds.cn(ds.iconSizes.sm)} />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
