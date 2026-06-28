import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";

/**
 * Hook for fetching analytics module results.
 * @param {string} module - One of: "dashboard", "segmentation", "ranking", "product-insights", "mega-report"
 */
export function useAnalytics(module) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchModule = useCallback(() => {
    if (!module) return;
    setLoading(true);
    setError(null);
    setData(null);

    apiClient
      .get(`/api/analytics/${module}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [module]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  return { data, loading, error, refetch: fetchModule };
}

export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get("/api/analytics/dashboard")
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, loading, error };
}
