import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceArea, Legend, ComposedChart, PieChart, Pie } from 'recharts';
import { Search, Download, ChevronDown, ChevronRight, X, Copy, Check, Play, Square, BarChart3, TrendingUp, LineChart as LineChartIcon, Users, Building2, MapPin, Calendar, ExternalLink, Phone, Info, ArrowUp, ArrowDown, Minus, RefreshCw, Moon, Sun, Undo2, Redo2, Printer } from 'lucide-react';

// Import constants from separate file
import {
  deptColors,
  regionColors,
  cofogNames,
  governmentPeriods,
  timeSeriesData,
  genderHistoryData,
  agencyHistory
} from './data/constants';

// Import Sweden statistics for comparison
import { getStatsByYear } from './data/swedenStats';

// Import data fetching hook
import { useAgencyData } from './hooks/useAgencyData';

// Import loading states
import { LoadingState, ErrorState } from './components/LoadingState';

// Import IntroSection
import IntroSection from './components/IntroSection';

// Import SeriesSelector for multi-series graph
import SeriesSelector, { normalizeSeriesData } from './components/SeriesSelector';

// Import RegionHistoryChart for historical region data
import RegionHistoryChart from './components/RegionHistoryChart';

// Import DeptHistoryChart for historical department data
import DeptHistoryChart from './components/DeptHistoryChart';

// Helper function to get short department names (for UI display)
const getShortDeptName = (dept) => {
  if (!dept) return '';
  const shortNames = {
    'Justitiedepartementet': 'Justitie',
    'Finansdepartementet': 'Finans',
    'Utbildningsdepartementet': 'Utbildning',
    'Socialdepartementet': 'Social',
    'Klimat- och näringslivsdepartementet': 'Klimat & Näringsliv',
    'Kulturdepartementet': 'Kultur',
    'Försvarsdepartementet': 'Försvar',
    'Arbetsmarknadsdepartementet': 'Arbetsmarknad',
    'Landsbygds- och infrastrukturdepartementet': 'Landsbygd & Infra',
    'Utrikesdepartementet': 'Utrikes',
    'Statsrådsberedningen': 'Statsrådsberedningen'
  };
  return shortNames[dept] || dept.replace('departementet', '').trim();
};

// Animerad siffra med cleanup (FIX #4)
const AnimatedNumber = ({ value, duration = 400, prefix = '', suffix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef(null);
  const startValueRef = useRef(value);
  
  useEffect(() => {
    const start = startValueRef.current;
    const end = value;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        startValueRef.current = end;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);
  
  return <span className={className}>{prefix}{displayValue.toLocaleString('sv-SE')}{suffix}</span>;
};

// FIX #12: Trendpil komponent
const TrendArrow = ({ current, previous, className = '' }) => {
  if (!previous || !current) return <Minus className={`w-4 h-4 text-gray-400 ${className}`} />;
  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.5) return <Minus className={`w-4 h-4 text-gray-400 ${className}`} />;
  if (diff > 0) return <ArrowUp className={`w-4 h-4 text-emerald-500 ${className}`} />;
  return <ArrowDown className={`w-4 h-4 text-red-500 ${className}`} />;
};

// Sparkline komponent
const Sparkline = ({ data, color = '#3b82f6', height = 24 }) => {
  if (!data || Object.keys(data).length < 2) return null;
  const values = Object.values(data);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 60;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 4)}`).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block" aria-label="FTE-trend">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
};

// Loading skeleton
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Skeleton for agency list row
const SkeletonAgencyRow = () => (
  <div className="p-4 border-b border-gray-100 animate-pulse">
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded" />
    </div>
  </div>
);

// Skeleton for chart area
const SkeletonChart = ({ height = 300 }) => (
  <div className="animate-pulse">
    <div className="flex items-end gap-2" style={{ height }}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-200 rounded-t"
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between mt-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-3 w-10 bg-gray-100 rounded" />
      ))}
    </div>
  </div>
);

// Skeleton for stats card
const SkeletonStatCard = () => (
  <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/3" />
  </div>
);

// FIX #1: Fungerande dual range slider
const DualRangeSlider = ({ min, max, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef(null);
  const draggingRef = useRef(null);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const getValueFromPosition = (clientX) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(min + percent * (max - min));
  };
  
  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    draggingRef.current = handle;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const newValue = getValueFromPosition(e.clientX);
    
    setLocalValue(prev => {
      if (draggingRef.current === 'start') {
        const clamped = Math.min(newValue, prev[1] - 1);
        return [Math.max(min, clamped), prev[1]];
      } else {
        const clamped = Math.max(newValue, prev[0] + 1);
        return [prev[0], Math.min(max, clamped)];
      }
    });
  }, [min, max]);
  
  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) {
      onChange(localValue);
      draggingRef.current = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [localValue, onChange, handleMouseMove]);
  
  const leftPercent = ((localValue[0] - min) / (max - min)) * 100;
  const rightPercent = ((localValue[1] - min) / (max - min)) * 100;
  
  return (
    <div className="px-2 py-4">
      <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
        <span>{localValue[0]}</span>
        <span className="text-gray-400 text-xs">Dra för att justera period</span>
        <span>{localValue[1]}</span>
      </div>
      <div ref={trackRef} className="relative h-2 bg-gray-200 rounded-full cursor-pointer">
        {/* Active range */}
        <div 
          className="absolute h-full bg-blue-500 rounded-full"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        {/* Start handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1.5 hover:scale-110 transition-transform"
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
          role="slider"
          aria-label="Startår"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue[0]}
          tabIndex={0}
        />
        {/* End handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1.5 hover:scale-110 transition-transform"
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
          role="slider"
          aria-label="Slutår"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue[1]}
          tabIndex={0}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

// FIX #5: Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
};

// FIX #29: URL state hook
const useUrlState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(key);
    if (urlValue === null) return defaultValue;
    try {
      return JSON.parse(urlValue);
    } catch {
      return urlValue;
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (JSON.stringify(value) === JSON.stringify(defaultValue)) {
      params.delete(key);
    } else {
      params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [key, value, defaultValue]);

  return [value, setValue];
};

// Dark mode hook with localStorage persistence
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return [isDark, setIsDark];
};

// Filter history hook for undo/redo
const useFilterHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = history[currentIndex];

  const push = useCallback((newState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      // Limit history to 20 items
      if (newHistory.length > 20) newHistory.shift();
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, 19));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { current, push, undo, redo, canUndo, canRedo };
};

// FIX #24: Virtualiserad lista
const VirtualList = ({ items, height, itemHeight, renderItem }) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(height / itemHeight) + 2, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;
  
  return (
    <div 
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => renderItem(item, startIndex + i))}
        </div>
      </div>
    </div>
  );
};


export default function MyndigheterV6() {
  // External data fetching with caching
  const { data: externalData, loading: dataLoading, error: dataError, refresh: refreshData, cacheInfo } = useAgencyData();

  // Use external data (no fallback - data is fetched from civictechsweden/myndighetsdata)
  const currentAgenciesData = externalData || [];

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  // Filter history for undo/redo
  const filterHistory = useFilterHistory({ search: '', filter: 'all', dept: 'all' });

  // FIX #29: URL-baserad state för delning
  const [activeView, setActiveView] = useUrlState('view', 'overview');
  const [yearRange, setYearRange] = useUrlState('years', [1978, 2025]);
  const [registrySearch, setRegistrySearch] = useUrlState('search', '');
  const [departmentFilter, setDepartmentFilter] = useUrlState('dept', 'all');

  const [showRegistry, setShowRegistry] = useState(false);
  const [showGovernments, setShowGovernments] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard navigation state
  const [keyboardIndex, setKeyboardIndex] = useState(-1);

  const [chartType, setChartType] = useState('area');
  const [chartMetric, setChartMetric] = useState('count');
  const [chartFilter, setChartFilter] = useState('all'); // 'all', 'active', 'dissolved'
  // Multi-series support: which series are active
  const [activeSeries, setActiveSeries] = useState({
    agencies: true,
    employees: false,
    population: false,
    gdp: false,
    women: false,
    men: false
  });
  const [normalizeData, setNormalizeData] = useState(false);
  // Backwards compatibility
  const showPopulation = activeSeries.population;
  const showGDP = activeSeries.gdp;
  const [deptSortBy, setDeptSortBy] = useState('count');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [groupBy, setGroupBy] = useState('none');
  
  // FIX #20: Breadcrumbs state
  const [breadcrumbs, setBreadcrumbs] = useState([{ label: 'Start', view: 'overview' }]);
  
  // Animation med cleanup (FIX #4)
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationYear, setAnimationYear] = useState(1978);
  const animationRef = useRef(null);
  
  const [compareList, setCompareList] = useState([]);
  
  // FIX #5: Debounced search
  const [searchInput, setSearchInput] = useState(registrySearch);
  const debouncedSearch = useDebounce(searchInput, 300);
  
  useEffect(() => {
    setRegistrySearch(debouncedSearch);
  }, [debouncedSearch]);
  
  const [registryFilter, setRegistryFilter] = useState('all');
  const [registrySort, setRegistrySort] = useState('name');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [registryPage, setRegistryPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // FIX #2 & #3: Tooltip med ref för korrekt positionering
  const [tooltipAgency, setTooltipAgency] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const listRef = useRef(null);
  
  const handleMouseEnter = useCallback((agency, e) => {
    if (selectedAgency?.n === agency.n) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const listRect = listRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setTooltipPos({ 
      x: rect.left - listRect.left + rect.width / 2, 
      y: rect.top - listRect.top 
    });
    setTooltipAgency(agency);
  }, [selectedAgency]);
  
  const handleMouseLeave = useCallback(() => {
    setTooltipAgency(null);
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Ctrl+Z for undo (works globally)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (filterHistory.canUndo) handleUndo();
        return;
      }
      // Handle Ctrl+Y or Ctrl+Shift+Z for redo (works globally)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (filterHistory.canRedo) handleRedo();
        return;
      }

      // Only handle keyboard nav when registry is open
      if (!showRegistry) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setKeyboardIndex(prev => Math.min(prev + 1, paginatedAgencies.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setKeyboardIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (keyboardIndex >= 0 && paginatedAgencies[keyboardIndex]) {
            setSelectedAgency(paginatedAgencies[keyboardIndex]);
          }
          break;
        case 'Escape':
          setSelectedAgency(null);
          setKeyboardIndex(-1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRegistry, keyboardIndex, filterHistory, handleUndo, handleRedo]);

  // Reset keyboard index when filters change
  useEffect(() => {
    setKeyboardIndex(-1);
  }, [registrySearch, registryFilter, departmentFilter]);

  // Save filter state for undo/redo
  const saveFilterState = useCallback(() => {
    filterHistory.push({
      search: registrySearch,
      filter: registryFilter,
      dept: departmentFilter
    });
  }, [registrySearch, registryFilter, departmentFilter, filterHistory]);

  // Handle undo
  const handleUndo = useCallback(() => {
    filterHistory.undo();
    const prev = filterHistory.current;
    setRegistrySearch(prev.search);
    setRegistryFilter(prev.filter);
    setDepartmentFilter(prev.dept);
  }, [filterHistory, setRegistrySearch, setDepartmentFilter]);

  // Handle redo
  const handleRedo = useCallback(() => {
    filterHistory.redo();
    const next = filterHistory.current;
    setRegistrySearch(next.search);
    setRegistryFilter(next.filter);
    setDepartmentFilter(next.dept);
  }, [filterHistory, setRegistrySearch, setDepartmentFilter]);

  const [copyFeedback, setCopyFeedback] = useState(null);
  const ITEMS_PER_PAGE = 20;
  
  // FIX #14: Info modal för FTE
  const [showFteInfo, setShowFteInfo] = useState(false);
  
  const activeAgencies = useMemo(() => currentAgenciesData.filter(a => a && a.n && !a.e), [currentAgenciesData]);
  const departments = useMemo(() => [...new Set(activeAgencies.map(a => a.d).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sv')), [activeAgencies]);

  // FIX #9: Regionstatistik
  const regionStats = useMemo(() => {
    const stats = { Stockholm: 0, Göteborg: 0, Malmö: 0, Uppsala: 0, Övrigt: 0 };
    activeAgencies.forEach(a => {
      const city = a.city?.toUpperCase() || '';
      if (city.includes('STOCKHOLM') || city.includes('SOLNA') || city.includes('SUNDBYBERG')) stats.Stockholm++;
      else if (city.includes('GÖTEBORG')) stats.Göteborg++;
      else if (city.includes('MALMÖ') || city.includes('LUND')) stats.Malmö++;
      else if (city.includes('UPPSALA')) stats.Uppsala++;
      else stats.Övrigt++;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value, color: regionColors[name] }));
  }, [activeAgencies]);

  // Myndigheter bildade/nedlagda ett specifikt år
  const yearAgencies = useMemo(() => {
    if (!selectedYear) return { formed: [], dissolved: [] };
    return {
      formed: currentAgenciesData.filter(a => a.s?.startsWith(String(selectedYear))),
      dissolved: currentAgenciesData.filter(a => a.e?.startsWith(String(selectedYear)))
    };
  }, [selectedYear, currentAgenciesData]);

  // Relaterade myndigheter
  const relatedAgencies = useMemo(() => {
    if (!selectedAgency) return [];
    return activeAgencies.filter(a => 
      a.n !== selectedAgency.n && 
      (a.d === selectedAgency.d || a.host === selectedAgency.n || selectedAgency.host === a.n)
    ).slice(0, 5);
  }, [selectedAgency, activeAgencies]);

  // Sökförslag
  const searchSuggestions = useMemo(() => {
    if (!searchInput || searchInput.length < 2) return [];
    const search = searchInput.toLowerCase();
    return currentAgenciesData.filter(a =>
      a.n?.toLowerCase().includes(search) ||
      a.sh?.toLowerCase().includes(search) ||
      a.en?.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [searchInput, currentAgenciesData]);

  // FIX #6 & #7: Korrekt loading och filtrering
  const filteredAgencies = useMemo(() => {
    // Filter out invalid entries first
    let result = currentAgenciesData.filter(a => a && a.n);

    if (registrySearch) {
      const search = registrySearch.toLowerCase();
      result = result.filter(a =>
        a.n?.toLowerCase().includes(search) ||
        a.en?.toLowerCase().includes(search) ||
        a.sh?.toLowerCase().includes(search) ||
        a.d?.toLowerCase().includes(search)
      );
    }
    if (registryFilter === 'active') result = result.filter(a => !a.e);
    else if (registryFilter === 'inactive') result = result.filter(a => a.e);
    if (departmentFilter !== 'all') result = result.filter(a => a.d === departmentFilter);
    if (selectedDept) result = result.filter(a => a.d === selectedDept);

    result.sort((a, b) => {
      if (registrySort === 'name') return (a.n || '').localeCompare(b.n || '', 'sv');
      if (registrySort === 'employees') return (b.emp || 0) - (a.emp || 0);
      if (registrySort === 'start') return (b.s || '1800') > (a.s || '1800') ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrySearch, registryFilter, departmentFilter, registrySort, selectedDept, currentAgenciesData]);

  // FIX #7: Separat hantering för gruppering
  const groupedAgencies = useMemo(() => {
    if (groupBy === 'none') return null;
    const groups = {};
    filteredAgencies.forEach(a => {
      let key = 'Övrigt';
      if (groupBy === 'dept') key = a.d || 'Okänt departement';
      else if (groupBy === 'structure') key = a.str || 'Okänd struktur';
      else if (groupBy === 'cofog') key = a.cof ? cofogNames[a.cof] : 'Okänd COFOG';
      else if (groupBy === 'region') {
        const city = a.city?.toUpperCase() || '';
        if (city.includes('STOCKHOLM') || city.includes('SOLNA')) key = 'Stockholm';
        else if (city.includes('GÖTEBORG')) key = 'Göteborg';
        else if (city.includes('MALMÖ')) key = 'Malmö';
        else key = 'Övriga orter';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredAgencies, groupBy]);
  
  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  const paginatedAgencies = groupBy === 'none' 
    ? filteredAgencies.slice((registryPage - 1) * ITEMS_PER_PAGE, registryPage * ITEMS_PER_PAGE)
    : filteredAgencies;

  // Departementsstatistik
  const departmentStats = useMemo(() => {
    const stats = {};
    activeAgencies.forEach(a => {
      if (a.d) {
        if (!stats[a.d]) stats[a.d] = { name: a.d, count: 0, emp: 0, color: deptColors[a.d] || '#6b7280' };
        stats[a.d].count++;
        stats[a.d].emp += a.emp || 0;
      }
    });
    const arr = Object.values(stats);
    if (deptSortBy === 'count') return arr.sort((a, b) => b.count - a.count);
    if (deptSortBy === 'emp') return arr.sort((a, b) => b.emp - a.emp);
    return arr.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [activeAgencies, deptSortBy]);

  // KPI med trenddata (FIX #12)
  const dashboardStats = useMemo(() => {
    const withEmp = activeAgencies.filter(a => a.emp);
    const totalEmp = withEmp.reduce((s, a) => s + a.emp, 0);
    const avgEmp = withEmp.length ? Math.round(totalEmp / withEmp.length) : 0;
    const withGender = activeAgencies.filter(a => a.w && a.m);
    const totalW = withGender.reduce((s, a) => s + a.w, 0);
    const totalM = withGender.reduce((s, a) => s + a.m, 0);
    const pctWomen = totalW + totalM > 0 ? Math.round(totalW / (totalW + totalM) * 100) : 0;
    
    // Förra årets data för trendpilar
    const prevYear = timeSeriesData.find(d => d.year === 2024);
    const currYear = timeSeriesData.find(d => d.year === 2025);
    
    return { 
      totalEmp, 
      avgEmp, 
      pctWomen,
      empTrend: { current: currYear?.emp, previous: prevYear?.emp },
      countTrend: { current: currYear?.count, previous: prevYear?.count }
    };
  }, [activeAgencies]);

  // Animation med korrekt cleanup (FIX #4)
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        setAnimationYear(y => {
          if (y >= yearRange[1]) {
            setIsAnimating(false);
            return yearRange[1];
          }
          return y + 1;
        });
        animationRef.current = setTimeout(animate, 150);
      };
      animationRef.current = setTimeout(animate, 150);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isAnimating, yearRange]);

  // Kopiera
  const copyAgencyInfo = (agency) => {
    const info = [
      agency.n,
      agency.en ? `(${agency.en})` : '',
      agency.d ? `Departement: ${agency.d}` : '',
      agency.emp ? `Anställda: ${agency.emp.toLocaleString('sv-SE')}` : '',
      agency.web ? `Webb: ${agency.web}` : ''
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(info);
    setCopyFeedback(agency.n);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Export
  const exportCSV = () => {
    const headers = ['Namn', 'Kortnamn', 'Departement', 'Struktur', 'Anställda', 'FTE', 'Andel kvinnor', 'Bildad', 'Ort', 'Webb'];
    const rows = filteredAgencies.map(a => [
      a.n, 
      a.sh || '', 
      a.d || '', 
      a.str || '',
      a.emp || '', 
      a.fte || '',
      a.w && a.m ? `${Math.round(a.w/(a.w+a.m)*100)}%` : '',
      a.s || '', 
      a.city || '',
      a.web || ''
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `myndigheter-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleCompare = (agency) => {
    if (compareList.find(a => a.n === agency.n)) {
      setCompareList(compareList.filter(a => a.n !== agency.n));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, agency]);
    }
  };

  // Navigering med breadcrumbs (FIX #20)
  const navigate = (view, label) => {
    setActiveView(view);
    if (view === 'overview') {
      setBreadcrumbs([{ label: 'Start', view: 'overview' }]);
    } else {
      setBreadcrumbs(prev => {
        const existingIndex = prev.findIndex(b => b.view === view);
        if (existingIndex >= 0) {
          return prev.slice(0, existingIndex + 1);
        }
        return [...prev, { label, view }];
      });
    }
  };

  useEffect(() => {
    setRegistryPage(1);
  }, [registrySearch, registryFilter, departmentFilter, registrySort, selectedDept]);

  // Design system styles - using CSS classes from index.css
  const cardStyle = 'card'; // Uses .card class with proper shadows and borders
  const headingStyle = 'font-serif font-semibold text-neutral-900'; // Source Serif 4 for headings

  // Render agency row
  const renderAgencyRow = (agency, index) => {
    const deptColor = deptColors[agency.d] || '#6b7280';
    const history = agencyHistory[agency.n];
    
    return (
      <div 
        key={agency.n}
        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
          selectedAgency?.n === agency.n ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onMouseEnter={(e) => handleMouseEnter(agency, e)}
        onMouseLeave={handleMouseLeave}
      >
        {/* FIX #22: Större klickyta */}
        <div 
          className="flex items-start justify-between gap-3 min-h-[44px]"
          onClick={() => setSelectedAgency(selectedAgency?.n === agency.n ? null : agency)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className={`w-3 h-3 rounded-full flex-shrink-0 ${agency.e ? 'bg-gray-300' : 'bg-emerald-500'}`}
                aria-label={agency.e ? 'Nedlagd' : 'Aktiv'}
              />
              <span className="font-semibold text-gray-900">{agency.n}</span>
              {agency.sh && (
                <span 
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ backgroundColor: `${deptColor}20`, color: deptColor }}
                >
                  {agency.sh}
                </span>
              )}
            </div>
            {agency.d && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1" title={agency.d}>
                <Building2 className="w-3 h-3" />
                {getShortDeptName(agency.d)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeView === 'compare' && !agency.e && (
              <button
                onClick={e => { e.stopPropagation(); toggleCompare(agency); }}
                className={`p-2 rounded-lg text-sm min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  compareList.find(a => a.n === agency.n) 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                aria-label={compareList.find(a => a.n === agency.n) ? 'Ta bort från jämförelse' : 'Lägg till i jämförelse'}
              >
                ⚖️
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); copyAgencyInfo(agency); }}
              className={`p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                copyFeedback === agency.n ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Kopiera information"
            >
              {copyFeedback === agency.n ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            {agency.fteH && <Sparkline data={agency.fteH} color={deptColor} />}
            {agency.emp && (
              <span className="px-2 py-1 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {agency.emp >= 1000 ? `${(agency.emp/1000).toFixed(1)}k` : agency.emp}
              </span>
            )}
          </div>
        </div>
        
        {/* Expanderad vy */}
        {selectedAgency?.n === agency.n && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* FIX #10: Historik */}
            {history && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  Historik
                </div>
                {history.map((h, i) => (
                  <div key={i} className="text-sm text-amber-700">
                    <span className="font-medium">{h.year}:</span> {h.event}
                  </div>
                ))}
              </div>
            )}
            
            {/* Personal */}
            {(agency.emp || agency.w) && (
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {agency.emp && (
                    <div>
                      <AnimatedNumber value={agency.emp} className="text-2xl font-bold text-emerald-600" />
                      <span className="text-sm text-gray-500 ml-1">anställda</span>
                    </div>
                  )}
                  {agency.fte && (
                    <div className="flex items-center gap-1">
                      <AnimatedNumber value={agency.fte} className="text-lg font-semibold text-cyan-600" />
                      <span className="text-sm text-gray-500">FTE</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowFteInfo(true); }}
                        className="p-1 rounded-full hover:bg-gray-200"
                        aria-label="Vad är FTE?"
                      >
                        <Info className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
                {agency.w && agency.m && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-blue-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-400 rounded-full transition-all"
                          style={{ width: `${Math.round(agency.w / (agency.w + agency.m) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-pink-600">
                        {Math.round(agency.w / (agency.w + agency.m) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>♀ {agency.w.toLocaleString('sv-SE')}</span>
                      <span>♂ {agency.m.toLocaleString('sv-SE')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {agency.org && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Org.nr:</span>
                  <span className="font-medium font-mono">{agency.org}</span>
                </div>
              )}
              {agency.str && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Ledningsform:</span>
                  <span className={`badge ${agency.str === 'Styrelse' ? 'badge-primary' : 'bg-neutral-100 text-neutral-700'}`}>
                    {agency.str}
                  </span>
                </div>
              )}
              {agency.gd !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">GD:</span>
                  {agency.gd ? (
                    <span className="badge badge-success">
                      Generaldirektör
                    </span>
                  ) : (
                    <span className="badge bg-neutral-100 text-neutral-500">
                      Nej
                    </span>
                  )}
                </div>
              )}
              {agency.cof && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">COFOG:</span>
                  <span className="font-medium">{cofogNames[agency.cof]}</span>
                </div>
              )}
              {agency.s && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Bildad {agency.s.split('-')[0]}</span>
                </div>
              )}
              {agency.e && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-red-600">Nedlagd {agency.e.split('-')[0]}</span>
                </div>
              )}
              {agency.sfs && (
                <div className="flex items-center gap-2 col-span-2">
                  <span className="text-gray-500">SFS:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{agency.sfs}</span>
                </div>
              )}
            </div>

            {/* Adress */}
            {(agency.addr || agency.city) && (
              <div className="p-3 rounded-lg bg-gray-50 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {agency.addr ? (
                      <span>{agency.addr}</span>
                    ) : agency.city && (
                      <span>{agency.city}</span>
                    )}
                    {agency.post && agency.post !== agency.addr && (
                      <div className="text-gray-500 text-xs mt-1">
                        Postadress: {agency.post}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Kontaktlänkar */}
            {(agency.tel || agency.email || agency.web || agency.wiki) && (
              <div className="flex flex-wrap gap-2">
                {agency.tel && (
                  <a
                    href={`tel:${agency.tel}`}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2 min-h-[44px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <Phone className="w-4 h-4" />
                    {agency.tel}
                  </a>
                )}
                {agency.email && (
                  <a
                    href={`mailto:${agency.email}`}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2 min-h-[44px]"
                    onClick={e => e.stopPropagation()}
                  >
                    📧
                    <span className="truncate max-w-[180px]">{agency.email}</span>
                  </a>
                )}
                {agency.web && (
                  <a
                    href={agency.web.startsWith('http') ? agency.web : `https://${agency.web}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm flex items-center gap-2 min-h-[44px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Webbplats
                  </a>
                )}
                {agency.wiki && (
                  <a
                    href={agency.wiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm flex items-center gap-2 min-h-[44px]"
                    onClick={e => e.stopPropagation()}
                  >
                    📖 Wikipedia
                  </a>
                )}
              </div>
            )}
            
            {/* Relaterade */}
            {relatedAgencies.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Relaterade myndigheter
                </h4>
                <div className="flex flex-wrap gap-2">
                  {relatedAgencies.map(r => (
                    <button
                      key={r.n}
                      onClick={() => setSelectedAgency(r)}
                      className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm min-h-[44px]"
                    >
                      {r.sh || r.n.slice(0, 20)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Show loading state while fetching external data
  if (dataLoading && !externalData) {
    return <LoadingState message="Hämtar myndighetsdata..." />;
  }

  // Show error state if fetch failed
  if (dataError && !externalData) {
    return <ErrorState error={dataError} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-2xl md:text-3xl ${headingStyle} flex items-center gap-3`}>
              <Building2 className="w-8 h-8 text-blue-600" />
              Svenska myndigheter
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              <AnimatedNumber value={activeAgencies.length} className="font-semibold text-blue-600" /> aktiva ·
              <AnimatedNumber value={currentAgenciesData.filter(a => a.e).length} className="font-semibold text-gray-500 ml-1" /> nedlagda
              {cacheInfo?.exists && (
                <span className="ml-2 text-xs text-gray-400">
                  · Cachad {cacheInfo.ageHours < 1 ? 'nyss' : `${Math.round(cacheInfo.ageHours)}h sedan`}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto flex-wrap">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-3 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 min-h-[44px] focus-visible-ring"
              title={isDarkMode ? 'Ljust tema' : 'Mörkt tema'}
              aria-label={isDarkMode ? 'Byt till ljust tema' : 'Byt till mörkt tema'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Print button */}
            <button
              onClick={() => window.print()}
              className="px-3 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 min-h-[44px] no-print focus-visible-ring"
              title="Skriv ut"
              aria-label="Skriv ut sidan"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              onClick={refreshData}
              disabled={dataLoading}
              className="px-3 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 min-h-[44px] disabled:opacity-50 no-print focus-visible-ring"
              title="Uppdatera data från extern källa"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 min-h-[44px] no-print focus-visible-ring"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportera CSV</span>
            </button>
          </div>
        </div>

        {/* Intro Section - collapsible with localStorage persistence */}
        <IntroSection
          agencyCount={currentAgenciesData.length}
          activeCount={activeAgencies.length}
          dissolvedCount={currentAgenciesData.filter(a => a.e).length}
        />

        {/* FIX #20: Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.view}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                <button
                  onClick={() => navigate(crumb.view, crumb.label)}
                  className={`hover:text-blue-600 ${i === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* FIX #18: Navigation med Lucide-ikoner */}
        <div className={`${cardStyle} rounded-xl p-1.5 mb-6`}>
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Översikt', icon: BarChart3 },
              { id: 'departments', label: 'Departement', icon: Building2 },
              { id: 'regions', label: 'Regioner', icon: MapPin },
              { id: 'dashboard', label: 'KPI', icon: TrendingUp },
              { id: 'compare', label: 'Jämför', icon: LineChartIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.id, tab.label)}
                className={`px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 min-h-[44px] transition-colors ${
                  activeView === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FIX #9: Regioner */}
        {activeView === 'regions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Nuvarande fördelning */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <h3 className={`${headingStyle} text-lg mb-4`}>Geografisk fördelning (nuvarande)</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {regionStats.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {regionStats.map(r => (
                    <div key={r.name} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: r.color }} />
                        <span className="font-medium">{r.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{r.value}</span>
                        <span className="text-neutral-500 text-sm ml-1">({Math.round(r.value / activeAgencies.length * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-neutral-500 mt-4">
                <Info className="w-4 h-4 inline mr-1" />
                Majoriteten av myndigheterna är lokaliserade i Stockholmsområdet. Regeringen har en uttalad ambition att sprida statliga jobb i landet.
              </p>
            </div>

            {/* Historisk regionfördelning */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <h3 className={`${headingStyle} text-lg mb-4`}>Historisk regionfördelning (1978-2025)</h3>
              <RegionHistoryChart
                agencies={currentAgenciesData}
                yearRange={[1978, 2025]}
              />
              <p className="text-sm text-neutral-500 mt-4">
                <Info className="w-4 h-4 inline mr-1" />
                Diagrammet visar hur myndigheter geografiskt fördelats över tid baserat på deras huvudsäte.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard med trendpilar (FIX #12) */}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: 'Aktiva myndigheter',
                  value: activeAgencies.length,
                  icon: Building2,
                  trend: dashboardStats.countTrend
                },
                {
                  label: 'Anställda totalt',
                  value: dashboardStats.totalEmp,
                  icon: Users,
                  trend: dashboardStats.empTrend
                },
                {
                  label: 'Snitt per myndighet',
                  value: dashboardStats.avgEmp,
                  icon: TrendingUp
                },
                {
                  label: 'Andel kvinnor',
                  value: dashboardStats.pctWomen,
                  suffix: '%',
                  icon: Users
                },
              ].map((stat, i) => (
                <div key={i} className={`${cardStyle} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-primary-500" />
                    {stat.trend && <TrendArrow current={stat.trend.current} previous={stat.trend.previous} />}
                  </div>
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix || ''}
                    className="text-3xl font-bold text-neutral-900"
                  />
                  <div className="text-sm text-neutral-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Ledningsform statistik */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GD-statistik */}
              <div className={`${cardStyle} rounded-xl p-6`}>
                <h3 className={`${headingStyle} text-lg mb-4`}>Ledning</h3>
                <div className="space-y-4">
                  {(() => {
                    const withGD = activeAgencies.filter(a => a.gd === true).length;
                    const withoutGD = activeAgencies.filter(a => a.gd === false).length;
                    const unknownGD = activeAgencies.filter(a => a.gd === undefined).length;
                    const total = activeAgencies.length;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">Med generaldirektör</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(withGD / total) * 100}%` }} />
                            </div>
                            <span className="font-semibold text-emerald-600 w-12 text-right">{withGD}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">Utan GD</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-neutral-400 rounded-full" style={{ width: `${(withoutGD / total) * 100}%` }} />
                            </div>
                            <span className="font-semibold text-neutral-500 w-12 text-right">{withoutGD}</span>
                          </div>
                        </div>
                        {unknownGD > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Okänt</span>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div className="h-full bg-neutral-200 rounded-full" style={{ width: `${(unknownGD / total) * 100}%` }} />
                              </div>
                              <span className="font-semibold text-neutral-400 w-12 text-right">{unknownGD}</span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Ledningsform pie chart */}
              <div className={`${cardStyle} rounded-xl p-6`}>
                <h3 className={`${headingStyle} text-lg mb-4`}>Ledningsform</h3>
                {(() => {
                  const strStats = activeAgencies.reduce((acc, a) => {
                    const key = a.str || 'Okänd';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {});
                  const pieData = Object.entries(strStats).map(([name, value]) => ({
                    name,
                    value,
                    fill: name === 'Styrelse' ? '#0c80f0' : name === 'Enrådighet' ? '#059669' : '#78716c'
                  }));
                  return (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width={150} height={150}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={2}
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [`${v} myndigheter`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {pieData.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="text-neutral-700">{item.name}</span>
                            </div>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Departement */}
        {activeView === 'departments' && (
          <div className="space-y-6 animate-fade-in">
            {/* Current distribution */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className={`${headingStyle} text-lg`}>Myndigheter per departement (nuvarande)</h3>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[{id:'count',label:'Antal'},{id:'emp',label:'Anställda'},{id:'alpha',label:'A–Ö'}].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setDeptSortBy(s.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium min-h-[40px] ${
                        deptSortBy === s.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={departmentStats}
                  layout="vertical"
                  onClick={(e) => {
                    if (e?.activePayload) {
                      setSelectedDept(e.activePayload[0]?.payload?.name);
                      setShowRegistry(true);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={deptSortBy === 'emp' ? (v => `${(v/1000).toFixed(0)}k`) : undefined} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={200}
                    tick={{ fontSize: 11 }}
                    tickFormatter={getShortDeptName}
                  />
                  <Tooltip
                    formatter={(v) => [deptSortBy === 'emp' ? v.toLocaleString('sv-SE') : v, deptSortBy === 'emp' ? 'Anställda' : 'Myndigheter']}
                    labelFormatter={(name) => name} // Show full department name
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', maxWidth: '300px' }}
                  />
                  <Bar
                    dataKey={deptSortBy === 'emp' ? 'emp' : 'count'}
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                  >
                    {departmentStats.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-500 text-center mt-2">Klicka på ett departement för att se dess myndigheter</p>
            </div>

            {/* Historical department distribution */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <h3 className={`${headingStyle} text-lg mb-4`}>Historisk departementsfördelning (1978–2025)</h3>
              <DeptHistoryChart
                agencies={currentAgenciesData}
                yearRange={[1978, 2025]}
              />
            </div>
          </div>
        )}


        {/* Jämförelse */}
        {activeView === 'compare' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`${cardStyle} rounded-xl p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className={headingStyle}>Jämför myndigheter (max 3)</h3>
                {compareList.length > 0 && (
                  <button 
                    onClick={() => setCompareList([])}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Rensa
                  </button>
                )}
              </div>
              
              {compareList.length === 0 ? (
                <p className="text-gray-600">Välj myndigheter från registret nedan (klicka på ⚖️)</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {compareList.map(a => (
                    <div key={a.n} className="rounded-xl bg-gray-50 p-4 relative">
                      <button 
                        onClick={() => toggleCompare(a)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200"
                        aria-label="Ta bort"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                      <h4 className="font-bold text-sm mb-3 pr-6">{a.n}</h4>
                      {a.fteH && <Sparkline data={a.fteH} color={deptColors[a.d] || '#3b82f6'} height={30} />}
                      <div className="space-y-2 text-sm mt-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Anställda</span>
                          <span className="font-bold text-emerald-600">{a.emp?.toLocaleString('sv-SE') || '–'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">FTE</span>
                          <span className="font-medium">{a.fte?.toLocaleString('sv-SE') || '–'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Andel ♀</span>
                          <span className="font-medium text-pink-600">
                            {a.w && a.m ? `${Math.round(a.w/(a.w+a.m)*100)}%` : '–'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bildad</span>
                          <span>{a.s?.split('-')[0] || '–'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Översikt */}
        {activeView === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* FIX #1: Fungerande slider */}
            <div className={`${cardStyle} rounded-xl p-4`}>
              <DualRangeSlider
                min={1978}
                max={2025}
                value={yearRange}
                onChange={setYearRange}
              />
              
              {/* Kontroller */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { id: 'area', icon: TrendingUp },
                    { id: 'line', icon: LineChartIcon },
                    { id: 'bar', icon: BarChart3 }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setChartType(t.id)}
                      className={`p-2 rounded-md min-w-[40px] min-h-[40px] flex items-center justify-center ${
                        chartType === t.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                      }`}
                      aria-label={`Visa som ${t.id}`}
                    >
                      <t.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[{id:'count',label:'Antal'},{id:'emp',label:'Personal'}].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setChartMetric(m.id);
                        if (m.id === 'emp' && yearRange[0] < 2005) {
                          setYearRange([2005, yearRange[1]]);
                        }
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium min-h-[40px] ${
                        chartMetric === m.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setIsAnimating(!isAnimating);
                    if (!isAnimating) setAnimationYear(yearRange[0]);
                  }}
                  className={`p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center ${
                    isAnimating ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  aria-label={isAnimating ? 'Stoppa animation' : 'Starta animation'}
                >
                  {isAnimating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                {isAnimating && (
                  <span className="text-lg font-bold text-blue-600">{animationYear}</span>
                )}
                
                {/* Filter: Alla / Aktiva / Nedlagda */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
                  {[{id:'all',label:'Alla'},{id:'active',label:'Aktiva'},{id:'dissolved',label:'Nedlagda'}].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setChartFilter(f.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        chartFilter === f.id
                          ? f.id === 'dissolved' ? 'bg-red-500 text-white shadow-sm' : 'bg-white shadow-sm'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-series selector with normalization option */}
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <SeriesSelector
                  activeSeries={activeSeries}
                  setActiveSeries={setActiveSeries}
                  normalizeData={normalizeData}
                  setNormalizeData={setNormalizeData}
                  baseYear={yearRange[0]}
                />
              </div>
            </div>

            {/* Graf */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <h3 className={`${headingStyle} mb-4`}>
                {normalizeData ? `Index (${yearRange[0]}=100)` : (chartMetric === 'emp' ? 'Antal anställda' : chartFilter === 'dissolved' ? 'Nedlagda myndigheter' : chartFilter === 'active' ? 'Aktiva myndigheter' : 'Antal myndigheter')} {yearRange[0]}–{isAnimating ? animationYear : yearRange[1]}
              </h3>
              <ResponsiveContainer width="100%" height={Object.values(activeSeries).filter(Boolean).length > 1 ? 400 : 300}>
                <ComposedChart
                  data={(() => {
                    // Combine all data sources
                    let chartData = timeSeriesData
                      .filter(d => d.year >= yearRange[0] && d.year <= (isAnimating ? animationYear : yearRange[1]))
                      .map(d => {
                        const swedenData = getStatsByYear(d.year);
                        const genderData = genderHistoryData.find(g => g.year === d.year);
                        return {
                          ...d,
                          population: swedenData?.population,
                          gdp: swedenData?.gdp,
                          w: genderData?.w,
                          m: genderData?.m
                        };
                      });

                    // Normalize if enabled
                    if (normalizeData) {
                      chartData = normalizeSeriesData(chartData, activeSeries, yearRange[0]);
                    }
                    return chartData;
                  })()}
                  onClick={(e) => e?.activePayload && setSelectedYear(e.activePayload[0]?.payload?.year)}
                >
                  <defs>
                    <linearGradient id="colorAgencies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c80f0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0c80f0" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDissolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    domain={normalizeData ? ['auto', 'auto'] : (chartMetric === 'emp' ? ['auto', 'auto'] : chartFilter === 'dissolved' ? [0, 'auto'] : [150, 300])}
                    tickFormatter={normalizeData ? (v => `${v.toFixed(0)}`) : (chartMetric === 'emp' ? (v => `${(v/1000).toFixed(0)}k`) : undefined)}
                    tick={{ fontSize: 12 }}
                    label={normalizeData ? { value: 'Index', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#78716c' } } : undefined}
                  />
                  {!normalizeData && (showPopulation || showGDP) && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={v => showPopulation ? `${(v/1000000).toFixed(1)}M` : `${(v/1000000).toFixed(1)}Mkr`}
                      tick={{ fontSize: 11 }}
                      stroke={showPopulation ? '#0d9488' : '#d97706'}
                    />
                  )}
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(v, name) => {
                      if (normalizeData) return [v?.toFixed(1), name];
                      if (name === 'Befolkning') return [v?.toLocaleString('sv-SE'), name];
                      if (name === 'BNP') return [`${(v/1000).toFixed(0)} mdr kr`, name];
                      if (name === 'Nedlagda') return [v, name];
                      if (name === 'Kvinnor') return [v?.toLocaleString('sv-SE'), name];
                      if (name === 'Män') return [v?.toLocaleString('sv-SE'), name];
                      if (name === 'Anställda') return [v?.toLocaleString('sv-SE'), name];
                      return [v?.toLocaleString('sv-SE') || v, name];
                    }}
                  />
                  {Object.values(activeSeries).filter(Boolean).length > 1 && <Legend />}
                  {showGovernments && governmentPeriods
                    .filter(p => p.end > yearRange[0] && p.start < yearRange[1])
                    .map((p, i) => (
                      <ReferenceArea
                        key={i}
                        x1={Math.max(p.start, yearRange[0])}
                        x2={Math.min(p.end, isAnimating ? animationYear : yearRange[1])}
                        fill={p.party === 'S' ? '#ef4444' : '#3b82f6'}
                        fillOpacity={0.08}
                        yAxisId="left"
                      />
                    ))
                  }
                  {/* Agencies */}
                  {activeSeries.agencies && chartFilter !== 'dissolved' && (
                    chartType === 'bar' ? (
                      <Bar yAxisId="left" dataKey="count" fill="#0c80f0" radius={[2,2,0,0]} cursor="pointer" name="Myndigheter" />
                    ) : chartType === 'line' ? (
                      <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0c80f0" strokeWidth={2} dot={{ r: 3 }} cursor="pointer" name="Myndigheter" />
                    ) : (
                      <Area yAxisId="left" type="monotone" dataKey="count" stroke="#0c80f0" strokeWidth={2} fill="url(#colorAgencies)" cursor="pointer" name="Myndigheter" />
                    )
                  )}
                  {/* Employees */}
                  {activeSeries.employees && (
                    <Line yAxisId="left" type="monotone" dataKey="emp" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name="Anställda" />
                  )}
                  {/* Nedlagda myndigheter */}
                  {(chartFilter === 'all' || chartFilter === 'dissolved') && chartMetric !== 'emp' && !normalizeData && (
                    chartFilter === 'dissolved' ? (
                      chartType === 'bar' ? (
                        <Bar yAxisId="left" dataKey="dissolved" fill="#ef4444" radius={[2,2,0,0]} cursor="pointer" name="Nedlagda" />
                      ) : chartType === 'line' ? (
                        <Line yAxisId="left" type="monotone" dataKey="dissolved" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} cursor="pointer" name="Nedlagda" />
                      ) : (
                        <Area yAxisId="left" type="monotone" dataKey="dissolved" stroke="#ef4444" strokeWidth={2} fill="url(#colorDissolved)" cursor="pointer" name="Nedlagda" />
                      )
                    ) : (
                      <Line yAxisId="left" type="monotone" dataKey="dissolved" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Nedlagda" />
                    )
                  )}
                  {/* Population */}
                  {activeSeries.population && (
                    <Line yAxisId={normalizeData ? "left" : "right"} type="monotone" dataKey="population" stroke="#0d9488" strokeWidth={2} strokeDasharray={normalizeData ? "0" : "5 5"} dot={false} name="Befolkning" />
                  )}
                  {/* GDP */}
                  {activeSeries.gdp && (
                    <Line yAxisId={normalizeData ? "left" : "right"} type="monotone" dataKey="gdp" stroke="#d97706" strokeWidth={2} strokeDasharray={normalizeData ? "0" : "5 5"} dot={false} name="BNP" />
                  )}
                  {/* Women */}
                  {activeSeries.women && (
                    <Line yAxisId="left" type="monotone" dataKey="w" stroke="#be185d" strokeWidth={2} dot={{ r: 2 }} name="Kvinnor" />
                  )}
                  {/* Men */}
                  {activeSeries.men && (
                    <Line yAxisId="left" type="monotone" dataKey="m" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} name="Män" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-sm text-neutral-500 text-center mt-2">
                {normalizeData
                  ? `Alla serier normaliserade till ${yearRange[0]}=100 för jämförbarhet`
                  : 'Klicka på ett år för att se bildade/nedlagda myndigheter'}
              </p>
            </div>

            {/* År-detaljer */}
            {selectedYear && (
              <div className={`${cardStyle} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={headingStyle}>{selectedYear}</h3>
                  <button 
                    onClick={() => setSelectedYear(null)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                    aria-label="Stäng"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Bildade ({yearAgencies.formed.length})
                    </h4>
                    {yearAgencies.formed.length === 0 ? (
                      <p className="text-sm text-gray-500">Inga myndigheter bildades</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {yearAgencies.formed.map(a => (
                          <div key={a.n} className="text-sm py-2 px-3 rounded bg-emerald-50">{a.n}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Nedlagda ({yearAgencies.dissolved.length})
                    </h4>
                    {yearAgencies.dissolved.length === 0 ? (
                      <p className="text-sm text-gray-500">Inga myndigheter lades ner</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {yearAgencies.dissolved.map(a => (
                          <div key={a.n} className="text-sm py-2 px-3 rounded bg-red-50">{a.n}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Könsfördelning - stapeldiagram */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className={`${headingStyle} text-lg flex items-center gap-2`}>
                  <Users className="w-5 h-5" />
                  Könsfördelning i staten
                </h3>
                <div className="text-sm text-gray-500">
                  {yearRange[0]}–{yearRange[1]}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={genderHistoryData.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1])}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11 }}
                    interval={Math.ceil(genderHistoryData.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1]).length / 10)}
                  />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, n) => [v.toLocaleString('sv-SE'), n === 'w' ? 'Kvinnor' : 'Män']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(year) => `År ${year}`}
                  />
                  <Legend />
                  <Bar dataKey="w" name="Kvinnor" fill="#ec4899" radius={[2,2,0,0]} />
                  <Bar dataKey="m" name="Män" fill="#3b82f6" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Nyckeltal för senaste året */}
              {(() => {
                const latestData = genderHistoryData.find(d => d.year === Math.min(yearRange[1], 2024));
                if (!latestData) return null;
                const total = latestData.w + latestData.m;
                const wPct = Math.round((latestData.w / total) * 100);
                return (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-pink-50">
                      <div className="text-2xl font-bold text-pink-600">{wPct}%</div>
                      <div className="text-xs text-pink-700">Kvinnor {latestData.year}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">{100 - wPct}%</div>
                      <div className="text-xs text-blue-700">Män {latestData.year}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="text-2xl font-bold text-gray-700">{total.toLocaleString('sv-SE')}</div>
                      <div className="text-xs text-gray-600">Totalt {latestData.year}</div>
                    </div>
                  </div>
                );
              })()}
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs text-emerald-800">
                  <strong>2008:</strong> Jämställdhet uppnåddes – för första gången 50/50 i staten.
                  <strong className="ml-2">2024:</strong> 53% kvinnor.
                </p>
              </div>
            </div>

            {/* Statistikkort */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${cardStyle} rounded-xl p-5`}>
                <AnimatedNumber 
                  value={chartMetric === 'emp' 
                    ? (timeSeriesData.find(d => d.year === (isAnimating ? animationYear : yearRange[1]))?.emp || 0)
                    : (timeSeriesData.find(d => d.year === (isAnimating ? animationYear : yearRange[1]))?.count || 215)} 
                  className="text-3xl font-bold text-gray-900" 
                />
                <div className="text-sm text-gray-600">
                  {chartMetric === 'emp' ? 'Anställda' : 'Myndigheter'} {isAnimating ? animationYear : yearRange[1]}
                </div>
              </div>
              <div className={`${cardStyle} rounded-xl p-5`}>
                {(() => {
                  const metric = chartMetric === 'emp' ? 'emp' : 'count';
                  const curr = timeSeriesData.find(d => d.year === (isAnimating ? animationYear : yearRange[1]))?.[metric] || 0;
                  const first = timeSeriesData.find(d => d.year === yearRange[0])?.[metric] || 0;
                  const pct = first > 0 ? Math.round(((curr - first) / first) * 100) : 0;
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <AnimatedNumber 
                          value={Math.abs(pct)} 
                          prefix={pct >= 0 ? '+' : '-'} 
                          suffix="%" 
                          className={`text-3xl font-bold ${pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                        />
                        {pct >= 0 ? <ArrowUp className="w-5 h-5 text-emerald-600" /> : <ArrowDown className="w-5 h-5 text-red-600" />}
                      </div>
                      <div className="text-sm text-gray-600">Förändring sedan {yearRange[0]}</div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Register */}
        <div className={`${cardStyle} rounded-xl mt-6`}>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-t-xl"
            onClick={() => setShowRegistry(!showRegistry)}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className={`text-lg ${headingStyle}`}>Myndighetsregister</h2>
                <p className="text-sm text-gray-600">{currentAgenciesData.length} myndigheter totalt</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showRegistry ? 'rotate-180' : ''}`} />
          </div>

          {showRegistry && (
            <div className="border-t border-gray-200">
              {/* Filter */}
              <div className="p-4 space-y-3 sticky-filter">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Sök myndighet..."
                    value={searchInput}
                    onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchSuggestions.map(s => (
                        <div
                          key={s.n}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm"
                          onClick={() => { setSearchInput(s.n); setShowSuggestions(false); }}
                        >
                          <span className="font-medium">{s.n}</span>
                          {s.sh && <span className="ml-2 text-gray-400">({s.sh})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={registryFilter}
                    onChange={e => setRegistryFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm min-h-[44px]"
                  >
                    <option value="all">Alla</option>
                    <option value="active">Aktiva</option>
                    <option value="inactive">Nedlagda</option>
                  </select>
                  
                  <select
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm flex-1 min-w-[120px] min-h-[44px]"
                  >
                    <option value="all">Alla departement</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{getShortDeptName(d)}</option>
                    ))}
                  </select>
                  
                  <select
                    value={groupBy}
                    onChange={e => setGroupBy(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm min-h-[44px]"
                  >
                    <option value="none">Ingen gruppering</option>
                    <option value="dept">Departement</option>
                    <option value="structure">Struktur</option>
                    <option value="cofog">COFOG</option>
                    <option value="region">Region</option>
                  </select>
                  
                  <select
                    value={registrySort}
                    onChange={e => setRegistrySort(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm min-h-[44px]"
                  >
                    <option value="name">A–Ö</option>
                    <option value="employees">Anställda</option>
                    <option value="start">Nyast</option>
                  </select>
                  
                  {selectedDept && (
                    <button
                      onClick={() => setSelectedDept(null)}
                      className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-sm flex items-center gap-1 min-h-[44px]"
                    >
                      {selectedDept.replace('departementet', '').trim()}
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Undo/Redo knappar */}
                  <div className="flex gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={!filterHistory.canUndo}
                      className={`p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center transition-opacity ${
                        filterHistory.canUndo
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Ångra filter (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!filterHistory.canRedo}
                      className={`p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center transition-opacity ${
                        filterHistory.canRedo
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Gör om filter (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg flex items-center min-h-[44px]">
                    {filteredAgencies.length} st
                  </span>
                </div>
              </div>

              {/* Tom state */}
              {filteredAgencies.length === 0 && (
                <div className="p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-gray-700 mb-2">Inga myndigheter hittades</h3>
                  <p className="text-sm text-gray-500 mb-4">Prova att ändra dina filter eller sökord</p>
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setRegistryFilter('all');
                      setDepartmentFilter('all');
                      setSelectedDept(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm min-h-[44px]"
                  >
                    Rensa filter
                  </button>
                </div>
              )}

              {/* Lista med FIX #2: Korrekt positionerad tooltip */}
              {filteredAgencies.length > 0 && (
                <div ref={listRef} className="relative">
                  {/* FIX #2: Tooltip */}
                  {tooltipAgency && tooltipAgency.emp && (
                    <div
                      className="absolute z-30 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl pointer-events-none"
                      style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y - 8,
                        transform: 'translate(-50%, -100%)'
                      }}
                    >
                      <div className="font-medium">{tooltipAgency.n}</div>
                      <div className="flex items-center gap-2 mt-1 text-gray-300">
                        <Users className="w-3 h-3" />
                        {tooltipAgency.emp.toLocaleString('sv-SE')} anställda
                      </div>
                      {tooltipAgency.fteH && (
                        <div className="mt-2">
                          <Sparkline data={tooltipAgency.fteH} color="#fff" height={20} />
                        </div>
                      )}
                      <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
                    </div>
                  )}
                  
                  {/* FIX #24: Virtualiserad eller grupperad lista */}
                  {groupBy !== 'none' && groupedAgencies ? (
                    <div className="max-h-[600px] overflow-y-auto">
                      {groupedAgencies.map(([group, agencies]) => (
                        <div key={group}>
                          <div className="px-4 py-3 bg-gray-100 font-medium text-sm sticky top-0 z-10 border-y border-gray-200">
                            {group} <span className="text-gray-500">({agencies.length})</span>
                          </div>
                          {agencies.slice(0, 15).map((agency, i) => renderAgencyRow(agency, i))}
                          {agencies.length > 15 && (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center bg-gray-50">
                              +{agencies.length - 15} fler i denna grupp
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* FIX #24: Virtualiserad lista för bättre prestanda */
                    <VirtualList
                      items={paginatedAgencies}
                      height={500}
                      itemHeight={80}
                      renderItem={(agency, i) => renderAgencyRow(agency, i)}
                    />
                  )}
                </div>
              )}

              {/* Pagination */}
              {groupBy === 'none' && totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setRegistryPage(p => Math.max(1, p - 1))}
                    disabled={registryPage === 1}
                    className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 bg-gray-100 hover:bg-gray-200 min-h-[44px]"
                  >
                    ← Föregående
                  </button>
                  <span className="text-sm text-gray-600">
                    Sida {registryPage} av {totalPages}
                  </span>
                  <button
                    onClick={() => setRegistryPage(p => Math.min(totalPages, p + 1))}
                    disabled={registryPage === totalPages}
                    className="px-4 py-2 rounded-lg text-sm disabled:opacity-40 bg-gray-100 hover:bg-gray-200 min-h-[44px]"
                  >
                    Nästa →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FIX #14: FTE Info modal */}
        {showFteInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFteInfo(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={headingStyle}>Vad är FTE?</h3>
                <button onClick={() => setShowFteInfo(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 mb-3">
                <strong>FTE</strong> (Full-Time Equivalent) är ett mått på antalet heltidsanställda.
              </p>
              <p className="text-gray-600 text-sm mb-3">
                Till skillnad från "antal anställda" tar FTE hänsyn till deltidsanställningar:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>2 personer på 50% = 1 FTE</li>
                <li>1 person på 80% = 0,8 FTE</li>
                <li>1 heltidsanställd = 1 FTE</li>
              </ul>
              <p className="text-gray-500 text-sm mt-4">
                FTE ger en mer rättvisande bild av myndighetens faktiska personalresurser.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Data: SFS, ESV, SCB, AGV, Statskontoret</p>
          <p className="text-xs mt-1">
            {window.location.search && (
              <span className="text-blue-600">🔗 Delbar URL aktiv – kopiera adressen för att dela denna vy</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
