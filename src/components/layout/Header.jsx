import React, { useState } from 'react';
import { Search, Share, ChevronRight, Command, X } from 'lucide-react';

const Header = ({ 
  activeTabLabel, 
  searchQuery, 
  onSearchChange, 
  onShare,
  onToggleMobileMenu,
  agencies = [], 
  onSelectAgency 
}) => {
  const [showResults, setShowResults] = useState(false);

  // Filter suggestions
  const suggestions = searchQuery.length > 1 
    ? agencies.filter(a => a.n.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5) 
    : [];

  const handleSelect = (agency) => {
    onSelectAgency(agency);
    setShowResults(false);
    onSearchChange(''); // Clear search to avoid obstruction
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 w-full transition-all duration-300">
      
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer hidden sm:inline font-medium transition-colors">Start</span>
          <ChevronRight className="w-4 h-4 mx-2 text-slate-300 hidden sm:block" />
          <span className="font-semibold text-slate-900">{activeTabLabel}</span>
        </div>
      </div>
      
      {/* Right Side: Search & Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Sök myndighet..." 
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)} 
            className="w-32 sm:w-64 pl-9 pr-8 py-2 bg-white/50 border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all shadow-sm placeholder-stone-400 hover:bg-white"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          
          {/* Search Dropdown */}
          {showResults && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
              <div className="py-1">
                {suggestions.map(agency => (
                  <button
                    key={agency.n}
                    onClick={() => handleSelect(agency)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <span className="font-medium text-slate-900">{agency.n}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{agency.d}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button 
          onClick={onShare}
          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 border border-transparent hover:border-primary-100 rounded-xl transition-all duration-200"
          title="Dela denna vy"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;