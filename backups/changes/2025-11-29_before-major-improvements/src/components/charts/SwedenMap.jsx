import React from 'react';

const SwedenMap = ({ stats, hoveredRegion }) => {
  // Normalize stats for bubble size
  const maxVal = Math.max(...Object.values(stats).map(s => s.value));
  const getSize = (val) => Math.max(8, (val / maxVal) * 40);

  const Bubble = ({ cx, cy, name, align = "start" }) => {
    const stat = stats.find(s => s.name === name);
    const value = stat?.value || 0;
    const color = name === 'Stockholm' ? '#0c80f0' :
                  name === 'Göteborg' ? '#059669' :
                  name === 'Malmö' ? '#d97706' :
                  name === 'Uppsala' ? '#7c3aed' : '#78716c';
    
    const isHovered = hoveredRegion === name;
    
    return (
      <g className="transition-all duration-300" style={{ opacity: hoveredRegion && !isHovered ? 0.3 : 1, transform: isHovered ? 'scale(1.1)' : 'scale(1)', transformOrigin: `${cx}px ${cy}px` }}>
        <circle 
          cx={cx} cy={cy} r={getSize(value)} 
          fill={color} 
          opacity={isHovered ? 1 : 0.8} 
          stroke={isHovered ? "white" : "none"}
          strokeWidth="2"
        />
        <text 
          x={align === "end" ? cx - getSize(value) - 5 : align === "middle" ? cx : cx + getSize(value) + 5} 
          y={cy + 4} 
          className={`text-[10px] font-medium transition-all ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'}`}
          textAnchor={align}
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox="0 0 300 600" className="w-full h-full max-h-[500px]">
      {/* Abstract Sweden Outline (Simplified) */}
      <path 
        d="M110,580 L90,550 L70,500 L60,450 L50,400 L60,350 L50,300 L60,250 L80,200 L100,150 L130,100 L150,50 L170,20 L190,50 L200,100 L190,150 L180,200 L190,250 L200,300 L210,350 L200,400 L180,450 L160,500 L140,550 L110,580 Z" 
        fill="#f8fafc" 
        stroke="#e2e8f0" 
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