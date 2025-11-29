import React, { useState, useMemo } from 'react';
import { useAgencyData, useUrlState } from './hooks/useAgencyData';
import { LoadingState, ErrorState } from './components/ui/LoadingState';
import { deptColors, regionColors } from './data/constants';

// Layout & Views
import Layout from './components/layout/Layout';
import DashboardView from './components/views/DashboardView';
import RegistryView from './components/views/RegistryView';
import DepartmentsView from './components/views/DepartmentsView';
import RegionsView from './components/views/RegionsView';
import CompareView from './components/views/CompareView';

// Hooks
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return [isDark, setIsDark];
};

export default function MyndigheterApp() {
  // 1. Data & State
  const { data, loading, error, refresh } = useAgencyData();
  const agencies = data || []; // Ensure agencies is always an array
  const [isDark, setIsDark] = useDarkMode();
  
  // URL State
  const [activeTab, setActiveTab] = useUrlState('view', 'overview');
  const [yearRange, setYearRange] = useUrlState('years', [1978, 2025]);
  const [searchQuery, setSearchQuery] = useUrlState('q', '');

  // Local UI State
  const [showIntro, setShowIntro] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationYear, setAnimationYear] = useState(1978);
  const [activeSeries, setActiveSeries] = useState({ agencies: true, employees: false });
  const [normalizeData, setNormalizeData] = useState(false);
  const [compareList, setCompareList] = useState([]);

  // Animation Loop
  React.useEffect(() => {
    let timer;
    if (isAnimating) {
      timer = setInterval(() => {
        setAnimationYear(y => {
          if (y >= yearRange[1]) {
            setIsAnimating(false);
            return yearRange[1];
          }
          return y + 1;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isAnimating, yearRange]);

  // 2. Derived Data
  const activeAgencies = useMemo(() => agencies.filter(a => !a.e), [agencies]);
  const departments = useMemo(() => [...new Set(activeAgencies.map(a => a.d).filter(Boolean))].sort(), [activeAgencies]);

  // Stats Calculations
  const departmentStats = useMemo(() => {
    const stats = {};
    activeAgencies.forEach(a => {
      if (a.d) {
        if (!stats[a.d]) stats[a.d] = { name: a.d, count: 0, emp: 0 };
        stats[a.d].count++;
        stats[a.d].emp += a.emp || 0;
      }
    });
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [activeAgencies]);

  const regionStats = useMemo(() => {
    const stats = { Stockholm: 0, Göteborg: 0, Malmö: 0, Uppsala: 0, Övrigt: 0 };
    activeAgencies.forEach(a => {
      const city = a.city?.toUpperCase() || '';
      if (city.includes('STOCKHOLM') || city.includes('SOLNA')) stats.Stockholm++;
      else if (city.includes('GÖTEBORG')) stats.Göteborg++;
      else if (city.includes('MALMÖ') || city.includes('LUND')) stats.Malmö++;
      else if (city.includes('UPPSALA')) stats.Uppsala++;
      else stats.Övrigt++;
    });
    return Object.entries(stats).map(([name, value]) => ({ 
      name, value, color: regionColors[name] || '#78716c' 
    }));
  }, [activeAgencies]);

  // 3. Render
  if (loading) return <LoadingState message="Laddar myndighetsdata..." />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showIntro={showIntro}
      onToggleIntro={() => setShowIntro(!showIntro)}
      isDark={isDark}
      onToggleDark={() => setIsDark(!isDark)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {activeTab === 'overview' && (
        <DashboardView 
          activeSeries={activeSeries}
          setActiveSeries={setActiveSeries}
          normalizeData={normalizeData}
          setNormalizeData={setNormalizeData}
          yearRange={yearRange}
          setYearRange={setYearRange}
          isAnimating={isAnimating}
          setIsAnimating={(val) => {
            if(val) setAnimationYear(yearRange[0]);
            setIsAnimating(val);
          }}
          animationYear={animationYear}
          activeAgenciesCount={activeAgencies.length}
        />
      )}

      {activeTab === 'list' && (
        <RegistryView 
          agencies={agencies}
          departments={departments}
          filterText={searchQuery}
          setFilterText={setSearchQuery}
        />
      )}

      {activeTab === 'departments' && (
        <DepartmentsView 
          agencies={agencies}
          departments={departments}
          departmentStats={departmentStats}
        />
      )}

      {activeTab === 'regions' && (
        <RegionsView 
          regionStats={regionStats}
          agencies={agencies}
        />
      )}

      {activeTab === 'compare' && (
        <CompareView 
          compareList={compareList}
          removeFromCompare={(agency) => setCompareList(prev => prev.filter(a => a.n !== agency.n))}
          onAddMore={() => setActiveTab('list')}
        />
      )}
    </Layout>
  );
}