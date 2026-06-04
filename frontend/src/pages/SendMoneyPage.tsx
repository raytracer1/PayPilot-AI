import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import QuoteForm from "../components/Form/QuoteForm";
import ResultsPanel from "../components/Results/ResultsPanel";
import SimulationPanel from "../components/Simulation/SimulationPanel";
import SigningStep from "../components/Simulation/SigningStep";
import SettlementStep from "../components/Simulation/SettlementStep";
import DepositStep from "../components/Simulation/DepositStep";
import AuthModal from "../components/Auth/AuthModal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { QuoteResponse, SimulateResponse, SimulationStep, PathOption, ScoredPath } from "../types/api";
import { sortPaths } from "../utils/sortPaths";
import { fundUserWallet } from "../utils/fundWallet";
import { getExplorerUrl } from "../utils/chainConfig";
import { api } from "../api/client";
import { Wallet } from "lucide-react";

export default function SendMoneyPage() {
  const { isAuthenticated } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [amount, setAmount] = useState(500);
  const [preference, setPreference] = useState("balanced");
  const [currency, setCurrency] = useState<"USDC" | "USDT">("USDC");
  const [recipientType, setRecipientType] = useState<"bank" | "wallet">("bank");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawPaths, setRawPaths] = useState<PathOption[] | null>(null);
  const [totalEvaluated, setTotalEvaluated] = useState(0);

  // Auto-sort whenever rawPaths/amount/preference change
  const sortedPaths = useMemo(() => {
    if (!rawPaths) return null;
    return sortPaths(rawPaths, amount, preference);
  }, [rawPaths, amount, preference]);

  const handlePreferenceChange = (pref: string) => setPreference(pref);

  const [simulationData, setSimulationData] = useState<SimulateResponse | null>(null);
  const { walletAddress } = useApp();
  const [signingPath, setSigningPath] = useState<PathOption | null>(null);
  const [collectInfo, setCollectInfo] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundingTx, setFundingTx] = useState<string | null>(null);
  const [settlingPath, setSettlingPath] = useState<{ signedTx: string; txHash: string | null } | null>(null);

  const clearResults = () => {
    setRawPaths(null);
    setSimulationData(null);
    setSigningPath(null);
    setError(null);
  };

  const handleRecipientTypeChange = (t: "bank" | "wallet") => setRecipientType(t);

  const handleQuote = (data: QuoteResponse) => {
    setRawPaths(data.paths);
    setTotalEvaluated(data.meta.total_paths_evaluated);
    setSimulationData(null);
    setSigningPath(null);
    setError(null);
  };

  const handleSend = (path: PathOption) => {
    // USDT: collect on-ramp info first. USDC: fund then sign.
    if (currency === "USDT" && path.on_ramp) {
      setSigningPath(path);
      setCollectInfo(true);
    } else {
      // USDC: fund wallet from dev wallet, then sign
      setSigningPath(path);
      if (walletAddress) {
        setFunding(true);
        fundUserWallet(walletAddress, amount).then((result) => {
          setFunding(false);
          if ("txHash" in result) setFundingTx(result.txHash);
        });
      }
    }
    setError(null);
  };

  const handleSigned = async (signedTx: string, txHash: string | null) => {
    const p = signingPath!;

    // If path has an off-ramp, show settlement step first
    if (p.off_ramp) {
      setSettlingPath({ signedTx, txHash });
      return;
    }

    // Direct wallet transfer — no off-ramp needed
    setSigningPath(null);
    showSimulation(p, signedTx, txHash);
  };

  const handleSettled = () => {
    const p = signingPath!;
    const { signedTx, txHash } = settlingPath!;
    setSigningPath(null);
    setSettlingPath(null);
    showSimulation(p, signedTx, txHash);
  };

  const showSimulation = (p: PathOption, signedTx: string, txHash: string | null) => {
    const steps: SimulationStep[] = [];
    let stepNum = 0;

    // On-ramp step
    if (p.on_ramp) {
      steps.push({
        step_number: ++stepNum, phase: "on_ramp", name: `${p.on_ramp.provider} — Deposit`,
        status: "completed", timestamp_offset_minutes: 0, duration_minutes: p.on_ramp.time_minutes,
        details: {
          provider: p.on_ramp.provider,
          method: p.on_ramp.method,
          fee_usd: p.on_ramp.fee_usd,
          spread_usd: p.on_ramp.spread_usd,
        },
      });
    }

    // Network step
    steps.push({
      step_number: ++stepNum, phase: "network", name: `${p.network.name} Transfer`,
      status: "completed",
      timestamp_offset_minutes: steps.reduce((s, st) => s + st.duration_minutes, 0),
      duration_minutes: p.network.time_minutes,
      details: {
        network: p.network.name,
        gas_fee_usd: p.network.gas_fee_usd,
        tx_hash: txHash || signedTx.slice(0, 20) + "...",
        explorer_url: txHash ? getExplorerUrl(txHash) : "",
      },
    });

    // Off-ramp step
    if (p.off_ramp) {
      steps.push({
        step_number: ++stepNum, phase: "off_ramp", name: `${p.off_ramp.provider} — Settlement`,
        status: "completed",
        timestamp_offset_minutes: steps.reduce((s, st) => s + st.duration_minutes, 0),
        duration_minutes: p.off_ramp.time_minutes,
        details: {
          provider: p.off_ramp.provider,
          method: p.off_ramp.method,
          fee_usd: p.off_ramp.fee_usd,
          spread_usd: p.off_ramp.spread_usd,
          received_local: p.off_ramp.received_local,
          currency: p.off_ramp.currency,
        },
      });
    }

    setSimulationData({
      simulation_id: txHash || signedTx.slice(0, 20),
      transaction_id: txHash || signedTx.slice(0, 20),
      status: "completed",
      path_snapshot: p,
      steps,
      summary: {
        total_fee_usd: p.summary.total_fee_usd,
        total_time_minutes: p.summary.total_time_minutes,
        final_amount_local: p.summary.received_local,
        local_currency: p.summary.currency,
        usd_equivalent_received: p.summary.received_local,
        effective_exchange_rate: p.summary.exchange_rate,
        value_loss_pct: p.summary.risk_score,
      },
    } as any);
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

      {!simulationData && !signingPath && (
        <QuoteForm
          onResult={handleQuote}
          onError={setError}
          onParamChange={() => { setRawPaths(null); setSimulationData(null); }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          defaultAmount={amount}
          onAmountChange={setAmount}
          currency={currency}
          onCurrencyChange={setCurrency}
          recipientType={recipientType}
          onRecipientTypeChange={handleRecipientTypeChange}
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

      {sortedPaths && !simulationData && !isLoading && !signingPath && (
        <ResultsPanel
          paths={sortedPaths}
          totalEvaluated={totalEvaluated}
          amount={amount}
          preference={preference}
          onPreferenceChange={handlePreferenceChange}
          onSend={handleSend}
          onError={setError}
        />
      )}

      {/* USDT: collect on-ramp info */}
      {collectInfo && signingPath && signingPath.on_ramp && (
        <DepositStep
          amount={amount}
          currency={currency}
          onRampMethod={`${signingPath.on_ramp.provider} — ${signingPath.on_ramp.method}`}
          onComplete={async () => {
            setCollectInfo(false);
            if (walletAddress) {
              setFunding(true);
              const result = await fundUserWallet(walletAddress, amount);
              setFunding(false);
              if ("txHash" in result) setFundingTx(result.txHash);
            }
          }}
          onCancel={() => { setCollectInfo(false); setSigningPath(null); }}
        />
      )}

      {/* Funding from dev wallet */}
      {funding && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-gray-900 dark:text-white">Funding Wallet</h3>
          <p className="text-sm text-gray-500">{amount} USDC on Base Sepolia from dev wallet</p>
          <p className="text-xs text-gray-400 font-mono">{walletAddress?.slice(0,12)}...{walletAddress?.slice(-6)}</p>
        </div>
      )}
      {fundingTx && !funding && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 text-center">
          ✅ Funded: <a href={getExplorerUrl(fundingTx)} target="_blank" rel="noopener noreferrer" className="underline font-mono text-xs">{fundingTx.slice(0, 16)}...</a>
        </div>
      )}

      {signingPath && !collectInfo && !funding && !settlingPath && (
        <SigningStep
          pathLabel={signingPath.off_ramp
            ? (signingPath.on_ramp
              ? `${signingPath.on_ramp.provider} → ${signingPath.network.name} → ${signingPath.off_ramp.provider}`
              : `${signingPath.network.name} → ${signingPath.off_ramp.provider}`)
            : `${signingPath.network.name} → Wallet`}
          amount={amount}
          token={currency}
          onSigned={handleSigned}
          onCancel={handleCancelSign}
        />
      )}

      {/* Off-ramp settlement */}
      {settlingPath && signingPath?.off_ramp && (
        <SettlementStep
          amount={amount}
          offRamp={signingPath.off_ramp}
          onComplete={handleSettled}
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
