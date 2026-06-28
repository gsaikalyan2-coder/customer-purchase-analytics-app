import { useState, useEffect } from "react";
import apiClient from "../api/client";

export function useOrders(customerId = null) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = customerId
      ? `/api/orders/customer/${customerId}`
      : "/api/orders";

    apiClient
      .get(url)
      .then((res) => {
        if (!cancelled) setOrders(res.data);
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
  }, [customerId]);

  return { orders, loading, error };
}
