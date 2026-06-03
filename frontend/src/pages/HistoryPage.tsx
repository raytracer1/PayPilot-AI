import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import type { TransactionRecord } from "../types/api";
import TransactionRow from "../components/History/TransactionRow";
import { History } from "lucide-react";

export default function HistoryPage() {
  const { isAuthenticated } = useApp();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions()
      .then((res) => setTransactions(res.transactions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
        <p className="text-gray-500">Sign in to view your transaction history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 animate-pulse"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" /></div>)}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">{transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}</div>
      )}
    </div>
  );
}
