/**
 * useAiSuggestion — manages the AI query suggestion lifecycle.
 *
 * States: idle | loading | success | error
 * Exposes: suggest(intent), dismiss, suggestedSql, isLoading, error, aiEnabled
 */
import { useState, useCallback, useEffect } from "react";
import apiClient from "../api/client";

export function useAiSuggestion() {
  const [status,       setStatus]       = useState("idle");  // "idle"|"loading"|"success"|"error"
  const [suggestedSql, setSuggestedSql] = useState(null);
  const [error,        setError]        = useState(null);
  const [aiEnabled,    setAiEnabled]    = useState(true);    // optimistic default

  // Check if AI is configured on mount
  useEffect(() => {
    apiClient.get("/api/ai/status")
      .then((res) => setAiEnabled(res.data.ai_enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const suggest = useCallback(async (intent) => {
    if (!intent?.trim()) return;
    setStatus("loading");
    setSuggestedSql(null);
    setError(null);

    try {
      const res  = await apiClient.post("/api/ai/suggest", { intent });
      const data = res.data;

      if (data.status === "success") {
        setStatus("success");
        setSuggestedSql(data.sql);
      } else {
        setStatus("error");
        setError(data.error_message || "AI suggestion failed.");
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Network error reaching AI endpoint.");
    }
  }, []);

  const dismiss = useCallback(() => {
    setStatus("idle");
    setSuggestedSql(null);
    setError(null);
  }, []);

  return {
    status,
    suggestedSql,
    error,
    aiEnabled,
    isLoading: status === "loading",
    suggest,
    dismiss,
  };
}
