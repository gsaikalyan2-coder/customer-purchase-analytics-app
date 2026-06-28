/**
 * useQueryHistory — localStorage-backed query history management.
 * Key: "cpa_query_history"
 * Stores last 20 queries with metadata.
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "cpa_query_history";
const MAX_HISTORY  = 20;

function loadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function useQueryHistory() {
  const [history, setHistory] = useState(loadHistory);

  const addToHistory = useCallback(({ sql, durationMs, rowCount, status, errorCode }) => {
    setHistory((prev) => {
      const entry = {
        id: Date.now().toString(),
        sql,
        executedAt: new Date().toISOString(),
        durationMs,
        rowCount,
        status,
        errorCode: errorCode || null,
        preview: sql.replace(/\s+/g, " ").slice(0, 80),
      };
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addToHistory, clearHistory };
}
