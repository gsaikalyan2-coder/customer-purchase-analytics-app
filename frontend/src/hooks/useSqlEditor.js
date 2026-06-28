/**
 * useSqlEditor — state management hook for the SQL editor.
 *
 * Manages: SQL text, execution state, results, errors, execution time.
 * Delegates history management to useQueryHistory.
 */
import { useState, useCallback } from "react";
import apiClient from "../api/client";
import { useQueryHistory } from "./useQueryHistory";

export const DEFAULT_QUERY = `-- Customer Purchase Analytics — SQL Editor
-- Database: Supabase PostgreSQL 17.6
-- Tables: customers, products, orders
-- Try one of the window function queries from M1–M10 below:

SELECT
    c.customer_name,
    c.city,
    o.order_date,
    ROUND(o.quantity * o.unit_price * (1 - o.discount), 2)    AS order_amount,
    ROW_NUMBER() OVER (
        PARTITION BY c.customer_id ORDER BY o.order_date
    )                                                           AS purchase_sequence,
    SUM(ROUND(o.quantity * o.unit_price * (1 - o.discount), 2))
        OVER (
            PARTITION BY c.customer_id ORDER BY o.order_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                       AS running_total
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN products  p ON o.product_id  = p.product_id
ORDER BY c.customer_id, o.order_date;`;

export function useSqlEditor() {
  const [sql, setSql]             = useState(DEFAULT_QUERY);
  const [status, setStatus]       = useState("idle"); // "idle" | "running" | "success" | "error"
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [durationMs, setDurationMs] = useState(null);

  const { addToHistory } = useQueryHistory();

  const executeQuery = useCallback(async (queryOverride) => {
    const queryToRun = (queryOverride ?? sql).trim();
    if (!queryToRun) return;

    setStatus("running");
    setResult(null);
    setError(null);
    setDurationMs(null);

    try {
      const response = await apiClient.post("/api/sql/execute", {
        sql: queryToRun,
      });

      const data = response.data;
      setDurationMs(data.duration_ms);

      if (data.status === "success") {
        setStatus("success");
        setResult(data);
        addToHistory({
          sql: queryToRun,
          durationMs: data.duration_ms,
          rowCount: data.row_count,
          status: "success",
        });
      } else {
        setStatus("error");
        setError(data);
        addToHistory({
          sql: queryToRun,
          durationMs: data.duration_ms,
          rowCount: 0,
          status: "error",
          errorCode: data.error_code,
        });
      }
    } catch (networkErr) {
      setStatus("error");
      const errData = {
        status: "error",
        error_code: "NETWORK_ERROR",
        error_message: networkErr.message || "Network request failed.",
        hint: "Ensure the FastAPI backend is running on port 8000.",
        duration_ms: 0,
      };
      setError(errData);
      addToHistory({
        sql: queryToRun,
        durationMs: 0,
        rowCount: 0,
        status: "error",
        errorCode: "NETWORK_ERROR",
      });
    } finally {
      setStatus((prev) => (prev === "running" ? "idle" : prev));
    }
  }, [sql, addToHistory]);

  const clearEditor = useCallback(() => {
    setSql("");
    setResult(null);
    setError(null);
    setStatus("idle");
    setDurationMs(null);
  }, []);

  const isRunning = status === "running";

  return {
    sql, setSql,
    status,
    result,
    error,
    durationMs,
    isRunning,
    executeQuery,
    clearEditor,
  };
}
