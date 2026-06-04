import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Banknote, CheckCircle2 } from "lucide-react";

interface Props {
  amount: number;
  currency: string;
  onRampMethod: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function DepositStep({ amount, currency, onRampMethod, onComplete, onCancel }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidAvailable, setPlaidAvailable] = useState(false);

  const providerName = onRampMethod.split(" — ")[0];
  const isOAuth = onRampMethod.includes("Coinbase") || onRampMethod.includes("Robinhood");
  const isCard = onRampMethod.includes("Card") || onRampMethod.includes("Debit");
  const needsPlaid = !isOAuth && !isCard;

  // Fetch Plaid link token
  useEffect(() => {
    fetch("/api/plaid/create-link-token", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.link_token) {
          setLinkToken(data.link_token);
          setPlaidAvailable(true);
        }
      })
      .catch(() => {});
  }, []);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    await fetch(`/api/plaid/exchange-token?public_token=${public_token}`, { method: "POST" });
    onComplete();
  }, []);

  const { open: openPlaid, ready: plaidLinkReady } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token) => onPlaidSuccess(public_token),
  });

  // OAuth flow (Coinbase, Robinhood)
  if (isOAuth) {
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
            You'll be redirected to {providerName} to log in and authorize a {currency} purchase of ${amount.toFixed(2)}.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
            Cancel
          </button>
          <button onClick={() => onComplete()} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
            Authorize with {providerName}
          </button>
        </div>
      </div>
    );
  }

  // Card payment (MoonPay, Transak): no bank login needed
  if (isCard) {
    return <CardPaymentStep amount={amount} currency={currency} providerName={providerName} onComplete={onComplete} onCancel={onCancel} />;
  }

  // Plaid Link for ACH/Wire methods (Circle, Binance)
  if (needsPlaid && plaidAvailable && linkToken) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
          <Banknote className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {onRampMethod}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Connect your bank via Plaid to fund ${amount.toFixed(2)} {currency}.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm text-left space-y-1 max-w-sm mx-auto">
          <div className="flex justify-between"><span className="text-gray-600">Provider:</span><span className="font-medium">{providerName}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-medium">${amount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Fee:</span><span className="font-medium text-amber-600">~${(amount * 0.0003).toFixed(2)}</span></div>
        </div>

        <button
          onClick={() => openPlaid()}
          disabled={!plaidLinkReady}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md"
        >
          Connect Bank with Plaid
        </button>

        <p className="text-xs text-gray-400">
          🔒 Plaid Sandbox — uses test credentials. No real bank access.
        </p>

        <button onClick={onCancel} className="text-sm text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  // Fallback: simulated bank connection for ACH/Wire (Plaid not configured)
  if (needsPlaid) return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto">
        <Banknote className="w-8 h-8 text-blue-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{onRampMethod}</h3>
        <p className="text-sm text-gray-500 mt-2">Plaid not configured. Using simulated bank connection.</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm text-left space-y-1 max-w-sm mx-auto">
        <div className="flex justify-between"><span className="text-gray-600">Provider:</span><span className="font-medium">{providerName}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="font-medium">${amount.toFixed(2)}</span></div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
        🧪 Demo: simulated bank connection. Set PLAID keys in .env for real Sandbox.
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={onCancel} className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">Cancel</button>
        <button onClick={() => onComplete()} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">Continue (Simulated)</button>
      </div>
    </div>
  );
}

function CardPaymentStep({ amount, currency, providerName, onComplete, onCancel }: {
  amount: number; currency: string; providerName: string; onComplete: () => void; onCancel: () => void;
}) {
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvv: "" });
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">{providerName} — Card Payment</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter your card details. In production, this is processed by {providerName}'s secure widget. PayPilot never stores card numbers.
        </p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm flex justify-between">
        <span className="text-gray-500">Amount:</span>
        <span className="font-bold">${amount.toFixed(2)} {currency}</span>
      </div>
      <div className="space-y-3">
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cardholder Name</label><input type="text" value={card.holder} onChange={e => setCard({...card, holder: e.target.value})} placeholder="John Doe" className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card Number</label><input type="text" value={card.number} onChange={e => setCard({...card, number: e.target.value})} placeholder="4111 1111 1111 1111" className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry</label><input type="text" value={card.expiry} onChange={e => setCard({...card, expiry: e.target.value})} placeholder="12/28" className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label><input type="text" value={card.cvv} onChange={e => setCard({...card, cvv: e.target.value})} placeholder="123" className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
        </div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-xs text-amber-700 dark:text-amber-300">
        🧪 Demo: card details not submitted. Production: processed by {providerName} widget.
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">Cancel</button>
        <button onClick={onComplete} className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">Pay & Continue</button>
      </div>
    </div>
  );
}
