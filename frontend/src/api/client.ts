import type {
  QuoteRequest,
  QuoteResponse,
  SimulateRequest,
  SimulateResponse,
  TransactionRecord,
  Country,
} from "../types/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("paypilot_token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = getAuthHeaders();
  const res = await fetch(endpoint, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      err.detail || `Request failed with status ${res.status}`
    );
  }
  return res.json();
}

export const api = {
  getQuote: (data: QuoteRequest) =>
    request<QuoteResponse>("/api/quote", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  simulate: (data: SimulateRequest) =>
    request<SimulateResponse>("/api/simulate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTransactions: () =>
    request<{ transactions: TransactionRecord[]; total: number }>(
      "/api/transactions"
    ),

  getTransaction: (id: string) => request<unknown>(`/api/transactions/${id}`),

  getCountries: () =>
    request<{ countries: Country[] }>("/api/info/countries"),

  getOnRamps: () =>
    request<{ providers: unknown[] }>("/api/info/onramps"),

  getNetworks: () =>
    request<{ networks: unknown[] }>("/api/info/networks"),
};

export { ApiError };
