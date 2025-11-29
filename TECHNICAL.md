# Svenska Myndigheter - Teknisk Dokumentation

> Interaktivt visualiseringsverktyg för svenska statliga myndigheter 1978-2025

**Live:** https://isakskogstad.github.io/myndigheter

---

## 1. Teknisk Översikt

### 1.1 Tech Stack

| Kategori | Teknologi | Version |
|----------|-----------|---------|
| **Framework** | React | 18.2.0 |
| **Build Tool** | Create React App | 5.0.1 |
| **Styling** | TailwindCSS | 3.4.18 |
| **Charts** | Recharts | 3.5.1 |
| **Icons** | Lucide React | 0.555.0 |
| **Hosting** | GitHub Pages | - |
| **CI/CD** | GitHub Actions | - |

### 1.2 Projektstruktur

```
myndigheter/
├── public/
│   ├── index.html              # HTML-template
│   ├── manifest.json           # PWA manifest
│   └── favicon.ico             # Favicon
│
├── src/
│   ├── index.js                # Entry point
│   ├── index.css               # Global CSS + Tailwind + Design System
│   ├── App.js                  # Root component (ErrorBoundary wrapper)
│   ├── MyndigheterApp.jsx      # Huvudkomponent (~2500 rader)
│   │
│   ├── components/
│   │   ├── IntroSection.jsx    # Kollapsbar intro med datakällor
│   │   ├── SeriesSelector.jsx  # Checkbox-väljare för tidsserier
│   │   ├── RegionHistoryChart.jsx  # Historisk regionfördelning
│   │   ├── DeptHistoryChart.jsx    # Historisk departementsfördelning
│   │   └── LoadingState.jsx    # Loading/Error states
│   │
│   ├── data/
│   │   ├── constants.js        # Statiska data (tidsserier, färger, config)
│   │   ├── fetchData.js        # API-anrop till GitHub + transform
│   │   └── swedenStats.js      # Befolkning & BNP 1978-2025
│   │
│   └── hooks/
│       └── useAgencyData.js    # Custom hook för datahämtning + cache
│
├── .github/workflows/
│   ├── deploy.yml              # Auto-deploy till GitHub Pages
│   ├── claude.yml              # Claude Code integration
│   └── claude-code-review.yml  # Automatisk PR-review
│
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── TECHNICAL.md                # Denna fil
```

### 1.3 Kodfiler - Detaljerad Beskrivning

#### `src/MyndigheterApp.jsx` (Huvudkomponent)
- **Storlek:** ~2500 rader, ~96KB
- **Ansvar:** All huvudlogik, state management, rendering
- **Struktur:**
  - Rad 1-50: Imports och hjälpfunktioner
  - Rad 50-200: Skeleton loaders och UI-komponenter
  - Rad 200-400: Custom hooks (slider, keyboard navigation)
  - Rad 400-700: State declarations och derived data
  - Rad 700-1500: Event handlers och business logic
  - Rad 1500-2500: JSX rendering

#### `src/data/constants.js`
```javascript
// Exporterar:
- deptColors          // Färgkoder per departement
- regionColors        // Färgkoder per region
- cofogNames          // COFOG-klassificering (1-10)
- governmentPeriods   // Regeringsperioder 1978-2026
- timeSeriesData      // Antal myndigheter + anställda per år
- genderHistoryData   // Könsfördelning 1990-2024
- agencyHistory       // Historiska händelser per myndighet
- config              // App-konfiguration
```

#### `src/data/fetchData.js`
```javascript
// Exporterar:
- fetchAllAgencyData()      // Hämtar merged.json + wd.json från GitHub
- transformAgencyData()     // Transformerar till kompakt format
- clearCache()              // Rensar localStorage-cache
- getCacheInfo()            // Cache-metadata
```

#### `src/hooks/useAgencyData.js`
```javascript
// Exporterar:
- useAgencyData()     // Hook: { data, loading, error, refresh, cacheInfo }
- useDebounce()       // Hook: Debounced value för sökfält
- useUrlState()       // Hook: Synkronisera state med URL-parametrar
```

---

## 2. Datakällor

### 2.1 Översikt

| Källa | Typ | Ursprung | Uppdatering |
|-------|-----|----------|-------------|
| **civictechsweden/myndighetsdata** | Dynamisk | GitHub API | 24h cache |
| **AGV (Arbetsgivarverket)** | Statisk | agv.json → constants.js | Årlig |
| **SCB** | Statisk | swedenStats.js | Årlig |
| **Wikidata** | Dynamisk | wd.json via GitHub | 24h cache |

### 2.2 Dynamisk Data (Runtime)

#### GitHub Repository: `civictechsweden/myndighetsdata`
**URL:** `https://raw.githubusercontent.com/civictechsweden/myndighetsdata/master/data/`

**Filer som hämtas:**
- `merged.json` - 978 myndigheter med sammanslagna källor
- `wd.json` - Wikidata (start/slutdatum, Wikipedia-länkar)

**Datakällor i merged.json:**
```javascript
{
  "Myndighetsnamn": {
    "esv": {      // Ekonomistyrningsverket
      "name_en": "English name",
      "department": "Departement",
      "employees": { "2024": 1234, ... },
      "fte": { "2024": 1100, ... }
    },
    "stkt": {     // Statskontoret
      "structure": "Styrelse|Enrådighet",
      "cofog10": 3,
      "has_gd": true
    },
    "scb": {      // SCB
      "website": "https://...",
      "office_address": { ... },
      "group": "Kategori"
    },
    "agv": {      // Arbetsgivarverket
      "total": { "1980": 500, "2024": 800 },
      "women": { ... },
      "men": { ... }
    },
    "sfs": {      // Svensk författningssamling
      "created_by": "SFS 2007:123",
      "sfs": ["SFS 2007:123", "SFS 2010:456"]
    }
  }
}
```

**Transform till kompakt format:**
```javascript
// Kort nyckelnamn för att spara minne
{
  n: "Namn",           // name
  en: "English",       // english name
  sh: "Kort",          // short name
  d: "Departement",    // department
  org: "123456-7890",  // org number
  s: "1980-01-01",     // start date
  e: "2020-12-31",     // end date (om nedlagd)
  emp: 1234,           // employees (latest)
  fte: 1100,           // FTE (latest)
  w: 600,              // women
  m: 634,              // men
  empH: {...},         // employee history
  wH: {...},           // women history
  mH: {...},           // men history
  str: "Styrelse",     // structure
  cof: 3,              // COFOG code
  web: "https://...",  // website
  wiki: "https://...", // Wikipedia
  city: "Stockholm",   // city
  sfs: "SFS 2007:123"  // creating regulation
}
```

### 2.3 Statisk Data (Compile-time)

#### `constants.js` - timeSeriesData
**Källa:** AGV aggregat från agv.json
**Period:** 1978-2025
**Fält:**
```javascript
{
  year: 2024,
  count: 215,      // Antal myndigheter
  dissolved: 0,    // Nedlagda detta år
  emp: 294146      // Totalt anställda (från AGV)
}
```

#### `constants.js` - genderHistoryData
**Källa:** AGV aggregat
**Period:** 1990-2024
**Fält:**
```javascript
{
  year: 2024,
  w: 156096,       // Kvinnor
  m: 138039,       // Män
  pct: 53.1        // % kvinnor
}
```

#### `swedenStats.js`
**Källa:** SCB
**Period:** 1978-2025
**Fält:**
```javascript
{
  year: 2024,
  population: 10551707,  // Befolkning
  gdp: 6446315           // BNP (MSEK, löpande priser)
}
```

### 2.4 Cache-strategi

```javascript
// localStorage cache
const CACHE_KEY = 'myndigheter_data_cache_v3';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 timmar

// Cache-struktur
{
  data: { merged: {...}, wd: {...} },
  timestamp: 1701234567890
}
```

**Cache-flöde:**
1. Kolla localStorage för giltig cache
2. Om giltig → använd cachad data
3. Om utgången/saknas → fetch från GitHub
4. Transformera data
5. Spara i localStorage

---

## 3. Design & UX

### 3.1 Design System

#### Färgpalett (CSS Custom Properties)
```css
:root {
  /* Primary - Professional Blue */
  --primary-500: #3b8bc7;

  /* Accent Colors */
  --accent-teal: #2a9d8f;
  --accent-amber: #e9a040;
  --accent-rose: #c76f8f;

  /* Neutral - Warm Gray */
  --neutral-50: #fafaf9;
  --neutral-900: #1c1917;

  /* Semantic */
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
}
```

#### Typografi
- **Rubriker:** Source Serif 4 (serif)
- **Brödtext:** Inter (sans-serif)
- **Kod:** SF Mono, Menlo

#### Departementsf��rger
```javascript
{
  "Justitiedepartementet": "#0c80f0",      // Blå
  "Finansdepartementet": "#059669",         // Grön
  "Utbildningsdepartementet": "#7c3aed",   // Lila
  "Socialdepartementet": "#be185d",         // Rosa
  "Försvarsdepartementet": "#475569",       // Grå
  // ... etc
}
```

### 3.2 Layout-struktur

```
┌─────────────────────────────────────────────────┐
│  Header: "Svenska Myndigheter" + Dark Mode      │
├─────────────────────────────────────────────────┤
│  IntroSection (kollapsbar)                      │
├─────────────────────────────────────────────────┤
│  Navigation Tabs: Översikt | Register | ...     │
├─────────────────────────────────────────────────┤
│  Sticky Filter Bar (sök, filter, år-slider)     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Main Content Area                              │
│  ┌───────────────┬─────────────────────────┐   │
│  │ Sidepanel     │ Chart / List / Detail   │   │
│  │ (på desktop)  │                         │   │
│  └───────────────┴─────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3.3 Responsiv Design

| Breakpoint | Layout |
|------------|--------|
| < 640px | Single column, compact cards |
| 640-1024px | Two column, sidepanel hidden |
| > 1024px | Full layout med sidepanel |

### 3.4 Dark Mode

- Toggle i header (Sun/Moon ikon)
- Sparas i localStorage
- Applicerar `.dark` class på `<html>`
- CSS-variabler inverteras automatiskt

### 3.5 Animationer

```css
/* Fade-in för kort */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Staggered animation för listor */
.animate-stagger > *:nth-child(1) { animation-delay: 0ms; }
.animate-stagger > *:nth-child(2) { animation-delay: 50ms; }
/* ... */

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
```

---

## 4. Funktioner & Element

### 4.1 Navigation Tabs

| Tab | Funktion |
|-----|----------|
| **Översikt** | Huvudgraf + statistikkort |
| **Register** | Sökbar lista på alla myndigheter |
| **Departementsvy** | Fördelning per departement |
| **Regioner** | Geografisk fördelning |
| **Jämförelser** | Multi-serie graf med index |

### 4.2 Interaktiva Element

#### År-slider (Range Slider)
```javascript
// Custom hook: useRangeSlider
// Features:
- Drag left/right handles
- Click to jump
- Keyboard navigation (←/→)
- Touch support
- Visar valt intervall: [1978, 2025]
```

#### Sökfält
```javascript
// Debounced search (300ms)
// Söker i:
- Myndighetsnamn
- Engelska namn
- Kortnamn
- Stad
```

#### Filter-dropdowns
- **Departement:** 11 val
- **Struktur:** Styrelse, Enrådighet, Nämnd
- **Status:** Aktiva, Nedlagda, Alla
- **Region:** Stockholm, Göteborg, Malmö, Uppsala, Övrigt

### 4.3 Grafer (Recharts)

#### ComposedChart (Huvudgraf)
```javascript
<ComposedChart>
  <Area dataKey="count" />      // Antal myndigheter
  <Line dataKey="emp" />        // Anställda
  <Line dataKey="population" /> // Befolkning
  <Line dataKey="gdp" />        // BNP
  <Line dataKey="w" />          // Kvinnor
  <Line dataKey="m" />          // Män
  <ReferenceArea />             // Regeringsperioder
</ComposedChart>
```

#### BarChart (Departementsvy)
```javascript
<BarChart layout="vertical">
  <Bar dataKey="count" />
  <Bar dataKey="employees" />
</BarChart>
```

#### PieChart (Strukturfördelning)
```javascript
<PieChart>
  <Pie dataKey="value" nameKey="name" />
</PieChart>
```

### 4.4 Statistikkort

```
┌─────────────────────────────────────────┐
│  Myndigheter                            │
│  215                        ▲ +37 (+21%)│
│  ━━━━━━━━━━━━━━━━━━━━ [sparkline]       │
└─────────────────────────────────────────┘
```

**Kort som visas:**
- Myndigheter (antal)
- Anställda (totalt)
- Kvinnor (%)
- Nedlagda (under perioden)

### 4.5 Myndighetsdetalj

När en myndighet väljs visas:
```
┌─────────────────────────────────────────┐
│ [X] Skatteverket                        │
│ Swedish Tax Agency                      │
│                                         │
│ Departement: Finansdepartementet        │
│ Struktur: Enrådighet                    │
│ Org.nr: 202100-5448                     │
│ Startdatum: 2004-01-01                  │
│                                         │
│ Anställda: 10,234 (52% kvinnor)         │
│ [Sparkline 2005-2024]                   │
│                                         │
│ 📍 Solna                                │
│ 🌐 skatteverket.se  📖 Wikipedia        │
└─────────────────────────────────────────┘
```

### 4.6 Verktyg i Header

| Knapp | Funktion |
|-------|----------|
| 🌙/☀️ | Toggle dark mode |
| ↶/↷ | Undo/Redo filter-ändringar |
| 🔄 | Refresh data (clear cache) |
| 🖨️ | Print-optimerad vy |
| ⬇️ | Export till CSV |

### 4.7 Keyboard Navigation

| Tangent | Funktion |
|---------|----------|
| `↑/↓` | Navigera i myndighetslistan |
| `Enter` | Välj markerad myndighet |
| `Escape` | Stäng detalj/rensa sökning |
| `←/→` | Justera år-slider |
| `/` | Fokusera sökfält |

---

## 5. Utveckling & Underhåll

### 5.1 Kommandon

```bash
# Installation
npm install

# Utveckling (localhost:3000)
npm start

# Produktion-build
npm run build

# Deploy till GitHub Pages
npm run deploy

# Tester
npm test
```

### 5.2 GitHub Actions

#### `deploy.yml` - Auto-deploy
- **Trigger:** Push till `main`
- **Steg:** Install → Build → Deploy till gh-pages branch

#### `claude.yml` - Claude Code
- **Trigger:** `@claude` mention i issues
- **Funktion:** AI-assisterad problemlösning

#### `claude-code-review.yml`
- **Trigger:** Nya pull requests
- **Funktion:** Automatisk kodgranskning

### 5.3 Uppdatera Data

#### Årlig uppdatering (AGV-data)
1. Hämta senaste agv.json från myndighetsdata-repo
2. Kör aggregering:
```javascript
// Aggregera totaler per år
const yearlyTotals = {};
for (const [agency, data] of Object.entries(agv)) {
  if (data.total) {
    for (const [year, count] of Object.entries(data.total)) {
      yearlyTotals[year] = (yearlyTotals[year] || 0) + count;
    }
  }
}
```
3. Uppdatera `constants.js` med nya värden
4. Commit & push

#### Befolkning/BNP (SCB)
1. Hämta från SCB statistikdatabas
2. Uppdatera `swedenStats.js`

### 5.4 Kända Begränsningar

1. **Ingen backend** - All data från GitHub raw files
2. **24h cache** - Ändringar i källdata syns efter max 24h
3. **Hårdkodade aggregat** - timeSeriesData måste uppdateras manuellt
4. **Stora bundle** - MyndigheterApp.jsx bör splitas

### 5.5 Förbättringsförslag

1. **Code splitting** - Dela upp MyndigheterApp.jsx
2. **Build-time aggregation** - Script som genererar constants.js
3. **Service Worker** - Offline-stöd
4. **TypeScript** - Migrera för bättre typsäkerhet
5. **Testing** - Lägg till unit tests

### 5.6 Miljövariabler

Inga miljövariabler krävs. All konfiguration finns i:
- `package.json` (homepage för routing)
- `constants.js` (app config)

### 5.7 Felsökning

#### "Data laddas inte"
1. Öppna DevTools → Network
2. Kolla att GitHub raw files returnerar 200
3. Rensa cache: `localStorage.removeItem('myndigheter_data_cache_v3')`

#### "Grafen visar fel data"
1. Verifiera att `timeSeriesData` har korrekta värden
2. Kolla att rätt dataKey används i Recharts-komponent
3. Testa med `console.log(chartData)` före rendering

#### "Styling fungerar ej"
1. Kör `npm run build` för att verifiera Tailwind-kompilering
2. Kolla att `index.css` importeras i `index.js`
3. Verifiera att `tailwind.config.js` har rätt content-paths

---

## 6. Kontakt & Licens

**Repository:** https://github.com/isakskogstad/myndigheter

**Datakällor:**
- https://github.com/civictechsweden/myndighetsdata
- https://www.esv.se/
- https://www.scb.se/
- https://www.wikidata.org/

---

*Senast uppdaterad: 2025-11-29*
