import type { TransactionRecord } from "../../types/api";
import { formatUSD, formatDuration, formatLocal } from "../../utils/format";
import { COUNTRIES } from "../../utils/constants";
import { Clock, DollarSign } from "lucide-react";

interface TransactionRowProps {
  tx: TransactionRecord;
}

export default function TransactionRow({ tx }: TransactionRowProps) {
  const country = COUNTRIES.find((c) => c.code === tx.destination_country);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400">{tx.id}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                tx.status === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {tx.status}
            </span>
          </div>
          {tx.selected_path_summary && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tx.selected_path_summary}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="text-right">
            <div className="text-gray-500 dark:text-gray-400">
              <DollarSign className="w-3 h-3 inline" />
              Sent
            </div>
            <div className="font-bold text-gray-900 dark:text-white">
              {formatUSD(tx.amount_usd)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 dark:text-gray-400">Fees</div>
            <div className="font-bold text-red-600 dark:text-red-400">
              {formatUSD(tx.total_fee_usd)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 inline" /> Time
            </div>
            <div className="font-bold text-gray-900 dark:text-white">
              {formatDuration(tx.total_time_minutes)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 dark:text-gray-400">Received</div>
            <div className="font-bold text-green-600 dark:text-green-400">
              {formatLocal(
                tx.received_local,
                tx.local_currency,
                country?.currency_symbol || "$"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 mt-2">
        {new Date(tx.created_at).toLocaleString()}
      </div>
    </div>
  );
}
