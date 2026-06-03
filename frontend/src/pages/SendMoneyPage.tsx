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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [simulationData, setSimulationData] = useState<SimulateResponse | null>(null);

  // Signing step state
  const [signingPath, setSigningPath] = useState<PathOption | null>(null);

  const handleQuote = (data: QuoteResponse) => {
    setQuoteData(data);
    setSimulationData(null);
    setSigningPath(null);
    setError(null);
  };

  const handleStartSimulate = (path: PathOption) => {
    // Show signing step before calling API
    setSigningPath(path);
    setError(null);
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
  };

  // Guard: require a wallet
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center space-y-4">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Wallet Required</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create a smart wallet or connect your existing one to send money.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setAuthOpen(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
              Create Wallet
            </button>
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

      {!simulationData && !signingPath && (
        <QuoteForm
          onResult={handleQuote}
          onError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          defaultAmount={amount}
          onAmountChange={setAmount}
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

      {quoteData && !simulationData && !isLoading && !signingPath && (
        <ResultsPanel
          data={quoteData}
          amount={amount}
          onSimulate={handleStartSimulate}
          onError={setError}
        />
      )}

      {/* Signing step — user signs with private key before simulation */}
      {signingPath && (
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
            try {
              const res = await api.getTransactions();
              return res.transactions;
            } catch {
              return [];
            }
          }}
        />
      )}
    </div>
  );
}
