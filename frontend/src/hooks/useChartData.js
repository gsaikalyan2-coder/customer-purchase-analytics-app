/**
 * useChartData — fetches data for all three charts in parallel.
 * Calls /api/analytics/moving-analytics and /api/analytics/revenue-timeline.
 */
import { useState, useEffect, useCallback } from "react";
import apiClient from "../api/client";

export function useChartData() {
  const [movingData,  setMovingData]  = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [movingRes, revenueRes] = await Promise.all([
        apiClient.get("/api/analytics/moving-analytics"),
        apiClient.get("/api/analytics/revenue-timeline"),
      ]);
      setMovingData(movingRes.data.data || []);
      setRevenueData(revenueRes.data.data || []);
    } catch (err) {
      setError(err.message || "Failed to load chart data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { movingData, revenueData, loading, error, refetch: fetchAll };
}
