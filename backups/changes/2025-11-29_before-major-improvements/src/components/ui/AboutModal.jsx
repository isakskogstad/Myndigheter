import React from 'react';
import { X, Github, Database, LineChart, Users } from 'lucide-react';

const AboutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-fade-in border border-slate-200">
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-serif text-2xl text-slate-900 font-bold mb-2">Om Svenska Myndigheter</h2>
              <p className="text-slate-500">Ett analysverktyg för den offentliga sektorn.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="prose prose-slate prose-sm">
            <p>
              Detta verktyg samlar och visualiserar data om Sveriges statliga myndigheter från 1978 fram till idag. 
              Syftet är att göra det enklare för journalister, forskare och allmänheten att förstå hur statsförvaltningen utvecklas över tid.
            </p>
            
            <h3 className="text-lg font-medium text-slate-900 mt-6 mb-3">Datakällor</h3>
            <ul className="space-y-3 not-prose">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Database className="w-4 h-4" /></div>
                <div>
                  <span className="font-medium text-slate-900 block">Civic Tech Sweden</span>
                  <span className="text-slate-500 text-xs">Grunddata om myndigheter och organisationsnummer.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><LineChart className="w-4 h-4" /></div>
                <div>
                  <span className="font-medium text-slate-900 block">Ekonomistyrningsverket (ESV)</span>
                  <span className="text-slate-500 text-xs">Statistik om personal, årsarbetskrafter och kostnader.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Users className="w-4 h-4" /></div>
                <div>
                  <span className="font-medium text-slate-900 block">SCB</span>
                  <span className="text-slate-500 text-xs">Befolkningsstatistik och BNP-data för jämförelse.</span>
                </div>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
              <a 
                href="https://github.com/isakskogstad/myndigheter" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors no-underline"
              >
                <Github className="w-4 h-4" /> Öppen källkod
              </a>
              <span className="text-slate-400 text-xs">Version 5.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
