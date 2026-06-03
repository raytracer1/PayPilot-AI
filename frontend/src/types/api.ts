/* ─── Request Types ─── */

export interface QuoteRequest {
  amount_usd: number;
  destination_country: string;
  speed_preference: "fast" | "cheapest" | "balanced";
  wallet_address?: string | null;
  bank_account?: string | null;
}

export interface SimulateRequest {
  path_id: string;
  amount_usd: number;
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
  overall: number;
  level: string;
}

export interface PathSummary {
  total_fee_usd: number;
  total_time_minutes: number;
  usd_received_after_fees: number;
  received_local: number;
  received_usd_equivalent: number;
  currency: string;
  risk_score: number;
  risk_level: string;
  risk_breakdown: RiskBreakdown;
  efficiency_score: number;
  speed_label: string;
}

export interface PathOption {
  id: string;
  rank: number;
  total_score: number;
  cost_score: number;
  speed_score: number;
  risk_score_0_100: number;
  reliability_score: number;
  on_ramp: OnRampInfo;
  network: NetworkInfo;
  off_ramp: OffRampInfo;
  summary: PathSummary;
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
  status: string;
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
