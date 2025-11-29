import React, { useState, useEffect, useRef, useCallback } from 'react';

const RangeSlider = ({ min, max, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef(null);
  const draggingRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercent = useCallback((val) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const getValueFromPosition = useCallback((clientX) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(min + percent * (max - min));
  }, [min, max]);

  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    draggingRef.current = handle;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  // Touch support wrapper
  const handleTouchStart = (e, handle) => {
    e.preventDefault(); // Prevent scroll
    handleMouseDown(e, handle);
  };

  const handleMouseMove = useCallback((e) => {
    updateValue(e.clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    updateValue(e.touches[0].clientX);
  }, []);

  const updateValue = (clientX) => {
    if (!draggingRef.current) return;
    const newValue = getValueFromPosition(clientX);
    
    setLocalValue(prev => {
      const [start, end] = prev;
      if (draggingRef.current === 'start') {
        const clamped = Math.min(newValue, end - 1);
        return [Math.max(min, clamped), end];
      } else {
        const clamped = Math.max(newValue, start + 1);
        return [start, Math.min(max, clamped)];
      }
    });
  };

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) {
      onChange(localValue);
      draggingRef.current = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  }, [localValue, onChange, handleMouseMove, handleTouchMove]);

  const leftPercent = getPercent(localValue[0]);
  const rightPercent = getPercent(localValue[1]);

  return (
    <div className="w-full select-none px-3 py-2">
      <div className="flex justify-between items-end mb-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidsintervall</label>
        <div className="font-mono text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          {localValue[0]} – {localValue[1]}
        </div>
      </div>
      
      <div className="relative h-8 touch-none">
        {/* Track Background */}
        <div 
          ref={trackRef}
          className="absolute w-full h-1.5 bg-slate-100 rounded-full top-1/2 -mt-0.5 overflow-hidden border border-slate-200"
        />
        
        {/* Active Range */}
        <div 
          className="absolute h-1.5 bg-primary-500 rounded-full top-1/2 -mt-0.5 pointer-events-none"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        
        {/* Handles */}
        {['start', 'end'].map((handle) => {
          const percent = handle === 'start' ? leftPercent : rightPercent;
          return (
            <div
              key={handle}
              className="absolute top-1/2 -mt-3 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              style={{ left: `${percent}%`, transform: 'translate(-50%, -50%)' }}
              onMouseDown={(e) => handleMouseDown(e, handle)}
              onTouchStart={(e) => handleTouchStart(e, handle)}
              role="slider"
              aria-label={handle === 'start' ? "Startår" : "Slutår"}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={handle === 'start' ? localValue[0] : localValue[1]}
              tabIndex={0}
            >
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
            </div>
          );
        })}
      </div>

      {/* Ticks */}
      <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1 px-1">
        <span>{min}</span>
        <span>1990</span>
        <span>2000</span>
        <span>2010</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default RangeSlider;