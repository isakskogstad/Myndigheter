import React, { useState, useMemo, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Building2,
  MapPin,
  List,
  BarChart3,
  Moon,
  Sun,
  Download,
  X,
  FileText,
  Users,
  TrendingUp,
  Filter
} from 'lucide-react';

const CommandPalette = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  onExport,
  onClearFilters,
  agencies = [],
  isDark = false,
}) => {
  const [search, setSearch] = useState('');

  const navigationItems = [
    { id: 'overview', label: 'Översikt', icon: LayoutDashboard, keywords: ['hem', 'start', 'dashboard'] },
    { id: 'analysis', label: 'Analys', icon: BarChart3, keywords: ['data', 'statistik', 'trender'] },
    { id: 'departments', label: 'Departement', icon: Building2, keywords: ['departement', 'regering'] },
    { id: 'regions', label: 'Regioner', icon: MapPin, keywords: ['län', 'karta', 'geografi'] },
    { id: 'list', label: 'Myndighetsregister', icon: List, keywords: ['lista', 'sök', 'register'] },
    { id: 'about-data', label: 'Om Data & Källor', icon: FileText, keywords: ['info', 'källa', 'om'] },
  ];

  const actionItems = [
    {
      id: 'toggle-theme',
      label: isDark ? 'Ljust läge' : 'Mörkt läge',
      icon: isDark ? Sun : Moon,
      action: onToggleTheme,
      keywords: ['tema', 'dark', 'light', 'färg']
    },
    {
      id: 'export-csv',
      label: 'Exportera data (CSV)',
      icon: Download,
      action: onExport,
      keywords: ['ladda ner', 'export', 'csv', 'excel']
    },
    {
      id: 'clear-filters',
      label: 'Rensa filter',
      icon: Filter,
      action: onClearFilters,
      keywords: ['rensa', 'återställ', 'filter']
    },
  ];

  const filteredAgencies = useMemo(() => {
    if (!search || search.length < 2) return [];
    const searchLower = search.toLowerCase();
    return agencies
      .filter(a =>
        a.name?.toLowerCase().includes(searchLower) ||
        a.department?.toLowerCase().includes(searchLower) ||
        a.region?.toLowerCase().includes(searchLower)
      )
      .slice(0, 5);
  }, [search, agencies]);

  const handleSelect = useCallback((item) => {
    if (item.action) {
      item.action();
    } else if (item.id) {
      onNavigate(item.id, item.options);
    }
    onClose();
    setSearch('');
  }, [onNavigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl z-50"
          >
            <Command
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-slate-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Sök myndigheter, navigera, eller kör kommandon..."
                  className="flex-1 px-4 py-4 text-base bg-transparent outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Command List */}
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-slate-500">
                  Inga resultat hittades.
                </Command.Empty>

                {/* Navigation Group */}
                <Command.Group heading="Navigera" className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {navigationItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords.join(' ')}`}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/30 aria-selected:text-primary-700 dark:aria-selected:text-primary-300 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Actions Group */}
                <Command.Group heading="Åtgärder" className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
                  {actionItems.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords.join(' ')}`}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/30 aria-selected:text-primary-700 dark:aria-selected:text-primary-300 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Agency Search Results */}
                {filteredAgencies.length > 0 && (
                  <Command.Group heading="Myndigheter" className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
                    {filteredAgencies.map((agency) => (
                      <Command.Item
                        key={agency.name}
                        value={agency.name}
                        onSelect={() => handleSelect({
                          id: 'list',
                          options: { selectedAgency: agency.name }
                        })}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/30 transition-colors"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{agency.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {agency.department} • {agency.region}
                            {agency.employees > 0 && ` • ${agency.employees.toLocaleString('sv-SE')} anställda`}
                          </p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↵</kbd>
                    välj
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↑↓</kbd>
                    navigera
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">esc</kbd>
                    stäng
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">⌘K</kbd>
                  öppna
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
