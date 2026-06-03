import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { TransactionRecord } from "../types/api";

export function useHistory() {
  const [data, setData] = useState<TransactionRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions();
      setData(res.transactions);
      return res.transactions;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load history";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchHistory, reset: () => setData(null) };
}
