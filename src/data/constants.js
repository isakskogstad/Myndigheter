// Static constants and configuration data

// Department colors for charts and UI
// Modern, professional palette aligned with design system
export const deptColors = {
  "Justitiedepartementet": "#0c80f0",      // Primary blue - law & order
  "Finansdepartementet": "#059669",         // Emerald green - money/finance
  "Utbildningsdepartementet": "#7c3aed",   // Purple - education/knowledge
  "Socialdepartementet": "#be185d",         // Rose - social/health care
  "Klimat- och näringslivsdepartementet": "#0d9488", // Teal - environment/business
  "Kulturdepartementet": "#8b5cf6",         // Violet - culture/arts
  "Försvarsdepartementet": "#475569",       // Slate gray - military/defense
  "Arbetsmarknadsdepartementet": "#0891b2", // Cyan - labor market
  "Landsbygds- och infrastrukturdepartementet": "#65a30d", // Lime - rural/infrastructure
  "Utrikesdepartementet": "#0284c7",        // Sky blue - foreign affairs
  "Statsrådsberedningen": "#dc2626"         // Red - prime minister's office (importance)
};

// Region colors for geographic distribution
// Distinct, accessible colors for map/chart visualization
export const regionColors = {
  "Stockholm": "#0c80f0",    // Primary blue - capital
  "Göteborg": "#059669",     // Emerald - west coast
  "Malmö": "#d97706",        // Amber - south
  "Uppsala": "#7c3aed",      // Purple - university city
  "Övrigt": "#78716c"        // Warm gray - other regions
};

// COFOG (Classification of Functions of Government) names
export const cofogNames = {
  1: "Allmän offentlig förvaltning",
  2: "Försvar",
  3: "Samhällsskydd & rättsskipning",
  4: "Näringslivsfrågor",
  5: "Miljöskydd",
  6: "Bostäder & samhällsutveckling",
  7: "Hälso- och sjukvård",
  8: "Fritid, kultur & religion",
  9: "Utbildning",
  10: "Socialt skydd"
};

// Swedish government periods (for timeline visualization)
export const governmentPeriods = [
  { start: 1978, end: 1982, party: 'borgerlig' },
  { start: 1982, end: 1991, party: 'S' },
  { start: 1991, end: 1994, party: 'borgerlig' },
  { start: 1994, end: 2006, party: 'S' },
  { start: 2006, end: 2014, party: 'borgerlig' },
  { start: 2014, end: 2022, party: 'S' },
  { start: 2022, end: 2026, party: 'borgerlig' },
];

// Time series data for historical agency counts
// Employee data (emp) from AGV aggregated totals 1980-2024
// Source: https://github.com/civictechsweden/myndighetsdata (agv.json)
export const timeSeriesData = [
  {year:1978,count:178,dissolved:0},{year:1979,count:178,dissolved:0},
  {year:1980,count:178,dissolved:0,emp:298674},{year:1981,count:178,dissolved:0,emp:306176},
  {year:1982,count:178,dissolved:0,emp:307168},{year:1983,count:189,dissolved:0,emp:305638},
  {year:1984,count:204,dissolved:0,emp:299593},{year:1985,count:221,dissolved:0,emp:300036},
  {year:1986,count:245,dissolved:0,emp:300966},{year:1987,count:263,dissolved:6,emp:299733},
  {year:1988,count:284,dissolved:30,emp:299417},{year:1989,count:277,dissolved:13,emp:299543},
  {year:1990,count:274,dissolved:10,emp:303427},{year:1991,count:279,dissolved:28,emp:299773},
  {year:1992,count:275,dissolved:16,emp:291946},{year:1993,count:276,dissolved:20,emp:281830},
  {year:1994,count:276,dissolved:27,emp:230750},{year:1995,count:265,dissolved:23,emp:248328},
  {year:1996,count:252,dissolved:11,emp:243958},{year:1997,count:245,dissolved:7,emp:238616},
  {year:1998,count:252,dissolved:6,emp:234810},{year:1999,count:257,dissolved:9,emp:233932},
  {year:2000,count:257,dissolved:12,emp:226522},{year:2001,count:261,dissolved:23,emp:214015},
  {year:2002,count:245,dissolved:8,emp:222146},{year:2003,count:242,dissolved:5,emp:225013},
  {year:2004,count:246,dissolved:5,emp:225298},{year:2005,count:245,dissolved:6,emp:236300},
  {year:2006,count:249,dissolved:16,emp:242684},{year:2007,count:234,dissolved:7,emp:242068},
  {year:2008,count:264,dissolved:35,emp:237589},{year:2009,count:241,dissolved:25,emp:235980},
  {year:2010,count:223,dissolved:10,emp:236394},{year:2011,count:221,dissolved:7,emp:240509},
  {year:2012,count:215,dissolved:2,emp:244774},{year:2013,count:221,dissolved:8,emp:249255},
  {year:2014,count:216,dissolved:3,emp:252927},{year:2015,count:216,dissolved:3,emp:253809},
  {year:2016,count:213,dissolved:6,emp:257220},{year:2017,count:208,dissolved:2,emp:262654},
  {year:2018,count:212,dissolved:3,emp:262067},{year:2019,count:211,dissolved:2,emp:264287},
  {year:2020,count:210,dissolved:0,emp:269146},{year:2021,count:210,dissolved:0,emp:273666},
  {year:2022,count:213,dissolved:0,emp:280685},{year:2023,count:214,dissolved:1,emp:287131},
  {year:2024,count:215,dissolved:0,emp:294146},{year:2025,count:215,dissolved:0,emp:301000},
];

// Gender history data 1990-2024
export const genderHistoryData = [
  {year:1990,w:131210,m:172200,pct:43.2},{year:1991,w:131502,m:168253,pct:43.9},
  {year:1992,w:127879,m:164051,pct:43.8},{year:1993,w:123043,m:158772,pct:43.7},
  {year:1994,w:94925,m:135817,pct:41.1},{year:1995,w:102391,m:145929,pct:41.2},
  {year:1996,w:100506,m:143451,pct:41.2},{year:1997,w:99042,m:139573,pct:41.5},
  {year:1998,w:98967,m:135842,pct:42.1},{year:1999,w:99717,m:134213,pct:42.6},
  {year:2000,w:98740,m:127778,pct:43.6},{year:2001,w:96159,m:117855,pct:44.9},
  {year:2002,w:100463,m:121681,pct:45.2},{year:2003,w:102345,m:122667,pct:45.5},
  {year:2004,w:103230,m:122067,pct:45.8},{year:2005,w:114485,m:121809,pct:48.5},
  {year:2006,w:120230,m:122454,pct:49.5},{year:2007,w:120489,m:121577,pct:49.8},
  {year:2008,w:118677,m:118908,pct:50.0},{year:2009,w:119457,m:116512,pct:50.6},
  {year:2010,w:121394,m:114992,pct:51.4},{year:2011,w:123212,m:117277,pct:51.2},
  {year:2012,w:126223,m:118542,pct:51.6},{year:2013,w:128388,m:120845,pct:51.5},
  {year:2014,w:130397,m:122505,pct:51.6},{year:2015,w:130996,m:122793,pct:51.6},
  {year:2016,w:133895,m:123300,pct:52.1},{year:2017,w:136856,m:125764,pct:52.1},
  {year:2018,w:137004,m:125049,pct:52.3},{year:2019,w:138018,m:126263,pct:52.2},
  {year:2020,w:140918,m:128221,pct:52.4},{year:2021,w:144675,m:128981,pct:52.9},
  {year:2022,w:149113,m:131569,pct:53.1},{year:2023,w:153178,m:133943,pct:53.3},
  {year:2024,w:156096,m:138039,pct:53.1},
];

// Historical agency name changes and events
export const agencyHistory = {
  "Arbetsförmedlingen": [{ year: 2008, event: "Bildades genom sammanslagning av AMS och länsarbetsnämnderna" }],
  "Polismyndigheten": [{ year: 2015, event: "Ersatte 21 polismyndigheter + Rikspolisstyrelsen" }],
  "Försäkringskassan": [{ year: 2005, event: "Ersatte Riksförsäkringsverket och de allmänna försäkringskassorna" }],
  "Skatteverket": [{ year: 2004, event: "Ersatte Riksskatteverket och skattemyndigheterna" }],
  "Trafikverket": [{ year: 2010, event: "Ersatte Banverket och Vägverket" }],
};

// App configuration
export const config = {
  defaultYearRange: [1978, 2025],
  animationDuration: 400,
  cacheKey: 'myndigheter_data_cache',
  cacheDurationHours: 24,
};
