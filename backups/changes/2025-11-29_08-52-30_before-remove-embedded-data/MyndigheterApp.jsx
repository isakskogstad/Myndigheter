import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceArea, Legend, ComposedChart, PieChart, Pie } from 'recharts';
import { Search, Download, ChevronDown, ChevronRight, X, Copy, Check, Play, Square, BarChart3, TrendingUp, LineChart as LineChartIcon, Users, Building2, MapPin, Calendar, ExternalLink, Phone, Info, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';

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

// Import data fetching hook
import { useAgencyData } from './hooks/useAgencyData';

// Import loading states
import { LoadingState, ErrorState } from './components/LoadingState';

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

const agenciesData = [
  {n:"Affärsverket svenska kraftnät",s:"1992-01-01",sfs:"1991:2013,2007:1119",d:"Klimat- och näringslivsdepartementet",en:"Swedish National Grid",sh:"SVK",emp:1462,fte:1443,w:647,m:863,str:"Styrelse",cof:4,gd:true,fteH:{"2017":571.8,"2018":582.88,"2019":606.9,"2020":659.2,"2021":786.7,"2022":915.92,"2023":1028.7,"2024":1350.35}},
  {n:"Alkoholsortimentsnämnden",s:"2008-01-01",sfs:"2007:1216",d:"Socialdepartementet",org:"202100-5943",tel:"087000800",web:"www.kammarkollegiet.se/alkoholsortimentsnamnden",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:4,host:"Kammarkollegiet",gd:false,fteH:{"2018":0.25,"2019":0.25,"2020":0.35,"2021":0.35,"2022":0.25,"2023":0.25,"2024":0.25}},
  {n:"Allmänna reklamationsnämnden",sfs:"1980:872,1988:1583",d:"Finansdepartementet",en:"National Board for Consumer Disputes",sh:"ARN",emp:56,fte:51,w:37,m:19,org:"202100-3625",tel:"0850886000",web:"www.arn.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":43.99,"2018":47.84,"2019":49.8,"2020":53,"2021":49.73,"2022":46,"2023":45.1,"2024":56.77}},
  {n:"Arbetsdomstolen",sfs:"1974:589,1988:1137",d:"Arbetsmarknadsdepartementet",en:"Labour Court",sh:"AD",emp:20,fte:16,w:15,m:6,org:"202100-2122",tel:"86176600",web:"www.arbetsdomstolen.se",grp:"Sveriges domstolar samt Domstolsverket",city:"STOCKHOLM",str:"Domstol",cof:4,gd:false,fteH:{"2017":17.95,"2018":18.48,"2019":17.7,"2020":17.9,"2021":15.88,"2022":15.76,"2023":16.8,"2024":15.76}},
  {n:"Arbetsförmedlingen",s:"2008-01-01",sfs:"2007:1030,2022:811",d:"Arbetsmarknadsdepartementet",en:"Swedish Public Employment Service",sh:"AF",emp:10325,fte:9479,w:6633,m:3402,org:"202100-2114",tel:"0771600053",web:"www.arbetsformedlingen.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:10,gd:true,fteH:{"2017":12937.96,"2018":12810.79,"2019":11898.6,"2020":9164.1,"2021":10343.94,"2022":9769.6,"2023":10469.7,"2024":9763.28}},
  {n:"Arbetsgivarverket",s:"1994-07-01",sfs:"1994:272,2007:829",d:"Finansdepartementet",en:"Swedish Agency for Government Employers",sh:"AGV",emp:75,fte:66,w:48,m:24,org:"202100-3476",tel:"087001300",web:"www.arbetsgivarverket.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Arbetsgivarkollegium",cof:1,gd:true,fteH:{"2017":65.9,"2018":66.28,"2019":60.8,"2020":59.1,"2021":63.15,"2022":62.68,"2023":69.5,"2024":69.25}},
  {n:"Arbetsmiljöverket",s:"2001-01-01",sfs:"2000:1211,2007:913",d:"Arbetsmarknadsdepartementet",en:"Swedish Work Environment Authority",sh:"AV",emp:678,fte:656,w:426,m:254,org:"202100-2148",tel:"0107309000",web:"www.av.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":565.06,"2018":624.87,"2019":614.5,"2020":595.9,"2021":613.98,"2022":626.96,"2023":684.1,"2024":665.9}},
  {n:"Barnombudsmannen",s:"1993-07-01",sfs:"1993:710,2002:379",d:"Socialdepartementet",en:"Office of the Children?s Ombudsman",sh:"BO",emp:26,fte:23,w:19,m:6,org:"202100-3690",tel:"086922950",web:"www.barnombudsmannen.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":26.35,"2018":25.25,"2019":22.7,"2020":25,"2021":26.91,"2022":27.2,"2023":18.8,"2024":25.55}},
  {n:"Bokföringsnämnden",sfs:"1976:377,1988:1118",d:"Finansdepartementet",en:"Swedish Accounting Standards Board",sh:"BFN",emp:7,fte:7,w:5,m:3,org:"202100-3278",tel:"0840898990",web:"www.bfn.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:4,gd:false,fteH:{"2017":7.5,"2018":6.9,"2019":5.5,"2020":4.8,"2021":5.5,"2022":6.5,"2023":5.9,"2024":5.5}},
  {n:"Bolagsverket",s:"2004-07-01",sfs:"2004:368,2007:1110",d:"Klimat- och näringslivsdepartementet",en:"Swedish Companies Registration Office",sh:"BOLAGS",emp:605,fte:560,w:367,m:232,org:"202100-5489",tel:"0771670670",web:"www.bolagsverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":516.78,"2018":565.13,"2019":538.8,"2020":489.1,"2021":524.48,"2022":566.95,"2023":240.8,"2024":545.84}},
  {n:"Boverket",s:"1988-07-01",sfs:"1988:590,1996:124",d:"Landsbygds- och infrastrukturdepartementet",en:"National Board of Housing Building and Planning",sh:"BOV",emp:234,fte:214,w:147,m:92,org:"202100-3989",tel:"0455353000",web:"www.boverket.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSKRONA",str:"Enrådighet",cof:6,gd:true,fteH:{"2017":207.75,"2018":232.27,"2019":287.2,"2020":275.2,"2021":253.59,"2022":255.98,"2023":240.8,"2024":219.47}},
  {n:"Brottsförebyggande rådet",sfs:"1982:787,1988:1223",d:"Justitiedepartementet",en:"National council for crime prevention",sh:"BRA",emp:182,fte:160,w:117,m:59,org:"202100-0068",tel:"0852758400",web:"www.bra.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":105.94,"2018":127.33,"2019":127.2,"2020":137.6,"2021":143.18,"2022":141.56,"2023":146.7,"2024":154.5}},
  {n:"Brottsoffermyndigheten",s:"1994-07-01",sfs:"1994:572,2005:1032",d:"Justitiedepartementet",en:"Criminal Victim Compensation and Support Authority",sh:"BROM",emp:67,fte:58,w:42,m:18,org:"202100-3435",tel:"090708200",web:"www.brottsoffermyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"UMEÅ",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":53.95,"2018":56.05,"2019":56.9,"2020":53.7,"2021":55.63,"2022":52.56,"2023":54.6,"2024":58.5}},
  {n:"Centrala studiestödsnämnden",sfs:"1978:500,1988:502",d:"Utbildningsdepartementet",en:"National Board of Student Aid",sh:"CSN",emp:1260,fte:1129,w:801,m:417,org:"202100-1819",tel:"060186000",web:"www.csn.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":830.64,"2018":887.63,"2019":887.3,"2020":882.7,"2021":1000.32,"2022":1067.26,"2023":1171.9,"2024":1203.5}},
  {n:"De lokala värderingsnämnderna",s:"1988-12-01",sfs:"1988:1043,2007:858"},
  {n:"Diskrimineringsombudsmannen",s:"2009-01-01",sfs:"2008:1401",d:"Arbetsmarknadsdepartementet",en:"The Equality Ombudsman (Diskrimineringsombudsmannen, DO)",sh:"DO",emp:109,fte:90,w:77,m:21,org:"202100-6073",tel:"0812020700",web:"www.do.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":77.68,"2018":77.63,"2019":93.1,"2020":89.9,"2021":89.15,"2022":89.03,"2023":95.8,"2024":94.8}},
  {n:"Domarnämnden",s:"2008-07-01",sfs:"2008:427,2010:1793",d:"Justitiedepartementet",en:"Judicial Council",sh:"DN",emp:8,fte:7,w:8,org:"202100-6081",tel:"0856166950",web:"www.domstol.se/domarnamnden",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:3,gd:false,fteH:{"2017":5.9,"2018":6.9,"2019":4.9,"2020":5,"2021":7,"2022":7,"2023":7,"2024":8}},
  {n:"Domstolsverket",sfs:"1975:506,1988:317",d:"Justitiedepartementet",en:"National Courts Administration",sh:"DOM",emp:7474,fte:6413,w:4855,m:2061,org:"202100-2742",tel:"36155300",web:"www.domstol.se",grp:"Sveriges domstolar samt Domstolsverket",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":6393.79,"2018":6617.23,"2019":557.64,"2020":377.89,"2021":383.1897916666642,"2022":403.8234132905163,"2023":421.55,"2024":411.19601225847435}},
  {n:"E-hälsomyndigheten",s:"2014-01-01",sfs:"2013:1031",d:"Socialdepartementet",en:"the Swedish eHealth Agency",sh:"EHM",emp:403,fte:376,w:226,m:179,org:"202100-6552",tel:"0104586200",web:"www.ehalsomyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"KALMAR",str:"Styrelse",cof:7,gd:true,fteH:{"2017":120.73,"2018":185.9,"2019":254.3,"2020":267.2,"2021":300.84,"2022":329.39,"2023":399.2,"2024":349.25}},
  {n:"Ekobrottsmyndigheten",s:"1998-01-01",sfs:"1997:898,2007:972",d:"Justitiedepartementet",en:"Swedish Economic Crime Authority",sh:"EBM",emp:530,fte:495,w:298,m:196,org:"202100-4979",tel:"0105629000",web:"www.ekobrottsmyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":337.51,"2018":343.28,"2019":329.8,"2020":267.2,"2021":381.17,"2022":357.7,"2023":399.2,"2024":447.45}},
  {n:"Ekonomistyrningsverket",s:"1998-07-01",sfs:"1998:417,2003:884",d:"Finansdepartementet",en:"National Financial Management Authority",sh:"ESV",emp:150,fte:143,w:86,m:65,org:"202100-5026",tel:"086904300",web:"www.esv.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":154.61,"2018":145.92,"2019":134.3,"2020":134.8,"2021":138.32,"2022":154.36,"2023":152.7,"2024":147.67}},
  {n:"Elsäkerhetsverket",s:"1993-01-01",sfs:"1992:1139,2007:1121",d:"Klimat- och näringslivsdepartementet",en:"National Electrical Saftey Board",sh:"ELSAK",emp:55,fte:52,w:25,m:29,org:"202100-4466",tel:"0101680500",web:"www.elsakerhetsverket.se",grp:"Statliga förvaltningsmyndigheter",city:"KRISTINEHAMN",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":49.55,"2018":50.79,"2019":52.8,"2020":47.6,"2021":55.89,"2022":49.45,"2023":51.4,"2024":53.35}},
  {n:"Energimarknadsinspektionen",s:"2008-01-01",sfs:"2007:1118,2016:742",d:"Klimat- och näringslivsdepartementet",sh:"EMI",emp:226,fte:203,w:147,m:75,org:"202100-5695",tel:"016162700",web:"www.ei.se",grp:"Statliga förvaltningsmyndigheter",city:"ESKILSTUNA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":99.5,"2018":111.49,"2019":110.4,"2020":127.2,"2021":144.8,"2022":153.17,"2023":187.9,"2024":199.61}},
  {n:"Etikprövningsmyndigheten",s:"2019-01-01",sfs:"2018:1879",d:"Utbildningsdepartementet",sh:"EPM",emp:32,fte:28,w:25,m:7,org:"202100-6925",tel:"0104750800",web:"www.etikprovning.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Enrådighet",cof:1,gd:false,fteH:{"2019":27.6,"2020":27.8,"2021":23.01,"2022":19.8,"2023":26.8,"2024":30.35}},
  {n:"Exportkreditnämnden",s:"1983-07-01",sfs:"1983:536,1988:1225",d:"Utrikesdepartementet",en:"The Swedish Export Credit Agency",sh:"EKN",emp:174,fte:161,w:91,m:85,org:"202100-2098",tel:"087880000",web:"www.ekn.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:4,gd:true,fteH:{"2017":138.11,"2018":136.65,"2019":140,"2020":136.4,"2021":145.66,"2022":152.4,"2023":152.5,"2024":160.7}},
  {n:"Fastighetsmäklarinspektionen",s:"2009-07-01",sfs:"2009:606",d:"Finansdepartementet",en:"The Swedish Estate Agents Inspectorate",sh:"FMI",emp:28,fte:25,w:20,m:7,org:"202100-4870",tel:"0104900100",web:"www.fmi.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSTAD",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":15.4,"2018":17.72,"2019":21.7,"2020":20.9,"2021":26.44,"2022":28.71,"2023":27.1,"2024":26.25}},
  {n:"Fideikommissnämnden",s:"1984-07-01",sfs:"1984:479,1988:1117",d:"Justitiedepartementet",org:"202100-0043",tel:"087000800",web:"www.kammarkollegiet.se/om-oss/kammarkollegiets-uppgifter/kammarkollegiets-stod-till-andra-myndigheter/fideikommissnamnden",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:4,host:"Kammarkollegiet",gd:false,fteH:{"2017":0.6,"2018":0.25,"2019":0.25,"2020":0.35,"2021":0.35,"2022":0.25,"2023":0.25,"2024":0.25}},
  {n:"Finansinspektionen",s:"1991-07-01",sfs:"1991:937,1992:102",d:"Finansdepartementet",en:"The Swedish Financial Supervisory Authority",sh:"FI",emp:611,fte:602,w:350,m:296,org:"202100-4235",tel:"0840898000",web:"www.fi.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:4,gd:true,fteH:{"2017":397.36,"2018":460.9,"2019":488.7,"2020":536.3,"2021":516.05,"2022":495.68,"2023":550.6,"2024":619.17}},
  {n:"Finanspolitiska rådet",s:"2007-08-01",sfs:"2007:652,2007:760",d:"Finansdepartementet",en:"Swedish Fiscal Policy Council",sh:"FPR",emp:5,fte:4,w:1,m:4,org:"202100-5687",tel:"084535990",web:"www.fpr.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":3.8,"2018":5.5,"2019":4,"2020":6.8,"2021":5,"2022":4,"2023":5,"2024":4}},
  {n:"Folke Bernadotteakademin",s:"2002-09-30",sfs:"2002:710,2007:1218",d:"Utrikesdepartementet",en:"Folke Bernadotte Academy",sh:"FB",emp:278,fte:226,w:175,m:91,org:"202100-5380",tel:"0104562300",web:"www.fba.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:2,gd:true,fteH:{"2017":179.06,"2018":196.39,"2019":228.9,"2020":243.7,"2021":225.83,"2022":245.13,"2023":253.3,"2024":189.93}},
  {n:"Folkhälsomyndigheten",s:"2014-01-01",sfs:"2013:1020,2021:248",d:"Socialdepartementet",en:"Public Health Agency of Sweden",sh:"FOHM",emp:650,fte:557,w:473,m:163,org:"202100-6545",tel:"0102052000",web:"www.folkhalsomyndigheten.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:7,gd:true,fteH:{"2017":419.35,"2018":437,"2019":467.36,"2020":473.7,"2021":549.2,"2022":561.78,"2023":546.6,"2024":550.74}},
  {n:"Fondtorgsnämnden",s:"2022-06-20",sfs:"2022:764",d:"Socialdepartementet",org:"202100-7030",tel:"0104598500",web:"www.ftn.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:4,host:"Statens pensionsverk",gd:false,fteH:{"2023":15,"2024":30}},
  {n:"Forskarskattenämnden",s:"2008-01-01",sfs:"2007:786",d:"Finansdepartementet",org:"202100-5893",tel:"0105747957",web:"www.forskarskattenamnden.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:1,host:"Skatteverket",gd:false,fteH:{"2017":2,"2018":1.75,"2019":1.75,"2020":1.5,"2021":1.5,"2022":2,"2023":3.5,"2024":3.5}},
  {n:"Forskningsrådet för hälsa, arbetsliv och välfärd",s:"2008-01-01",sfs:"2007:1431",d:"Socialdepartementet",en:"Swedish Research Council for Health, Working life and Welfare",sh:"FORTE",emp:41,fte:34,w:27,m:10,org:"202100-5240",tel:"087754070",web:"www.forte.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:10,gd:true,fteH:{"2017":26.25,"2018":31.5,"2019":30.5,"2020":35.6,"2021":34,"2022":33.9,"2023":35.8,"2024":35.2}},
  {n:"Forskningsrådet för miljö, areella näringar och samhällsbyggande",s:"2001-01-01",sfs:"2000:1210,2006:931",d:"Klimat- och näringslivsdepartementet",en:"The Swedish Research Council for Environment, Agricultural Sciences and Spatial",sh:"FORMAS",emp:110,fte:102,w:76,m:31,str:"Enrådighet",cof:5,gd:true,fteH:{"2017":46.15,"2018":60.75,"2019":77.2,"2020":78.6,"2021":83.87,"2022":88.15,"2023":99,"2024":108.35}},
  {n:"Fortifikationsverket",s:"1994-07-01",sfs:"1994:643,1996:102",d:"Finansdepartementet",sh:"FORTV",emp:1103,fte:1046,w:288,m:827,org:"202100-4607",tel:"0104444000",web:"www.fortifikationsverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:2,gd:true,fteH:{"2017":555.26,"2018":588.15,"2019":631.6,"2020":668.7,"2021":775.03,"2022":838.38,"2023":927.4,"2024":1031.03}},
  {n:"Forum för levande historia",s:"2008-01-01",sfs:"2007:1197",d:"Kulturdepartementet",sh:"LEHIST",emp:51,fte:43,w:40,m:13,org:"202100-5356",tel:"087238750",web:"www.levandehistoria.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":33.51,"2018":31.27,"2019":34.4,"2020":35.7,"2021":42.66,"2022":42.96,"2023":45.1,"2024":45.22}},
  {n:"Försvarets materielverk",s:"1994-07-01",sfs:"1994:644,1996:103",d:"Försvarsdepartementet",en:"Defence Materiel Administration",sh:"FMV",emp:2801,fte:2677,w:988,m:1872,org:"202100-0340",tel:"087824000",web:"www.fmv.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:2,gd:true,fteH:{"2017":3328.39,"2018":3477,"2019":1627.2,"2020":1666.2,"2021":1911.69,"2022":2044.07,"2023":2270.7,"2024":2586.54}},
  {n:"Försvarets radioanstalt",s:"1994-07-01",sfs:"1994:714,2007:937",d:"Försvarsdepartementet",en:"National Defence Radio Establishment",sh:"FRA",emp:649,fte:591,org:"202100-0365",tel:"0105574600",web:"www.fra.se",grp:"Statliga förvaltningsmyndigheter",city:"BROMMA",str:"Enrådighet",cof:2,gd:true,},
  {n:"Försvarsmakten",s:"1994-07-01",sfs:"1994:642,2000:555",d:"Försvarsdepartementet",en:"Swedish Armed Forces",sh:"FM",emp:27048,fte:26188,w:6892,m:21685,org:"202100-4615",tel:"087887500",web:"www.forsvarsmakten.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:2,gd:true,fteH:{"2017":17464.1,"2018":17466.35,"2019":20205,"2020":21192.9,"2021":22091.23,"2022":22227.3,"2023":23108.2,"2024":24535.66}},
  {n:"Försvarsunderrättelsedomstolen",s:"2009-12-01",sfs:"2009:968",d:"Försvarsdepartementet",sh:"FUD",emp:3,fte:4,w:2,m:2,org:"202100-6313",tel:"855504500",web:"www.undom.se",grp:"Sveriges domstolar samt Domstolsverket",city:"KISTA",str:"Domstol",cof:2,gd:false,fteH:{"2017":4,"2018":4,"2019":4,"2020":4.1,"2021":4,"2022":3,"2023":4,"2024":4}},
  {n:"Försäkringskassan",s:"2005-01-01",sfs:"2004:1299,2007:1235",d:"Socialdepartementet",sh:"FK",emp:13098,fte:11334,w:9370,m:3287,org:"202100-5521",tel:"087869000",web:"www.forsakringskassan.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:10,gd:true,fteH:{"2017":12381.73,"2018":11945.13,"2019":12343.3,"2020":12439.2,"2021":12224.62,"2022":12437.9,"2023":12487.1,"2024":11624.58}},
  {n:"Gentekniknämnden",s:"1994-07-01",sfs:"1994:902,2007:1075",d:"Justitiedepartementet",en:"Swedish Gene Tecknology Advisory Board",sh:"GTN",emp:3,fte:2,w:3,org:"202100-4813",tel:"08271254",web:"www.genteknik.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:3,host:"Vetenskapsrådet",gd:false,fteH:{"2017":3.6,"2018":2.6,"2019":3.4,"2020":3.4,"2021":3.4,"2022":2,"2023":2,"2024":2}},
  {n:"Granskningsnämnden för försvarsuppfinningar",sfs:"1971:1080,1988:345",d:"Försvarsdepartementet",org:"202100-6859",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:2,host:"Patent- och registreringsverket",gd:false,fteH:{"2018":0.1,"2019":0.1,"2020":0.1,"2021":0.1,"2022":0.1,"2023":0.1,"2024":0.1}},
  {n:"Handelssekreterare",sfs:"1975:492,1988:1093"},
  {n:"Harpsundsnämnden",s:"1990-02-01",sfs:"1989:1073,1999:241",d:"Statsrådsberedningen",org:"202100-4250",tel:"015760003",web:"www.harpsund.se",grp:"Statliga förvaltningsmyndigheter",city:"MELLÖSA",str:"Nämnd",cof:4,gd:false,fteH:{"2017":9.1,"2018":10.5,"2019":10.5,"2020":11,"2021":11,"2022":11,"2023":10,"2024":10}},
  {n:"Havs- och vattenmyndigheten",s:"2011-07-01",sfs:"2011:619",d:"Klimat- och näringslivsdepartementet",en:"Swedish Agency for Marine and Water Management",sh:"HaV",emp:317,fte:297,w:175,m:140,org:"202100-6420",tel:"0106986000",web:"www.havochvatten.se",grp:"Statliga förvaltningsmyndigheter",city:"GÖTEBORG",str:"Enrådighet",cof:5,gd:true,fteH:{"2017":237.67,"2018":253.98,"2019":279.7,"2020":296.1,"2021":293.82,"2022":305.32,"2023":316.83,"2024":312.35}},
  {n:"Hälso- och sjukvårdens ansvarsnämnd",sfs:"1980:497,1988:1240",d:"Socialdepartementet",en:"Medical Responsability Board",sh:"HSAN",emp:33,fte:34,w:28,m:11,str:"Nämnd",cof:7,host:"Socialstyrelsen",gd:false,fteH:{"2017":4.3,"2018":4.3,"2019":4.3,"2020":5,"2021":5,"2022":6,"2023":7,"2024":8}},
  {n:"Högskolans avskiljandenämnd",s:"2008-01-01",sfs:"2007:990",d:"Utbildningsdepartementet",org:"202100-6867",tel:"0856308700",web:"www.han.se",grp:"Statliga förvaltningsmyndigheter",city:"JOHANNESHOV",str:"Nämnd",cof:9,host:"Universitetkanslerämbetet",gd:false,fteH:{"2017":0.1,"2018":0.1,"2019":0.1,"2020":0.1,"2021":0.1,"2022":0.15,"2023":0.1,"2024":0.1}},
  {n:"Högsta domstolen",sfs:"1979:567,1996:377",d:"Justitiedepartementet",org:"202100-2742",tel:"856166600",web:"www.hogstadomstolen.se",grp:"Sveriges domstolar samt Domstolsverket",city:"STOCKHOLM",str:"Domstol",cof:3,gd:false,fteH:{"2019":87.3598,"2020":77.06,"2021":82.48630952380957,"2022":79.344665,"2023":92.96156694664027,"2024":92.8558780090317}},
  {n:"Högsta förvaltningsdomstolen",s:"1996-07-01",sfs:"1996:378",d:"Justitiedepartementet",org:"202100-2742",tel:"856167600",web:"www.hogstaforvaltningsdomstolen.se",grp:"Sveriges domstolar samt Domstolsverket",city:"STOCKHOLM",str:"Domstol",cof:3,gd:false,fteH:{"2019":75.3344,"2020":75.9957,"2021":76.48244047619049,"2022":76.80583003952563,"2023":77.72233201581024,"2024":77.86950696027806}},
  {n:"ILO-kommittén",s:"1978-01-01",sfs:"1977:987",org:"202100-5877",tel:"084051000",web:"www.svenskailo-kommitten.se",grp:"Statliga förvaltningsmyndigheter"},
  {n:"Inspektionen för arbetslöshetsförsäkringen",s:"2004-01-01",sfs:"2003:1108,2007:906",d:"Arbetsmarknadsdepartementet",en:"Swedish Unemployment Insurance Board",sh:"IAF",emp:73,fte:64,w:46,m:20,str:"Enrådighet",cof:10,gd:true,fteH:{"2017":55.15,"2018":60.12,"2019":69.1,"2020":65.4,"2021":69.86,"2022":67.25,"2023":66.05,"2024":68.05}},
  {n:"Inspektionen för socialförsäkringen",s:"2009-07-01",sfs:"2009:602",d:"Socialdepartementet",en:"The Swedish Social Insurance Inspectorate",sh:"ISF",emp:55,fte:47,w:35,m:18,org:"202100-6248",tel:"0101741500",web:"www.isf.se",grp:"Statliga förvaltningsmyndigheter",city:"GÖTEBORG",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":47.23,"2018":51.71,"2019":38.8,"2020":40.5,"2021":43.8,"2022":45.3,"2023":46.4,"2024":47.1}},
  {n:"Inspektionen för strategiska produkter",s:"1996-02-01",sfs:"1995:1680,2005:1177",d:"Utrikesdepartementet",en:"Inspectorate of Strategic Products",sh:"ISP",emp:91,fte:81,w:49,m:37,org:"202100-4912",tel:"0851789065",web:"www.isp.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:2,gd:true,fteH:{"2017":28,"2018":32.8,"2019":34.4,"2020":39.2,"2021":42.53,"2022":43,"2023":51,"2024":74}},
  {n:"Inspektionen för vård och omsorg",s:"2013-06-01",sfs:"2013:176",d:"Socialdepartementet",en:"Health and Social Care Inspectorate",sh:"IVO",emp:788,fte:706,w:602,m:153,org:"202100-6537",tel:"0107885000",web:"www.ivo.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:7,gd:true,fteH:{"2017":566.29,"2018":687.22,"2019":649.22,"2020":699.9,"2021":721.58,"2022":689.47,"2023":733.06,"2024":741.7}},
  {n:"Institutet för arbetsmarknads- och utbildningspolitisk utvärdering",s:"2008-01-01",sfs:"2007:911",d:"Arbetsmarknadsdepartementet",en:"Institute for Labour Market Policy Evaluation - IFAU",sh:"IFAU",emp:47,fte:39,w:22,m:25,str:"Enrådighet",cof:4,gd:true,fteH:{"2017":34.86,"2018":42.16,"2019":41.6,"2020":36.9,"2021":36.82,"2022":37.2,"2023":39.25,"2024":39.6}},
  {n:"Institutet för mänskliga rättigheter",s:"2022-01-01",sfs:"2021:1198",d:"Arbetsmarknadsdepartementet",en:"Institute for human rights",sh:"IMR",emp:34,fte:31,w:29,m:8,org:"202100-7022",tel:"0462873900",web:"www.mrinstitutet.se",grp:"Statliga förvaltningsmyndigheter",city:"LUND",str:"Styrelse",cof:10,gd:false,fteH:{"2022":7,"2023":18.38,"2024":29}},
  {n:"Institutet för rymdfysik",s:"1987-07-01",sfs:"1987:500,1988:1200",d:"Utbildningsdepartementet",en:"Swedish Institute of Space Physics",sh:"IRF",emp:108,fte:103,w:30,m:78,org:"202100-3567",tel:"098079000",web:"www.irf.se",grp:"Statliga förvaltningsmyndigheter",city:"KIRUNA",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":88.75,"2018":104.82,"2019":100.1,"2020":93.7,"2021":103.35,"2022":104.21,"2023":100.61,"2024":102.22}},
  {n:"Institutet för språk och folkminnen",s:"2006-07-01",sfs:"2006:888,2007:1181",d:"Kulturdepartementet",en:"Institute for Language and Folklore",sh:"ISOF",emp:97,fte:97,w:71,m:34,org:"202100-1082",tel:"0200283333",web:"www.isof.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":78.46,"2018":79.64,"2019":73,"2020":79.2,"2021":82.22,"2022":78.47,"2023":95.89,"2024":97.75}},
  {n:"Integritetsskyddsmyndigheten",s:"2008-01-01",sfs:"2007:975",d:"Justitiedepartementet",sh:"IMY",emp:142,fte:125,w:107,m:33,org:"202100-0050",tel:"086576100",web:"www.imy.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":52.5,"2018":50.7,"2019":80.3,"2020":82,"2021":84.6,"2022":104.45,"2023":105.95,"2024":113.55}},
  {n:"Justitiekanslern",sfs:"1975:1345",d:"Justitiedepartementet",en:"Office of the Chancellor of Justice",sh:"JK",emp:55,fte:48,w:36,m:16,org:"202100-0035",tel:"0104759300",web:"www.jk.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":33.8,"2018":41.66,"2019":44.4,"2020":37.4,"2021":41.4,"2022":45,"2023":47.44,"2024":47.66}},
  {n:"Jämställdhetsmyndigheten",s:"2018-01-01",sfs:"2017:937",d:"Arbetsmarknadsdepartementet",en:"Swedish Gender Equality Agency",sh:"JäMy",emp:137,fte:121,w:112,m:21,org:"202100-6693",tel:"0313929125",web:"www.jamstalldhetsmyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"GÖTEBORG",str:"Enrådighet",cof:4,gd:true,fteH:{"2018":46.6,"2019":58.9,"2020":66.2,"2021":83.77,"2022":99.9,"2023":116.5,"2024":127.25}},
  {n:"Kammarkollegiet",s:"1986-07-01",sfs:"1986:600,1988:913",d:"Finansdepartementet",en:"Kammarkollegiet",sh:"KAMK",emp:356,fte:332,w:248,m:119,org:"202100-0829",tel:"087000800",web:"www.kammarkollegiet.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":207.93,"2018":227.54999999999998,"2019":244.2,"2020":244.8,"2021":289.53,"2022":261.04,"2023":326.93,"2024":339.28}},
  {n:"Kemikalieinspektionen",s:"1986-01-01",sfs:"1985:843,1988:525",d:"Klimat- och näringslivsdepartementet",en:"National Chemicals Inspectorare",sh:"KEMI",emp:283,fte:262,w:195,m:79,org:"202100-3880",tel:"0851941100",web:"www.kemi.se",grp:"Statliga förvaltningsmyndigheter",city:"SUNDBYBERG",str:"Enrådighet",cof:5,gd:true,fteH:{"2017":245.86,"2018":249.36,"2019":245,"2020":243.8,"2021":255.68,"2022":250.71,"2023":256.87,"2024":279.68}},
  {n:"Klimatpolitiska rådet",s:"2018-01-01",sfs:"2017:1268",d:"Klimat- och näringslivsdepartementet",org:"202100-6719",tel:"087754170",web:"www.klimatpolitiskaradet.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:5,host:"Formas",gd:false,fteH:{"2019":3,"2020":4,"2021":4,"2022":4,"2023":5,"2024":4.75}},
  {n:"Kommerskollegium",s:"1985-07-01",sfs:"1985:604,1988:570",d:"Utrikesdepartementet",en:"National Board of Trade Sweden",sh:"KOMK",emp:92,fte:84,w:60,m:35,org:"202100-2007",tel:"086904800",web:"www.kommerskollegium.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":80.2,"2018":84.85,"2019":85.1,"2020":81.7,"2021":86.1,"2022":85.4,"2023":75.3,"2024":83}},
  {n:"Konjunkturinstitutet",sfs:"1979:742,1988:1531",d:"Finansdepartementet",en:"National Institute of Economic Research",sh:"KONJ",emp:58,fte:50,w:15,m:40,org:"202100-0845",tel:"084535900",web:"www.konj.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":51.01,"2018":51.21,"2019":49.9,"2020":46.2,"2021":48.53,"2022":47.29,"2023":50,"2024":53.1}},
  {n:"Konkurrensverket",s:"1992-07-01",sfs:"1992:820,1996:353",d:"Klimat- och näringslivsdepartementet",en:"Swedish Competition Authority",sh:"KKV",emp:207,fte:172,w:107,m:81,org:"202100-4342",tel:"087001600",web:"www.konkurrensverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":140.65,"2018":130.26,"2019":138.9,"2020":151.9,"2021":146.88,"2022":156.11,"2023":162.4,"2024":164.16}},
  {n:"Konstnärsnämnden",sfs:"1976:531,1988:831",d:"Kulturdepartementet",en:"The Arts Grants Committee",sh:"KN",emp:37,fte:33,w:22,m:13,org:"202100-3252",tel:"0850655000",web:"www.konstnarsnamnden.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:8,gd:true,fteH:{"2017":27.05,"2018":26,"2019":29.8,"2020":30.1,"2021":37.03,"2022":36.4,"2023":34.7,"2024":35.15}},
  {n:"Konsumentverket",s:"1986-07-01",sfs:"1986:629,1988:61",d:"Finansdepartementet",en:"Swedish Consumer Agency",sh:"KOV",emp:192,fte:172,w:135,m:53,org:"202100-2064",tel:"0771423300",web:"www.konsumentverket.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSTAD",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":160.1,"2018":173.56,"2019":178.6,"2020":174.4,"2021":184.51,"2022":168.15,"2023":149.38,"2024":173.75}},
  {n:"Krigsförsäkringsnämnden",s:"2000-01-01",sfs:"1999:1352,2007:842",d:"Finansdepartementet",org:"202100-5810",tel:"087878000",web:"http://www.regeringen.se/myndigheter-med-flera/krigsforsakringsnamnden/",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:2,host:"Finansinspektionen",gd:false,fteH:{"2018":0.3,"2019":0.3,"2020":0.5,"2021":0.5,"2022":0.2,"2023":0.1,"2024":0.1}},
  {n:"Kriminalvården",s:"2006-01-01",sfs:"2005:985,2007:1172",d:"Justitiedepartementet",en:"Swedish Prison and Probation Service",sh:"KVV",emp:19354,fte:15931,w:9288,m:9187,org:"202100-0225",tel:"0772280800",web:"www.kriminalvarden.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":9511.82,"2018":9817.66,"2019":9817.6,"2020":9810,"2021":10633.89,"2022":11743.8,"2023":13447.22,"2024":15328.39}},
  {n:"Kronofogdemyndigheten",s:"2006-07-01",sfs:"2006:883,2007:781",d:"Finansdepartementet",en:"Swedish Enforcement Authority",sh:"KFM",emp:2170,fte:1950,w:1411,m:700,org:"202100-5646",tel:"0771737300",web:"www.kronofogden.se",grp:"Statliga förvaltningsmyndigheter",city:"SUNDBYBERG",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":2106.31,"2018":1996.68,"2019":2143.5,"2020":1976.1,"2021":2091.25,"2022":2024.07,"2023":2039.29,"2024":2016.28}},
  {n:"Kungl. biblioteket",sfs:"1979:480,1988:678",d:"Utbildningsdepartementet",en:"National Library of Sweden",sh:"KB",emp:342,fte:312},
  {n:"Kustbevakningen",s:"1988-07-01",sfs:"1988:256,2005:742",d:"Försvarsdepartementet",en:"Swedish Coast Guard",sh:"KBV",emp:967,fte:909,w:259,m:711,org:"202100-3997",tel:"0776707000",web:"www.kustbevakningen.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSKRONA",str:"Enrådighet",cof:2,gd:true,fteH:{"2017":754.41,"2018":771.07,"2019":783.4,"2020":792.9,"2021":812.1,"2022":811.31,"2023":837.71,"2024":895.79}},
  {n:"Kärnavfallsfonden",s:"2008-01-01",sfs:"2007:1055",d:"Klimat- och näringslivsdepartementet",en:"The Swedish Nuclear Waste Fund",sh:"KAFS",org:"202100-4904",tel:"087000800",web:"www.karnavfallsfonden.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:4,host:"Kammarkollegiet",gd:false,fteH:{"2017":3.2,"2018":3.5,"2019":3.5,"2020":4.6,"2021":4.6,"2022":6.2,"2023":6.2,"2024":6.2}},
  {n:"Lantmäteriet",s:"2008-09-01",sfs:"2008:694,2009:946",d:"Landsbygds- och infrastrukturdepartementet",en:"Central Office of the National Land Survey",sh:"LM",emp:2153,fte:2010,w:1267,m:878,org:"202100-4888",tel:"0771636363",web:"www.lantmateriet.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":1871.35,"2018":1981.15,"2019":2023.4,"2020":2067.3,"2021":2065.99,"2022":1994.07,"2023":1946.7,"2024":1952.27}},
  {n:"Livsmedelsverket",s:"2002-02-01",sfs:"2001:1259,2007:1043",d:"Landsbygds- och infrastrukturdepartementet",en:"National Food Agency",sh:"SLV",emp:686,fte:630,w:432,m:261,org:"202100-1850",tel:"018175500",web:"www.livsmedelsverket.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":546.76,"2018":548.96,"2019":600.6,"2020":583.6,"2021":554.44,"2022":576.11,"2023":613.95,"2024":620.69}},
  {n:"Lokala säkerhetsnämnder vid kärntekniska anläggningar",sfs:"1981:10,1988:810"},
  {n:"Luftfartsverket",s:"1986-05-01",sfs:"1986:128,1988:78",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish Airports and Air Navigation Services",sh:"LFV",emp:1173,fte:1101,w:466,m:675,org:"202100-0795",tel:"11192000",web:"www.lfv.se",grp:"Statliga affärsverk",str:"Styrelse",cof:4,gd:true,fteH:{"2017":1111,"2018":1090.38,"2019":1099.1,"2020":1095.7,"2021":1060.73,"2022":1082.18,"2023":1116.02,"2024":1135.19}},
  {n:"Läkemedelsverket",s:"1990-07-01",sfs:"1990:434,1996:611",d:"Socialdepartementet",en:"Swedish Medical Products Agency",sh:"LV",emp:997,fte:912,w:693,m:321,org:"202100-4078",tel:"018174600",web:"www.lakemedelsverket.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Styrelse",cof:7,gd:true,fteH:{"2017":748.03,"2018":758.67,"2019":813.1,"2020":806.9,"2021":816.41,"2022":859.38,"2023":901.72,"2024":939.67}},
  {n:"Mediemyndigheten",s:"2024-01-01",sfs:"2023:844",d:"Kulturdepartementet",en:"The Swedish Press and Broadcasting Authority",sh:"MEMY",emp:66,fte:57,w:42,m:19,org:"202100-6347",tel:"0858007000",web:"www.mediemyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2024":59.95}},
  {n:"Medlingsinstitutet",s:"2000-06-01",sfs:"2000:258,2007:912",d:"Arbetsmarknadsdepartementet",en:"Swedish National Mediation Office",sh:"MI",emp:12,fte:12,w:6,m:7,org:"202100-5174",tel:"0854529240",web:"www.mi.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":8.88,"2018":9.88,"2019":9,"2020":9,"2021":12.12,"2022":10,"2023":11,"2024":13}},
  {n:"Migrationsverket",s:"1988-07-01",sfs:"1988:429,2004:294",d:"Justitiedepartementet",en:"Swedish Migration Board",sh:"MIGR",emp:5972,fte:5114,w:3482,m:2236,org:"202100-2163",tel:"0771235235",web:"www.migrationsverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":7326.96,"2018":6571.31,"2019":5193.1,"2020":5106.6,"2021":4539.41,"2022":4489.9,"2023":5114.99,"2024":5080.57}},
  {n:"Moderna museet",s:"1999-07-01",sfs:"1999:563,2007:1177",d:"Kulturdepartementet",en:"Modern Museum",sh:"MM",emp:164,fte:127,w:135,m:67,org:"202100-5091",tel:"0852023500",web:"www.modernamuseet.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":124.23,"2018":125.82,"2019":120.3,"2020":129.6,"2021":113.08,"2022":125.71,"2023":125.41,"2024":127.78}},
  {n:"Myndigheten för arbetsmiljökunskap",s:"2018-06-01",sfs:"2018:254",d:"Arbetsmarknadsdepartementet",en:"?",sh:"Mynak",emp:26,fte:24,w:16,m:9,org:"202100-6875",tel:"026148400",web:"www.mynak.se",grp:"Statliga förvaltningsmyndigheter",city:"GÄVLE",str:"Enrådighet",cof:4,gd:true,fteH:{"2019":15.5,"2020":13.5,"2021":16.26,"2022":19.45,"2023":21.95,"2024":25.2}},
  {n:"Myndigheten för delaktighet",s:"2014-05-01",sfs:"2014:134,2024:78",d:"Socialdepartementet",sh:"MFD",emp:50,fte:46,w:41,m:12,org:"202100-5588",tel:"086008400",web:"www.mfd.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":55.83,"2018":49.3,"2019":44.9,"2020":44.6,"2021":41.4,"2022":33.6,"2023":35.75,"2024":39.75}},
  {n:"Myndigheten för digital förvaltning",s:"2018-09-01",sfs:"2018:1486",d:"Finansdepartementet",en:"Agency for Digital Government",sh:"Digg",emp:152,fte:135,w:97,m:65,org:"202100-6883",tel:"0771114400",web:"www.digg.se",grp:"Statliga förvaltningsmyndigheter",city:"SUNDSVALL",str:"Enrådighet",cof:1,gd:true,fteH:{"2019":40.5,"2020":50.9,"2021":76.7,"2022":104.6,"2023":115.79,"2024":129.5}},
  {n:"Myndigheten för familjerätt och föräldraskapsstöd",s:"2008-01-01",sfs:"2007:1020,2017:292",d:"Socialdepartementet",en:"Family Law and Parental Support Authority",sh:"MFF",emp:42,fte:39,w:35,m:8,org:"202100-4169",tel:"0101901100",web:"www.mfof.se",grp:"Statliga förvaltningsmyndigheter",city:"SKELLEFTEÅ",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":14.6,"2018":13.5,"2019":13.7,"2020":19.3,"2021":24.9,"2022":34.45,"2023":35.05,"2024":39.55}},
  {n:"Myndigheten för kulturanalys",s:"2011-04-01",sfs:"2011:124",d:"Kulturdepartementet",en:"Swedish agency for cultural policy analysis",sh:"MKA",emp:15,fte:12,w:9,m:6,org:"202100-6404",tel:"0313952000",web:"www.kulturanalys.se",grp:"Statliga förvaltningsmyndigheter",city:"GÖTEBORG",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":9.8,"2018":10.5,"2019":13,"2020":11.1,"2021":12.73,"2022":13.4,"2023":12.7,"2024":13.4}},
  {n:"Myndigheten för press, radio och tv",s:"2010-08-01",sfs:"2010:1062,2020:879"},
  {n:"Myndigheten för psykologiskt försvar",s:"2022-01-01",sfs:"2021:936",d:"Försvarsdepartementet",en:"Swedish Psychological Defence Agency",sh:"MPF",emp:69,fte:61,w:31,m:41,org:"202100-7014",tel:"0101837000",web:"www.mpf.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSTAD",str:"Enrådighet",cof:2,gd:true,fteH:{"2022":35.8,"2023":48.63,"2024":54.5}},
  {n:"Myndigheten för samhällsskydd och beredskap",s:"2009-01-01",sfs:"2008:1002",d:"Försvarsdepartementet",en:"Swedish Civil Contingencies Agency",sh:"MSB",emp:1378,fte:1281,w:717,m:711,org:"202100-5984",tel:"0771240240",web:"www.msb.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:2,gd:true,fteH:{"2017":942.12,"2018":1027.63,"2019":1037.8,"2020":1183.3,"2021":1224.41,"2022":1086.31,"2023":1131.55,"2024":1190.22}},
  {n:"Myndigheten för stöd till trossamfund",s:"2017-07-01",sfs:"2017:104",d:"Socialdepartementet",en:"Commission for state grants to religious communities",sh:"SST",emp:17,fte:16,w:12,m:5,org:"202100-5141",tel:"084536870",web:"www.myndighetensst.se",grp:"Statliga förvaltningsmyndigheter",city:"BROMMA",str:"Enrådighet",cof:8,gd:false,fteH:{"2017":8.2,"2018":8.95,"2019":9.5,"2020":8.7,"2021":11.19,"2022":10.18,"2023":12.47,"2024":16.8}},
  {n:"Myndigheten för tillgängliga medier",s:"2010-08-01",sfs:"2010:769",d:"Kulturdepartementet",en:"Swedish Agency for Accessible Media",sh:"MTM",emp:88,fte:80,w:50,m:38,org:"202100-3591",tel:"0406532700",web:"www.mtm.se",grp:"Statliga förvaltningsmyndigheter",city:"Malmö",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":97.94,"2018":97.67,"2019":75.2,"2020":66.2,"2021":74.75,"2022":76.5,"2023":80.85,"2024":81.65}},
  {n:"Myndigheten för tillväxtpolitiska utvärderingar och analyser",s:"2009-04-01",sfs:"2009:146,2016:1048",d:"Klimat- och näringslivsdepartementet",en:"Growth Analysis",sh:"MTUA",emp:51,fte:44,w:17,m:31,org:"202100-6164",tel:"0104474400",web:"www.tillvaxtanalys.se",grp:"Statliga förvaltningsmyndigheter",city:"ÖSTERSUND",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":36.75,"2018":35,"2019":39.5,"2020":38.7,"2021":38.8,"2022":40.6,"2023":43.44,"2024":44.35}},
  {n:"Myndigheten för totalförsvarsanalys",s:"2023-01-01",sfs:"2022:1768",d:"Försvarsdepartementet",en:"Swedish Agency for Defence Analysis",sh:"MTFA",emp:28,fte:26,w:10,m:19,org:"202100-7055",tel:"0101605100",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:2,gd:true,fteH:{"2023":4,"2024":24}},
  {n:"Myndigheten för ungdoms- och civilsamhällesfrågor",s:"2008-01-01",sfs:"2007:1140,2015:49",d:"Socialdepartementet",en:"Swedish Agency for Youth and Civil Society",sh:"MUCF",emp:135,fte:131,w:101,m:34,str:"Enrådighet",cof:8,gd:true,fteH:{"2017":73.25,"2018":67.27,"2019":79.7,"2020":79.2,"2021":84.9,"2022":93.74,"2023":96.95,"2024":115.47}},
  {n:"Myndigheten för vård- och omsorgsanalys",s:"2011-01-01",sfs:"2010:1385",d:"Socialdepartementet",sh:"MVOA",emp:49,fte:41,w:37,m:9,org:"202100-6412",tel:"086904100",web:"www.vardanalys.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:7,gd:true,fteH:{"2017":36.4,"2018":40.77,"2019":41.3,"2020":41.1,"2021":41.83,"2022":42.28,"2023":40.43,"2024":41.8}},
  {n:"Myndigheten för yrkeshögskolan",s:"2009-07-01",sfs:"2009:279,2011:1162",d:"Utbildningsdepartementet",en:"Swedish National Agency for Higher Vocational Education",sh:"MYH",emp:139,fte:130,w:98,m:47,org:"202100-6230",tel:"0102090100",web:"www.myh.se",grp:"Statliga förvaltningsmyndigheter",city:"VÄSTERÅS",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":88.57,"2018":95.54,"2019":106,"2020":107.7,"2021":121.96,"2022":126.74,"2023":134.26,"2024":128.25}},
  {n:"Nationalmuseum",s:"2008-01-01",sfs:"2007:1175",d:"Kulturdepartementet",en:"National Museum of Fine Arts",sh:"NM",emp:159,fte:129,w:113,m:63,org:"202100-1108",tel:"0851954300",web:"www.nationalmuseum.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":135.73,"2018":116.53,"2019":152.8,"2020":131.3,"2021":119.2,"2022":121.29,"2023":132.55,"2024":130.51}},
  {n:"Naturhistoriska riksmuseet",sfs:"1966:264,1987:582",d:"Kulturdepartementet",en:"Swedish Museum of Natural History",sh:"NRM",emp:259,fte:225,w:148,m:111,org:"202100-1124",tel:"0851954000",web:"www.nrm.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":229.94,"2018":231.93,"2019":228.2,"2020":223.5,"2021":210.44,"2022":210.94,"2023":226.15,"2024":224.45}},
  {n:"Naturvårdsverket",s:"1988-07-01",sfs:"1988:518,2001:1096",d:"Klimat- och näringslivsdepartementet",en:"Swedish environmental protection agency",sh:"NV",emp:767,fte:655,w:476,m:237,org:"202100-1975",tel:"0106981000",web:"www.naturvardsverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:5,gd:true,fteH:{"2017":483.02,"2018":500.72,"2019":562.9,"2020":576.8,"2021":643.35,"2022":685.05,"2023":757.41,"2024":688.25}},
  {n:"Nordiska Afrikainstitutet",s:"1996-01-01",sfs:"1995:1352,2007:1222",d:"Utrikesdepartementet",en:"Nordic Africa Institute",sh:"NAI",emp:42,fte:36,org:"202100-2726",tel:"0184715200",web:"www.nai.uu.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA"},
  {n:"Notarienämnden",s:"2008-01-01",sfs:"2007:1076",d:"Justitiedepartementet",org:"202100-6032",tel:"036156800",web:"www.domstol.se/Om-Sveriges-Domstolar/Notarienamnden",grp:"Statliga förvaltningsmyndigheter",city:"JÖNKÖPING",str:"Nämnd",cof:3,host:"Domstolsverket/Kammarrätten i Jönköping",gd:false,fteH:{"2017":0.1,"2018":0.15,"2019":0.15,"2020":0.15,"2021":0.15,"2022":0.15,"2023":0.2,"2024":0.2}},
  {n:"Nämnden för hemslöjdsfrågor",sfs:"1981:500,1988:315",d:"Kulturdepartementet",w:3,org:"202100-4144",tel:"086819353",web:"www.nfh.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:8,host:"Tillväxtverket",gd:false,fteH:{"2017":4.5,"2018":3.03,"2019":3.03,"2020":3,"2021":3,"2022":2.8,"2023":2.8,"2024":2.8}},
  {n:"Nämnden för lön till riksdagens ombudsmän och riksrevisorn",s:"2013-01-01",sfs:"2012:882"},
  {n:"Nämnden för prövning av oredlighet i forskning",s:"2020-01-01",sfs:"2019:1152",d:"Utbildningsdepartementet",en:"National Board for Assessment of Research Misconduct",sh:"NPO",org:"202100-6933",tel:"0104573320",web:"https://npof.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Nämnd",cof:1,host:"Etikprövningsmyndigheten",gd:false,fteH:{"2020":1,"2021":1,"2022":4,"2023":5,"2024":6}},
  {n:"Nämnden för prövning av statsråds och vissa andra befattningshavares övergångsrestriktioner",s:"2018-07-01",sfs:"2018:677"},
  {n:"Nämnden för styrelserepresentationsfrågor",sfs:"1976:465,2007:909",d:"Arbetsmarknadsdepartementet",org:"202100-5786",tel:"084051000",web:"www.regeringen.se/myndigheter-med-flera/namnden-for-styrelserepresentationsfragor",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:4,host:"RK/A",gd:false,fteH:{"2017":0.15,"2018":0.15,"2019":0.15}},
  {n:"Nämnden mot diskriminering",s:"1999-05-01",sfs:"1999:171,2007:1032",d:"Arbetsmarknadsdepartementet",org:"202100-6206",tel:"0856166668",web:"www.namndenmotdiskriminering.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:4,host:"Kammarkollegiet",gd:false},
  {n:"Oljekrisnämnden",sfs:"1978:600,1988:519",d:"Klimat- och näringslivsdepartementet",org:"202100-6776",web:"www.regeringen.se/myndigheter-med-flera/oljekrisnamnden",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:2,host:"RK/M",gd:false,fteH:{"2017":0.025,"2018":0.025,"2019":0.025,"2020":0.025,"2021":0.025,"2022":0.025,"2023":0.025,"2024":0.025}},
  {n:"Partibidragsnämnden",s:"2013-07-01",sfs:"2013:353"},
  {n:"Patent- och registreringsverket",s:"1987-02-01",sfs:"1987:7,1988:403",d:"Klimat- och näringslivsdepartementet",en:"SWEDISH PATENT AND REGISTRATION OFFICE",sh:"PRV",emp:298,fte:278,w:143,m:144,org:"202100-2072",tel:"087822800",web:"www.prv.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":314.34,"2018":319.06,"2019":337.5,"2020":308.9,"2021":305.01,"2022":317.92,"2023":299.24,"2024":292.45}},
  {n:"Patentombudsnämnden",s:"2010-09-01",sfs:"2010:1054",d:"Näringsdepartementet",sh:"PO",org:"202100-6370",tel:"0771670670",web:"www.bolagsverket.se/om/oss/fler/patentombud",grp:"Statliga förvaltningsmyndigheter",city:"SUNDSVALL",str:"Nämnd",cof:4,host:"Bolagsverket",gd:false,fteH:{"2018":0.6,"2019":0.6,"2020":0.8,"2021":0.8,"2022":0.5,"2023":0.5,"2024":0.5}},
  {n:"Pensionsmyndigheten",s:"2010-01-01",sfs:"2009:1173",d:"Socialdepartementet",en:"Swedish Pensions Agency",sh:"PM",emp:1652,fte:1541,w:1067,m:567,org:"202100-6255",tel:"0771771771",web:"www.pensionsmyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:10,gd:true,fteH:{"2017":1027.31,"2018":1067.74,"2019":1043.5,"2020":1333.3,"2021":1485.78,"2022":1386.754,"2023":1578.3,"2024":1497.42}},
  {n:"Polarforskningssekretariatet",s:"1987-07-01",sfs:"1987:504,1988:1199",d:"Utbildningsdepartementet",en:"Swedish Polar Research Secretariat",sh:"POLAR",emp:35,fte:29,w:16,m:21,org:"202100-4060",tel:"0705502393",web:"www.polar.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:5,gd:true,fteH:{"2017":35.8,"2018":33.45,"2019":26.3,"2020":33.8,"2021":29,"2022":32,"2023":30,"2024":32}},
  {n:"Polismyndigheten",s:"2015-01-01",sfs:"2014:1102,2022:1718",d:"Justitiedepartementet",sh:"POLM",emp:39200,fte:37374,w:18742,m:20164,org:"202100-0076",tel:"11414",web:"www.polisen.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":27372.72,"2018":27221.14,"2019":28273.6,"2020":29804.3,"2021":31995.26,"2022":32153.03,"2023":32948.69,"2024":35620.91}},
  {n:"Post- och telestyrelsen",s:"1994-03-01",sfs:"1993:1710,1997:401",d:"Finansdepartementet",en:"National Post and Telecom Agency",sh:"PTS",emp:449,fte:403,w:247,m:201,org:"202100-4359",tel:"086785500",web:"www.pts.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:4,gd:true,fteH:{"2017":277.12,"2018":283.5,"2019":289.5,"2020":307.2,"2021":331.66,"2022":357.63,"2023":363.85,"2024":398.11}},
  {n:"Regeringskansliet",s:"1997-01-01",sfs:"1996:1515",d:"Statsrådsberedningen",en:"Government  Offices",sh:"RK",emp:4906,fte:4805,w:3142,m:1952,org:"202100-3831",tel:"084051000",web:"www.regeringen.se",grp:"Statliga förvaltningsmyndigheter",str:"Regeringskansliet",cof:1,gd:false,fteH:{"2017":3924.775,"2018":4071.885,"2019":3827.255,"2020":3948.7,"2021":4014.43,"2022":3982.975,"2023":4193.51,"2024":4177.62}},
  {n:"Revisorsinspektionen",s:"2008-01-01",sfs:"2007:1077",d:"Finansdepartementet",en:"Swedish Inspectorate of Auditors",sh:"RI",emp:24,fte:21,w:12,m:13,org:"202100-4805",tel:"087384600",web:"www.revisorsinspektionen.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":27.35,"2018":25.3,"2019":25.1,"2020":22.7,"2021":23.09,"2022":21.88,"2023":21.17,"2024":23}},
  {n:"Riksantikvarieämbetet",s:"1998-01-01",sfs:"1997:1171,2007:1184",d:"Kulturdepartementet",en:"Swedish National Heritage Board",sh:"RAA",emp:249,fte:230,w:140,m:97,org:"202100-1090",tel:"0851918000",web:"www.raa.se",grp:"Statliga förvaltningsmyndigheter",city:"VISBY",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":213.23,"2018":248.28,"2019":243.7,"2020":229.6,"2021":232.29,"2022":229.9,"2023":228.95,"2024":232.84}},
  {n:"Riksarkivet",sfs:"1977:553,2009:1593",d:"Kulturdepartementet",en:"Swedish National Archives",sh:"RA",emp:427,fte:391,w:219,m:204,org:"202100-1074",tel:"0104767000",web:"www.riksarkivet.se",grp:"Statliga förvaltningsmyndigheter",city:"TÄBY",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":454.32,"2018":474.31,"2019":473.4,"2020":413.5,"2021":411.48,"2022":400.34,"2023":396.44,"2024":398.38}},
  {n:"Riksdagens arvodesnämnd",s:"1994-01-01",sfs:"1993:1426,2012:883",org:"202100-6461",tel:"702303205",web:"www.riksdagen.se/sv/sa-funkar-riksdagen/riksdagens-myndigheter-och-namnder/riksdagens-arvodesnamnd",grp:"Myndigheter under riksdagen",gd:false},
  {n:"Riksdagens ombudsmän",s:"1986-12-04",sfs:"1986:765,2023:499",w:70,m:20,org:"202100-2650",tel:"87865100",web:"www.jo.se",grp:"Myndigheter under riksdagen",city:"STOCKHOLM",gd:false},
  {n:"Riksdagens överklagandenämnd",s:"2013-01-01",sfs:"2012:884"},
  {n:"Riksdagsförvaltningen",s:"2000-07-01",sfs:"2000:419,2011:745",d:"Riksdagen och dess verk m.m.",en:"The Swedish Riksdag Administration",sh:"RD",emp:748,fte:687,w:429,m:323,org:"202100-2627",tel:"87864000",web:"www.riksdagen.se",grp:"Myndigheter under riksdagen",gd:false},
  {n:"Riksgäldskontoret",s:"1989-07-01",sfs:"1989:248,1996:311",d:"Finansdepartementet",en:"Swedish National Debt Office",sh:"RGK",emp:243,fte:219,w:111,m:129,org:"202100-2635",tel:"086134500",web:"www.riksgalden.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:1,gd:true,fteH:{"2017":166.7,"2018":159.11,"2019":170.9,"2020":203.3,"2021":209.41,"2022":215.57,"2023":206.57,"2024":222.5}},
  {n:"Riksrevisionen",s:"2003-07-01",sfs:"2002:1023",d:"Riksdagen och dess verk m.m.",en:"The Swedish National Audit Office",sh:"RIKSR",emp:307,fte:288,w:189,m:121,org:"202100-5422",tel:"851714000",web:"www.riksrevisionen.se",grp:"Myndigheter under riksdagen",city:"STOCKHOLM",gd:false},
  {n:"Riksvärderingsnämnden",sfs:"1978:559,1988:1042",d:"Försvarsdepartementet",org:"202100-6784",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:2,gd:false,fteH:{"2018":0.02,"2019":0.02,"2020":0.02,"2021":0.02,"2022":0.02,"2023":0.1,"2024":0.2}},
  {n:"Rymdstyrelsen",s:"1988-07-01",sfs:"1988:343,1996:80",d:"Utbildningsdepartementet",en:"Swedish National Space Agency",sh:"RS",emp:28,fte:25,w:17,m:10,org:"202100-2585",tel:"0840907700",web:"www.rymdstyrelsen.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Styrelse",cof:4,gd:true,fteH:{"2017":17.5,"2018":16.5,"2019":19.3,"2020":19.5,"2021":22.25,"2022":22.5,"2023":24,"2024":27}},
  {n:"Rättshjälpsmyndigheten",s:"1991-01-01",sfs:"1990:1048,2003:502",d:"Justitiedepartementet",org:"202100-6016",tel:"060134600",web:"www.rattshjalp.se",grp:"Statliga förvaltningsmyndigheter",city:"SUNDSVALL",str:"Enrådighet",cof:3,host:"Sundsvalls tingsrätt",gd:false,fteH:{"2019":4.1368,"2020":3.8,"2021":2.58174603174603,"2022":4.533992094861658,"2023":6.26,"2024":6.32304073826293}},
  {n:"Rättshjälpsnämnden",s:"1991-01-01",sfs:"1990:1049,2007:1079",d:"Justitiedepartementet",str:"Nämnd",cof:3,gd:false,fteH:{"2019":0.4475,"2020":0.61,"2021":0.7630952380952379,"2022":0.4810276679841898,"2023":0.4,"2024":0.4}},
  {n:"Rättsmedicinalverket",s:"1991-07-01",sfs:"1991:944,1996:613",d:"Justitiedepartementet",en:"The National Board of Forensic Medicine",sh:"RMV",emp:547,fte:501,w:373,m:239,org:"202100-4227",tel:"0104834100",web:"www.rmv.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":437.83,"2018":463.52,"2019":489.7,"2020":502.3,"2021":501.11,"2022":514.23,"2023":520.89,"2024":529.8}},
  {n:"Rådet för Europeiska socialfonden i Sverige",s:"2001-01-01",sfs:"2000:1212,2007:907",d:"Arbetsmarknadsdepartementet",en:"Swedish ESF-council",sh:"ESF",emp:142,fte:127},
  {n:"Sameskolstyrelsen",s:"2011-07-01",sfs:"2011:131",d:"Utbildningsdepartementet",sh:"SAMS",emp:162,fte:121,w:131,m:16,org:"202100-4631",tel:"097144200",web:"www.sameskolstyrelsen.se",grp:"Statliga förvaltningsmyndigheter",city:"JOKKMOKK",str:"Nämnd",cof:9,gd:false,fteH:{"2017":73.97,"2018":99.36,"2019":109,"2020":108.4,"2021":113.32,"2022":119.9,"2023":120.35,"2024":122.38}},
  {n:"Sametinget",s:"1993-08-01",sfs:"1993:327,2007:1239",d:"Kulturdepartementet",en:"Sami Parliament in Sweden",sh:"SA",emp:66,fte:55,w:48,m:14,org:"202100-4573",tel:"098078030",web:"www.sametinget.se",grp:"Statliga förvaltningsmyndigheter",city:"KIRUNA",str:"SBA",cof:8,gd:false,fteH:{"2017":50.36,"2018":52.96,"2019":56.8,"2020":58.7,"2021":53.97,"2022":59.39,"2023":60.19,"2024":59.36}},
  {n:"Sjöfartsverket",sfs:"1969:320,1988:14",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish Maritime Administration",sh:"SJOV",emp:1701,fte:1390,w:415,m:1392,org:"202100-0654",tel:"771630000",web:"www.sjofartsverket.se",grp:"Statliga affärsverk",str:"Styrelse",cof:4,gd:true,fteH:{"2017":1233.6,"2018":1141.36,"2019":1178.7,"2020":1238.9,"2021":1328.82,"2022":1273.06,"2023":1321.08,"2024":1392.62}},
  {n:"Skatterättsnämnden",s:"2008-01-01",sfs:"2007:785",d:"Finansdepartementet",org:"202100-5901",tel:"0105747957",web:"www.skatterattsnamnden.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:1,gd:false,fteH:{"2017":12,"2018":12.75,"2019":12.75,"2020":10,"2021":10,"2022":9,"2023":7.5,"2024":7.5}},
  {n:"Skatteverket",s:"2004-01-01",sfs:"2003:1106,2007:780",d:"Finansdepartementet",en:"The National Tax Board",sh:"SKV",emp:10007,fte:9110,w:6358,m:3378,org:"202100-5448",tel:"0771567567",web:"www.skatteverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:1,gd:true,fteH:{"2017":9391.41,"2018":9478.39,"2019":9733.9,"2020":9179.3,"2021":9511,"2022":9347.71,"2023":9298.78,"2024":9301.65}},
  {n:"Skiljenämnden i vissa trygghetsfrågor",s:"2008-01-01",sfs:"2007:830",d:"Finansdepartementet",org:"202100-5869",tel:"087000800",web:"www.kammarkollegiet.se/kammarkollegiet/vi-arbetar-ocksa-med/naemndmyndigheter/skiljenaemnden-i-vissa-trygghetsfragor",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:10,gd:false,fteH:{"2017":1.2,"2018":1.2,"2019":1.2,"2020":1.5,"2021":1.5,"2022":2,"2023":2,"2024":2}},
  {n:"Skogsstyrelsen",s:"2006-01-01",sfs:"2005:1160,2007:1046",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish Forest Agency",sh:"SKS",emp:727,fte:698,w:339,m:370,org:"202100-5612",tel:"036359300",web:"www.skogsstyrelsen.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":682.55,"2018":654.31,"2019":767.9,"2020":674.7,"2021":730.01,"2022":768.63,"2023":734.16,"2024":693.55}},
  {n:"Skolforskningsinstitutet",s:"2015-01-01",sfs:"2014:1578",d:"Utbildningsdepartementet",sh:"SF",emp:19,fte:18,w:17,m:3,org:"202100-6602",tel:"0852729800",web:"www.skolfi.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:9,gd:false,fteH:{"2017":10.6,"2018":11.9,"2019":15.5,"2020":15.1,"2021":15.14,"2022":15.8,"2023":14.6,"2024":15}},
  {n:"Skolväsendets överklagandenämnd",s:"1991-07-01",sfs:"1991:1122,2007:948",d:"Utbildningsdepartementet",org:"202100-5729",tel:"087297760",web:"www.overklagandenamnden.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:9,host:"Statens skolinspektion",gd:false,fteH:{"2017":4.4,"2018":5.2,"2019":5.2,"2020":6.45,"2021":6.45,"2022":17,"2023":14,"2024":16}},
  {n:"Socialstyrelsen",sfs:"1981:683,1988:1236",d:"Socialdepartementet",en:"National Board of Health and Welfare",sh:"SOS",emp:1001,fte:1002,w:746,m:251,org:"202100-0555",tel:"0752473000",web:"www.socialstyrelsen.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:7,gd:true,fteH:{"2017":608.14,"2018":670.69,"2019":675.8,"2020":685.5,"2021":753.76,"2022":765.33,"2023":777.82,"2024":898.85}},
  {n:"Specialattachéer vid utlandsmyndigheterna",s:"1991-01-01",sfs:"1990:1108"},
  {n:"Specialpedagogiska skolmyndigheten",s:"2008-07-01",sfs:"2008:390,2009:1216",d:"Utbildningsdepartementet",en:"The National Agency for Special Needs Education and schools",sh:"SPSM",emp:1232,fte:1076,w:910,m:285,org:"202100-5745",tel:"0104735000",web:"www.spsm.se",grp:"Statliga förvaltningsmyndigheter",city:"HÄRNÖSAND",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":1002.77,"2018":1056.65,"2019":1054.6,"2020":1105.4,"2021":1117.37,"2022":1134.11,"2023":1151.98,"2024":1130.26}},
  {n:"Spelinspektionen",s:"2019-01-01",sfs:"2018:1476",d:"Finansdepartementet",en:"National Gaming  Board",sh:"LI",emp:70,fte:64,w:49,m:21,org:"202100-3310",tel:"0152650100",web:"www.lotteriinspektionen.se",grp:"Statliga förvaltningsmyndigheter",city:"STRÄNGNÄS",str:"Styrelse",cof:4,gd:true,fteH:{"2017":42.1,"2018":40.5,"2019":52,"2020":58.9,"2021":64.5,"2022":63.54,"2023":60.72,"2024":60.05}},
  {n:"Statens ansvarsnämnd",s:"1986-04-01",sfs:"1986:54,1988:1102",d:"Finansdepartementet",org:"202100-5836",tel:"0856167131",web:"www.statensansvarsnamnd.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:1,host:"Svea hovrätt",gd:false,fteH:{"2017":0.05,"2018":0.05,"2019":0.05,"2020":0.05,"2021":0.05,"2022":0.05,"2023":0.05}},
  {n:"Statens beredning för medicinsk och social utvärdering",s:"2008-01-01",sfs:"2007:1233",d:"Socialdepartementet",en:"Swedish Agency for Health Technology Assessment and Assessment of social service",sh:"SBU",emp:89,fte:78,w:68,m:16,org:"202100-4417",tel:"084123200",web:"www.sbu.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:7,gd:true,fteH:{"2017":67.52,"2018":74.26,"2019":70.8,"2020":75.2,"2021":78.07,"2022":73.61,"2023":74.52,"2024":78.15}},
  {n:"Statens centrum för arkitektur och design",s:"2013-05-01",sfs:"2013:71",d:"Kulturdepartementet",en:"Museum of Architecture",sh:"ARKDES",emp:43,fte:35,w:33,m:10,org:"202100-3427",tel:"0852023500",web:"www.arkdes.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":32.13,"2018":33.12,"2019":36.8,"2020":33,"2021":35.55,"2022":29.94,"2023":40.1,"2024":35.26}},
  {n:"Statens energimyndighet",s:"1998-01-01",sfs:"1997:868,2004:1200",d:"Klimat- och näringslivsdepartementet",en:"Swedish Energy Agency",sh:"STEM",emp:524,fte:477,w:333,m:180,org:"202100-5000",tel:"0165442000",web:"www.energimyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"ESKILSTUNA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":371.25,"2018":375.84,"2019":401.2,"2020":400.4,"2021":362.5,"2022":386.78,"2023":419.76,"2024":468.77}},
  {n:"Statens fastighetsverk",s:"1993-01-01",sfs:"1992:1533,1996:312",d:"Finansdepartementet",en:"National Property Board",sh:"SFV",emp:550,fte:518,w:265,m:295,org:"202100-4474",tel:"0104787000",web:"www.sfv.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:1,gd:true,fteH:{"2017":376.91,"2018":392.95,"2019":393.2,"2020":435.2,"2021":479.35,"2022":518.26,"2023":534.79,"2024":540.69}},
  {n:"Statens försvarshistoriska museer",s:"1992-07-01",sfs:"1992:514,2007:1178",d:"Kulturdepartementet",en:"National Swedish Museums of Military History",sh:"SFHM",emp:86,fte:68,w:59,m:41,org:"202100-0464",tel:"0851956310",web:"www.sfhm.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":71.38,"2018":69.81,"2019":70.3,"2020":66.8,"2021":70.9,"2022":72.98,"2023":80.17,"2024":72.97}},
  {n:"Statens geotekniska institut",sfs:"1965:693,1988:628",d:"Klimat- och näringslivsdepartementet",en:"Swedish Geotechnical Institute",sh:"SGI",emp:99,fte:90,w:54,m:42,org:"202100-0712",tel:"013201800",web:"www.swedgeo.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:6,gd:true,fteH:{"2017":73.55,"2018":76.2,"2019":80.8,"2020":81.9,"2021":90.68,"2022":86.68,"2023":90.85,"2024":94.51}},
  {n:"Statens haverikommission",sfs:"1978:555,1988:1114",d:"Försvarsdepartementet",en:"Swedish Accident Investigation Authority",sh:"SHK",emp:32,fte:29,w:11,m:21,org:"202100-3260",tel:"0850886200",web:"www.shk.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":28.83,"2018":27.25,"2019":27.3,"2020":28.8,"2021":26.65,"2022":28.9,"2023":29.2,"2024":28.2}},
  {n:"Statens historiska museer",s:"1998-01-01",sfs:"1997:1172,2007:1180",d:"Kulturdepartementet",en:"The National Historical Museums",sh:"SHMM",emp:401,fte:307,w:241,m:137,org:"202100-4953",tel:"0851955600",web:"www.shm.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":196.86,"2018":254.01,"2019":252.4,"2020":266.1,"2021":250.55,"2022":268.94,"2023":287.42,"2024":299.84}},
  {n:"Statens inspektion för försvarsunderrättelseverksamheten",s:"2009-12-01",sfs:"2009:969",d:"Försvarsdepartementet",en:"?",sh:"SIUN",emp:6,fte:6,w:3,m:3,org:"202100-6214",tel:"0855504550",web:"www.siun.se",grp:"Statliga förvaltningsmyndigheter",city:"KISTA"},
  {n:"Statens institutionsstyrelse",s:"1993-07-01",sfs:"1993:877,1996:610",d:"Socialdepartementet",en:"National Board of Institution Care",sh:"SIS",emp:5516,fte:4280,w:2422,m:2789,org:"202100-4508",tel:"0104534000",web:"www.stat-inst.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:10,gd:true,fteH:{"2017":3410.68,"2018":3365.48,"2019":3452,"2020":3509.6,"2021":3472.77,"2022":3550.61,"2023":3700.39,"2024":4063.9}},
  {n:"Statens jordbruksverk",s:"1991-07-01",sfs:"1991:375,1996:148",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish Board of Agriculture",sh:"SJV",emp:1768,fte:1682,w:1378,m:495,org:"202100-4151",tel:"036155000",web:"www.jordbruksverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":1299.65,"2018":1394.71,"2019":1464.35,"2020":1463.1,"2021":1504.75,"2022":1565.14,"2023":1629.15,"2024":1636.76}},
  {n:"Statens konstråd",sfs:"1965:746,1988:743",d:"Kulturdepartementet",en:"National Public Art Council",sh:"SK",emp:24,fte:19,w:20,m:5,org:"202100-1033",tel:"084401280",web:"www.statenskonstrad.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":22.15,"2018":21.95,"2019":27.3,"2020":25.3,"2021":24,"2022":21.25,"2023":21.8,"2024":18.4}},
  {n:"Statens kulturråd",sfs:"1974:644,1987:719",d:"Kulturdepartementet",en:"Swedish Arts Council",sh:"KUR",emp:103,fte:92,w:71,m:31,org:"202100-1280",tel:"0851926400",web:"www.kulturradet.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:8,gd:true,fteH:{"2017":76.24,"2018":75.5,"2019":91.9,"2020":84.1,"2021":106.41,"2022":105.69,"2023":104.14,"2024":92.3}},
  {n:"Statens maritima och transporthistoriska museer",s:"2008-01-01",sfs:"2007:1198",d:"Kulturdepartementet",en:"SWEDISH NATIONAL MARITIME AND TRANSPORT MUSEUMS",sh:"SMM",emp:303,fte:255,w:216,m:185,org:"202100-1132",tel:"0455359300",web:"www.smtm.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSKRONA",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":185.04,"2018":238.06,"2019":235.8,"2020":254.9,"2021":216.12,"2022":222.29,"2023":247.95,"2024":260.69}},
  {n:"Statens medieråd",s:"2011-01-01",sfs:"2010:1923",d:"Kulturdepartementet",en:"Swedish Media Council",sh:"SMR",emp:25,fte:20,w:19,m:7,org:"202100-6396"},
  {n:"Statens museer för världskultur",s:"1999-01-01",sfs:"1998:1714,2007:1185",d:"Kulturdepartementet",en:"The museum of Worldculture",sh:"SMVK",emp:149,fte:134,w:108,m:61,org:"202100-5075",tel:"0104561200",web:"www.varldskulturmuseerna.se",grp:"Statliga förvaltningsmyndigheter",city:"GÖTEBORG",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":112.44,"2018":132.76,"2019":134.7,"2020":135.3,"2021":116.14,"2022":123.09,"2023":132.41,"2024":131.9}},
  {n:"Statens musikverk",s:"2011-05-01",sfs:"2010:1922",d:"Kulturdepartementet",en:"Music Development and Heritage Sweden",sh:"SMV",emp:80,fte:65,w:48,m:35,org:"202100-3666",tel:"0851955450",web:"www.musikverket.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:8,gd:true,fteH:{"2017":81.47,"2018":69.55,"2019":74.3,"2020":70.2,"2021":71.58,"2022":66.79,"2023":68.52,"2024":68.01}},
  {n:"Statens nämnd för arbetstagares uppfinningar",sfs:"1965:668,1988:1140",d:"Arbetsmarknadsdepartementet",org:"202100-5778",tel:"084051000",web:"www.regeringen.se/myndigheter-med-flera/statens-namnd-for-arbetstagares-uppfinningar2/",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:4,host:"RK/A",gd:false,fteH:{"2017":0.05,"2018":0.05,"2019":0.05,"2020":0.05,"2021":0.05,"2022":0.04,"2023":0.04,"2024":0.04}},
  {n:"Statens servicecenter",s:"2012-06-01",sfs:"2012:208",d:"Finansdepartementet",sh:"SSC",emp:1569,fte:1335,w:1094,m:424,org:"202100-6453",tel:"0771456000",web:"www.statenssc.se",grp:"Statliga förvaltningsmyndigheter",city:"GÄVLE",str:"Styrelse",cof:1,gd:true,fteH:{"2017":377.51,"2018":422.28,"2019":456.9,"2020":1207.3,"2021":1302.9,"2022":1366.9,"2023":1500.58,"2024":1423}},
  {n:"Statens skaderegleringsnämnd",s:"2008-01-01",sfs:"2007:826",d:"Finansdepartementet",org:"202100-5828",tel:"087000800",web:"http://www.kammarkollegiet.se/n-mndmyndigheter/skaderegleringsn-mnden",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:1,host:"Kammarkollegiet",gd:false,fteH:{"2018":0.25,"2019":0.25,"2020":0.18,"2021":0.18,"2022":0.25,"2023":0.25,"2024":0.25}},
  {n:"Statens skolinspektion",s:"2008-10-01",sfs:"2008:613,2009:1215",d:"Utbildningsdepartementet",sh:"SSIP",emp:548,fte:470,w:398,m:126,org:"202100-6065",tel:"0858608000",web:"www.skolinspektionen.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":388.33000000000004,"2018":398.43,"2019":406.9,"2020":371.6,"2021":425,"2022":420,"2023":496.73,"2024":484.83}},
  {n:"Statens skolverk",s:"1991-07-01",sfs:"1991:1121,2002:1160",d:"Utbildningsdepartementet",en:"National Agency for Education.",sh:"SKOL",emp:935,fte:845,w:629,m:283,org:"202100-4185",tel:"0852733200",web:"www.skolverket.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:9,gd:true,fteH:{"2017":551.77,"2018":687.91,"2019":657.1,"2020":684.6,"2021":745.34,"2022":773.35,"2023":816.76,"2024":851.56}},
  {n:"Statens tjänstepensions- och grupplivnämnd",s:"1988-06-01",sfs:"1988:247,2007:833",d:"Finansdepartementet",org:"202100-5851",tel:"020650065",web:"www.spv.se",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:1,host:"Statens pensionsverk",gd:false,fteH:{"2017":0.01,"2018":0.03,"2019":0.03,"2020":0.013,"2021":0.013,"2022":0.026,"2023":0.026,"2024":0.026}},
  {n:"Statens tjänstepensionsverk",s:"2008-01-01",sfs:"2007:832",d:"Finansdepartementet",en:"The National Government Employee Pensions Board",sh:"SPV",emp:237,fte:220,w:136,m:94,org:"202100-0928",tel:"060187400",web:"www.spv.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:1,gd:true,fteH:{"2017":237.03,"2018":234.99,"2019":234.37,"2020":232.9,"2021":236.3,"2022":232.88,"2023":226.08,"2024":222.71}},
  {n:"Statens veterinärmedicinska anstalt",sfs:"1982:553,1988:864",d:"Landsbygds- och infrastrukturdepartementet",en:"National Veterinary Institute",sh:"SVA",emp:385,fte:344,w:275,m:121,org:"202100-1868",tel:"018674000",web:"www.sva.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":312.4,"2018":316.62,"2019":328.3,"2020":320.7,"2021":347.15,"2022":348.96,"2023":341.65,"2024":349.99}},
  {n:"Statens väg- och transportforskningsinstitut",s:"1993-07-01",sfs:"1993:679,1996:284",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish National Road and Transport Research Institute",sh:"VTI",emp:244,fte:217,w:118,m:128,org:"202100-0704",tel:"013204000",web:"www.vti.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":168.5,"2018":173.15,"2019":190.8,"2020":196.8,"2021":205.28,"2022":205.76,"2023":211.05,"2024":221.09}},
  {n:"Statens överklagandenämnd",s:"2008-01-01",sfs:"2007:835",d:"Finansdepartementet",org:"202100-4763",tel:"087000800",web:"www.kammarkollegiet.se/namndmyndigheter/statens-overklagandenamnd/om-namnden",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:1,host:"Kammarkollegiet",gd:false,fteH:{"2017":3.5,"2018":5,"2019":5,"2020":3.5,"2021":3.5,"2022":3.5,"2023":3.5,"2024":3.5}},
  {n:"Statistiska centralbyrån",s:"1985-07-01",sfs:"1985:608,1988:137",d:"Finansdepartementet",en:"Statistics Sweden",sh:"SCB",emp:1055,fte:962,w:580,m:478,org:"202100-0837",tel:"0104794000",web:"www.scb.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":1180.88,"2018":1091.89,"2019":1061.7,"2020":1059.5,"2021":1033.92,"2022":971.42,"2023":963.18,"2024":967.04}},
  {n:"Statskontoret",s:"1986-07-01",sfs:"1986:448,1988:959",d:"Finansdepartementet",en:"Swedish Agency for Administrative Development",sh:"STKT",emp:81,fte:72,w:51,m:29,org:"202100-0852",tel:"084544600",web:"www.statskontoret.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":68.8,"2018":63.7,"2019":68,"2020":70.4,"2021":75.25,"2022":70.25,"2023":68.8,"2024":75.1}},
  {n:"Statsrådsarvodesnämnden",s:"1994-01-01",sfs:"1993:1427,2012:881"},
  {n:"Strålsäkerhetsmyndigheten",s:"2008-07-01",sfs:"2008:452",d:"Klimat- och näringslivsdepartementet",en:"Swedish Radiation Safety Authority",sh:"SSM",emp:324,fte:299,w:160,m:175,org:"202100-5737",tel:"087994000",web:"www.stralsakerhetsmyndigheten.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":288.63,"2018":266.54,"2019":274.3,"2020":293.3,"2021":279.09,"2022":276.37,"2023":266.79,"2024":290.14}},
  {n:"Styrelsen för ackreditering och teknisk kontroll",s:"1989-07-01",sfs:"1989:270,1996:81",d:"Utrikesdepartementet",en:"Swedish Board for Accreditation and Conformity Assessment",sh:"SWEDAC",emp:107,fte:103,org:"202100-3815",tel:"0771990900",web:"www.swedac.se",grp:"Statliga förvaltningsmyndigheter",city:"BORÅS",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":106.01,"2018":107.95,"2019":89.5,"2020":99.4,"2021":107.75,"2022":106.9,"2023":108.88,"2024":104.68}},
  {n:"Styrelsen för internationellt utvecklingssamarbete",s:"1995-07-01",sfs:"1995:869,2007:1371",d:"Utrikesdepartementet",en:"Swedish International Development Cooperation Agency",sh:"SIDA",emp:801,fte:758,str:"Styrelse",cof:1,gd:true,fteH:{"2017":514.21,"2018":518.74,"2019":521.5,"2020":545.4,"2021":646.38,"2022":661.63,"2023":666.66,"2024":625.02}},
  {n:"Svenska FAO-kommittén",s:"1995-11-01",sfs:"1995:1100",d:"Landsbygds- och infrastrukturdepartementet",org:"202100-6818",tel:"084051000",web:"www.svenskafaokommitten.se",grp:"Statliga förvaltningsmyndigheter",str:"Kommitté",cof:4,host:"RK/N",gd:false,fteH:{"2018":0.5,"2019":0.5,"2020":0.5,"2021":0.5,"2022":0.5,"2023":0.2,"2024":0.2}},
  {n:"Svenska dialoginstitutet för Mellanöstern och Nordafrika",s:"1998-11-01",sfs:"1998:1218"},
  {n:"Svenska institutet",s:"1998-01-01",sfs:"1997:1226,2007:1224",d:"Utrikesdepartementet",en:"Swedish Institute",sh:"SI",emp:129,fte:119,w:88,m:28,org:"202100-4961",tel:"084537800",web:"www.si.se",grp:"Statliga förvaltningsmyndigheter",city:"JOHANNESHOV",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":120.34,"2018":120.94,"2019":113.5,"2020":119.9,"2021":112.5,"2022":115.3,"2023":105.68,"2024":108.75}},
  {n:"Svenska institutet för europapolitiska studier",s:"2008-01-01",sfs:"2007:1228,2008:748",d:"Statsrådsberedningen",en:"Swedish Institute for European Policy Studies",sh:"SIEPS",emp:14,fte:12,w:6,m:6,org:"202100-5331",tel:"0858644700",web:"www.sieps.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":10.82,"2018":11.1,"2019":15.7,"2020":11.9,"2021":11.2,"2022":13.05,"2023":14.55,"2024":13.1}},
  {n:"Sveriges geologiska undersökning",sfs:"1982:586,1988:367",d:"Klimat- och näringslivsdepartementet",en:"Geological Survey of Sweden",sh:"SGU",emp:325,fte:292,w:141,m:192,org:"202100-2528",tel:"018179000",web:"www.sgu.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":223.1,"2018":228.92,"2019":255.3,"2020":254.3,"2021":256.98,"2022":250.8,"2023":261.35,"2024":277.06}},
  {n:"Sveriges meteorologiska och hydrologiska institut",sfs:"1981:1102,1988:1113",d:"Klimat- och näringslivsdepartementet",en:"Swedish Meteorological and Hydrological Institute",sh:"SMHI",emp:611,fte:583,w:291,m:339,org:"202100-0696",tel:"0114958000",web:"www.smhi.se",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":600.92,"2018":592.79,"2019":614.4,"2020":651.6,"2021":587.07,"2022":578.71,"2023":584.94,"2024":588.45}},
  {n:"Säkerhets- och integritetsskyddsnämnden",s:"2008-01-01",sfs:"2007:1141",d:"Justitiedepartementet",en:"The Swedish Commission on Security and Integrity Protection",sh:"SIN",emp:22,fte:18,w:18,m:5,org:"202100-5703",tel:"0106179800",web:"www.sakint.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:3,gd:true,fteH:{"2017":12.05,"2018":12.93,"2019":10.5,"2020":14.5,"2021":16.68,"2022":12.95,"2023":16.3,"2024":17}},
  {n:"Säkerhetspolisen",s:"2003-01-01",sfs:"2002:1050,2014:1103",d:"Justitiedepartementet",en:"Swedish Security Service",sh:"SAPO",org:"202100-6594",tel:"0105687000",web:"www.sakerhetspolisen.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,},
  {n:"Tandvårds- och läkemedelsförmånsverket",s:"2008-01-01",sfs:"2007:1206",d:"Socialdepartementet",en:"Dental and Pharmaceutical Benefits Agency",sh:"TLV",emp:175,fte:151},
  {n:"Tillväxtverket",s:"2009-04-01",sfs:"2009:145",d:"Klimat- och näringslivsdepartementet",en:"Swedish Agency for Economic and Regional Growth",sh:"TVV",emp:532,fte:468,w:302,m:192,org:"202100-6149",tel:"086819100",web:"www.tillvaxtverket.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:4,gd:true,fteH:{"2017":373.28,"2018":372.40000000000003,"2019":416.57,"2020":421.2,"2021":628.03,"2022":974.49,"2023":530.5,"2024":494.12}},
  {n:"Totalförsvarets forskningsinstitut",s:"2001-01-01",sfs:"2000:1074,2007:861",d:"Försvarsdepartementet",en:"Swedish Defence Research Agency",sh:"FOI",emp:1290,fte:1240,w:428,m:933,str:"Styrelse",cof:2,gd:true,fteH:{"2017":789.18,"2018":820.35,"2019":853,"2020":914.6,"2021":923.32,"2022":972.24,"2023":1073.85,"2024":1202.97}},
  {n:"Totalförsvarets plikt- och prövningsverk",s:"2011-01-01",sfs:"2010:1472",d:"Försvarsdepartementet",en:"Swedish Defence Conscription and Assessment Agency",sh:"TPPV",emp:359,fte:322,w:183,m:175,org:"202100-4771",tel:"0771244030",web:"www.pliktverket.se",grp:"Statliga förvaltningsmyndigheter",city:"KARLSTAD"},
  {n:"Trafikanalys",s:"2010-04-01",sfs:"2010:186",d:"Landsbygds- och infrastrukturdepartementet",en:"?",sh:"TA",emp:41,fte:37,w:17,m:25,org:"202100-6305",tel:"0104144200",web:"www.trafa.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":33,"2018":36.35,"2019":32.4,"2020":35,"2021":35.45,"2022":33.65,"2023":35,"2024":40}},
  {n:"Trafikverket",s:"2010-04-01",sfs:"2010:185",d:"Landsbygds- och infrastrukturdepartementet",sh:"TRV",emp:11572,fte:10457,w:4883,m:6360,org:"202100-6297",tel:"0771921921",web:"www.trafikverket.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":6786.41,"2018":7304.31,"2019":8100.5,"2020":8622.6,"2021":9081.8,"2022":9284.32,"2023":9605.26,"2024":10267.66}},
  {n:"Transportstyrelsen",s:"2009-01-01",sfs:"2008:1300",d:"Landsbygds- och infrastrukturdepartementet",en:"Swedish Transport Agency",sh:"TS",emp:2285,fte:2105,w:1210,m:1035,org:"202100-6099",tel:"0771503503",web:"www.transportstyrelsen.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":1770.49,"2018":1785.93,"2019":1810.3,"2020":1891,"2021":1922.81,"2022":1899.69,"2023":2056.24,"2024":2179.68}},
  {n:"Tullverket",s:"1985-01-01",sfs:"1984:988,1991:1524",d:"Finansdepartementet",en:"Board of Customs",sh:"TV",emp:2610,fte:2360,w:1295,m:1228,org:"202100-0969",tel:"0771520520",web:"www.tullverket.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":1875.05,"2018":1865.43,"2019":1947.1,"2020":2013,"2021":2172.87,"2022":2155.35,"2023":2316.99,"2024":2416.98}},
  {n:"Universitets- och högskolerådet",s:"2013-01-01",sfs:"2012:811",d:"Utbildningsdepartementet",en:"Swedish Council for Higher Education",sh:"UHR",emp:350,fte:313,w:249,m:90,org:"202100-6487",tel:"0104700300",web:"www.uhr.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Styrelse",cof:9,gd:true,fteH:{"2017":270.21,"2018":277.74,"2019":307.2,"2020":280.5,"2021":288.05,"2022":310.6,"2023":320.65,"2024":327.43}},
  {n:"Universitetskanslersämbetet",s:"2013-01-01",sfs:"2012:810",d:"Utbildningsdepartementet",en:"Swedish Higher Education Authority",sh:"UKÄ",emp:126,fte:113,w:74,m:47,org:"202100-6495",tel:"0856308500",web:"www.uka.se",grp:"Statliga förvaltningsmyndigheter",city:"JOHANNESHOV"},
  {n:"Upphandlingsmyndigheten",s:"2015-09-01",sfs:"2015:527",d:"Finansdepartementet",en:"The National Agency for Public Procurement",sh:"UHM",emp:73,fte:64,w:41,m:27,org:"202100-6610",tel:"0858621700",web:"www.upphandlingsmyndigheten.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Enrådighet",cof:4,gd:true,fteH:{"2017":56,"2018":62.55,"2019":80.5,"2020":65.2,"2021":64.53,"2022":69.6,"2023":71.85,"2024":65.28}},
  {n:"Utbetalningsmyndigheten",s:"2024-01-01",sfs:"2023:461",d:"Finansdepartementet",en:"?",sh:"UBEM",emp:48,fte:52,w:29,m:33,org:"202100-7071",tel:"0101751240",web:"www.ubm.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:1,gd:true,fteH:{"2024":47}},
  {n:"Utrikesförvaltningens antagningsnämnd",s:"1991-07-01",sfs:"1991:360",d:"Utrikesdepartementet",org:"202100-6826",grp:"Statliga förvaltningsmyndigheter",str:"Nämnd",cof:1,host:"RK/UD",gd:false,fteH:{"2017":0.1,"2018":0.1,"2019":0.1,"2020":0.1,"2021":0.1,"2022":0.1,"2023":0.2,"2024":0.2}},
  {n:"Utrikesrepresentationen",s:"1992-07-01",sfs:"1992:247,2014:115"},
  {n:"Valmyndigheten",s:"2001-07-01",sfs:"2001:240,2007:977",d:"Kulturdepartementet",en:"Election Authority",sh:"VAL",emp:18,fte:15,w:9,m:10,org:"202100-5281",tel:"0105757000",web:"www.val.se",grp:"Statliga förvaltningsmyndigheter",city:"SOLNA",str:"Nämnd",cof:1,host:"Skatteverket",gd:true,fteH:{"2020":20,"2021":20,"2022":32,"2023":33,"2024":38}},
  {n:"Valprövningsnämnden",sfs:"1974:1037,2012:880"},
  {n:"Verket för innovationssystem",s:"2001-01-01",sfs:"2000:1132,2007:1114",d:"Klimat- och näringslivsdepartementet",en:"The Swedish Agency for Innovation Systems",sh:"VINOVA",emp:236,fte:223,w:148,m:86,org:"202100-5216",tel:"084733000",web:"www.vinnova.se",grp:"Statliga förvaltningsmyndigheter",str:"Styrelse",cof:4,gd:true,fteH:{"2017":184.49,"2018":191.62,"2019":204.9,"2020":203.7,"2021":198.95,"2022":221.75,"2023":218.09,"2024":222.75}},
  {n:"Vetenskapsrådet",s:"2001-01-01",sfs:"2000:1199,2007:1397",d:"Utbildningsdepartementet",en:"Swedish Research Council",sh:"VR",emp:272,fte:253,w:159,m:112,org:"202100-5208",tel:"0854644000",web:"www.vr.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Styrelse",cof:1,gd:true,fteH:{"2017":168.32,"2018":187.16,"2019":225.5,"2020":224.2,"2021":225.41,"2022":234.69,"2023":252.25,"2024":253.98}},
  {n:"Åklagarmyndigheten",s:"2005-01-01",sfs:"2004:1266,2007:971",d:"Justitiedepartementet",en:"Swedish Prosecution Authority",sh:"ÅKM",emp:2083,fte:1860,w:1023,m:397,org:"202100-0084",tel:"0105625000",web:"www.aklagare.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Enrådighet",cof:3,gd:true,fteH:{"2017":1264.45,"2018":1295.34,"2019":1249.8,"2020":1375.2,"2021":1400.83,"2022":1124.76,"2023":1146.71,"2024":1242.03}},
  {n:"Överklagandenämnden för etikprövning",s:"2008-01-01",sfs:"2007:1068",d:"Utbildningsdepartementet",en:"Central Ethical Review Board",sh:"CEP",org:"202100-5463",tel:"0854677610",web:"www.onep.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Nämnd",cof:9,host:"Vetenskapsrådet",gd:false,fteH:{"2017":2,"2018":2,"2019":2,"2022":3.5,"2023":4,"2024":3}},
  {n:"Överklagandenämnden för högskolan",s:"1992-07-01",sfs:"1992:404,2007:991",d:"Utbildningsdepartementet",org:"202100-4375",tel:"0856308700",web:"www.onh.se",grp:"Statliga förvaltningsmyndigheter",city:"JOHANNESHOV",str:"Nämnd",cof:9,host:"Universitetkanslerämbetet",gd:false,fteH:{"2017":4,"2018":4.8,"2019":4.8,"2020":7.7,"2021":7.7,"2022":8.5,"2023":7.5,"2024":7.5}},
  {n:"Överklagandenämnden för nämndemannauppdrag",s:"2008-01-01",sfs:"2007:1081",d:"Justitiedepartementet",org:"202100-6024",tel:"060186600",web:"www.kammarrattenisundsvall.se",grp:"Statliga förvaltningsmyndigheter",city:"SUNDSVALL",str:"Nämnd",cof:3,host:"Kammarrätten i Sundsvall",gd:false,fteH:{"2017":0.1,"2018":0.1,"2019":0.1}},
  {n:"Överklagandenämnden för studiestöd",s:"2001-05-01",sfs:"2001:79,2007:1348",d:"Utbildningsdepartementet",sh:"OKS",emp:20,fte:17,w:17,m:3,org:"202100-5273",tel:"0611347500",web:"www.oks.se",grp:"Statliga förvaltningsmyndigheter",city:"HÄRNÖSAND",str:"Enrådighet",cof:9,gd:false,fteH:{"2017":16.45,"2018":14.25,"2019":16.8,"2020":17.9,"2021":18.35,"2022":17.9,"2023":18.15,"2024":18.7}},
  {n:"Övervakningsnämnderna",s:"1983-07-01",sfs:"1983:257,1988:683"},
  {n:"AMU-gruppen",s:"1986-01-01",e:"1993-07-01",sfs:"1985:833,1988:1076"},
  {n:"Affärsverket FFV",e:"1991-01-01",sfs:"1976:723,1988:365"},
  {n:"Alkohol- och läkemedelssortimentsnämnden",s:"1995-01-01",e:"2008-01-01",sfs:"1994:2048"},
  {n:"Alkoholinspektionen",s:"1995-01-01",e:"2001-07-01",sfs:"1994:2047,1996:612",d:"Socialdepartementet",sh:"AI",w:7,m:7},
  {n:"Ansvarsnämnden för biskopar",s:"1987-01-01",e:"2000-01-01",sfs:"1986:1039,1989:7"},
  {n:"Arbetarskyddsstyrelsen",e:"1987-07-01",sfs:"1972:164"},
  {n:"Arbetarskyddsverket",s:"1987-07-01",e:"2001-01-01",sfs:"1987:393,1988:730"},
  {n:"Arbetslivscentrum",e:"1989-01-01",sfs:"1976:943"},
  {n:"Arbetslivsfonden",s:"1990-05-01",e:"1996-01-01",sfs:"1990:130"},
  {n:"Arbetslivsinstitutet",s:"1995-07-01",e:"2007-07-01",sfs:"1995:864",d:"Arbetsmarknadsdepartementet",en:"National Institute for Working Life",sh:"ALI",emp:414,fte:377,w:5,m:1},
  {n:"Arbetsmarknadsråd",e:"1991-01-01",sfs:"1977:575"},
  {n:"Arbetsmarknadsverket",s:"1987-01-01",e:"2008-01-01",sfs:"1986:739,1988:1139"},
  {n:"Arbetsmiljöattaché",e:"1990-07-01",sfs:"1980:616"},
  {n:"Arbetsmiljöfonden",e:"1995-07-01",sfs:"1971:803,1988:731"},
  {n:"Arbetsmiljöinstitutet",s:"1988-07-01",e:"1995-07-01",sfs:"1988:732"},
  {n:"Arkitekturmuseet",e:"2013-05-01",sfs:"1978:245,1988:1186"},
  {n:"Arkivet för ljud och bild",s:"1984-07-01",e:"1996-07-01",sfs:"1984:580,1988:342"},
  {n:"Bankinspektionen",e:"1991-07-01",sfs:"1979:740,1988:93"},
  {n:"Banverket",s:"1988-07-01",e:"2010-04-01",sfs:"1988:707,1996:286",d:"Näringsdepartementet",en:"National Rail Administration",sh:"BV",emp:6588,fte:6127,w:1458,m:5120,org:"202100-4003"},
  {n:"Barnmiljörådet",e:"1993-07-01",sfs:"1980:572,1988:1127"},
  {n:"Beredningen för internationellt tekniskt-ekonomiskt samarbete",e:"1995-07-01",sfs:"1979:831,1988:1125"},
  {n:"Bergslagsdelegationen",s:"1986-07-01",e:"1994-01-01",sfs:"1986:557,1988:347"},
  {n:"Bergsstaten",e:"2009-01-01",sfs:"1974:346,1988:368",org:"202200-1529"},
  {n:"Beslutsgrupper",s:"1996-01-01",e:"2000-01-01",sfs:"1995:1325"},
  {n:"Besvärsnämnden för högskoleutbildning",e:"1992-07-01",sfs:"1982:250,1988:1231"},
  {n:"Besvärsnämnden för rättshjälpen",e:"1991-01-01",sfs:"1979:952,1988:909"},
  {n:"Biståndskontorschef",e:"1995-07-01",sfs:"1980:806"},
  {n:"Bostadsdomstolen",e:"1994-07-01",sfs:"1975:517,1988:903"},
  {n:"Bostadsstyrelsen och länsbostadsnämnderna",e:"1988-07-01",sfs:"1965:669"},
  {n:"Bostadsstyrelsens bostadssociala råd",e:"1988-07-01",sfs:"1978:753"},
  {n:"Bostadsstyrelsens råd för belånings- och värderingsmetoder",e:"1988-07-01",sfs:"1978:399"},
  {n:"Boverkets stadsmiljöråd",s:"1988-10-15",e:"2004-01-01",sfs:"1988:1009"},
  {n:"Brottsskadenämnden",e:"1994-07-01",sfs:"1978:655,1988:984"},
  {n:"Bränslenämnden",s:"1984-05-29",e:"1994-07-01",sfs:"1984:228,1988:521"},
  {n:"Byggforskningsrådet",s:"1988-07-01",e:"2001-01-01",sfs:"1988:232",d:"Miljödepartementet",sh:"BFR",w:28,m:16},
  {n:"Byggnadsstyrelsen",e:"1993-10-01",sfs:"1982:518,1989:774"},
  {n:"Centrala etikprövningsnämnden",s:"2004-01-01",e:"2008-01-01",sfs:"2003:617"},
  {n:"Centrala försöksdjursnämnden",s:"1988-07-01",e:"2004-01-01",sfs:"1988:541",w:1,m:1},
  {n:"Centralnämnden för fastighetsdata",s:"1985-01-01",e:"1996-01-01",sfs:"1984:927,1988:278"},
  {n:"Civilbefälhavarna",s:"1989-01-01",e:"2001-01-01",sfs:"1988:1121"},
  {n:"Datainspektionen",s:"1987-02-09",e:"2008-01-01",sfs:"1987:17,1988:912"},
  {n:"De allmänna advokatbyråerna",e:"2000-07-01",sfs:"1980:548"},
  {n:"Delegationen för energiförsörjning i Sydsverige",s:"1998-03-15",e:"2005-01-01",sfs:"1998:62"},
  {n:"Delegationen för främjande av miljöanpassad teknik",s:"1997-03-01",e:"2001-01-01",sfs:"1997:40"},
  {n:"Delegationen för genomförande av vissa EU-program inom utbildning och kompetensutveckling m.m.",s:"1995-07-01",e:"1998-01-01",sfs:"1995:963"},
  {n:"Delegationen för hybrid-DNA-frågor",e:"1994-07-01",sfs:"1979:1173"},
  {n:"Delegationen för icke-militärt motstånd",s:"1987-06-01",e:"1994-07-01",sfs:"1987:199"},
  {n:"Delegationen för informationsinsatser om europeisk integration",s:"1992-07-01",e:"1996-02-01",sfs:"1992:887"},
  {n:"Delegationen för prognos- och utvecklingsverksamhet inom transportsektorn",s:"1994-07-01",e:"1995-07-01",sfs:"1994:756"},
  {n:"Delegationen för samordning av havsresursverksamheten",e:"1990-11-01",sfs:"1979:34,1988:371"},
  {n:"Delegationen för strukturfrågor inom vissa branscher",e:"1988-01-01",sfs:"1979:1181"},
  {n:"Delegationen för stöd till vissa kommuner med bostadsåtaganden",s:"1998-07-01",e:"2002-08-01",sfs:"1998:667",d:"Finansdepartementet",sh:"BD"},
  {n:"Delegationen för verkstadsteknisk utveckling",s:"1990-08-01",e:"1993-07-01",sfs:"1990:805"},
  {n:"Delegationen för vetenskaplig och teknisk informationsförsörjning",e:"1988-07-01",sfs:"1979:479"},
  {n:"Delegationen mot segregation",s:"2018-01-01",e:"2023-01-01",sfs:"2017:1085",d:"Justitiedepartementet",en:"Swedish Agency against Segregation",sh:"Delmos",emp:18,fte:16,w:10,m:3},
  {n:"Den statliga skoladministrationen",e:"1991-07-01",sfs:"1981:1371,1988:815"},
  {n:"Det statliga lantmäteriet",s:"1996-01-01",e:"2008-09-01",sfs:"1995:1418,2007:1057"},
  {n:"Dialekt- och ortnamnsarkiven samt Svenskt visarkiv",s:"1988-10-01",e:"1993-07-01",sfs:"1988:969"},
  {n:"Dialekt- och ortnamnsarkiven samt svenskt visarkiv",s:"1986-07-01",e:"1988-10-01",sfs:"1986:538"},
  {n:"Distansutbildningsmyndigheten",s:"1999-07-01",e:"2002-03-01",sfs:"1999:249",w:8,m:8},
  {n:"Djurskyddsmyndigheten",s:"2004-01-01",e:"2007-07-01",sfs:"2003:1125",d:"Landsbygdsdepartementet",en:"Swedish Animal Welfare Agency",sh:"DJURSK",emp:139,fte:59,w:122,m:97},
  {n:"Domkapitlen",e:"2000-01-01",sfs:"1965:738,1989:6"},
  {n:"Domänverket",e:"1994-01-01",sfs:"1975:1021,1988:366"},
  {n:"E-legitimationsnämnden",s:"2011-01-01",e:"2018-09-01",sfs:"2010:1497",org:"202100-6438"},
  {n:"Ekeskolans resurscenter",s:"2000-07-01",e:"2001-07-01",sfs:"2000:452"},
  {n:"Ekonomiska attachéer och finansråd",s:"1985-05-01",e:"1991-01-01",sfs:"1985:170"},
  {n:"Ekonomiska rådet",s:"1987-12-15",e:"2007-11-01",sfs:"1987:1057,1988:1214"},
  {n:"Elförsörjningsnämnden",s:"1986-01-01",e:"1997-01-01",sfs:"1985:921,1988:520"},
  {n:"Energiforskningsnämnden",e:"1990-08-01",sfs:"1982:587,1988:522"},
  {n:"Ersättningsnämnden",s:"2013-01-01",e:"2016-07-01",sfs:"2012:666",d:"Socialdepartementet",sh:"ER",emp:33,fte:25,w:26,m:6,org:"202100-6503"},
  {n:"Etnografiska museet",e:"1989-01-01",sfs:"1966:265"},
  {n:"Exekutionsväsendet",s:"1988-07-01",e:"2006-07-01",sfs:"1988:784"},
  {n:"Expertgruppen för EU-frågor",s:"2001-07-01",e:"2006-08-01",sfs:"2001:204"},
  {n:"Fartygsuttagningskommissionen",s:"1987-07-01",e:"2003-06-01",sfs:"1987:288"},
  {n:"Fastighetsmäklarnämnden",s:"1995-10-01",e:"2009-07-01",sfs:"1995:1029,1998:1808"},
  {n:"Fiskeristyrelsen och fiskenämnderna",s:"1985-07-01",e:"1991-07-01",sfs:"1985:437,1988:863"},
  {n:"Fiskeriverket",s:"1991-07-01",e:"2011-07-01",sfs:"1991:827,1996:145",d:"Landsbygdsdepartementet",en:"National Board of Fisheries",sh:"FIV",emp:373,fte:348,w:176,m:217,org:"202100-1843"},
  {n:"Flygplatsnämnden",s:"2000-05-01",e:"2005-01-01",sfs:"2000:152"},
  {n:"Flygtekniska försöksanstalten",e:"2001-01-01",sfs:"1980:387,1988:554",d:"Försvarsdepartementet",sh:"FFA",w:36,m:189},
  {n:"Folkens museum - etnografiska",s:"1989-01-01",e:"1999-01-01",sfs:"1988:1185"},
  {n:"Folkhälsoinstitutet",s:"1992-07-01",e:"2001-07-01",sfs:"1992:850,1996:614"},
  {n:"Formum för levande historia",s:"2003-06-01",e:"2008-01-01",sfs:"2002:795"},
  {n:"Forskningsdelegationen vid arbetarskyddsstyrelsen",e:"1987-07-01",sfs:"1982:1288"},
  {n:"Forskningsinstitutet för atomfysik",s:"1984-06-12",e:"1988-07-01",sfs:"1984:282"},
  {n:"Forskningsråden inom Utbildningsdepartementets verksamhetsområde",s:"1989-01-01",e:"2001-01-01",sfs:"1988:1198,1996:648"},
  {n:"Forskningsråden inom utbildningsdepartementets verksamhetsområde",e:"1989-01-01",sfs:"1977:34"},
  {n:"Forskningsrådet för arbetsliv och socialvetenskap",s:"2001-01-01",e:"2008-01-01",sfs:"2000:1198"},
  {n:"Forskningsrådsnämnden",e:"2001-01-01",sfs:"1977:35,1988:1201",d:"Utbildningsdepartementet",sh:"FRN"},
  {n:"Företagshälsovårdsdelegationen vid arbetarskyddsstyrelsen",s:"1985-07-01",e:"1987-07-01",sfs:"1985:328"},
  {n:"Försvarets civilförvaltning",s:"1992-07-01",e:"1994-07-01",sfs:"1992:511"},
  {n:"Försvarets fastighetsnämnd",e:"1990-07-01",sfs:"1979:264,1988:553"},
  {n:"Försvarets forskningsanstalt",s:"1984-01-01",e:"2001-01-01",sfs:"1983:910,1988:1036",d:"Försvarsdepartementet",sh:"FOA",w:273,m:733},
  {n:"Försvarets förvaltningshögskola",s:"1992-07-01",e:"1994-07-01",sfs:"1992:516"},
  {n:"Försvarets mediecenter",s:"1992-07-01",e:"1993-07-01",sfs:"1992:515"},
  {n:"Försvarets personalnämnd",s:"1987-07-01",e:"1995-07-01",sfs:"1987:534,1988:852"},
  {n:"Försvarets rationaliseringsinstitut",s:"1985-06-01",e:"1991-07-01",sfs:"1985:257,1988:1120"},
  {n:"Försvarets underrättelsenämnd",e:"2009-12-01",sfs:"1976:498,1988:552"},
  {n:"Försvarsexportmyndigheten",s:"2010-08-01",e:"2016-01-01",sfs:"2010:654",d:"Försvarsdepartementet",en:"Swedish Defence and Security Export Agency",sh:"FEM",emp:49,fte:42,w:14,m:24,org:"202100-6339"},
  {n:"Försvarshögskolan",s:"1988-07-01",e:"2008-01-01",sfs:"1988:550,1996:1476",d:"Utbildningsdepartementet",en:"National Defence College",sh:"FHS",emp:510,fte:454,w:244,m:313,org:"202100-4730",tel:"0855342500",web:"www.fhs.se",grp:"Statliga förvaltningsmyndigheter",city:"STOCKHOLM",str:"Universitet eller högskola",cof:2,gd:true,fteH:{"2017":315.49,"2018":338.64,"2019":358.7,"2020":378.9,"2021":401.42,"2022":415.08,"2023":416.8,"2024":452.32}},
  {n:"Försvarsmaktens flygförarnämnd",s:"1987-04-28",e:"1999-07-01",sfs:"1987:98"},
  {n:"Försvarsmaktens organisationsmyndighet",s:"1992-11-15",e:"1994-07-01",sfs:"1992:1019"},
  {n:"Försäkringsinspektionen",e:"1991-07-01",sfs:"1981:181,1988:94"},
  {n:"Försäkringsöverdomstolen",e:"1995-07-01",sfs:"1978:632"},
  {n:"Försörjningskommissionen",s:"1989-07-01",e:"2002-07-01",sfs:"1989:631,1996:195"},
  {n:"Glesbygdsverket",s:"1991-01-01",e:"2009-04-01",sfs:"1990:1008,2007:1154",d:"Näringsdepartementet",en:"NATIONEL RURAL DEVELOPMENT AGENCY",sh:"GBV",emp:34,fte:28,w:15,m:15,org:"202100-4128"},
  {n:"Granskningsnämnden för radio och TV",s:"1994-07-01",e:"2010-08-01",sfs:"1994:728,2007:1183",d:"Kulturdepartementet",en:"Swedish Broadcasting Commission",sh:"GRN",emp:12,fte:12,w:10,m:4},
  {n:"Handelsflottans kultur- och fritidsråd",e:"2007-01-01",sfs:"1976:493,1988:1110",d:"Näringsdepartementet",en:"Swedish Government Seamen´s Service",sh:"HKF",emp:27,fte:27,w:21,m:16},
  {n:"Handelsflottans pensionsanstalt",e:"1994-10-01",sfs:"1965:699,1988:1112"},
  {n:"Handikappombudsmannen",s:"1994-07-01",e:"2009-01-01",sfs:"1994:949,2007:1034",d:"Integrations- och jämställdhetsdepartementet",en:"Office of the Swedish Disability Ombudsman",sh:"HO",emp:16,fte:12,w:12,m:3,org:"202100-4672"},
  {n:"Hällsboskolans resurscenter",s:"2000-07-01",e:"2001-07-01",sfs:"2000:453"},
  {n:"Högskoleverket",s:"1995-07-01",e:"2013-01-01",sfs:"1995:945,2003:7",d:"Utbildningsdepartementet",en:"Swedish National Agency for Higher Education",sh:"HSV",emp:155,fte:139,w:124,m:87,org:"202100-4797"},
  {n:"Importkontoret för u-landsprodukter",e:"1991-07-01",sfs:"1979:296,1988:364"},
  {n:"Institutet för arbetslivsforskning",s:"1989-01-01",e:"1995-07-01",sfs:"1988:1138"},
  {n:"Institutet för arbetsmarknadspolitisk utvärdering",s:"1997-01-01",e:"2008-01-01",sfs:"1996:1426,2007:180"},
  {n:"Institutet för psykosocial medicin",s:"1996-07-01",e:"2007-10-01",sfs:"1996:615",d:"Socialdepartementet",en:"National Institutet for Psychosocial Medicine",sh:"IPM",emp:38,fte:29,w:20,m:17},
  {n:"Institutet för tillväxtpolitiska studier",s:"2001-01-01",e:"2009-04-01",sfs:"2000:1133,2007:1116",d:"Näringsdepartementet",en:"The Swedish Institute for Growth Policy Studies",sh:"ITPS",emp:67,fte:59,w:24,m:36,org:"202100-5190"},
  {n:"Institutet för utvärdering av internationellt utvecklingssamarbete",s:"2006-01-01",e:"2013-01-01",sfs:"2005:1214,2007:1300",d:"Utrikesdepartementet",en:"Swedish agency for development evaluation",sh:"SADEV",emp:14,fte:14,org:"202100-5604"},
  {n:"Instruktion för Statens va-nämnd",e:"2008-01-01",sfs:"1970:350"},
  {n:"Insättningsgarantinämnden",s:"1996-07-01",e:"2008-01-01",sfs:"1996:595",d:"Finansdepartementet",en:"Deposit Guarantee Board",sh:"IGN",emp:8,fte:7,w:1,m:4},
  {n:"Integrationsverket",s:"1998-06-01",e:"2007-07-01",sfs:"1998:201",d:"Integrations- och jämställdhetsdepartementet",sh:"IV",emp:121,fte:101,w:40,m:20},
  {n:"Internationella programkontoret för utbildningsområdet",s:"2000-01-01",e:"2013-01-01",sfs:"1999:1222,2007:949",d:"Utbildningsdepartementet",en:"International Programme Office",sh:"IPRO",emp:70,fte:68},
  {n:"Jämställdhetsnämnden",e:"2009-01-01",sfs:"1980:416,1991:1437",org:"202100-5919"},
  {n:"Jämställdhetsombudsmannen",e:"2009-01-01",sfs:"1980:415,1988:128",d:"Integrations- och jämställdhetsdepartementet",en:"Office of the Equal Opportunities Ombudsman",sh:"JAMO",emp:35,fte:31,w:25,m:10,org:"202100-3617"},
  {n:"Järnvägsstyrelsen",s:"2004-07-01",e:"2009-01-01",sfs:"2004:527,2007:1028",d:"Näringsdepartementet",en:"Swedisch Rail Agency",sh:"JVS",emp:65,fte:50,w:25,m:37,org:"202100-5505"},
  {n:"Kabelnämnden och Närradionämnden",s:"1988-07-01",e:"1994-07-01",sfs:"1988:340"},
  {n:"Kabelnämnden och närradionämnden",s:"1986-01-01",e:"1988-07-01",sfs:"1985:1062"},
  {n:"Kanslersämbetet",s:"1993-07-01",e:"1995-07-01",sfs:"1993:886"},
  {n:"Kommunikationsforskningsberedningen",s:"1993-07-01",e:"2001-01-01",sfs:"1993:675,1996:283",d:"Näringsdepartementet",sh:"KFB",w:10,m:14},
  {n:"Kompetensrådet för utveckling i staten",s:"2009-01-01",e:"2013-01-01",sfs:"2008:1085",d:"Socialdepartementet",sh:"KRU",emp:16,fte:15,w:6,m:4,org:"202100-6115"},
  {n:"Koncessionsnämnden för miljöskydd",e:"1999-01-01",sfs:"1969:389,1988:624"},
  {n:"Krigsarkivet",s:"1992-07-01",e:"1995-07-01",sfs:"1992:512"},
  {n:"Kriminalvårdsnämnden",e:"2011-04-01",sfs:"1981:234,1988:682",org:"202100-5992"},
  {n:"Kriminalvårdsverket",e:"2006-01-01",sfs:"1974:555,1988:931"},
  {n:"Krisberedskapsmyndigheten",s:"2002-07-01",e:"2009-01-01",sfs:"2002:518,2007:856",d:"Försvarsdepartementet",en:"Swedish Emergency Management Agency",sh:"KBM",emp:259,fte:216,w:125,m:121,org:"202100-5349"},
  {n:"Kronofogdemyndigheterna",e:"1988-07-01",sfs:"1981:1184"},
  {n:"Kyrkofondens styrelse",s:"1987-04-01",e:"2000-01-01",sfs:"1987:59,1988:1149"},
  {n:"Kärnavfallsfondens styrelse",s:"1996-01-01",e:"2008-01-01",sfs:"1995:1548"},
  {n:"Landsarkiven",e:"1989-01-01",sfs:"1965:743"},
  {n:"Lantbruksekonomiska samarbetsnämnden",e:"1988-08-01",sfs:"1972:14"},
  {n:"Lantbruksråd och lantbruksattaché",s:"1985-07-01",e:"1991-01-01",sfs:"1985:305"},
  {n:"Lantbruksstyrelsen och lantbruksnämnderna",e:"1991-07-01",sfs:"1967:425,1988:854"},
  {n:"Lantmäterimyndigheterna",s:"1989-01-01",e:"1996-01-01",sfs:"1988:1232"},
  {n:"Livrustkammaren och Skoklosters slott med Stiftelsen Hallwylska museet",s:"1989-01-01",e:"2018-01-01",sfs:"1988:1183,2007:1195",d:"Kulturdepartementet",en:"Royal Armoury and Skokloster Castle with Foundation of Hallwyl Mu",sh:"LSH",emp:75,fte:61,org:"202100-3732"},
  {n:"Livrustkammaren, Skoklosters slott och Hallwylska museet",e:"1989-01-01",sfs:"1980:394",w:56,m:30},
  {n:"Livsmedelsekonomiska institutet",s:"1999-07-01",e:"2009-01-01",sfs:"1999:380,2007:1047",d:"Landsbygdsdepartementet",en:"Swedish Institute for Food and Agricultural Economics",sh:"SLI",emp:14,fte:13,w:5,m:8,org:"202100-5117"},
  {n:"Livsmedelsekonomiska samarbetsnämnden",s:"1988-08-01",e:"1999-01-01",sfs:"1988:862"},
  {n:"Lokal värderingsnämnd",e:"1988-12-01",sfs:"1978:560"},
  {n:"Lotteriinspektionen",s:"1995-01-01",e:"2019-01-01",sfs:"1994:1452,2007:756"},
  {n:"Lotterinämnden",e:"1995-01-01",sfs:"1982:1013,1988:1135"},
  {n:"Luftfartsstyrelsen",s:"2005-01-01",e:"2009-01-01",sfs:"2004:1110,2007:959",d:"Näringsdepartementet",en:"Swedish Civil Aviation Authority",sh:"LFS",emp:278,fte:244,org:"202100-5547"},
  {n:"Läkemedelsförmånsnämnden",s:"2002-10-01",e:"2008-01-01",sfs:"2002:719"},
  {n:"Länsbostadsnämnderna",s:"1988-07-01",e:"1994-01-01",sfs:"1988:591"},
  {n:"Länsstyrelsen i Norrbottens län",s:"1987-01-01",e:"1991-07-01",sfs:"1986:1123,1988:972",d:"Finansdepartementet",en:"Administrative Board of Norrbotten County",sh:"LNBOTT",emp:352,fte:326,w:242,m:126,org:"202100-2478",tel:"0102255000",web:"www.lansstyrelsen.se/norrbotten",grp:"Statliga förvaltningsmyndigheter",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":239.67,"2018":260.31,"2019":280.1,"2020":282.6,"2021":300.46,"2022":317.67,"2023":320.99,"2024":332.43}},
  {n:"Länsstyrelsernas organisationsnämnd",s:"1983-12-01",e:"1992-07-01",sfs:"1983:864,1988:1151"},
  {n:"Länsvägnämnderna",e:"1991-07-01",sfs:"1971:959"},
  {n:"Lånenämnden för den mindre skeppsfarten",e:"1988-01-01",sfs:"1971:325"},
  {n:"Manne Siegbahninstitutet för fysik",s:"1988-07-01",e:"1993-07-01",sfs:"1988:734"},
  {n:"Marknadsdomstolen",e:"2016-09-01",sfs:"1970:1030,1988:1564",d:"Finansdepartementet",en:"Market Court",sh:"MD",emp:10,fte:7,w:5,m:2,org:"202100-2015"},
  {n:"Mellankommunala skatterätten",e:"1988-07-01",sfs:"1981:562"},
  {n:"Militärhögskolan",s:"1994-07-01",e:"1997-01-01",sfs:"1994:713"},
  {n:"Militärledningen",s:"1984-05-10",e:"1994-07-01",sfs:"1984:181"},
  {n:"Militärledningens rådgivande nämnd",e:"1994-07-01",sfs:"1978:879"},
  {n:"Myndigheten för Sveriges nätuniversitet",s:"2002-03-01",e:"2006-01-15",sfs:"2002:26",w:5,m:3},
  {n:"Myndigheten för avveckling av vissa verksamheter inom totalförsvaret",s:"1993-07-01",e:"1996-01-01",sfs:"1993:663"},
  {n:"Myndigheten för handikappolitisk samordning",s:"2006-01-01",e:"2014-05-01",sfs:"2005:1073,2007:1134"},
  {n:"Myndigheten för internationella adoptionsfrågor",s:"2005-01-01",e:"2008-01-01",sfs:"2004:1145"},
  {n:"Myndigheten för kvalificerad yrkesutbildning",s:"2001-10-01",e:"2009-07-01",sfs:"2001:723",d:"Utbildningsdepartementet",en:"Advanced Vocational Education",sh:"KY",emp:27,fte:25,w:19,m:9,org:"202100-5299"},
  {n:"Myndigheten för nätverk och samarbete inom högre utbildning",s:"2006-01-15",e:"2009-01-01",sfs:"2005:1236,2007:1166"},
  {n:"Myndigheten för skolutveckling",s:"2003-03-01",e:"2008-10-01",sfs:"2002:1161",d:"Utbildningsdepartementet",en:"National Agency for Education",sh:"MSU",emp:150,fte:150,w:85,m:36,org:"202100-5406"},
  {n:"Myndigheten för utländska investeringar i Sverige",s:"1995-07-01",e:"2013-01-01",sfs:"1995:962,2007:1220",d:"Utrikesdepartementet",en:"Invest Sweden",sh:"ISA",emp:40,fte:39,w:17,m:14},
  {n:"Nationalmuseum med Prins Eugens Waldemarsudde",s:"1999-07-01",e:"2008-01-01",sfs:"1999:562"},
  {n:"Nationellt centrum för flexibelt lärande",s:"2002-01-01",e:"2008-10-01",sfs:"2001:1201",d:"Utbildningsdepartementet",en:"Swedish Agency for flexible learning",sh:"CFL",emp:98,fte:94,w:43,m:29,org:"202100-5307"},
  {n:"Nordiska afrikainstitutet",s:"1989-01-01",e:"1996-01-01",sfs:"1988:1124",d:"Utrikesdepartementet",w:27,m:16,org:"202100-2726",tel:"0184715200",web:"www.nai.uu.se",grp:"Statliga förvaltningsmyndigheter",city:"UPPSALA",str:"Enrådighet",cof:1,gd:true,fteH:{"2017":28.7,"2018":28.35,"2019":31.2,"2020":29.5,"2021":27.5,"2022":30.65,"2023":33,"2024":34.45}},
  {n:"Nordiska afrikainstitutet (Scandinavian Institute of African Studies)",e:"1989-01-01",sfs:"1981:186"},
  {n:"Nordiska rådets svenska delegation",s:"1984-02-15",e:"1994-07-01",sfs:"1984:50"},
  {n:"Nordkalottens AMU-center",s:"1986-01-01",e:"1991-01-01",sfs:"1985:1087"},
  {n:"Nämnden för Rh-anpassad utbildning",s:"1991-01-01",e:"2008-07-01",sfs:"1990:1110"},
  {n:"Nämnden för elektronisk förvaltning",s:"2004-01-01",e:"2006-01-01",sfs:"2003:769"},
  {n:"Nämnden för lokalanställda",e:"1994-03-01",sfs:"1981:605,1988:1535"},
  {n:"Nämnden för offentlig upphandling",s:"1993-03-15",e:"2007-09-01",sfs:"1993:98",d:"Finansdepartementet",en:"National Board for Public Procurement",sh:"NOU",emp:10,fte:8,w:7,m:4},
  {n:"Nämnden för personalvård för totalförsvarspliktiga",s:"1994-07-01",e:"2004-01-01",sfs:"1994:648"},
  {n:"Nämnden för rederistöd",e:"1989-02-15",sfs:"1982:785"},
  {n:"Nämnden för statens avtalsförsäkringar",s:"2000-01-01",e:"2004-07-01",sfs:"1999:1170"},
  {n:"Nämnden för statens gruvegendom",e:"1993-07-01",sfs:"1982:579,1988:370"},
  {n:"Nämnden för statliga förnyelsefonder",s:"1986-11-15",e:"1999-01-01",sfs:"1986:729,1988:1104"},
  {n:"Nämnden för statligt stöd till trossamfund",s:"2008-01-01",e:"2017-07-01",sfs:"2007:1192"},
  {n:"Nämnden för u-landsutbildning",e:"1987-07-01",sfs:"1981:664"},
  {n:"Nämnden för undervisningssjukhusens utbyggande",e:"1990-07-01",sfs:"1977:433,1988:1243"},
  {n:"Nämnden för utgivande av förvaltningsrättsliga publikationer",s:"1989-01-01",e:"1999-06-01",sfs:"1988:1115"},
  {n:"Nämnden för utställningar av nutida svensk konst i utlandet",s:"1988-07-01",e:"1997-01-01",sfs:"1988:744"},
  {n:"Nämnden för utställningar av svensk konst i utlandet",s:"1986-07-01",e:"1988-07-01",sfs:"1986:539"},
  {n:"Nämnden för vapenfriutbildning",e:"1989-10-01",sfs:"1982:1278,1988:551"},
  {n:"Nämnden för vissa statliga pensionsfrågor",s:"1992-04-01",e:"1997-07-01",sfs:"1992:78"},
  {n:"Nämnden mot etnisk diskriminering",s:"1986-07-01",e:"1999-05-01",sfs:"1986:447"},
  {n:"Närings- och teknikutvecklingsverket",s:"1991-07-01",e:"2001-01-01",sfs:"1991:960,1997:1178"},
  {n:"Näringsfrihetsombudsmannen",e:"1992-07-01",sfs:"1982:1048,1988:1582"},
  {n:"Ombudsmannen mot diskriminering på grund av sexuell läggning",s:"1999-05-01",e:"2009-01-01",sfs:"1999:170,2007:1036",d:"Integrations- och jämställdhetsdepartementet",en:"The Office of the Ombudsman against Discrimination because of Sexual Orientation",sh:"HOMO",emp:8,fte:8,w:7,m:3,org:"202100-5083"},
  {n:"Ombudsmannen mot etnisk diskriminering",s:"1986-07-01",e:"2009-01-01",sfs:"1986:446,1988:895",d:"Integrations- och jämställdhetsdepartementet",en:"The Ombudsman against Ethnic Discrimination",sh:"DO",emp:45,fte:40,w:30,m:15,org:"202100-3948"},
  {n:"Patentbesvärsrätten",s:"1987-07-01",e:"2016-09-01",sfs:"1987:429,1988:346",d:"Näringsdepartementet",en:"Court of Patent appeals",sh:"PBR",emp:14,fte:12,w:10,m:5,org:"202100-3971"},
  {n:"Postverket",e:"1994-03-01",sfs:"1969:736,1988:79",w:5,m:3},
  {n:"Premiepensionsmyndigheten",s:"1998-07-01",e:"2010-01-01",sfs:"1998:794,2000:585",d:"Finansdepartementet",en:"Premium Pension Authority",sh:"PPM",emp:208,fte:185,w:125,m:90,org:"202100-5034"},
  {n:"Presstödsnämnden",e:"2015-07-01",sfs:"1976:419,1988:673",d:"Kulturdepartementet",en:"Press Subsidies Council",sh:"PSN",emp:5,fte:5,w:3,m:2,org:"202100-3294"},
  {n:"Programrådet för forskning för ett avfallssnålt samhälle",s:"1990-11-01",e:"1995-07-01",sfs:"1990:961"},
  {n:"Programrådet vid Studsvik",s:"1990-10-15",e:"1995-07-01",sfs:"1990:942"},
  {n:"Prövningsnämnden för bankstödsfrågor",s:"1993-07-01",e:"1996-07-01",sfs:"1993:889"},
  {n:"Prövningsnämnden för stöd till kreditinstitut",s:"2008-11-10",e:"2016-07-01",sfs:"2008:850",org:"202100-6362"},
  {n:"Psykiatriska nämnden",e:"1992-01-01",sfs:"1966:567"},
  {n:"Radio- och TV-verket",s:"1994-07-01",e:"2010-08-01",sfs:"1994:729,2007:1190",d:"Kulturdepartementet",en:"Swedish Radio and TV Authority",sh:"RTVV",emp:14,fte:13,w:11,m:3},
  {n:"Radionämnden",e:"1994-07-01",sfs:"1978:482,1988:339"},
  {n:"Rederinämnden",s:"1989-02-15",e:"2011-01-01",sfs:"1989:10,2007:1160",org:"202100-5638"},
  {n:"Regeringskansliets förvaltningskontor",s:"1983-10-01",e:"1997-01-01",sfs:"1983:688,1988:1147"},
  {n:"Regeringsrätten",e:"1996-07-01",sfs:"1979:568"},
  {n:"Regionala etikprövningsnämnden",s:"2008-01-01",e:"2019-01-01",sfs:"2007:1069"},
  {n:"Regionala etikprövningsnämnder",s:"2004-01-01",e:"2008-01-01",sfs:"2003:616"},
  {n:"Regionmusiken",e:"1988-01-01",sfs:"1973:446"},
  {n:"Regionstyrelserna för högskolan",e:"1988-07-01",sfs:"1977:458"},
  {n:"Registernämnden",s:"1996-07-01",e:"2008-01-01",sfs:"1996:730,2006:1076"},
  {n:"Resegarantinämnden",e:"2018-08-01",sfs:"1972:272,1988:1584",org:"202100-6354"},
  {n:"Revisorsnämnden",s:"1995-07-01",e:"2008-01-01",sfs:"1995:666"},
  {n:"Riksantikvarieämbetet och statens historiska museer",e:"1998-01-01",sfs:"1975:468,1988:1131"},
  {n:"Riksarkivet och landsarkiven",s:"1989-01-01",e:"2010-01-01",sfs:"1988:1187,1991:731"},
  {n:"Riksdagens förvaltningskontor",s:"1984-01-01",e:"2000-07-01",sfs:"1983:1061"},
  {n:"Riksdagens revisorer",e:"2003-07-01",sfs:"1974:1036,1987:518",d:"Riksdagen och dess verk m.m.",sh:"RR"},
  {n:"Riksförsäkringsverket",e:"2005-01-01",sfs:"1965:777,1988:1204",d:"Socialdepartementet",en:"National Social Insurance Board",sh:"RFV"},
  {n:"Rikspolisstyrelsen",s:"1984-10-01",e:"2015-01-01",sfs:"1984:731,1988:762"},
  {n:"Riksrevisionsverket",s:"1986-07-01",e:"2003-07-01",sfs:"1986:449,1988:80",d:"Finansdepartementet",sh:"RRV",w:139,m:134},
  {n:"Rikstrafiken",s:"1999-07-01",e:"2011-01-01",sfs:"1999:279,2007:1026",d:"Näringsdepartementet",sh:"RT",emp:18,fte:17,w:10,m:8,org:"202100-5059"},
  {n:"Riksutställningar",s:"1998-01-01",e:"2017-06-01",sfs:"1997:1170,2007:1187",d:"Kulturdepartementet",en:"Swedish Travelling Exhibitions",sh:"RU",emp:32,fte:25,w:19,m:12,org:"202100-4995"},
  {n:"Riksåklagaren",s:"1990-01-01",e:"2005-01-01",sfs:"1989:847"},
  {n:"Rättshjälpsnämnderna",e:"1991-01-01",sfs:"1979:978"},
  {n:"Rådet för arbetslivsforskning",s:"1995-07-01",e:"2001-01-01",sfs:"1995:865",d:"Näringsdepartementet",sh:"RALF",w:23,m:10},
  {n:"Rådet för forsknings- och utvecklingssamarbete inom EU",s:"1992-07-01",e:"2006-01-01",sfs:"1992:816",d:"Utbildnings- och kulturdepartementet",en:"The Swedish EU-R&D Council",sh:"EUFOU",emp:11,fte:11,w:5,m:7},
  {n:"Rådet för grundläggande högskoleutbildning",s:"1992-07-01",e:"1995-07-01",sfs:"1992:817"},
  {n:"Rådet för högpresterande datorsystem",s:"1994-07-01",e:"1998-01-01",sfs:"1994:945"},
  {n:"Samarbetsnämnden för statsbidrag till trossamfund",s:"1989-07-01",e:"2008-01-01",sfs:"1989:272,1999:975"},
  {n:"Samrådsnämnden för kärnavfallsfrågor",s:"1985-08-01",e:"1990-07-01",sfs:"1985:686,1988:524"},
  {n:"Sekretariatet för utvärdering av universitet och högskolor",s:"1992-07-01",e:"1993-07-01",sfs:"1992:814"},
  {n:"Signalspaningsnämnden",s:"2009-01-01",e:"2009-12-01",sfs:"2008:924",d:"Försvarsdepartementet",sh:"SSN",w:2,m:1,org:"202100-6131"},
  {n:"Sjöfartsregistret",e:"2001-12-01",sfs:"1979:593"},
  {n:"Sjösäkerhetsrådet",e:"1993-07-01",sfs:"1969:322,1988:1111"},
  {n:"Skatteför- valtningen",s:"1988-07-01",e:"1991-01-01",sfs:"1988:832"},
  {n:"Skatteförvaltningen",s:"1987-01-01",e:"2004-01-01",sfs:"1986:1346,1990:1293"},
  {n:"Skogs- och jordbrukets forskningsråd",e:"2001-01-01",sfs:"1981:532,1988:866",d:"Landsbygdsdepartementet",sh:"SJFR",w:12,m:15},
  {n:"Skogsstyrelsen och skogsvårdsstyrelserna",e:"2006-01-01",sfs:"1981:531,1988:855"},
  {n:"Smittskyddsinstitutet",s:"1993-07-01",e:"2014-01-01",sfs:"1993:110,1996:609",d:"Socialdepartementet",en:"Swedish National Institute for Infectious Disease Control",sh:"SMI",emp:291,fte:246,w:212,m:94,org:"202100-4532"},
  {n:"Socialvetenskapliga forskningsrådet",s:"1990-07-01",e:"2001-01-01",sfs:"1990:739",d:"Socialdepartementet",sh:"SFR",w:5,m:3},
  {n:"Specialpedagogiska institutet",s:"2001-07-01",e:"2008-07-01",sfs:"2001:286",d:"Utbildningsdepartementet",en:"The Swedish Institute for Special Needs Education",sh:"SIT",emp:687,fte:502,w:431,m:141,org:"202100-5265"},
  {n:"Sprängämnesinspektionen",e:"2001-10-01",sfs:"1981:499,1988:369",d:"Försvarsdepartementet",sh:"SAI",w:6,m:17},
  {n:"Språk- och folkminnesinstitutet",s:"1993-07-01",e:"2006-07-01",sfs:"1993:654"},
  {n:"Statens Strålskyddsinstitut",s:"1988-07-01",e:"2006-07-01",sfs:"1988:295",org:"202100-0571"},
  {n:"Statens arbetsgivarverk",e:"1994-07-01",sfs:"1978:813,1988:1580"},
  {n:"Statens arbetsmarknadsnämnd",e:"1989-07-01",sfs:"1979:579,1988:1106"},
  {n:"Statens arbetsmiljönämnd",e:"1993-07-01",sfs:"1982:759,1988:1141"},
  {n:"Statens bakteriologiska laboratorium",e:"1993-07-01",sfs:"1965:786,1988:1241"},
  {n:"Statens beredning för medicinsk utvärdering",s:"2003-01-01",e:"2008-01-01",sfs:"2002:1085"},
  {n:"Statens beredning för utvärdering av medicinsk metodik",s:"1992-07-01",e:"2003-01-01",sfs:"1992:851,1996:608"},
  {n:"Statens biografbyrå",e:"2011-01-01",sfs:"1965:748,1988:675",d:"Kulturdepartementet",en:"National Board of Film Classification",sh:"SB",emp:11,fte:8,w:6,m:4,org:"202100-1041"},
  {n:"Statens bostadskreditnämnd",s:"1992-01-01",e:"2012-10-01",sfs:"1991:1274,1996:125",d:"Socialdepartementet",en:"National Housing Credit Guarantee Board",sh:"BKN",emp:17,fte:16,w:7,m:8,org:"202100-4276"},
  {n:"Statens bostadsnämnd",s:"2002-08-01",e:"2006-01-01",sfs:"2002:669",d:"Miljö- och samhällsbyggnadsdepartementet",sh:"SBN",emp:4,fte:4},
  {n:"Statens chefslönenämnd",s:"1985-07-01",e:"1993-11-01",sfs:"1985:609,1988:1533"},
  {n:"Statens delegation för rymdverksamhet",e:"1988-07-01",sfs:"1977:1066"},
  {n:"Statens elektriska inspektion",s:"1983-07-01",e:"1993-01-01",sfs:"1983:592,1988:809"},
  {n:"Statens energiverk",s:"1983-07-01",e:"1991-07-01",sfs:"1983:646,1988:808"},
  {n:"Statens folkhälsoinstitut",s:"2001-07-01",e:"2014-01-01",sfs:"2001:309,2007:1214",d:"Socialdepartementet",en:"National Institute of Public Health",sh:"FHI",emp:155,fte:134,org:"202100-4383"},
  {n:"Statens förhandlingsnämnd",e:"1990-07-01",sfs:"1974:628,1988:1585"},
  {n:"Statens förlikningsmannaexpedition",e:"2000-06-01",sfs:"1967:284,1988:653"},
  {n:"Statens giftinformationscentral",e:"1988-07-01",sfs:"1982:442"},
  {n:"Statens handikappråd",e:"1994-07-01",sfs:"1979:421,1988:1094"},
  {n:"Statens hundskola",e:"1992-07-01",sfs:"1981:159,1988:654"},
  {n:"Statens industriverk",s:"1983-07-01",e:"1991-07-01",sfs:"1983:701,1988:314"},
  {n:"Statens institut för byggnadsforskning",e:"1994-01-01",sfs:"1982:200,1988:930"},
  {n:"Statens institut för ekologisk hållbarhet",s:"1999-02-01",e:"2005-01-01",sfs:"1998:1835",d:"Miljö- och samhällsbyggnadsdepartementet",en:"Swedish Institute for Ecological Sustainability",sh:"IEH",w:6,m:6},
  {n:"Statens institut för handikappfrågor i skolan",s:"1991-07-01",e:"2001-07-01",sfs:"1991:1081",d:"Utbildningsdepartementet",sh:"SIH",w:279,m:128},
  {n:"Statens institut för kommunikationsanalys",s:"1995-07-01",e:"2010-04-01",sfs:"1995:810,2007:958",d:"Näringsdepartementet",en:"Swedish Institute for Transport and Communications and Analysis",sh:"SIKA",emp:32,fte:31,w:15,m:18},
  {n:"Statens institut för läromedel",s:"1987-07-01",e:"1991-07-01",sfs:"1987:578,1988:284"},
  {n:"Statens institut för läromedelsinformation",e:"1987-07-01",sfs:"1974:440"},
  {n:"Statens institut för personalutveckling",s:"1985-01-01",e:"1992-07-01",sfs:"1984:1004,1988:1006"},
  {n:"Statens institut för psykosocial miljömedicin",e:"1996-07-01",sfs:"1980:303,1988:1242"},
  {n:"Statens institut för regionalforskning",s:"1993-02-15",e:"2001-01-01",sfs:"1993:46",w:4,m:9},
  {n:"Statens institut för särskilt utbildningsstöd",s:"1989-01-01",e:"2006-01-01",sfs:"1988:1126,2000:755",d:"Socialdepartementet",en:"National Agency for Special Educational Support",sh:"SISUS",emp:19,fte:16,w:16,m:5},
  {n:"Statens invandrarverk",e:"1988-07-01",sfs:"1969:137"},
  {n:"Statens jordbruksnämnd",e:"1991-07-01",sfs:"1965:799,1988:856"},
  {n:"Statens järnvägar",s:"1985-07-01",e:"2013-01-01",sfs:"1985:445,1988:626",d:"Näringsdepartementet",en:"Swedish State Railways",sh:"ASJ",emp:6,fte:5,w:3,m:3,org:"202100-0787"},
  {n:"Statens konstmuseer",e:"1999-07-01",sfs:"1976:439,1988:677"},
  {n:"Statens krigsförsäkringsnämnd",s:"1989-01-01",e:"2000-01-01",sfs:"1988:1565"},
  {n:"Statens krigsskadenämnd",e:"2000-01-01",sfs:"1959:484,1988:1566"},
  {n:"Statens kriminaltekniska laboratorium",e:"2015-01-01",sfs:"1978:677"},
  {n:"Statens kvalitets- och kompetensråd",s:"1999-01-01",e:"2006-01-01",sfs:"1998:1647",w:7,m:4},
  {n:"Statens kärnbränslenämnd",e:"1992-07-01",sfs:"1981:672,1988:296"},
  {n:"Statens kärnkraftinspektion",e:"2008-07-01",sfs:"1974:427,1988:523",d:"Miljödepartementet",en:"Swedish Nuclear Power Inspectorate",sh:"SKI",emp:129,fte:118,w:48,m:82,org:"202100-2544"},
  {n:"Statens lantbrukskemiska laboratorium",s:"1984-07-01",e:"1991-07-01",sfs:"1984:471,1988:859"},
  {n:"Statens livsmedelsverk",e:"2002-02-01",sfs:"1971:808,1988:857"},
  {n:"Statens ljud- och bildarkiv",s:"1996-07-01",e:"2009-01-01",sfs:"1996:503,2007:1067",d:"Utbildningsdepartementet",en:"The National Archive of Recorded Sound and Moving Images",sh:"ALB",emp:84,fte:82,w:34,m:38},
  {n:"Statens lokalförsörjningsverk",s:"1993-01-01",e:"1998-01-01",sfs:"1992:1532,1996:826"},
  {n:"Statens löne- och pensionsverk",s:"1986-07-01",e:"1997-05-01",sfs:"1986:599,1988:113"},
  {n:"Statens maritima museer",s:"1990-07-01",e:"2008-01-01",sfs:"1990:571"},
  {n:"Statens maskinprovningar",s:"1983-10-25",e:"1996-07-01",sfs:"1983:816,1988:858"},
  {n:"Statens miljömedicinska laboratorium",e:"1988-07-01",sfs:"1980:571"},
  {n:"Statens musiksamlingar",e:"2011-05-01",sfs:"1981:504,1988:1184"},
  {n:"Statens mät- och provråd",s:"1983-07-01",e:"1989-07-01",sfs:"1983:695"},
  {n:"Statens naturvårdsverk",e:"1988-07-01",sfs:"1967:444"},
  {n:"Statens nämnd för internationella adoptionsfrågor",e:"2005-01-01",sfs:"1981:681,1988:1128",d:"Socialdepartementet",en:"National Board for Intercountry Adoptions (NIA)",sh:"NIA",w:7,m:2},
  {n:"Statens oljelager",s:"1994-07-01",e:"1998-01-01",sfs:"1994:1007,1996:226"},
  {n:"Statens pensionsverk",s:"1997-05-01",e:"2008-01-01",sfs:"1997:131"},
  {n:"Statens person- och adressregisternämnd",s:"1986-07-01",e:"1998-10-24",sfs:"1986:547,1988:1101"},
  {n:"Statens personadressregisternämnd",s:"1998-10-24",e:"2009-01-01",sfs:"1998:1235,2007:784",org:"202100-3922"},
  {n:"Statens planverk",e:"1988-07-01",sfs:"1967:329"},
  {n:"Statens planverks råd för samhällsplanering",e:"1988-07-01",sfs:"1979:670"},
  {n:"Statens planverks råd för stål- och betongnormer",e:"1988-07-01",sfs:"1978:849"},
  {n:"Statens planverks tekniska råd",e:"1988-07-01",sfs:"1980:411"},
  {n:"Statens pris- och kartellnämnd",s:"1983-07-01",e:"1988-10-01",sfs:"1983:407"},
  {n:"Statens pris- och konkurrensverk",s:"1988-10-01",e:"1992-07-01",sfs:"1988:980"},
  {n:"Statens provningsanstalt",s:"1984-03-01",e:"1993-07-01",sfs:"1984:49,1988:344"},
  {n:"Statens psykologisk-pedagogiska bibliotek",e:"2000-01-01",sfs:"1980:393,1988:679"},
  {n:"Statens räddningsverk",s:"1986-07-01",e:"2009-01-01",sfs:"1986:424,1988:1040",d:"Försvarsdepartementet",en:"Swedish Rescue Services Agency",sh:"SRV",emp:947,fte:780,w:409,m:621,org:"202100-3914"},
  {n:"Statens rättskemiska laboratorium",e:"1991-07-01",sfs:"1977:566,1988:1237"},
  {n:"Statens rättsläkarstationer",s:"1989-01-01",e:"1991-07-01",sfs:"1988:1238"},
  {n:"Statens rättspsykiatriska kliniker och stationer",s:"1989-01-01",e:"1991-10-01",sfs:"1988:1239"},
  {n:"Statens råd för byggnadsforskning",s:"1983-08-01",e:"1988-07-01",sfs:"1983:733"},
  {n:"Statens sjöhistoriska museum",e:"1990-07-01",sfs:"1965:698,1988:687"},
  {n:"Statens skolor för vuxna",s:"2001-07-01",e:"2002-01-01",sfs:"2001:281",w:99,m:67},
  {n:"Statens strålskyddsinstitut",e:"2008-07-01",sfs:"1976:481,2006:524",d:"Miljödepartementet",en:"National Radiation Protection Authority",sh:"SSI",emp:122,fte:117,w:57,m:61,org:"202100-0571"},
  {n:"Statens telenämnd",s:"1989-07-01",e:"1992-07-01",sfs:"1989:600"},
  {n:"Statens tjänstebostadsnämnd",s:"1984-07-01",e:"2000-01-01",sfs:"1984:538,1988:1105"},
  {n:"Statens tjänstepensionsnämnd",e:"1988-06-01",sfs:"1975:63"},
  {n:"Statens trygghetsnämnd",s:"1988-03-01",e:"2002-07-01",sfs:"1988:65,1990:481"},
  {n:"Statens ungdomsråd",e:"1994-09-01",sfs:"1976:527,1988:1136"},
  {n:"Statens utlandslönenämnd",s:"1985-10-01",e:"2010-01-01",sfs:"1985:713,1988:1534",org:"202100-5844"},
  {n:"Statens utsädeskontroll",e:"2006-01-01",sfs:"1978:249,1988:860",d:"Landsbygdsdepartementet",en:"Swedish Seed Testing and Certification Institute",sh:"SUK",emp:82,fte:54,w:49,m:32},
  {n:"Statens va-nämnd",s:"2008-01-01",e:"2016-01-01",sfs:"2007:1058",d:"Miljödepartementet",en:"The Swedish Water Supply and Sewage Tribunal",sh:"VAN",emp:9,fte:8,org:"202100-4029"},
  {n:"Statens vattenfallsverk",e:"1992-01-01",sfs:"1982:705,1988:851"},
  {n:"Statens väg- och trafikinstitut",e:"1993-07-01",sfs:"1971:233,1988:629"},
  {n:"Statens växtsortnämnd",e:"2006-01-01",sfs:"1971:395,1988:865",d:"Landsbygdsdepartementet",sh:"SVN",emp:2,fte:2,w:1,m:3},
  {n:"Statsförvaltningens centrala förslagsnämnd",e:"1995-07-01",sfs:"1981:607,1988:1103"},
  {n:"Statsrådslönenämnden",s:"1984-12-21",e:"1991-09-01",sfs:"1984:1005,1988:1532"},
  {n:"Steriliseringsersättningsnämnden",s:"1999-07-01",e:"2003-12-01",sfs:"1999:614",d:"Socialdepartementet",sh:"SEN",w:1},
  {n:"Stiftsnämnderna",e:"1989-07-01",sfs:"1971:862"},
  {n:"Studiemedelsnämnderna",e:"1992-07-01",sfs:"1965:745,1988:1196"},
  {n:"Styrelsen för Sverigebilden",s:"1992-07-01",e:"1995-07-01",sfs:"1992:584"},
  {n:"Styrelsen för internationell utveckling",e:"1995-07-01",sfs:"1973:687,1988:531"},
  {n:"Styrelsen för internationellt näringslivsbistånd",s:"1991-07-01",e:"1995-07-01",sfs:"1991:840"},
  {n:"Styrelsen för lokalradiotillstånd",s:"1993-03-15",e:"1994-07-01",sfs:"1993:127"},
  {n:"Styrelsen för psykologiskt försvar",s:"1985-07-01",e:"2009-01-01",sfs:"1985:476,1988:853",d:"Försvarsdepartementet",en:"National Board of Psychological Defence",sh:"SPF",emp:14,fte:14,w:4,m:5,org:"202100-0498"},
  {n:"Styrelsen för riksfärdtjänst",s:"1992-01-01",e:"1994-01-01",sfs:"1991:1812"},
  {n:"Styrelsen för teknisk utveckling",e:"1991-07-01",sfs:"1979:113,1988:404"},
  {n:"Styrelsen för u-landsforskning",s:"1988-09-01",e:"1995-07-01",sfs:"1988:532"},
  {n:"Styrelsen för u-landsforskning (Swedish Agency for Research Cooperation with Developing Countries, SAREC)",e:"1988-09-01",sfs:"1979:832"},
  {n:"Styrelsen för u-landsutbildning i Sandö (Sandö U-centrum)",s:"1987-07-01",e:"1995-07-01",sfs:"1987:601,1988:533"},
  {n:"Stängselnämnden",e:"2009-01-01",sfs:"1975:1012"},
  {n:"Svenska EU-programkontoret för utbildning och kompetensutveckling",s:"1998-01-01",e:"2000-01-01",sfs:"1997:1231"},
  {n:"Svenska Unescorådet",s:"2008-01-01",e:"2012-01-01",sfs:"2007:950"},
  {n:"Svenska insitutet för europapolitiska studier",s:"2006-08-01",e:"2008-01-01",sfs:"2006:948"},
  {n:"Svenska unescorådet",s:"1989-01-01",e:"2008-01-01",sfs:"1988:1462,1996:646"},
  {n:"Svenskt biografiskt lexikon",s:"1986-07-01",e:"2009-01-01",sfs:"1986:537,1988:630",d:"Kulturdepartementet",en:"Dictionary of Swedish National Biography",sh:"SBL",emp:7,fte:6,w:2,m:3,org:"202100-1165"},
  {n:"Talboks- och punktskriftsbiblioteket",e:"2010-08-01",sfs:"1979:1073,1988:341"},
  {n:"Taltidningsnämnden",s:"1988-07-01",e:"2010-08-01",sfs:"1988:674,2007:1189",org:"202100-5935"},
  {n:"Teknikvetenskapliga forskningsrådet",s:"1990-07-01",e:"1993-07-01",sfs:"1990:730",d:"Utbildningsdepartementet",sh:"TFR",w:8,m:7},
  {n:"Teleanslutningsnämnden",e:"1990-01-01",sfs:"1981:997"},
  {n:"Telestyrelsen",s:"1992-07-01",e:"1994-03-01",sfs:"1992:895"},
  {n:"Televerket",s:"1986-01-01",e:"1993-07-01",sfs:"1985:764,1988:348"},
  {n:"Tjänsteförslagsnämnden för domstolsväsendet",e:"2008-07-01",sfs:"1975:507,1988:318"},
  {n:"Tjänsteförslagsnämnden för åklagarväsendet",s:"1993-07-01",e:"1999-01-01",sfs:"1993:523"},
  {n:"Tomtebodaskolans resurscenter",s:"1989-01-01",e:"2001-07-01",sfs:"1988:1384,2000:451",d:"Utbildningsdepartementet",sh:"TRC",w:46,m:12},
  {n:"Totalförsvarets chefsnämnd",s:"1985-07-01",e:"2002-01-01",sfs:"1985:477,1988:1041",d:"Försvarsdepartementet",sh:"TCN",w:13,m:5},
  {n:"Totalförsvarets pliktverk",s:"1995-07-01",e:"2011-01-01",sfs:"1995:648,2007:1263"},
  {n:"Totalförsvarets tjänstepliktsnämnd",s:"1989-10-01",e:"1995-07-01",sfs:"1989:759"},
  {n:"Trafiksäkerhetsverket",s:"1985-07-01",e:"1993-01-01",sfs:"1985:345,1988:282"},
  {n:"Transportforskningsberedningen",s:"1984-07-01",e:"1993-07-01",sfs:"1984:483,1988:708"},
  {n:"Transportrådet",e:"1992-01-01",sfs:"1979:1037,1988:1179"},
  {n:"Trollhätte kanalverk",s:"1992-01-01",e:"1994-01-01",sfs:"1991:2014"},
  {n:"Trygghetsnämnden",s:"1984-04-01",e:"1988-03-01",sfs:"1984:109"},
  {n:"Turistdelegationen",s:"1995-07-01",e:"2006-01-01",sfs:"1995:950",d:"Näringsdepartementet",en:"Swedish Tourist Authority",sh:"TD",emp:9,fte:7,w:5,m:2},
  {n:"Ungdomsstyrelsen",s:"1994-09-01",e:"2008-01-01",sfs:"1994:1202,1994:1389"},
  {n:"Universitets- och högskoleämbetet",e:"1992-07-01",sfs:"1976:702,1988:670"},
  {n:"Utlänningsnämnden",s:"1992-01-01",e:"2006-03-31",sfs:"1991:1817",w:220,m:93},
  {n:"Utrikesdepartementet",e:"1997-01-01",sfs:"1982:1282,1996:728",d:"Utrikesdepartementet",sh:"RK/UD"},
  {n:"Utrikesdepartementets antagningsnämnd",e:"1991-07-01",sfs:"1977:37"},
  {n:"Utrustningsnämnden för universitet och högskolor",e:"1992-07-01",sfs:"1978:498,1988:680"},
  {n:"Utskrivningsnämnderna",e:"1992-01-01",sfs:"1966:566"},
  {n:"Valideringsdelegationen",s:"2004-01-01",e:"2008-01-01",sfs:"2003:1096",d:"Utbildningsdepartementet",en:"National Commission on Validation",sh:"VALID",emp:12,fte:8,w:4,m:6},
  {n:"Vapenfrinämnden",s:"1988-12-01",e:"1989-10-01",sfs:"1988:1038"},
  {n:"Vapenfristyrelsen",s:"1989-10-01",e:"1995-07-01",sfs:"1989:757"},
  {n:"Verket för förvaltningsutveckling",s:"2006-01-01",e:"2009-01-01",sfs:"2005:860,2007:828",d:"Finansdepartementet",en:"Swedish Administrative Development Agency",sh:"VERVA",emp:90,fte:82,w:56,m:28,org:"202100-5596"},
  {n:"Verket för högskoleservice",s:"1992-07-01",e:"2013-01-01",sfs:"1992:397,1995:943",d:"Utbildningsdepartementet",en:"National Agency for Services to Universities and University Colle",sh:"VHS",emp:106,fte:102,org:"202100-4367"},
  {n:"Verket för näringslivsutveckling",s:"2001-01-01",e:"2009-04-01",sfs:"2000:1178,2007:1155",d:"Näringsdepartementet",en:"Nutek,Swedish Agency for Economic and Regional Growth",sh:"NUTEK",emp:305,fte:289,w:191,m:129},
  {n:"Vuxenutbildningsnämnderna",e:"1992-07-01",sfs:"1975:394,1988:1197"},
  {n:"Vägverket",e:"2010-04-01",sfs:"1967:258,1988:1074",d:"Näringsdepartementet",en:"Swedish National Road Administration",sh:"VV",emp:2919,fte:2684,w:1173,m:1999,org:"202100-0639"},
  {n:"Värnpliktsnämnden",e:"1989-10-01",sfs:"1979:3,1988:1037"},
  {n:"Värnpliktsverket",s:"1994-07-01",e:"1995-07-01",sfs:"1994:645"},
  {n:"Växtförädlingsnämnden",e:"1990-01-01",sfs:"1979:300,1988:861"},
  {n:"Yrkesinspektionen",e:"1987-07-01",sfs:"1973:847"},
  {n:"Åsbackaskolans resurscenter",s:"2000-07-01",e:"2001-07-01",sfs:"2000:450",w:7,m:2},
  {n:"Överklagandenämnden för totalförsvaret",s:"1995-07-01",e:"2008-01-01",sfs:"1995:625",d:"Försvarsdepartementet",en:"Appeals Bord for the Total Defence",sh:"ONT",w:3,m:3},
  {n:"Överstyrelsen för civil beredskap",s:"1986-07-01",e:"2002-07-01",sfs:"1986:423,1988:1122",w:91,m:113},
  {n:"Överåklagarnämnden för nämndemannauppdrag",s:"2006-07-01",e:"2008-01-01",sfs:"2006:853"}
];

export default function MyndigheterV6() {
  // External data fetching with caching
  const { data: externalData, loading: dataLoading, error: dataError, refresh: refreshData, cacheInfo } = useAgencyData();

  // Use external data if available, otherwise fall back to embedded data
  const currentAgenciesData = externalData || agenciesData;

  // FIX #29: URL-baserad state för delning
  const [activeView, setActiveView] = useUrlState('view', 'overview');
  const [yearRange, setYearRange] = useUrlState('years', [1978, 2025]);
  const [registrySearch, setRegistrySearch] = useUrlState('search', '');
  const [departmentFilter, setDepartmentFilter] = useUrlState('dept', 'all');

  const [showRegistry, setShowRegistry] = useState(false);
  const [showGovernments, setShowGovernments] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [chartType, setChartType] = useState('area');
  const [chartMetric, setChartMetric] = useState('count');
  const [showDissolved, setShowDissolved] = useState(false);
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
  
  const [copyFeedback, setCopyFeedback] = useState(null);
  const ITEMS_PER_PAGE = 20;
  
  // FIX #14: Info modal för FTE
  const [showFteInfo, setShowFteInfo] = useState(false);
  
  const activeAgencies = useMemo(() => currentAgenciesData.filter(a => !a.e), [currentAgenciesData]);
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
      a.n.toLowerCase().includes(search) ||
      a.sh?.toLowerCase().includes(search) ||
      a.en?.toLowerCase().includes(search)
    ).slice(0, 8);
  }, [searchInput, currentAgenciesData]);

  // FIX #6 & #7: Korrekt loading och filtrering
  const filteredAgencies = useMemo(() => {
    let result = [...currentAgenciesData];
    
    if (registrySearch) {
      const search = registrySearch.toLowerCase();
      result = result.filter(a => 
        a.n.toLowerCase().includes(search) || 
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
      if (registrySort === 'name') return a.n.localeCompare(b.n, 'sv');
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

  // FIX #15 & #17: Bättre kontrast, inga gradient-text
  const cardStyle = 'bg-white border border-gray-200 shadow-sm';
  const headingStyle = 'font-bold text-gray-900';

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
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {agency.d.replace('departementet', '').trim()}
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
              {agency.str && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Struktur:</span>
                  <span className="font-medium">{agency.str}</span>
                </div>
              )}
              {agency.cof && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">COFOG:</span>
                  <span className="font-medium">{cofogNames[agency.cof]}</span>
                </div>
              )}
              {agency.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{agency.city}</span>
                </div>
              )}
              {agency.s && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Bildad {agency.s.split('-')[0]}</span>
                </div>
              )}
            </div>
            
            {/* Kontakt */}
            {(agency.tel || agency.web) && (
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

  // Show loading state while fetching external data (only if no fallback data)
  if (dataLoading && !agenciesData.length) {
    return <LoadingState message="Hämtar myndighetsdata..." />;
  }

  // Show error state if fetch failed and no fallback data
  if (dataError && !agenciesData.length) {
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
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              onClick={refreshData}
              disabled={dataLoading}
              className="px-3 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-2 min-h-[44px] disabled:opacity-50"
              title="Uppdatera data från extern källa"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Exportera CSV
            </button>
          </div>
        </div>

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
              { id: 'gender', label: 'Kön', icon: Users },
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
          <div className={`${cardStyle} rounded-xl p-6`}>
            <h3 className={`${headingStyle} text-lg mb-4`}>Geografisk fördelning</h3>
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
                  <div key={r.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: r.color }} />
                      <span className="font-medium">{r.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">{r.value}</span>
                      <span className="text-gray-500 text-sm ml-1">({Math.round(r.value / activeAgencies.length * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              <Info className="w-4 h-4 inline mr-1" />
              Majoriteten av myndigheterna är lokaliserade i Stockholmsområdet. Regeringen har en uttalad ambition att sprida statliga jobb i landet.
            </p>
          </div>
        )}

        {/* Dashboard med trendpilar (FIX #12) */}
        {activeView === 'dashboard' && (
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
                  <stat.icon className="w-5 h-5 text-blue-600" />
                  {stat.trend && <TrendArrow current={stat.trend.current} previous={stat.trend.previous} />}
                </div>
                <AnimatedNumber 
                  value={stat.value} 
                  suffix={stat.suffix || ''} 
                  className="text-3xl font-bold text-gray-900" 
                />
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Departement */}
        {activeView === 'departments' && (
          <div className="space-y-6">
            <div className={`${cardStyle} rounded-xl p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className={`${headingStyle} text-lg`}>Myndigheter per departement</h3>
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
                    width={180} 
                    tick={{ fontSize: 12 }}
                    tickFormatter={n => n.replace('departementet', '').trim()}
                  />
                  <Tooltip 
                    formatter={(v) => [deptSortBy === 'emp' ? v.toLocaleString('sv-SE') : v, deptSortBy === 'emp' ? 'Anställda' : 'Myndigheter']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
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
          </div>
        )}

        {/* Könsfördelning */}
        {activeView === 'gender' && (
          <div className={`${cardStyle} rounded-xl p-6`}>
            <h3 className={`${headingStyle} text-lg mb-4`}>Könsfördelning i staten 1990–2024</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={genderHistoryData}>
                <defs>
                  <linearGradient id="colorW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(v, n) => [v.toLocaleString('sv-SE'), n === 'w' ? 'Kvinnor' : 'Män']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="w" name="Kvinnor" stroke="#ec4899" strokeWidth={2} fill="url(#colorW)" />
                <Area type="monotone" dataKey="m" name="Män" stroke="#3b82f6" strokeWidth={2} fill="url(#colorM)" />
                <Legend />
                <ReferenceArea y1={118000} y2={122000} fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-800">
                <strong>2008:</strong> Jämställdhet uppnåddes – för första gången var könsfördelningen 50/50 i staten.
                <br />
                <strong>2024:</strong> 53,1% kvinnor bland statligt anställda.
              </p>
            </div>
          </div>
        )}

        {/* Jämförelse */}
        {activeView === 'compare' && (
          <div className="space-y-6">
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
          <div className="space-y-6">
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
                
                <label className="flex items-center gap-2 cursor-pointer ml-auto">
                  <input 
                    type="checkbox" 
                    checked={showDissolved} 
                    onChange={e => setShowDissolved(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Visa nedlagda</span>
                </label>
              </div>
            </div>

            {/* Graf */}
            <div className={`${cardStyle} rounded-xl p-6`}>
              <h3 className={`${headingStyle} mb-4`}>
                {chartMetric === 'emp' ? 'Antal anställda' : 'Antal myndigheter'} {yearRange[0]}–{isAnimating ? animationYear : yearRange[1]}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart 
                  data={timeSeriesData.filter(d => d.year >= yearRange[0] && d.year <= (isAnimating ? animationYear : yearRange[1]))}
                  onClick={(e) => e?.activePayload && setSelectedYear(e.activePayload[0]?.payload?.year)}
                >
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis 
                    domain={chartMetric === 'emp' ? ['auto', 'auto'] : [150, 300]}
                    tickFormatter={chartMetric === 'emp' ? (v => `${(v/1000).toFixed(0)}k`) : undefined}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(v, name) => [
                      chartMetric === 'emp' ? v?.toLocaleString('sv-SE') : v,
                      name === 'dissolved' ? 'Nedlagda' : (chartMetric === 'emp' ? 'Anställda' : 'Myndigheter')
                    ]}
                  />
                  {showGovernments && governmentPeriods
                    .filter(p => p.end > yearRange[0] && p.start < yearRange[1])
                    .map((p, i) => (
                      <ReferenceArea
                        key={i}
                        x1={Math.max(p.start, yearRange[0])}
                        x2={Math.min(p.end, isAnimating ? animationYear : yearRange[1])}
                        fill={p.party === 'S' ? '#ef4444' : '#3b82f6'}
                        fillOpacity={0.08}
                      />
                    ))
                  }
                  {chartType === 'bar' ? (
                    <Bar dataKey={chartMetric === 'emp' ? 'emp' : 'count'} fill="#3b82f6" radius={[2,2,0,0]} cursor="pointer" />
                  ) : chartType === 'line' ? (
                    <Line type="monotone" dataKey={chartMetric === 'emp' ? 'emp' : 'count'} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} cursor="pointer" />
                  ) : (
                    <Area type="monotone" dataKey={chartMetric === 'emp' ? 'emp' : 'count'} stroke="#3b82f6" strokeWidth={2} fill="url(#colorMain)" cursor="pointer" />
                  )}
                  {showDissolved && (
                    <Line type="monotone" dataKey="dissolved" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-500 text-center mt-2">Klicka på ett år för att se bildade/nedlagda myndigheter</p>
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
              <div className="p-4 space-y-3">
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
                      <option key={d} value={d}>{d.replace('departementet', '').trim()}</option>
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
