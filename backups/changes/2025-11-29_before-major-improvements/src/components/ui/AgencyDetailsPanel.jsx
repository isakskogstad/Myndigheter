import React from 'react';
import { X, Globe, MapPin, Phone, Building2, Calendar, Users, BookOpen, ExternalLink, Mail, Languages } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { cofogNames, agencyHistory } from '../../data/constants';

const AgencyDetailsPanel = ({ agency, onClose }) => {
  if (!agency) return null;

  const history = agencyHistory[agency.n];
  
  // Calculate gender percentage
  const pctWomen = (agency.w && agency.m) ? Math.round((agency.w / (agency.w + agency.m)) * 100) : null;

  // Prepare historical data for sparkline
  const empHistory = agency.empH ? Object.entries(agency.empH)
    .map(([year, val]) => ({ year: parseInt(year), val }))
    .sort((a, b) => a.year - b.year)
    : [];

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto border-l border-slate-100">
      
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-6 flex justify-between items-start z-10">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-serif font-bold text-2xl shadow-sm border border-primary-100">
              {agency.n.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="font-serif font-bold text-xl text-slate-900 leading-tight">{agency.n}</h2>
              {agency.sh && <span className="text-sm text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-1">{agency.sh}</span>}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${agency.e ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
              {agency.e ? 'Nedlagd' : 'Aktiv'}
            </span>
            {agency.gd && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                Har Generaldirektör
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        
        {/* English Name */}
        {agency.en && (
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <Languages className="w-4 h-4 text-slate-400" />
            <span className="italic">{agency.en}</span>
          </div>
        )}

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
              <Users className="w-3 h-3" /> Personal
            </div>
            <div className="text-2xl font-serif font-medium text-slate-900 old-style-nums mb-1">
              {agency.emp ? agency.emp.toLocaleString('sv-SE') : '–'}
            </div>
            {pctWomen !== null && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full mb-1 overflow-hidden">
                <div className="bg-pink-400 h-1.5" style={{ width: `${pctWomen}%` }}></div>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              {pctWomen !== null ? <span>{pctWomen}% Kvinnor</span> : <span>Ingen könsdata</span>}
              {agency.fte && <span>{agency.fte.toLocaleString('sv-SE')} FTE</span>}
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
              <Calendar className="w-3 h-3" /> Verksamhet
            </div>
            <div className="text-2xl font-serif font-medium text-slate-900 old-style-nums mb-1">
              {agency.s ? agency.s.split('-')[0] : '–'}
            </div>
            <div className="text-xs text-slate-500">Bildad</div>
            {agency.e && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="text-red-600 font-medium old-style-nums">{agency.e.split('-')[0]}</div>
                <div className="text-[10px] text-red-400 uppercase">Nedlagd</div>
              </div>
            )}
          </div>
        </div>

        {/* History Chart (New Feature) */}
        {empHistory.length > 1 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Utveckling (Anställda)</div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={empHistory}>
                  <defs>
                    <linearGradient id="colorEmp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" hide />
                  <YAxis hide domain={['dataMin', 'auto']} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    itemStyle={{ padding: 0 }}
                    formatter={(value) => [value, 'Anställda']}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#0ea5e9" 
                    fill="url(#colorEmp)" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Organization Info */}
        <div>
          <h3 className="font-serif text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-400" /> Organisation
          </h3>
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <dl className="divide-y divide-slate-200/60 text-sm">
              <div className="flex justify-between p-3">
                <dt className="text-slate-500">Departement</dt>
                <dd className="font-medium text-slate-900 text-right">{agency.d}</dd>
              </div>
              <div className="flex justify-between p-3 bg-white/50">
                <dt className="text-slate-500">Org.nummer</dt>
                <dd className="font-mono text-slate-900">{agency.org || '–'}</dd>
              </div>
              <div className="flex justify-between p-3">
                <dt className="text-slate-500">Ledningsform</dt>
                <dd className="text-slate-900">{agency.str || '–'}</dd>
              </div>
              <div className="flex justify-between p-3 bg-white/50">
                <dt className="text-slate-500">COFOG</dt>
                <dd className="text-slate-900 text-right max-w-[250px] leading-tight">{cofogNames[agency.cof] || agency.cof || '–'}</dd>
              </div>
              <div className="flex justify-between p-3">
                <dt className="text-slate-500">Instruktion (SFS)</dt>
                <dd className="font-mono text-slate-900 bg-white border border-slate-200 px-1.5 rounded text-xs py-0.5">
                  {agency.sfs || '–'}</dd>
              </div>
              {agency.grp && (
                <div className="flex justify-between p-3 bg-white/50">
                  <dt className="text-slate-500">Kategori</dt>
                  <dd className="text-slate-900">{agency.grp}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Contact */}
        {(agency.city || agency.web || agency.tel || agency.email) && (
          <div>
            <h3 className="font-serif text-lg text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" /> Kontakt
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-sm">
              {agency.city && (
                <div className="p-4 border-b border-slate-100 flex gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-900">{agency.addr ? agency.addr : agency.city}</div>
                    {agency.city && agency.addr && <div className="text-slate-500">{agency.city}</div>}
                    {agency.post && agency.post !== agency.addr && (
                      <div className="text-xs text-slate-400 mt-1">Post: {agency.post}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {agency.tel && (
                  <a href={`tel:${agency.tel}`} className="p-3 flex items-center gap-2 hover:bg-slate-50 transition-colors group">
                    <Phone className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    <span className="text-slate-700 group-hover:text-primary-700">{agency.tel}</span>
                  </a>
                )}
                {agency.email && (
                  <a href={`mailto:${agency.email}`} className="p-3 flex items-center gap-2 hover:bg-slate-50 transition-colors group">
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    <span className="text-slate-700 group-hover:text-primary-700 truncate" title={agency.email}>{agency.email}</span>
                  </a>
                )}
              </div>

              {agency.web && (
                <a 
                  href={agency.web.startsWith('http') ? agency.web : `https://${agency.web}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 border-t border-slate-100 hover:bg-primary-50 transition-colors text-center font-medium text-primary-600 flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" /> Besök webbplats
                </a>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-3">
          {agency.wiki && (
            <a 
              href={agency.wiki} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Wikipedia
            </a>
          )}
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(agency.n + ' regleringsbrev')}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Regleringsbrev
          </a>
        </div>

        {/* History Events */}
        {history && history.length > 0 && (
          <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
            <h4 className="text-amber-800 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Historik & Händelser
            </h4>
            <ul className="space-y-4">
              {history.map((h, i) => (
                <li key={i} className="text-sm text-amber-900 flex gap-3">
                  <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-xs h-fit mt-0.5">
                    {h.year}
                  </span>
                  <span className="leading-relaxed">{h.event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center pt-4">
          <p className="text-[10px] text-slate-400">
            Data-ID: <span className="font-mono">{agency.id || 'N/A'}</span> • Källa: Civic Tech Sweden / ESV / SCB
          </p>
        </div>

      </div>
    </div>
  );
};

export default AgencyDetailsPanel;
