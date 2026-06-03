import type { PathOption, ScoredPath } from "../types/api";

const WEIGHTS: Record<string, { cost: number; speed: number; risk: number; reliability: number }> = {
  fast: { cost: 0.05, speed: 0.60, risk: 0.20, reliability: 0.15 },
  cheapest: { cost: 0.70, speed: 0.05, risk: 0.15, reliability: 0.10 },
  balanced: { cost: 0.25, speed: 0.25, risk: 0.25, reliability: 0.25 },
};

/** Score a single cost dimension 0-100 (higher = cheaper). */
function costScore(fee: number, amount: number): number {
  if (amount <= 0) return 0;
  // Compare fees relative to the best possible cost for this amount
  // Small amounts still get differentiated — $0.53 beats $1.04
  const pct = (fee / amount) * 100;
  // 0% fee = 100, 40% fee = 0 — preserves ordering even for tiny amounts
  return Math.max(0, 100 - pct * 2.5);
}

/** Score speed 0-100 (exponential decay). */
function speedScore(minutes: number, decay: number = 0.001): number {
  return Math.max(0, 100 * Math.exp(-decay * minutes));
}

const SPEED_DECAY: Record<string, number> = {
  fast: 0.05,      // steep: 10min=60, 30min=22 — differentiates minutes
  balanced: 0.005,  // moderate: 1h=74, 1d=0
  cheapest: 0.001,  // flat: 1h=94, 1d=24 — only matters for days
};

/** Invert risk 1-5 to 0-100 (higher = safer). */
function riskScore(risk: number): number {
  return Math.max(0, 100 - ((risk - 1) / 4) * 100);
}

/** Reliability score from provider ratings. */
function reliabilityScore(onRating: number | null, offRating: number, netReliability: number): number {
  const on = onRating ?? 4.0;
  return (0.3 * (on / 5) + 0.3 * (offRating / 5) + 0.4 * (netReliability / 100)) * 100;
}

export function sortPaths(paths: PathOption[], amount: number, preference: string): ScoredPath[] {
  const w = WEIGHTS[preference] ?? WEIGHTS.balanced;

  const scored: ScoredPath[] = paths.map((p) => {
    const cs = costScore(p.summary.total_fee_usd, amount);
    const decay = SPEED_DECAY[preference] ?? 0.001;
    const ss = speedScore(p.summary.total_time_minutes, decay);
    const rs = riskScore(p.summary.risk_score);
    // OffRampInfo doesn't have a rating field — use a default
    const offRating = 4.0;
    const rel = reliabilityScore(
      p.on_ramp?.rating ?? null,
      offRating,
      p.network.reliability_pct,
    );

    const score = w.cost * cs + w.speed * ss + w.risk * rs + w.reliability * rel;

    return { ...p, score: Math.round(score * 10) / 10 };
  });

  scored.sort((a, b) => b.score - a.score);

  // USDC: backend already deduped by network+off_ramp.
  // USDT: dedup one per on_ramp for variety.
  const seen = new Set<string>();
  const result: ScoredPath[] = [];
  for (const p of scored) {
    const key = p.off_ramp
      ? (p.on_ramp ? p.on_ramp.provider : `${p.network.name}_${p.off_ramp.provider}`)
      : p.network.name;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}
