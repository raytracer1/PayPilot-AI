import { useState, type FormEvent } from "react";
import AmountInput from "./AmountInput";
import CountrySelect from "./CountrySelect";
import SpeedSelector from "./SpeedSelector";
import WalletInput from "./WalletInput";
import type { QuoteResponse, QuoteRequest } from "../../types/api";
import { api } from "../../api/client";
import { Search } from "lucide-react";

interface QuoteFormProps {
  onResult: (data: QuoteResponse) => void;
  onError: (msg: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  defaultAmount: number;
  onAmountChange: (v: number) => void;
  currency: "USDC" | "USDT";
  onCurrencyChange: (c: "USDC" | "USDT") => void;
}

export default function QuoteForm({
  onResult,
  onError,
  isLoading,
  setIsLoading,
  defaultAmount,
  onAmountChange,
  currency,
  onCurrencyChange,
}: QuoteFormProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [country, setCountry] = useState("MX");
  const [speed, setSpeed] = useState("balanced");
  const [wallet, setWallet] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (amount <= 0 || amount > 100000) {
      onError("Please enter an amount between $1 and $100,000.");
      return;
    }

    onAmountChange(amount);

    const req: QuoteRequest = {
      amount_usd: amount,
      destination_country: country,
      speed_preference: speed as QuoteRequest["speed_preference"],
      wallet_address: wallet || null,
      bank_account: null,
    };

    setIsLoading(true);
    try {
      const res = await api.getQuote(req);
      onResult(res);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to analyze routes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-5 transition-colors"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Send Money to Latin America
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI-powered routing finds the best path for your transfer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AmountInput
          value={amount}
          onChange={(v) => setAmount(v > 0 ? v : 0)}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
        />
        <CountrySelect value={country} onChange={setCountry} />
      </div>

      <SpeedSelector value={speed} onChange={setSpeed} />

      <WalletInput value={wallet} onChange={setWallet} />

      <button
        type="submit"
        disabled={isLoading || amount <= 0}
        className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing Routes...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Find Best Routes
          </>
        )}
      </button>
    </form>
  );
}
