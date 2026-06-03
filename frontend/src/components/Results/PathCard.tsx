import type { PathOption } from "../../types/api";
import { formatUSD, formatDuration, formatLocal } from "../../utils/format";
import { COUNTRIES } from "../../utils/constants";
import RiskBadge from "./RiskBadge";
import CostBreakdown from "./CostBreakdown";
import FlowchartContainer from "./Flowchart/FlowchartContainer";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { useState } from "react";

interface PathCardProps {
  path: PathOption;
  rank: number;
  amount: number;
  destinationCountry: string;
  onSimulate: (path: PathOption) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function PathCard({
  path,
  rank,
  amount,
  destinationCountry,
  onSimulate,
  isExpanded,
  onToggle,
}: PathCardProps) {
  const country = COUNTRIES.find((c) => c.code === destinationCountry);
  const countrySymbol = country?.currency_symbol || "$";

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
        rank === 1
          ? "border-blue-500 shadow-md shadow-blue-500/10"
          : "border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
      }`}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Rank + path label */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  rank === 1
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                #{rank}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {path.on_ramp.provider} → {path.network.name} →{" "}
                {path.off_ramp.provider}
              </span>
              <RiskBadge
                score={path.summary.risk_score}
                level={path.summary.risk_level}
              />
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  path.summary.speed_label === "fast"
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : path.summary.speed_label === "medium"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                }`}
              >
                {path.summary.speed_label}
              </span>
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total Fees
                </div>
                <div className="font-bold text-red-600 dark:text-red-400">
                  {formatUSD(path.summary.total_fee_usd)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Time
                </div>
                <div className="font-bold text-gray-900 dark:text-white">
                  {formatDuration(path.summary.total_time_minutes)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Recipient Gets
                </div>
                <div className="font-bold text-green-600 dark:text-green-400">
                  {formatLocal(
                    path.summary.received_local,
                    path.summary.currency,
                    countrySymbol
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  AI Score
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  {path.total_score}/100
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onSimulate(path)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm"
          >
            <Play className="w-4 h-4" />
            Simulate
          </button>
          <button
            onClick={onToggle}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Details
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CostBreakdown path={path} amount={amount} />
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                Risk Analysis
              </h4>
              <div className="space-y-3">
                {[
                  {
                    label: "Regulatory",
                    score: path.summary.risk_breakdown.regulatory,
                  },
                  {
                    label: "Congestion",
                    score: path.summary.risk_breakdown.congestion,
                  },
                  {
                    label: "Liquidity",
                    score: path.summary.risk_breakdown.liquidity,
                  },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {r.label}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {r.score}/5
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          r.score <= 2
                            ? "bg-green-500"
                            : r.score <= 3
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${(r.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Flowchart */}
          <FlowchartContainer path={path} />
        </div>
      )}
    </div>
  );
}
