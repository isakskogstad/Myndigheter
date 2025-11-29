import React, { useState, useMemo, Suspense } from 'react';
import { useAgencyData, useUrlState } from './hooks/useAgencyData';
import { LoadingState, ErrorState } from './components/ui/LoadingState';
import { regionColors } from './data/constants';
import Layout from './components/layout/Layout';

// UI Components
import AgencyDetailsPanel from './components/ui/AgencyDetailsPanel';
import CompareFloatingBar from './components/ui/CompareFloatingBar';
import CompareModal from './components/ui/CompareModal';
import AboutModal from './components/ui/AboutModal';

// Lazy load Views
const DashboardView = React.lazy(() => import('./components/views/DashboardView'));
const RegistryView = React.lazy(() => import('./components/views/RegistryView'));
const DepartmentsView = React.lazy(() => import('./components/views/DepartmentsView'));
const RegionsView = React.lazy(() => import('./components/views/RegionsView'));
const AnalysisView = React.lazy(() => import('./components/views/AnalysisView'));

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

const ViewLoader = () => (
  <div className="h-96 w-full flex items-center justify-center animate-fade-in">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin"></div>
  </div>
);

export default function MyndigheterApp() {
  const { data, loading, error, refresh } = useAgencyData();
  const agencies = data || [];
  const [isDark, setIsDark] = useDarkMode();
  
  const [activeTab, setActiveTab] = useUrlState('view', 'overview');
  const [yearRange, setYearRange] = useUrlState('years', [1978, 2025]);
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  
  const [activeSeries, setActiveSeries] = useUrlState('series', { agencies: true, employees: false });
  const [normalizeData, setNormalizeData] = useUrlState('index', false);
  const [perCapita, setPerCapita] = useUrlState('capita', false);
  const [seriesChartTypes, setSeriesChartTypes] = useUrlState('chartTypes', {
    agencies: 'bar',
    employees: 'line',
    women: 'area',
    men: 'area',
    population: 'line',
    gdp: 'line'
  });
  const [genderMode, setGenderMode] = useUrlState('gender', 'count');

  const [deptFilter, setDeptFilter] = useUrlState('dept', 'all');
  const [statusFilter, setStatusFilter] = useUrlState('status', 'active');

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationYear, setAnimationYear] = useState(1978);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);

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

  const activeAgencies = useMemo(() => agencies.filter(a => !a.e), [agencies]);
  const departments = useMemo(() => [...new Set(activeAgencies.map(a => a.d).filter(Boolean))].sort(), [activeAgencies]);

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

  const handleDepartmentClick = (deptName) => {
    setDeptFilter(deptName);
    setActiveTab('list');
  };

  const handleDashboardReset = () => {
    setActiveSeries({ agencies: true, employees: false });
    setNormalizeData(false);
    setPerCapita(false);
    setGenderMode('count');
    setYearRange([1978, 2025]);
    setSeriesChartTypes({
      agencies: 'bar',
      employees: 'line',
      women: 'area',
      men: 'area',
      population: 'line',
      gdp: 'line'
    });
  };

  if (loading) return <LoadingState message="Laddar myndighetsdata..." />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      showIntro={showAboutModal}
      onToggleIntro={() => setShowAboutModal(true)}
      isDark={isDark}
      onToggleDark={() => setIsDark(!isDark)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      agencies={agencies}
      onSelectAgency={setSelectedAgency}
    >
      <AgencyDetailsPanel 
        agency={selectedAgency} 
        onClose={() => setSelectedAgency(null)} 
      />
      
      {showCompareModal && (
        <CompareModal 
          compareList={compareList} 
          onClose={() => setShowCompareModal(false)}
          onRemove={(agency) => setCompareList(prev => prev.filter(a => a.n !== agency.n))}
        />
      )}

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}

      <CompareFloatingBar 
        compareList={compareList}
        onClear={() => setCompareList([])}
        onOpenCompare={() => setShowCompareModal(true)}
      />

      <Suspense fallback={<ViewLoader />}>
        {activeTab === 'overview' && (
          <DashboardView
            activeSeries={activeSeries}
            setActiveSeries={setActiveSeries}
            normalizeData={normalizeData}
            setNormalizeData={setNormalizeData}
            yearRange={yearRange}
            setYearRange={setYearRange}
            perCapita={perCapita}
            setPerCapita={setPerCapita}
            seriesChartTypes={seriesChartTypes}
            setSeriesChartTypes={setSeriesChartTypes}
            genderMode={genderMode}
            setGenderMode={setGenderMode}
            onReset={handleDashboardReset}
            isAnimating={isAnimating}
            setIsAnimating={(val) => {
              if(val) setAnimationYear(yearRange[0]);
              setIsAnimating(val);
            }}
            animationYear={animationYear}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView 
            agencies={agencies} 
            onSelectAgency={setSelectedAgency} 
          />
        )}

        {activeTab === 'list' && (
          <RegistryView 
            agencies={agencies}
            departments={departments}
            filterText={searchQuery}
            setFilterText={setSearchQuery}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onSelectAgency={setSelectedAgency}
            onToggleCompare={(agency) => {
              setCompareList(prev => {
                if (prev.find(a => a.n === agency.n)) return prev.filter(a => a.n !== agency.n);
                if (prev.length >= 3) return prev; 
                return [...prev, agency];
              });
            }}
            compareList={compareList}
          />
        )}

        {activeTab === 'departments' && (
          <DepartmentsView 
            agencies={agencies}
            departments={departments}
            departmentStats={departmentStats}
            onDepartmentClick={handleDepartmentClick}
          />
        )}

        {activeTab === 'regions' && (
          <RegionsView 
            regionStats={regionStats}
            agencies={agencies}
          />
        )}
      </Suspense>
    </Layout>
  );
}