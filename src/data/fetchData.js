// External data fetching from civictechsweden/myndighetsdata
const BASE_URL = 'https://raw.githubusercontent.com/civictechsweden/myndighetsdata/master/data';

const CACHE_KEY = 'myndigheter_data_cache_v3';  // v3: added wiki, email, address, full data
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if cached data is still valid
 */
function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (e) {
    console.warn('Cache read error:', e);
    return null;
  }
}

/**
 * Save data to cache
 */
function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
}

/**
 * Fetch a single JSON file with error handling
 */
async function fetchJSON(filename) {
  const response = await fetch(`${BASE_URL}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all agency data from external sources
 * Returns cached data if available and not expired
 */
export async function fetchAllAgencyData() {
  // Check cache first
  const cached = getCachedData();
  if (cached) {
    console.log('Using cached agency data');
    return cached;
  }

  console.log('Fetching fresh agency data from GitHub...');

  // Fetch all data sources in parallel
  // merged.json contains 978 agencies with combined data from all sources
  // wd.json has start/end dates from Wikidata
  const [merged, wd] = await Promise.all([
    fetchJSON('merged.json'),
    fetchJSON('wd.json'),
  ]);

  const data = { merged, wd };

  // Cache the data
  setCachedData(data);

  return data;
}

/**
 * Merge and transform raw data into app-ready compact format
 * Uses short property names:
 *
 * BASIC INFO:
 * n=name, en=english name, sh=short name, d=department, org=orgNr
 *
 * DATES:
 * s=start date, e=end date (dissolved)
 *
 * EMPLOYEES (current):
 * emp=total employees, fte=FTE, w=women, m=men
 *
 * EMPLOYEES (history - all years available):
 * empH=employee history {year: count}, wH=women history, mH=men history
 * fteH=FTE history (from ESV)
 *
 * ORGANIZATION:
 * str=structure (Styrelse/Enrådighet), cof=COFOG code, gd=has GD (boolean)
 * host=host authority, grp=group category
 *
 * CONTACT:
 * web=website, wiki=Wikipedia URL, wdId=Wikidata ID
 * email=email, tel=phone
 *
 * ADDRESS:
 * city=city, addr=office address, post=postal address
 *
 * LEGAL:
 * sfs=SFS reference (creating regulation), sfsAll=all SFS references
 */
export function transformAgencyData(rawData) {
  // Defensive: ensure rawData has required properties
  if (!rawData || typeof rawData !== 'object') {
    console.error('transformAgencyData: Invalid rawData', rawData);
    return [];
  }

  const merged = rawData.merged || {};
  const wd = rawData.wd || {};

  // merged.json has 978 agencies with nested source data (esv, stkt, scb, sfs, agv)
  // wd.json has start/end dates from Wikidata
  // Use Map to deduplicate by normalized name (handles "Andra AP-fonden" vs "ANDRA AP-FONDEN")
  const agencyMap = new Map();

  Object.entries(merged).forEach(([name, sources]) => {
    // Skip if sources is not an object
    if (!sources || typeof sources !== 'object') return;
    // Normalize name for deduplication (lowercase for comparison)
    const normalizedKey = name.toLowerCase().trim();
    // Extract data from each source within merged.json
    const esv = sources.esv || {};
    const stkt = sources.stkt || {};
    const scb = sources.scb || {};
    const sfs = sources.sfs || {};
    const agv = sources.agv || {};

    // Get Wikidata for start/end dates
    const wdData = wd[name] || {};

    // Get latest employee/FTE data from ESV (most complete for recent years)
    const esvEmployees = (esv && esv.employees) ? esv.employees : {};
    const esvFte = (esv && esv.fte) ? esv.fte : {};
    const esvYears = Object.keys(esvEmployees);
    const latestEsvYear = esvYears.length > 0 ? esvYears.sort().pop() : null;
    const latestEsvEmp = latestEsvYear ? esvEmployees[latestEsvYear] : undefined;
    const latestFte = latestEsvYear ? esvFte[latestEsvYear] : undefined;

    // Get AGV employee history (goes back to 1980 for many agencies)
    const agvTotal = (agv && agv.total) ? agv.total : {};
    const agvWomen = (agv && agv.women) ? agv.women : {};
    const agvMen = (agv && agv.men) ? agv.men : {};

    // Get latest employee count (prefer ESV if available, otherwise AGV)
    const agvYears = Object.keys(agvTotal);
    const latestAgvYear = agvYears.length > 0 ? agvYears.sort().pop() : null;
    const latestAgvEmp = latestAgvYear ? agvTotal[latestAgvYear] : undefined;
    const latestEmp = latestEsvEmp || latestAgvEmp;

    // Get latest gender data from AGV
    const latestWomen = latestAgvYear ? agvWomen[latestAgvYear] : undefined;
    const latestMen = latestAgvYear ? agvMen[latestAgvYear] : undefined;

    // Extract city from SCB office_address or postal_address
    const scbOffice = scb.office_address || {};
    const scbPostal = scb.postal_address || {};
    const city = scbOffice.city || scbPostal.city;

    // Build office address string
    const officeAddress = scbOffice.address
      ? `${scbOffice.address}, ${scbOffice.postcode || ''} ${scbOffice.city || ''}`.trim()
      : undefined;

    // Build postal address string
    const postalAddress = scbPostal.address
      ? `${scbPostal.address}, ${scbPostal.postcode || ''} ${scbPostal.city || ''}`.trim()
      : undefined;

    // Build compact agency object with ALL available data
    const agency = {
      // BASIC INFO
      n: name,
      en: esv.name_en || wdData.name_en,
      sh: esv.short_name || stkt.abbreviation || scb.short_name,
      d: esv.department || stkt.department,
      org: esv.org_nr || stkt.org_nr || scb.org_nr || wdData.org_nr,

      // DATES
      s: wdData.start || stkt.start || sfs.start,
      e: wdData.end || stkt.end || sfs.end,

      // EMPLOYEES (current/latest)
      emp: latestEmp,
      fte: latestFte,
      w: latestWomen || scb.women,
      m: latestMen || scb.men,

      // EMPLOYEES (history - all years)
      empH: agvTotal,  // { "1980": 1234, "1981": 1250, ... }
      wH: agvWomen,    // { "1980": 600, ... }
      mH: agvMen,      // { "1980": 634, ... }
      fteH: esvFte,    // FTE from ESV (2005+)

      // ORGANIZATION
      str: stkt.structure,  // "Styrelse", "Enrådighet", etc.
      cof: stkt.cofog10,    // COFOG classification
      gd: stkt.has_gd,      // has generaldirektör (boolean)
      host: stkt.host_authority,
      grp: scb.group,       // Agency category

      // CONTACT
      web: scb.website || agv.website,
      wiki: wdData.wiki_url,
      wdId: wdData.id,      // Wikidata Q-id
      email: scb.email || esv.email,
      tel: scb.phone || agv.phone,

      // ADDRESS
      city: city,
      addr: officeAddress,
      post: postalAddress,

      // LEGAL
      sfs: sfs.created_by || stkt.created_by,
      sfsAll: sfs.sfs,      // Array of all SFS references
      sfsLatest: stkt.latest_updated_by,
    };

    // Remove undefined/null/empty properties to keep objects clean
    Object.keys(agency).forEach(key => {
      const val = agency[key];
      if (val === undefined || val === null ||
          (typeof val === 'object' && val !== null && Object.keys(val).length === 0)) {
        delete agency[key];
      }
    });

    // Deduplicate: if we already have this agency, merge data (prefer more complete entry)
    if (agencyMap.has(normalizedKey)) {
      const existing = agencyMap.get(normalizedKey);
      // Keep the version with more data fields, or prefer properly capitalized name
      const existingFields = Object.keys(existing).length;
      const newFields = Object.keys(agency).length;
      if (newFields > existingFields || (newFields === existingFields && name !== name.toUpperCase())) {
        agencyMap.set(normalizedKey, agency);
      }
    } else {
      agencyMap.set(normalizedKey, agency);
    }
  });

  return Array.from(agencyMap.values());
}

/**
 * Clear the data cache (useful for forcing refresh)
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('Agency data cache cleared');
}

/**
 * Get cache info
 */
export function getCacheInfo() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { exists: false };

    const { timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    const expiresIn = CACHE_DURATION - age;

    return {
      exists: true,
      timestamp: new Date(timestamp).toISOString(),
      ageHours: Math.round(age / (60 * 60 * 1000) * 10) / 10,
      expiresInHours: Math.round(expiresIn / (60 * 60 * 1000) * 10) / 10,
    };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}
