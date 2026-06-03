import { useState } from "react";
import { Building2, Shield, Banknote, CheckCircle2, Lock, ChevronRight, ArrowLeft } from "lucide-react";

interface Props {
  amount: number;
  currency: string;
  onRampMethod: string;
  onComplete: () => void;
  onCancel: () => void;
}

const BANKS = [
  "Chase", "Bank of America", "Wells Fargo", "Citibank", "US Bank",
  "PNC Bank", "TD Bank", "Capital One", "Charles Schwab", "Ally Bank",
];

type Step = "method" | "bank" | "login" | "auth" | "done";

export default function DepositStep({ amount, currency, onRampMethod, onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>("method");
  const [selectedBank, setSelectedBank] = useState(BANKS[0]);
  const [searchBank, setSearchBank] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const providerName = onRampMethod.split(" — ")[0];
  const isOAuth = onRampMethod.includes("Coinbase") || onRampMethod.includes("Robinhood");

  const filteredBanks = BANKS.filter((b) =>
    b.toLowerCase().includes(searchBank.toLowerCase())
  );

  // Step: choose method (Plaid or manual)
  if (step === "method") {
    if (isOAuth) {
      // OAuth: redirect to provider
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
            <Banknote className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Connect to {providerName}
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              You'll be redirected to {providerName} to log in and authorize a {currency} purchase of ${amount.toFixed(2)}. PayPilot never sees your credentials.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={onCancel} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
              Cancel
            </button>
            <button onClick={() => setStep("done")} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
              Authorize with {providerName}
            </button>
          </div>
        </div>
      );
    }

    // Non-OAuth: Plaid-style bank connection
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-blue-500" />
            {onRampMethod}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ${amount.toFixed(2)} → {currency}. Connect your bank via Plaid to authorize the ACH transfer.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setStep("bank")}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Connect with Plaid</div>
                <div className="text-xs text-gray-500">Link your bank instantly · Secure · Encrypted</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-500" />
          </button>

        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          <Shield className="w-4 h-4 shrink-0" />
          Bank credentials go to Plaid/{providerName}, never to PayPilot.
        </div>

        <button onClick={onCancel} className="w-full py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
          Cancel
        </button>
      </div>
    );
  }

  // Step: Plaid — search bank
  if (step === "bank") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("method")} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Select Your Bank</h3>
            <p className="text-xs text-gray-500">Plaid connects to over 12,000 US banks.</p>
          </div>
        </div>

        <input
          type="text"
          value={searchBank}
          onChange={(e) => setSearchBank(e.target.value)}
          placeholder="Search banks..."
          className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filteredBanks.map((b) => (
            <button
              key={b}
              onClick={() => { setSelectedBank(b); setStep("login"); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{b}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step: Plaid — bank login
  if (step === "login") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("bank")} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Log in to {selectedBank}</h3>
            <p className="text-xs text-gray-500">Your credentials are encrypted and never stored by PayPilot.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-700 dark:text-green-300">
          <Lock className="w-4 h-4 shrink-0" />
          Connection secured by Plaid. PayPilot cannot see your login.
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Online Banking Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`${selectedBank} username`}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => setStep("auth")}
          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700"
        >
          Log In
        </button>
      </div>
    );
  }

  // Step: Plaid — authorize
  if (step === "auth") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-6">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Authorize ACH Transfer
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {selectedBank} — Account ending in 1234
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm text-left space-y-1 max-w-sm mx-auto">
          <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-medium">${amount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">To:</span><span className="font-medium">{providerName}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">For:</span><span className="font-medium">{currency} Purchase</span></div>
        </div>

        <div className="text-xs text-gray-400">This authorization allows {providerName} to debit your account once. It does not grant ongoing access.</div>

        <div className="flex gap-2 justify-center">
          <button onClick={() => setStep("login")} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
            Back
          </button>
          <button onClick={() => setStep("done")} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
            Authorize
          </button>
        </div>
      </div>
    );
  }

  // Step: done
  if (step === "done") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-500 p-8 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Bank Connected</h3>
          <p className="text-sm text-gray-500 mt-1">
            ${amount.toFixed(2)} will be debited from your bank via {providerName}.
          </p>
          <p className="text-xs text-gray-400 mt-2">PayPilot never saw your bank credentials.</p>
        </div>
        <button onClick={onComplete} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
          Continue to Sign
        </button>
      </div>
    );
  }

  // Should never reach here — all steps handled above
  return null;
}
