import { useState, useEffect, useCallback } from 'react';
import { useOfflineSupport } from './useOfflineSupport';

interface OfflineDataOptions {
  cacheKey: string;
  fetchFunction: () => Promise<any>;
  dependencies?: any[];
  cacheDuration?: number; // in milliseconds
}

interface OfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOfflineData: boolean;
}

const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useOfflineData = <T>({
  cacheKey,
  fetchFunction,
  dependencies = [],
  cacheDuration = DEFAULT_CACHE_DURATION,
}: OfflineDataOptions): OfflineDataResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  
  const { isOnline } = useOfflineSupport();

  // Load data from cache or fetch fresh data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      const isCacheValid = cacheTimestamp && 
        Date.now() - parseInt(cacheTimestamp) < cacheDuration;

      if (cachedData && isCacheValid) {
        console.log(`Using cached data for ${cacheKey}`);
        setData(JSON.parse(cachedData));
        setIsOfflineData(false);
        setLoading(false);
        
        // If online, fetch fresh data in background
        if (isOnline) {
          try {
            const freshData = await fetchFunction();
            setData(freshData);
            setIsOfflineData(false);
            
            // Update cache
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
          } catch (fetchError) {
            console.warn('Background fetch failed, using cached data:', fetchError);
          }
        }
        return;
      }

      // If online, fetch fresh data
      if (isOnline) {
        console.log(`Fetching fresh data for ${cacheKey}`);
        const freshData = await fetchFunction();
        setData(freshData);
        setIsOfflineData(false);
        
        // Update cache
        localStorage.setItem(cacheKey, JSON.stringify(freshData));
        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      } else {
        // If offline and no valid cache, use stale cache if available
        if (cachedData) {
          console.log(`Using stale cached data for ${cacheKey} (offline)`);
          setData(JSON.parse(cachedData));
          setIsOfflineData(true);
        } else {
          throw new Error('No cached data available and offline');
        }
      }
    } catch (err: any) {
      console.error(`Error loading data for ${cacheKey}:`, err);
      setError(err.message);
      
      // Try to use stale cache as fallback
      const staleCache = localStorage.getItem(cacheKey);
      if (staleCache) {
        console.log(`Using stale cache as fallback for ${cacheKey}`);
        setData(JSON.parse(staleCache));
        setIsOfflineData(true);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFunction, isOnline, cacheDuration, ...dependencies]);

  // Refresh data
  const refresh = useCallback(async () => {
    // Clear cache to force fresh fetch
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    await loadData();
  }, [cacheKey, loadData]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    isOfflineData,
  };
};
