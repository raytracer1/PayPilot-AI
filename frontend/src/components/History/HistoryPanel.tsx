import type { TransactionRecord } from "../../types/api";
import TransactionRow from "./TransactionRow";
import { ArrowLeft, History } from "lucide-react";

interface HistoryPanelProps {
  transactions: TransactionRecord[];
  onBack: () => void;
}

export default function HistoryPanel({
  transactions,
  onBack,
}: HistoryPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          Transaction History
        </h2>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No transactions yet</p>
          <p className="text-sm">
            Run a simulation to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
