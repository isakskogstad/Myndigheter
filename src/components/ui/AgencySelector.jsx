import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Building2 } from 'lucide-react';

const AgencySelector = ({ agencies, selectedAgencies, onToggleAgency, maxSelections = 3 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter agencies based on search
  const filteredAgencies = agencies
    .filter(a => !a.e) // Only active agencies
    .filter(a => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        a.n?.toLowerCase().includes(query) ||
        a.sh?.toLowerCase().includes(query) ||
        a.org?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => (b.emp || 0) - (a.emp || 0)) // Sort by size
    .slice(0, 50); // Limit to top 50 for performance

  const isSelected = (agency) => selectedAgencies.some(a => a.n === agency.n);
  const canAddMore = selectedAgencies.length < maxSelections;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Agencies Pills */}
      {selectedAgencies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedAgencies.map(agency => (
            <div
              key={agency.n}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm font-medium text-primary-700"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{agency.n}</span>
              <button
                onClick={() => onToggleAgency(agency)}
                className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={`Sök och välj myndigheter (max ${maxSelections})...`}
          className="w-full px-4 py-3 pl-11 pr-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 bg-white transition-all"
        />
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredAgencies.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          <div className="p-2">
            {filteredAgencies.map(agency => {
              const selected = isSelected(agency);
              const disabled = !selected && !canAddMore;

              return (
                <button
                  key={agency.n}
                  onClick={() => {
                    if (!disabled) {
                      onToggleAgency(agency);
                      if (!selected && selectedAgencies.length + 1 >= maxSelections) {
                        setIsOpen(false);
                      }
                    }
                  }}
                  disabled={disabled}
                  className={`w-full px-3 py-2.5 rounded-lg text-left transition-all flex items-center justify-between group ${
                    selected
                      ? 'bg-primary-50 text-primary-900 border border-primary-200'
                      : disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{agency.n}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-mono">{agency.org || 'N/A'}</span>
                      {agency.emp && (
                        <span className="font-medium">
                          {agency.emp.toLocaleString('sv-SE')} anst.
                        </span>
                      )}
                    </div>
                  </div>

                  {selected && (
                    <div className="flex-shrink-0 w-5 h-5 bg-primary-600 rounded flex items-center justify-center ml-2">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!canAddMore && (
            <div className="p-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 text-center font-medium">
              Max {maxSelections} myndigheter kan väljas. Ta bort en för att lägga till fler.
            </div>
          )}
        </div>
      )}

      {isOpen && filteredAgencies.length === 0 && searchQuery && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-6 text-center">
          <div className="text-slate-400 text-sm">
            Inga myndigheter hittades för "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencySelector;
