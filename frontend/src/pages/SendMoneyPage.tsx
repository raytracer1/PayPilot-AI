import { useState } from "react";
import QuoteForm from "../components/Form/QuoteForm";
import ResultsPanel from "../components/Results/ResultsPanel";
import SimulationPanel from "../components/Simulation/SimulationPanel";
import type { QuoteResponse, SimulateResponse, TransactionRecord } from "../types/api";
import { api } from "../api/client";

export default function SendMoneyPage() {
  const [amount, setAmount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [simulationData, setSimulationData] = useState<SimulateResponse | null>(null);

  const handleQuote = (data: QuoteResponse) => {
    setQuoteData(data);
    setSimulationData(null);
    setError(null);
  };

  const handleSimulate = async (data: SimulateResponse) => {
    setSimulationData(data);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Send Money</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {!simulationData && (
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

      {quoteData && !simulationData && !isLoading && (
        <ResultsPanel
          data={quoteData}
          amount={amount}
          onSimulate={handleSimulate}
          onError={setError}
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
