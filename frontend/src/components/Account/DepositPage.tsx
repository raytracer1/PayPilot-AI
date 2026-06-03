import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatUSD } from "../../utils/format";
import {
  Plus,
  History,
  Building2,
  CreditCard,
  ArrowRightLeft,
  Bitcoin,
  Wallet,
} from "lucide-react";

const METHODS = [
  {
    id: "ach",
    label: "ACH Bank Transfer",
    icon: Building2,
    fee: "Free",
    time: "1-3 business days",
    desc: "Direct from your US bank account",
  },
  {
    id: "debit_card",
    label: "Debit / Credit Card",
    icon: CreditCard,
    fee: "2.9%",
    time: "Instant",
    desc: "Visa, Mastercard, or Amex",
  },
  {
    id: "wire",
    label: "Wire Transfer",
    icon: ArrowRightLeft,
    fee: "$15.00",
    time: "Same day",
    desc: "For amounts over $5,000",
  },
  {
    id: "crypto",
    label: "Crypto (USDC)",
    icon: Bitcoin,
    fee: "$0.50",
    time: "~5 minutes",
    desc: "Send USDC from any wallet",
  },
];

interface DepositRecord {
  id: string;
  amount_usd: number;
  method: string;
  status: string;
  tx_reference: string;
  created_at: string;
}

export default function DepositPage() {
  const { token } = useAuth();
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState("ach");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [balance, setBalance] = useState(0);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchBalance = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/account/balance", { headers });
    const data = await res.json();
    setBalance(data.balance_usd || 0);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDeposits = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/account/deposits", { headers });
    const data = await res.json();
    setDeposits(data.deposits || []);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBalance();
    fetchDeposits();
  }, [fetchBalance, fetchDeposits]);

  const handleDeposit = async () => {
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/deposit", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount_usd: amount, method }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Deposit failed");
      }
      const data = await res.json();
      setBalance(data.new_balance);
      setMessage({
        type: "success",
        text: `Successfully deposited ${formatUSD(data.amount_usd)}!`,
      });
      fetchDeposits();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Deposit failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Sign In Required
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Please sign in to deposit funds and manage your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Available Balance</p>
            <p className="text-3xl font-bold">{formatUSD(balance)}</p>
          </div>
          <Wallet className="w-10 h-10 text-blue-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Deposit Funds
          </h2>

          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                $
              </span>
              <input
                type="number"
                min={1}
                max={50000}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              🧪 Simulated deposit — no real funds moved
            </p>
          </div>

          {/* Payment methods */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                    method === m.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <m.icon
                    className={`w-5 h-5 mt-0.5 ${
                      method === m.id
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {m.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Fee: {m.fee} · {m.time}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || amount <= 0}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? "Processing..." : `Deposit ${formatUSD(amount)}`}
          </button>
        </div>

        {/* Deposit history */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4" />
            Deposit History
          </h3>

          {deposits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No deposits yet
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {deposits.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      +{formatUSD(d.amount_usd)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {d.method} · {d.tx_reference}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
