import { useState, useCallback } from "react";
import { api } from "../api/client";
import type { SimulateRequest, SimulateResponse } from "../types/api";

export function useSimulate() {
  const [data, setData] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = useCallback(async (req: SimulateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.simulate(req);
      setData(res);
      return res;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Simulation failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, runSimulation, reset: () => setData(null) };
}
