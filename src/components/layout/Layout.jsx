import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import ScrollToTop from '../ui/ScrollToTop';

const Layout = ({
  children,
  activeTab,
  onTabChange,
  showIntro,
  onToggleIntro,
  isDark,
  onToggleDark,
  searchQuery,
  onSearchChange,
  agencies,
  onSelectAgency,
  onOpenCommandPalette
}) => {
  
  // Map ID to label
  const tabs = {
    overview: 'Översikt',
    analysis: 'Analys',
    departments: 'Departement',
    regions: 'Regioner',
    list: 'Myndighetsregister',
    'about-data': 'Om Data & Källor'
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        showIntro={showIntro}
        onToggleIntro={onToggleIntro}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onOpenCommandPalette={onOpenCommandPalette}
      />
      
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 pb-16 lg:pb-0">
        <Header 
          activeTabLabel={tabs[activeTab]} 
          searchQuery={searchQuery} 
          onSearchChange={onSearchChange}
          agencies={agencies}
          onSelectAgency={onSelectAgency}
          onShare={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Länk kopierad till urklipp!');
          }}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth relative">
          <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
            {children}
          </div>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto pt-12 pb-8 mt-12 border-t border-stone-100 text-xs text-stone-400 flex flex-col sm:flex-row justify-between items-center gap-6">
            <p>© {new Date().getFullYear()} Svenska Myndigheter. Ett analysverktyg av Isak Skogstad.</p>
            <div className="flex flex-wrap justify-center gap-6 font-medium">
              <a href="https://github.com/civictechsweden/myndighetsdata" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors">Civic Tech Sweden</a>
              <a href="https://www.esv.se/" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors">ESV</a>
              <a href="https://www.scb.se/" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors">SCB</a>
            </div>
          </footer>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Layout;
