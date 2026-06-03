import type { SimulateResponse, TransactionRecord } from "../../types/api";
import { formatUSD, formatLocal } from "../../utils/format";
import { COUNTRIES } from "../../utils/constants";
import TransactionTimeline from "./TransactionTimeline";
import FeeBreakdownChart from "./FeeBreakdownChart";
import { api } from "../../api/client";
import { ArrowLeft, History, CheckCircle, Clock, DollarSign } from "lucide-react";

interface SimulationPanelProps {
  data: SimulateResponse;
  onBack: () => void;
  onHistory: (data: TransactionRecord[]) => void;
}

export default function SimulationPanel({
  data,
  onBack,
  onHistory,
}: SimulationPanelProps) {
  const p = data.path_snapshot;
  const country = COUNTRIES.find(
    (c) => c.currency === p?.off_ramp?.currency
  );

  const handleViewHistory = async () => {
    try {
      const res = await api.getTransactions();
      onHistory(res.transactions);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </button>
        <button
          onClick={handleViewHistory}
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <History className="w-4 h-4" />
          View History
        </button>
      </div>

      {/* Success banner */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-800 dark:text-green-200">
              Simulation Complete ✅
            </h2>
            <p className="text-sm text-green-600 dark:text-green-300">
              No real funds were moved. All data is simulated for demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Cost
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatUSD(data.summary.total_fee_usd)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {data.summary.value_loss_pct}% of transfer
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Total Time
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.summary.total_time_minutes} min
          </div>
          <div className="text-xs text-gray-400 mt-1">
            From USD deposit to local settlement
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            🏦 Recipient Gets
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.summary.local_currency === "USDC"
              ? `${data.summary.final_amount_local} USDC`
              : formatLocal(
                  data.summary.final_amount_local,
                  data.summary.local_currency,
                  country?.currency_symbol || "$"
                )
            }
          </div>
          {data.summary.local_currency !== "USDC" && (
            <div className="text-xs text-gray-400 mt-1">
              ≈ {formatUSD(data.summary.usd_equivalent_received)} USD equivalent
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
          Transaction Timeline
        </h3>
        <TransactionTimeline steps={data.steps} />
      </div>

      {/* Fee chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <FeeBreakdownChart
          steps={data.steps}
          totalFee={data.summary.total_fee_usd}
        />
      </div>

      {/* Path info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Path:</span>
          <span className="font-mono text-gray-900 dark:text-white">
            {data.path_snapshot?.on_ramp?.provider} →{" "}
            {data.path_snapshot?.network?.name} →{" "}
            {data.path_snapshot?.off_ramp?.provider}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>Simulation ID: {data.simulation_id}</span>
          <span>·</span>
          <span>Transaction ID: {data.transaction_id}</span>
        </div>
      </div>

      {/* Demo disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 text-center">
        🧪 <strong>Demo Only.</strong> This is a simulated transaction for
        hackathon demonstration. No real funds were transferred.
      </div>
    </div>
  );
}
