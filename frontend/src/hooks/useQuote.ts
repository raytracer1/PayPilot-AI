import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { QuoteRequest, QuoteResponse } from "../types/api";

export function useQuote() {
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async (req: QuoteRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getQuote(req);
      setData(res);
      return res;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch quote";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchQuote, reset: () => setData(null) };
}
