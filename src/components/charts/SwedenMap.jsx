import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

// Swedish county GeoJSON URL
const SWEDEN_TOPO_URL = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/sweden/sweden-counties.json';

// Map Swedish county names to our region names
const countyToRegion = {
  'Stockholms län': 'Stockholm',
  'Uppsala län': 'Uppsala',
  'Södermanlands län': 'Sörmland',
  'Östergötlands län': 'Östergötland',
  'Jönköpings län': 'Jönköping',
  'Kronobergs län': 'Kronoberg',
  'Kalmar län': 'Kalmar',
  'Gotlands län': 'Gotland',
  'Blekinge län': 'Blekinge',
  'Skåne län': 'Skåne',
  'Hallands län': 'Halland',
  'Västra Götalands län': 'Västra Götaland',
  'Värmlands län': 'Värmland',
  'Örebro län': 'Örebro',
  'Västmanlands län': 'Västmanland',
  'Dalarnas län': 'Dalarna',
  'Gävleborgs län': 'Gävleborg',
  'Västernorrlands län': 'Västernorrland',
  'Jämtlands län': 'Jämtland',
  'Västerbottens län': 'Västerbotten',
  'Norrbottens län': 'Norrbotten',
};

// Region colors
const regionColors = {
  'Stockholm': '#0ea5e9',
  'Västra Götaland': '#059669',
  'Skåne': '#f59e0b',
  'Uppsala': '#8b5cf6',
  'Östergötland': '#ec4899',
  'Värmland': '#14b8a6',
  'Örebro': '#f97316',
  'Jönköping': '#6366f1',
  'Västerbotten': '#84cc16',
  'Norrbotten': '#0891b2',
  'Västernorrland': '#dc2626',
  'Gävleborg': '#a855f7',
  'Dalarna': '#eab308',
  'Västmanland': '#22d3d1',
  'Kronoberg': '#fb923c',
  'Kalmar': '#4ade80',
  'Blekinge': '#f472b6',
  'Halland': '#2dd4bf',
  'Gotland': '#facc15',
  'Jämtland': '#34d399',
  'Sörmland': '#818cf8',
};

/**
 * Interactive Sweden Map Component
 * Displays Swedish counties with agency count coloring
 */
const SwedenMap = ({
  agencies = [],
  selectedRegion = null,
  onRegionClick = () => {},
  className = '',
}) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate agency counts per region
  const regionCounts = useMemo(() => {
    const counts = {};
    agencies.forEach(agency => {
      const region = agency.region || 'Övrigt';
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [agencies]);

  // Create color scale based on agency counts
  const maxCount = Math.max(...Object.values(regionCounts), 1);
  const colorScale = scaleLinear()
    .domain([0, maxCount * 0.3, maxCount])
    .range(['#f1f5f9', '#bae6fd', '#0284c7']);

  const handleMouseEnter = (geo, evt) => {
    const countyName = geo.properties.name;
    const region = countyToRegion[countyName] || countyName;
    const count = regionCounts[region] || 0;

    setHoveredRegion(region);
    setTooltipContent({ region, count });
    setTooltipPos({ x: evt.clientX, y: evt.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    setTooltipContent(null);
  };

  const handleMouseMove = (evt) => {
    if (tooltipContent) {
      setTooltipPos({ x: evt.clientX, y: evt.clientY });
    }
  };

  return (
    <div className={`relative ${className}`} onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [17, 63],
          scale: 1200,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={SWEDEN_TOPO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countyName = geo.properties.name;
                const region = countyToRegion[countyName] || countyName;
                const count = regionCounts[region] || 0;
                const isHovered = hoveredRegion === region;
                const isSelected = selectedRegion === region;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => onRegionClick(region)}
                    style={{
                      default: {
                        fill: isSelected
                          ? regionColors[region] || '#0ea5e9'
                          : colorScale(count),
                        stroke: '#fff',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                      },
                      hover: {
                        fill: regionColors[region] || '#0ea5e9',
                        stroke: '#fff',
                        strokeWidth: 1,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: regionColors[region] || '#0ea5e9',
                        stroke: '#fff',
                        strokeWidth: 1,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 50,
          }}
        >
          <p className="font-semibold">{tooltipContent.region}</p>
          <p className="text-slate-300 dark:text-slate-600">
            {tooltipContent.count} {tooltipContent.count === 1 ? 'myndighet' : 'myndigheter'}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Sweden Bubble Map (original simplified version)
 */
export const SwedenBubbleMap = ({ stats, hoveredRegion }) => {
  const maxVal = Math.max(...stats.map(s => s.value));
  const getSize = (val) => Math.max(8, (val / maxVal) * 40);

  const Bubble = ({ cx, cy, name, align = "start" }) => {
    const stat = stats.find(s => s.name === name);
    const value = stat?.value || 0;
    const color = regionColors[name] || '#78716c';

    const isHovered = hoveredRegion === name;

    return (
      <g
        className="transition-all duration-300"
        style={{
          opacity: hoveredRegion && !isHovered ? 0.3 : 1,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transformOrigin: `${cx}px ${cy}px`
        }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={getSize(value)}
          fill={color}
          opacity={isHovered ? 1 : 0.8}
          stroke={isHovered ? "white" : "none"}
          strokeWidth="2"
        />
        <text
          x={align === "end" ? cx - getSize(value) - 5 : align === "middle" ? cx : cx + getSize(value) + 5}
          y={cy + 4}
          className={`text-[10px] font-medium transition-all ${isHovered ? 'fill-slate-900 dark:fill-white font-bold' : 'fill-slate-500 dark:fill-slate-400'}`}
          textAnchor={align}
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 300 600" className="w-full h-full max-h-[500px]">
      {/* Abstract Sweden Outline */}
      <path
        d="M110,580 L90,550 L70,500 L60,450 L50,400 L60,350 L50,300 L60,250 L80,200 L100,150 L130,100 L150,50 L170,20 L190,50 L200,100 L190,150 L180,200 L190,250 L200,300 L210,350 L200,400 L180,450 L160,500 L140,550 L110,580 Z"
        className="fill-slate-50 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
        strokeWidth="2"
      />

      <Bubble cx="180" cy="400" name="Stockholm" />
      <Bubble cx="175" cy="380" name="Uppsala" />
      <Bubble cx="80" cy="460" name="Göteborg" align="end" />
      <Bubble cx="110" cy="560" name="Malmö" />
      <Bubble cx="140" cy="250" name="Övrigt" align="middle" />
    </svg>
  );
};

export default SwedenMap;
