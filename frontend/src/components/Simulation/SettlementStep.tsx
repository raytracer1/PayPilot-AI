import { useState, useEffect } from "react";
import { Building2, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { IS_LOCAL } from "../../utils/chainConfig";
import type { OffRampInfo } from "../../types/api";

interface Props {
  amount: number;
  offRamp: OffRampInfo;
  bankAccount?: string;
  onComplete: () => void;
}

export default function SettlementStep({ amount, offRamp, bankAccount, onComplete }: Props) {
  const [stage, setStage] = useState<"settling" | "complete">("settling");

  useEffect(() => {
    if (stage !== "settling") return;

    if (IS_LOCAL) {
      // Dev mode: simulate settlement delay
      const timer = setTimeout(() => setStage("complete"), 4000);
      return () => clearTimeout(timer);
    } else {
      // Production: call real off-ramp API
      // TODO: integrate with actual off-ramp provider (MoonPay, Transak, etc.)
      // For now, show a placeholder
    }
  }, [stage]);

  const received = offRamp.received_local.toFixed(2);
  const rate = offRamp.exchange_rate.toFixed(4);

  if (stage === "complete") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-500 p-8 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
            Deposit Complete ✓
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Funds settled to bank account
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-left max-w-sm mx-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Provider</span>
            <span className="font-medium text-gray-900 dark:text-white">{offRamp.provider}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Rate</span>
            <span className="font-medium text-gray-900 dark:text-white">1 USDC = {rate} {offRamp.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Received</span>
            <span className="font-bold text-green-600 dark:text-green-400">{received} {offRamp.currency}</span>
          </div>
          {bankAccount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Account</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">•••{bankAccount.slice(-4)}</span>
            </div>
          )}
        </div>
        <button
          onClick={onComplete}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700"
        >
          View Summary
        </button>
      </div>
    );
  }

  // Settling in progress
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
        <Building2 className="w-8 h-8 text-blue-600" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {offRamp.provider} — Settlement
        </h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Converting USDC to {offRamp.currency} and depositing to your bank account.
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-sm mx-auto space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">USDC transferred on-chain</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 animate-pulse">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-gray-900 dark:text-white font-medium">
              {offRamp.provider} processing settlement
            </span>
            <p className="text-xs text-gray-500">
              Converting at {rate} {offRamp.currency}/USDC · ~{offRamp.time_minutes} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm opacity-40">
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-500">{received} {offRamp.currency} in bank account</span>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm text-left space-y-1 max-w-sm mx-auto">
        <div className="flex justify-between">
          <span className="text-gray-600">Provider</span>
          <span className="font-medium text-gray-900 dark:text-white">{offRamp.provider}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Method</span>
          <span className="font-medium text-gray-900 dark:text-white">{offRamp.method}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Fee</span>
          <span className="font-medium text-amber-600">${offRamp.fee_usd.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">You receive</span>
          <span className="font-bold text-green-600 dark:text-green-400">{received} {offRamp.currency}</span>
        </div>
      </div>

      {IS_LOCAL ? (
        <p className="text-xs text-gray-400">🧪 Dev mode: simulating settlement delay...</p>
      ) : (
        <p className="text-xs text-gray-400">Processing via {offRamp.provider}. This may take a few minutes.</p>
      )}
    </div>
  );
}
