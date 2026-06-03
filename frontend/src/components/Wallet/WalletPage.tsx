import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../../context/WalletContext";
import { formatUSD } from "../../utils/format";
import {
  Wallet,
  ExternalLink,
  Copy,
  Check,
  ArrowDownUp,
  History,
  Shield,
} from "lucide-react";

interface TransferRecord {
  tx_hash: string;
  from: string;
  to: string;
  amount_usdc: number;
  chain: string;
  timestamp: string;
  type: string;
}

export default function WalletPage() {
  const { address, isConnected, isAuthenticated, token, chainName } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceSimulated, setBalanceSimulated] = useState(false);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const headers = token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : undefined;

  const fetchBalance = useCallback(async () => {
    if (!headers) return;
    const res = await fetch("/api/wallet/balance?chain_id=8453", { headers });
    const data = await res.json();
    setBalance(data.balance);
    setBalanceSimulated(data.simulated || false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTransfers = useCallback(async () => {
    if (!headers) return;
    const res = await fetch("/api/wallet/transactions", { headers });
    const data = await res.json();
    setTransfers(data.transfers || []);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      fetchTransfers();
    }
  }, [isAuthenticated, fetchBalance, fetchTransfers]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
        <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Connect your Ethereum wallet to view your USDC balance and manage
          cross-border transfers. PayPilot never holds your funds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Non-custodial banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
        <Shield className="w-4 h-4 shrink-0" />
        <span>
          <strong>Non-Custodial.</strong> Your wallet, your keys. PayPilot never
          touches your funds.
        </span>
      </div>

      {/* Wallet info card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-200" />
            <span className="text-sm text-emerald-100">{chainName} Network</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 transition-colors"
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? "Copied" : `${address.slice(0, 6)}...${address.slice(-4)}`}
          </button>
        </div>

        <div>
          <p className="text-emerald-100 text-sm">USDC Balance</p>
          <p className="text-3xl font-bold">
            {balance !== null ? formatUSD(balance) : "..."}
          </p>
          {balanceSimulated && (
            <p className="text-xs text-emerald-200 mt-1">
              🧪 Simulated balance (demo mode)
            </p>
          )}
        </div>
      </div>

      {/* Top-up links */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4" />
          Buy USDC
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Purchase USDC directly into your wallet via third-party on-ramps.
          PayPilot never handles your funds.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              name: "MoonPay",
              url: "https://buy.moonpay.com",
              desc: "Card/bank → USDC",
            },
            {
              name: "Transak",
              url: "https://transak.com",
              desc: "Global on-ramp",
            },
            {
              name: "Coinbase",
              url: "https://pay.coinbase.com",
              desc: "USDC on Base",
            },
          ].map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {p.name}
                </div>
                <div className="text-xs text-gray-500">{p.desc}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Recent transfers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4" />
          Recent Transfers
        </h3>

        {transfers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No transfers yet
          </p>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        t.type === "on_ramp"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {t.type === "on_ramp" ? "IN" : "OUT"}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t.amount_usdc} USDC
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">
                    {t.tx_hash.slice(0, 14)}...
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {t.chain} · {new Date(t.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
