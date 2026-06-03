import { useState } from "react";
import { useApp } from "../context/AppContext";
import QuoteForm from "../components/Form/QuoteForm";
import ResultsPanel from "../components/Results/ResultsPanel";
import SimulationPanel from "../components/Simulation/SimulationPanel";
import SigningStep from "../components/Simulation/SigningStep";
import AuthModal from "../components/Auth/AuthModal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { QuoteResponse, SimulateResponse, PathOption } from "../types/api";
import { api } from "../api/client";
import { Wallet } from "lucide-react";

export default function SendMoneyPage() {
  const { isAuthenticated } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [amount, setAmount] = useState(500);
  const [currency, setCurrency] = useState<"USDC" | "USDT">("USDC");
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [needsTopUp, setNeedsTopUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [simulationData, setSimulationData] = useState<SimulateResponse | null>(null);
  const [signingPath, setSigningPath] = useState<PathOption | null>(null);

  const handleQuote = (data: QuoteResponse) => {
    setQuoteData(data);
    setSimulationData(null);
    setSigningPath(null);
    setError(null);
  };

  const handleStartSimulate = (path: PathOption) => {
    // USDT mode: always require top-up (platform never holds funds)
    if (currency === "USDT") {
      setSigningPath(path);
      setNeedsTopUp(true);
      setTopUpAmount(amount);
      setError(null);
      return;
    }
    setSigningPath(path);
    setNeedsTopUp(false);
    setError(null);
  };

  const handleTopUpAndContinue = () => {
    setNeedsTopUp(false);
  };

  const handleSigned = async (_signature: string) => {
    if (!signingPath) return;
    setSigningPath(null);
    setError(null);
    try {
      const result = await api.simulate({
        path_id: signingPath.id,
        amount_usd: amount,
      });
      setSimulationData(result);
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    }
  };

  const handleCancelSign = () => {
    setSigningPath(null);
    setNeedsTopUp(false);
  };

  // Guard: require a wallet
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center space-y-4">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Wallet Required</h3>
          <p className="text-gray-500 dark:text-gray-400">Create a smart wallet or connect your existing one to send money.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setAuthOpen(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">Create Wallet</button>
            <ConnectButton />
          </div>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {!simulationData && !signingPath && !needsTopUp && (
        <QuoteForm
          onResult={handleQuote}
          onError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          defaultAmount={amount}
          onAmountChange={setAmount}
          currency={currency}
          onCurrencyChange={setCurrency}
        />
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* USDT top-up step — platform never holds funds, always requires deposit */}
      {needsTopUp && signingPath && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-500 p-6 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Deposit USDT</h3>
          <p className="text-sm text-gray-500">
            USDT transfers require a deposit. This platform never holds your funds — the deposit is simulated for demo purposes.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transfer amount:</span>
              <span className="font-medium">${amount.toFixed(2)} USDT</span>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deposit Amount (USDT)</label>
              <input type="number" min={1} step={1} value={topUpAmount} onChange={e => setTopUpAmount(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button onClick={handleTopUpAndContinue} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
              Deposit
            </button>
          </div>
          <p className="text-xs text-gray-400">🧪 Simulated — no real funds used</p>
          <button onClick={handleCancelSign} className="text-sm text-gray-500 hover:underline">Cancel</button>
        </div>
      )}

      {quoteData && !simulationData && !isLoading && !signingPath && !needsTopUp && (
        <ResultsPanel
          data={quoteData}
          amount={amount}
          onSimulate={handleStartSimulate}
          onError={setError}
        />
      )}

      {signingPath && !needsTopUp && (
        <SigningStep
          pathLabel={`${signingPath.on_ramp.provider} → ${signingPath.network.name} → ${signingPath.off_ramp.provider}`}
          amount={amount}
          onSigned={handleSigned}
          onCancel={handleCancelSign}
        />
      )}

      {simulationData && (
        <SimulationPanel
          data={simulationData}
          onBack={() => setSimulationData(null)}
          onHistory={async () => {
            try { const res = await api.getTransactions(); return res.transactions; }
            catch { return []; }
          }}
        />
      )}
    </div>
  );
}
