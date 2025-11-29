// External data fetching from civictechsweden/myndighetsdata
const BASE_URL = 'https://raw.githubusercontent.com/civictechsweden/myndighetsdata/master/data';

const CACHE_KEY = 'myndigheter_data_cache';
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
  const [scb, stkt, sfs, agv, esv, wd] = await Promise.all([
    fetchJSON('scb.json'),
    fetchJSON('stkt.json'),
    fetchJSON('sfs.json'),
    fetchJSON('agv.json'),
    fetchJSON('esv.json'),
    fetchJSON('wd.json'),
  ]);

  const data = { scb, stkt, sfs, agv, esv, wd };

  // Cache the data
  setCachedData(data);

  return data;
}

/**
 * Merge and transform raw data into app-ready format
 */
export function transformAgencyData(rawData) {
  const { scb, stkt, sfs, agv, esv, wd } = rawData;

  // Create a merged dataset using stkt as base (has most structured data)
  const agencies = [];

  Object.entries(stkt).forEach(([name, data]) => {
    // Get additional data from other sources
    const scbData = scb[name] || {};
    const sfsData = sfs[name] || {};
    const agvData = agv[name] || {};
    const esvData = esv[name] || {};
    const wdData = wd[name] || {};

    agencies.push({
      name,
      // From stkt (Statskontoret)
      department: data.department || 'Okänt',
      orgNr: data.org_nr,
      cofog: data.cofog,
      cofog10: data.cofog10,
      structure: data.structure,
      hasGD: data.has_gd,
      createdBy: data.created_by,
      latestUpdatedBy: data.latest_updated_by,
      fte: data.fte || {},
      otherNames: data.other_names || [],

      // From scb
      employees: scbData.employees,

      // From sfs
      sfsRef: sfsData.created_by,

      // From agv
      email: agvData.email,
      phone: agvData.phone,
      website: agvData.website,
      postalAddress: agvData.postal_address,
      officeAddress: agvData.office_address,
      group: agvData.group,

      // From esv
      budget: esvData.budget,

      // From wd (Wikidata)
      wikidataId: wdData.id,
      nameEn: wdData.name_en,
      startDate: wdData.start || data.start,
      endDate: wdData.end,
      wikiUrl: wdData.wiki_url,
    });
  });

  return agencies;
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
