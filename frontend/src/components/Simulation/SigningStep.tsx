import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, toHex } from "viem";
import { Key, CheckCircle, Shield, Eye, EyeOff } from "lucide-react";

interface Props {
  pathLabel: string;
  amount: number;
  onSigned: (signature: string) => void;
  onCancel: () => void;
}

export default function SigningStep({ pathLabel, amount, onSigned, onCancel }: Props) {
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [signed, setSigned] = useState(false);
  const [signature, setSignature] = useState("");

  const handleSign = async () => {
    setError("");

    // Normalize: strip whitespace, ensure 0x prefix
    let key = privateKeyInput.trim();
    if (!key.startsWith("0x")) key = "0x" + key;

    // Validate hex
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      setError("Invalid private key. Must be 64 hex characters with 0x prefix.");
      return;
    }

    try {
      // Derive account from private key
      const account = privateKeyToAccount(key as `0x${string}`);

      // Construct mock transaction payload
      const mockTx = {
        from: account.address,
        to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
        value: 0n,
        data: `0x${"".padStart(64, "0")}`, // placeholder USDC transfer data
        chainId: 8453,
      };

      // Sign the transaction hash
      const txHash = keccak256(
        toHex(`${mockTx.from}${mockTx.to}${amount}${pathLabel}${Date.now()}`)
      );
      const sig = await account.sign({ hash: txHash });

      // Build signature string
      const sigStr = `0x${sig.slice(2)}`;
      setSignature(sigStr);
      setSigned(true);

      // Clear private key from state immediately after use
      setPrivateKeyInput("");
    } catch {
      setError("Failed to sign. Check your private key and try again.");
    }
  };

  const handleContinue = () => {
    onSigned(signature);
  };

  if (signed) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-500 p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
            Transaction Signed ✓
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Signed locally in your browser. Private key was never sent anywhere.
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-left">
          <p className="text-xs text-gray-500 mb-1">Signature:</p>
          <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">
            {signature.slice(0, 40)}...{signature.slice(-20)}
          </p>
        </div>
        <button
          onClick={handleContinue}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          Continue to Simulation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Sign Transaction</h3>
          <p className="text-sm text-gray-500">
            Enter your private key to sign this transfer locally.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Route:</span>
          <span className="text-gray-900 dark:text-white font-medium">{pathLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount:</span>
          <span className="text-gray-900 dark:text-white font-medium">${amount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
        <Shield className="w-4 h-4 shrink-0" />
        Your private key is used only in this browser tab to sign. It is never sent to any server.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Private Key
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={privateKeyInput}
            onChange={(e) => setPrivateKeyInput(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            placeholder="0x..."
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSign}
          disabled={privateKeyInput.length < 64}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
        >
          Sign Transaction
        </button>
      </div>
    </div>
  );
}
