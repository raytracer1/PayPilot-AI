import type { PathOption } from "../../types/api";
import { formatUSD } from "../../utils/format";

interface CostBreakdownProps {
  path: PathOption;
  amount: number;
}

export default function CostBreakdown({ path, amount }: CostBreakdownProps) {
  const items = [
    {
      label: `${path.on_ramp.provider} Fee`,
      amount: path.on_ramp.fee_usd,
    },
    {
      label: `${path.on_ramp.provider} Spread`,
      amount: path.on_ramp.spread_usd,
    },
    {
      label: `${path.network.name} Gas`,
      amount: path.network.gas_fee_usd,
    },
    {
      label: `${path.off_ramp.provider} Fee`,
      amount: path.off_ramp.fee_usd,
    },
    {
      label: `${path.off_ramp.provider} Spread`,
      amount: path.off_ramp.spread_usd,
    },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
        Fee Breakdown
      </h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between text-sm"
          >
            <span className="text-gray-600 dark:text-gray-400">
              {item.label}
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formatUSD(item.amount)}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm font-bold">
          <span className="text-gray-900 dark:text-white">Total Fees</span>
          <span className="text-red-600 dark:text-red-400">
            {formatUSD(path.summary.total_fee_usd)}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>You receive (after fees)</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            {formatUSD(path.summary.usd_received_after_fees)}
          </span>
        </div>
      </div>

      {/* Efficiency gauge */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Efficiency</span>
          <span>{path.summary.efficiency_score}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              path.summary.efficiency_score >= 95
                ? "bg-green-500"
                : path.summary.efficiency_score >= 90
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${path.summary.efficiency_score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
