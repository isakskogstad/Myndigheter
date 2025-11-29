import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Building2 } from 'lucide-react';
import ds from '../../styles/designSystem';

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
        <div className={ds.cn('flex flex-wrap', ds.spacing.sm, 'mb-3')}>
          {selectedAgencies.map(agency => (
            <div
              key={agency.n}
              className={ds.cn('flex items-center', ds.spacing.sm, 'px-3 py-1.5 border', ds.radius.sm, ds.typography.sizes.sm, ds.typography.weights.medium)}
              style={{ backgroundColor: ds.colors.primary[50], borderColor: ds.colors.primary[200], color: ds.colors.primary[700] }}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{agency.n}</span>
              <button
                onClick={() => onToggleAgency(agency)}
                className={ds.cn('p-0.5', ds.radius.full, ds.animations.normal, 'hover:bg-primary-100')}
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
          className={ds.cn('w-full px-4 py-3 pl-11 pr-4 border bg-white', ds.radius.md, ds.typography.sizes.sm, ds.focus.ring, ds.animations.normal)}
          style={{ borderColor: ds.colors.slate[200] }}
        />
        <Search className={ds.cn('absolute left-4 top-3.5', ds.iconSizes.sm, 'text-slate-400')} />

        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className={ds.cn('absolute right-4 top-3.5 text-slate-400 hover:text-slate-600', ds.animations.normal)}
          >
            <X className={ds.iconSizes.sm} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredAgencies.length > 0 && (
        <div className={ds.cn('absolute z-50 w-full mt-2 bg-white border', ds.radius.md, ds.shadows.strong, 'max-h-80 overflow-y-auto')} style={{ borderColor: ds.colors.slate[200] }}>
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
                  className={ds.cn(
                    'w-full px-3 py-2.5 text-left flex items-center justify-between group',
                    ds.radius.sm,
                    ds.animations.normal,
                    selected
                      ? 'border'
                      : disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'hover:bg-slate-50 text-slate-700'
                  )}
                  style={selected ? { backgroundColor: ds.colors.primary[50], color: ds.colors.primary[900], borderColor: ds.colors.primary[200] } : {}}
                >
                  <div className="flex-1 min-w-0">
                    <div className={ds.cn(ds.typography.weights.medium, ds.typography.sizes.sm, 'truncate')}>{agency.n}</div>
                    <div className={ds.cn('flex items-center mt-1', ds.spacing.md, ds.typography.sizes.xs, 'text-slate-500')}>
                      <span className="font-mono">{agency.org || 'N/A'}</span>
                      {agency.emp && (
                        <span className={ds.typography.weights.medium}>
                          {agency.emp.toLocaleString('sv-SE')} anst.
                        </span>
                      )}
                    </div>
                  </div>

                  {selected && (
                    <div className={ds.cn('flex-shrink-0 w-5 h-5 flex items-center justify-center ml-2', ds.radius.sm)} style={{ backgroundColor: ds.colors.primary[600] }}>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!canAddMore && (
            <div className={ds.cn('p-3 border-t text-center', ds.typography.sizes.xs, ds.typography.weights.medium)} style={{ backgroundColor: ds.colors.status.warning.light, borderColor: ds.colors.status.warning.main, color: ds.colors.status.warning.dark }}>
              Max {maxSelections} myndigheter kan väljas. Ta bort en för att lägga till fler.
            </div>
          )}
        </div>
      )}

      {isOpen && filteredAgencies.length === 0 && searchQuery && (
        <div className={ds.cn('absolute z-50 w-full mt-2 bg-white border p-6 text-center', ds.radius.md, ds.shadows.strong)} style={{ borderColor: ds.colors.slate[200] }}>
          <div className={ds.cn('text-slate-400', ds.typography.sizes.sm)}>
            Inga myndigheter hittades för "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencySelector;
