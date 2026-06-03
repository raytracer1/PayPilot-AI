import { useState, type FormEvent } from "react";
import AmountInput from "./AmountInput";
import RecipientInput from "./RecipientInput";
import type { QuoteResponse, QuoteRequest } from "../../types/api";
import { api } from "../../api/client";
import { Search } from "lucide-react";

interface QuoteFormProps {
  onResult: (data: QuoteResponse) => void;
  onError: (msg: string) => void;
  onParamChange: () => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  defaultAmount: number;
  onAmountChange: (v: number) => void;
  currency: "USDC" | "USDT";
  onCurrencyChange: (c: "USDC" | "USDT") => void;
  recipientType: "bank" | "wallet";
  onRecipientTypeChange: (t: "bank" | "wallet") => void;
}

export default function QuoteForm({
  onResult,
  onError,
  onParamChange,
  isLoading,
  setIsLoading,
  defaultAmount,
  onAmountChange,
  currency,
  onCurrencyChange,
  recipientType,
  onRecipientTypeChange,
}: QuoteFormProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [recipientCurrency, setRecipientCurrency] = useState("MXN");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (amount <= 0 || amount > 100000) {
      onError("Please enter an amount between $1 and $100,000.");
      return;
    }

    onAmountChange(amount);
   

    // Derive country from recipient currency
    const countryMap: Record<string, string> = { MXN: "MX", BRL: "BR", ARS: "AR", COP: "CO", CLP: "CL", PEN: "PE" };
    const derivedCountry = recipientType === "bank" ? (countryMap[recipientCurrency] || "MX") : "MX";

    const req: QuoteRequest = {
      amount_usd: amount,
      destination_country: derivedCountry,
      speed_preference: "balanced",
      currency,
      recipient_type: recipientType,
      wallet_address: recipientType === "wallet" ? walletAddress : null,
      bank_account: recipientType === "bank" ? accountNumber : null,
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
          onChange={(v) => { setAmount(v > 0 ? v : 0); onParamChange(); }}
          currency={currency}
          onCurrencyChange={(c) => { onCurrencyChange(c); onParamChange(); }}
        />
        <RecipientInput
          type={recipientType}
          onTypeChange={(t) => { onRecipientTypeChange(t); onParamChange(); }}
        />
      </div>

      {/* Recipient details: full width below */}
      {recipientType === "wallet" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => { onParamChange();  setWalletAddress(e.target.value); }}
            placeholder="0x..."
            className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
          />
        </div>
      )}
      {recipientType === "bank" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select
              value={recipientCurrency}
              onChange={(e) => { onParamChange();  setRecipientCurrency(e.target.value); }}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {["MXN", "BRL", "ARS", "COP", "CLP", "PEN"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => { onParamChange();  setAccountNumber(e.target.value); }}
              placeholder="000123456789"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
            isLoading ||
            amount <= 0 ||
            amount > 100000 ||
            (recipientType === "bank" && !accountNumber.trim()) ||
            (recipientType === "wallet" && !walletAddress.trim())
          }
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
