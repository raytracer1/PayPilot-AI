import { useState, useCallback } from "react";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import Disclaimer from "./components/Layout/Disclaimer";
import QuoteForm from "./components/Form/QuoteForm";
import ResultsPanel from "./components/Results/ResultsPanel";
import SimulationPanel from "./components/Simulation/SimulationPanel";
import HistoryPanel from "./components/History/HistoryPanel";
import DepositPage from "./components/Account/DepositPage";
import type {
  QuoteResponse,
  SimulateResponse,
  TransactionRecord,
} from "./types/api";

type View = "form" | "results" | "simulation" | "history" | "deposit";

export default function App() {
  const [view, setView] = useState<View>("form");
  const [quoteData, setQuoteData] = useState<QuoteResponse | null>(null);
  const [simulationData, setSimulationData] =
    useState<SimulateResponse | null>(null);
  const [history, setHistory] = useState<TransactionRecord[] | null>(null);
  const [amount, setAmount] = useState(500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuoteResult = useCallback(
    (data: QuoteResponse) => {
      setQuoteData(data);
      setSimulationData(null);
      setView("results");
      setError(null);
    },
    []
  );

  const handleSimulateResult = useCallback(
    (data: SimulateResponse) => {
      setSimulationData(data);
      setView("simulation");
      setError(null);
    },
    []
  );

  const handleShowHistory = useCallback(
    (data: TransactionRecord[]) => {
      setHistory(data);
      setView("history");
      setError(null);
    },
    []
  );

  const handleBack = useCallback(() => {
    setView(quoteData ? "results" : "form");
    setSimulationData(null);
    setHistory(null);
  }, [quoteData]);

  const handleNewQuote = useCallback(() => {
    setView("form");
    setQuoteData(null);
    setSimulationData(null);
    setHistory(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      <Header
        onNewQuote={handleNewQuote}
        onDeposit={() => setView("deposit")}
      />

      <Disclaimer />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Deposit page */}
        {view === "deposit" && <DepositPage />}

        {/* Quote Form — always visible unless viewing simulation/history/deposit */}
        {view !== "simulation" && view !== "history" && view !== "deposit" && (
          <QuoteForm
            onResult={handleQuoteResult}
            onError={setError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            defaultAmount={amount}
            onAmountChange={setAmount}
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {view === "results" && quoteData && !isLoading && (
          <ResultsPanel
            data={quoteData}
            amount={amount}
            onSimulate={handleSimulateResult}
            onError={setError}
          />
        )}

        {/* Simulation detail */}
        {view === "simulation" && simulationData && (
          <SimulationPanel
            data={simulationData}
            onBack={handleBack}
            onHistory={handleShowHistory}
          />
        )}

        {/* History */}
        {view === "history" && history && (
          <HistoryPanel
            transactions={history}
            onBack={handleBack}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
