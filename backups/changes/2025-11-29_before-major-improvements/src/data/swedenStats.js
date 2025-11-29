// Sveriges befolkning och BNP 1978-2025
// Datakällor:
// - Befolkning 1978–2024: SCB TAB4365 – Befolkningsutvecklingen i riket
// - BNP 1980–2023: SCB TAB3610 – BNP till marknadspris, löpande priser (mnkr)

export const swedenStats = [
  { year: 1978, population: 8284437, gdp: null },
  { year: 1979, population: 8303010, gdp: null },
  { year: 1980, population: 8317937, gdp: 593080 },
  { year: 1981, population: 8323033, gdp: 647792 },
  { year: 1982, population: 8327484, gdp: 709382 },
  { year: 1983, population: 8330573, gdp: 794938 },
  { year: 1984, population: 8342621, gdp: 893171 },
  { year: 1985, population: 8358139, gdp: 971661 },
  { year: 1986, population: 8381515, gdp: 1063426 },
  { year: 1987, population: 8414083, gdp: 1152756 },
  { year: 1988, population: 8458888, gdp: 1261383 },
  { year: 1989, population: 8527036, gdp: 1396026 },
  { year: 1990, population: 8590630, gdp: 1534734 },
  { year: 1991, population: 8644119, gdp: 1643226 },
  { year: 1992, population: 8692013, gdp: 1644889 },
  { year: 1993, population: 8745109, gdp: 1655098 },
  { year: 1994, population: 8816381, gdp: 1764642 },
  { year: 1995, population: 8837496, gdp: 1904951 },
  { year: 1996, population: 8844499, gdp: 1957814 },
  { year: 1997, population: 8847625, gdp: 2048059 },
  { year: 1998, population: 8854322, gdp: 2153527 },
  { year: 1999, population: 8861426, gdp: 2266528 },
  { year: 2000, population: 8882792, gdp: 2408775 },
  { year: 2001, population: 8909128, gdp: 2504784 },
  { year: 2002, population: 8940788, gdp: 2603427 },
  { year: 2003, population: 8975670, gdp: 2701410 },
  { year: 2004, population: 9011392, gdp: 2825986 },
  { year: 2005, population: 9047752, gdp: 2927127 },
  { year: 2006, population: 9113257, gdp: 3117499 },
  { year: 2007, population: 9182927, gdp: 3312135 },
  { year: 2008, population: 9256347, gdp: 3391873 },
  { year: 2009, population: 9340682, gdp: 3324135 },
  { year: 2010, population: 9415570, gdp: 3551514 },
  { year: 2011, population: 9482855, gdp: 3704817 },
  { year: 2012, population: 9555893, gdp: 3724495 },
  { year: 2013, population: 9644864, gdp: 3804976 },
  { year: 2014, population: 9747355, gdp: 3963666 },
  { year: 2015, population: 9851017, gdp: 4230936 },
  { year: 2016, population: 9995153, gdp: 4392801 },
  { year: 2017, population: 10120242, gdp: 4575114 },
  { year: 2018, population: 10230185, gdp: 4777837 },
  { year: 2019, population: 10327589, gdp: 5021382 },
  { year: 2020, population: 10379295, gdp: 5012855 },
  { year: 2021, population: 10452326, gdp: 5417760 },
  { year: 2022, population: 10521556, gdp: 5816415 },
  { year: 2023, population: 10551707, gdp: 6143187 },
  { year: 2024, population: 10587710, gdp: null },
  { year: 2025, population: null, gdp: null },
];

// Helper: Get stats by year
export function getStatsByYear(year) {
  return swedenStats.find(s => s.year === year);
}

// Helper: Get population for a specific year
export function getPopulation(year) {
  const stats = getStatsByYear(year);
  return stats?.population || null;
}

// Helper: Get GDP for a specific year
export function getGDP(year) {
  const stats = getStatsByYear(year);
  return stats?.gdp || null;
}

// Helper: Get stats as object keyed by year
export function getStatsAsMap() {
  return Object.fromEntries(swedenStats.map(s => [s.year, s]));
}

// Helper: Get year range with data
export function getYearRange() {
  const withPopulation = swedenStats.filter(s => s.population);
  const withGDP = swedenStats.filter(s => s.gdp);
  return {
    population: {
      min: Math.min(...withPopulation.map(s => s.year)),
      max: Math.max(...withPopulation.map(s => s.year)),
    },
    gdp: {
      min: Math.min(...withGDP.map(s => s.year)),
      max: Math.max(...withGDP.map(s => s.year)),
    },
  };
}
