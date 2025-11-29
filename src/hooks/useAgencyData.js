import { useState, useEffect, useCallback } from 'react';
import { fetchAllAgencyData, transformAgencyData, clearCache, getCacheInfo } from '../data/fetchData';

/**
 * Custom hook for fetching and managing agency data
 * Handles loading, error states, and caching
 */
export function useAgencyData() {
  const [data, setData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        clearCache();
      }

      const raw = await fetchAllAgencyData();
      setRawData(raw);

      const transformed = transformAgencyData(raw);
      setData(transformed);

      setCacheInfo(getCacheInfo());
    } catch (err) {
      console.error('Failed to fetch agency data:', err);
      setError(err.message || 'Kunde inte hämta data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    rawData,
    loading,
    error,
    refresh,
    cacheInfo,
  };
}

/**
 * Hook for debouncing values (useful for search)
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for URL state management
 */
export function useUrlState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;

    const params = new URLSearchParams(window.location.search);
    const urlValue = params.get(key);

    if (urlValue === null) return defaultValue;

    try {
      return JSON.parse(urlValue);
    } catch {
      return urlValue;
    }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (value === defaultValue || value === null || value === undefined) {
      params.delete(key);
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      params.set(key, stringValue);
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [key, value, defaultValue]);

  return [value, setValue];
}
