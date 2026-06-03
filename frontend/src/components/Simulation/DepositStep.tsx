import { useState } from "react";
import { CheckCircle, Building2, Shield } from "lucide-react";

interface Props {
  amount: number;
  currency: string;
  onRampMethod: string;
  onComplete: () => void;
  onCancel: () => void;
}

/* ─── Field requirements per on-ramp method ─── */
type FieldSet = { fields: { key: string; label: string; placeholder: string }[] };

function getFields(method: string): FieldSet {
  if (method.includes("ACH") || method.includes("Wire")) {
    return { fields: [
      { key: "holder", label: "Account Holder Name", placeholder: "John Doe" },
      { key: "routing", label: "Routing Number", placeholder: "021000021" },
      { key: "account", label: "Account Number", placeholder: "••••1234" },
    ]};
  }
  if (method.includes("Card") || method.includes("Debit")) {
    return { fields: [
      { key: "holder", label: "Cardholder Name", placeholder: "John Doe" },
      { key: "card", label: "Card Number", placeholder: "4111 1111 1111 1111" },
      { key: "expiry", label: "Expiry", placeholder: "12/28" },
      { key: "cvv", label: "CVV", placeholder: "123" },
    ]};
  }
  if (method.includes("Crypto")) {
    return { fields: [
      { key: "wallet", label: "Your Wallet Address", placeholder: "0x..." },
    ]};
  }
  // Default: bank info
  return { fields: [
    { key: "holder", label: "Account Holder Name", placeholder: "John Doe" },
    { key: "routing", label: "Routing Number", placeholder: "021000021" },
    { key: "account", label: "Account Number", placeholder: "••••1234" },
  ]};
}

export default function DepositStep({ amount, currency, onRampMethod, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<"account" | "processing" | "done">("account");
  const [values, setValues] = useState<Record<string, string>>({});

  const fieldSet = getFields(onRampMethod);

  const handleDeposit = async () => {
    setStep("processing");

    // Production: sends account info to Circle/Stripe/Plaid to initiate ACH
    // Testnet: faucet endpoint completes instantly
    await new Promise((r) => setTimeout(r, 2000));
    try {
      await fetch("/api/faucet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currency, amount }),
      });
    } catch {}

    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-500 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Deposit Complete</h3>
          <p className="text-sm text-gray-500 mt-1">
            ${amount.toFixed(2)} {currency} received in your wallet
          </p>
          <p className="text-xs text-gray-400 mt-1">via {onRampMethod}</p>
        </div>
        <button onClick={onComplete} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
          Continue to Sign
        </button>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Processing Deposit</h3>
          <p className="text-sm text-gray-500">
            Initiating ACH transfer via {onRampMethod}...
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {onRampMethod.includes("Card") && `Card: ••••${(values.card || "0000").slice(-4)}`}
            {onRampMethod.includes("ACH") && `Account: ••••${(values.account || "0000").slice(-4)} · Routing: ${values.routing || "N/A"}`}
            {onRampMethod.includes("Crypto") && `Wallet: ${(values.wallet || "0x...").slice(0, 10)}...`}
            {!onRampMethod.includes("Card") && !onRampMethod.includes("ACH") && !onRampMethod.includes("Crypto") && `Wire transfer in progress...`}
            <br />Production: 1-3 business days. Demo: instant.
          </p>
        </div>
      </div>
    );
  }

  // Step 1: collect bank account info
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">Link Bank Account</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter your US bank account to deposit via <strong>{onRampMethod}</strong>. PayPilot never stores this information — it goes directly to the on-ramp provider.
        </p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
        <Shield className="w-4 h-4 shrink-0" />
        Your bank details are sent to {onRampMethod.split(" — ")[0]}, not PayPilot. We never store or access them.
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm flex justify-between">
        <span className="text-gray-500">Amount to deposit:</span>
        <span className="font-bold text-gray-900 dark:text-white">${amount.toFixed(2)} {currency}</span>
      </div>

      <div className="space-y-3">
        {fieldSet.fields.map((f, i) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={values[f.key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${i > 1 ? "font-mono text-sm" : ""}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          Cancel
        </button>
        <button onClick={handleDeposit} className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
          Link & Deposit ${amount.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
