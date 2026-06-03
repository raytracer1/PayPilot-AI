import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Wallet, Copy, Check, ExternalLink, ArrowDownUp, Shield } from "lucide-react";
import { formatUSD } from "../utils/format";

export default function WalletCenterPage() {
  const { isAuthenticated, user, walletAddress, walletType } = useApp();
  const [balance] = useState(2500);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign In Required</h2>
        <p className="text-gray-500">Sign in to view your wallet and manage funds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wallet Center</h2>

      <div className={`rounded-xl p-6 text-white shadow-lg ${walletType === "byo" ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-blue-500 to-purple-600"}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 capitalize">{walletType === "byo" ? "BYO Wallet" : "Smart Wallet"}</span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "..."}
          </button>
        </div>
        <div>
          <p className="text-white/70 text-sm">USDC Balance</p>
          <p className="text-4xl font-bold">{formatUSD(balance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="https://buy.moonpay.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 transition-colors group">
          <ArrowDownUp className="w-5 h-5 text-blue-500" />
          <div className="flex-1"><div className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-blue-600">Buy USDC</div><div className="text-xs text-gray-500">MoonPay / Transak</div></div>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </a>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Shield className="w-5 h-5 text-green-500" />
          <div><div className="font-medium text-sm text-gray-900 dark:text-white">Gas Sponsored</div><div className="text-xs text-gray-500">Free transfers on Base</div></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <Wallet className="w-5 h-5 text-purple-500" />
          <div><div className="font-medium text-sm text-gray-900 dark:text-white">Recovery Enabled</div><div className="text-xs text-gray-500">Account recovery via email</div></div>
        </div>
      </div>
    </div>
  );
}
