/* ─── Request Types ─── */

export interface QuoteRequest {
  amount_usd: number;
  destination_country: string;
  speed_preference: "fast" | "cheapest" | "balanced";
  currency?: "USDC" | "USDT";
  recipient_type?: "bank" | "wallet";
  wallet_address?: string | null;
  bank_account?: string | null;
}

export interface SimulateRequest {
  path_id: string;
  amount_usd: number;
  skip_on_ramp?: boolean;
}

/* ─── Response Types ─── */

export interface OnRampInfo {
  provider: string;
  method: string;
  fee_usd: number;
  spread_pct: number;
  spread_usd: number;
  time_minutes: number;
  rating: number;
}

export interface NetworkInfo {
  name: string;
  layer: string;
  gas_fee_usd: number;
  time_minutes: number;
  reliability_pct: number;
  tps: number;
}

export interface OffRampInfo {
  provider: string;
  method: string;
  fee_usd: number;
  spread_pct: number;
  spread_usd: number;
  time_minutes: number;
  currency: string;
  exchange_rate: number;
  received_local: number;
}

export interface RiskBreakdown {
  regulatory: number;
  congestion: number;
  liquidity: number;
  intermediary: number;
  overall: number;
  level: string;
}

export interface PathSummary {
  input_amount_usd: number;
  total_fee_usd: number;
  total_time_minutes: number;
  on_ramp_fee_usd: number;
  on_ramp_time_minutes: number;
  gas_fee_usd: number;
  off_ramp_fee_usd: number;
  received_local: number;
  currency: string;
  exchange_rate: number;
  risk_score: number;
  risk_level: string;
  risk_breakdown: RiskBreakdown;
}

export interface PathOption {
  id: string;
  on_ramp: OnRampInfo | null;
  network: NetworkInfo;
  off_ramp: OffRampInfo | null;
  summary: PathSummary;
}

export interface ScoredPath extends PathOption {
  score: number;
}

export interface QuoteResponse {
  paths: PathOption[];
  meta: {
    total_paths_evaluated: number;
    paths_returned: number;
    base_currency: string;
    timestamp: string;
  };
}

export interface SimulationStep {
  step_number: number;
  phase: "on_ramp" | "network" | "off_ramp";
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp_offset_minutes: number;
  duration_minutes: number;
  details: Record<string, unknown>;
}

export interface SimulationSummary {
  total_fee_usd: number;
  total_time_minutes: number;
  final_amount_local: number;
  local_currency: string;
  usd_equivalent_received: number;
  effective_exchange_rate: number;
  value_loss_pct: number;
}

export interface SimulateResponse {
  simulation_id: string;
  transaction_id: string;
  status: string;
  path_snapshot: PathOption;
  steps: SimulationStep[];
  summary: SimulationSummary;
}

export interface TransactionRecord {
  id: string;
  amount_usd: number;
  destination_country: string;
  speed_preference: string;
  total_fee_usd: number;
  total_time_minutes: number;
  received_local: number;
  local_currency: string;
  selected_path_summary: string | null;
  created_at: string;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
  off_ramps: string[];
}
