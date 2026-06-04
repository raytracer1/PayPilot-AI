import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, parseUnits, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { Key, CheckCircle, Shield, Eye, EyeOff, ExternalLink } from "lucide-react";

const ERC20_ABI = [{
  name: "transfer", type: "function", stateMutability: "nonpayable",
  inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;

// Base Sepolia contracts
const TOKEN_CONTRACTS: Record<string, string> = {
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  USDT: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",  // Same faucet USDC for now
};

interface Props {
  pathLabel: string;
  amount: number;
  token: "USDC" | "USDT";
  onSigned: (signedTx: string, txHash: string | null) => void;
  onCancel: () => void;
}

export default function SigningStep({ pathLabel, amount, token, onSigned, onCancel }: Props) {
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ tx_hash: string; explorer_url: string } | null>(null);

  const handleSignAndSend = async () => {
    setError("");
    let key = privateKeyInput.trim();
    if (!key.startsWith("0x")) key = "0x" + key;
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      setError("Invalid private key. Must be 64 hex characters with 0x prefix.");
      return;
    }

    setSending(true);
    try {
      const account = privateKeyToAccount(key as `0x${string}`);
      const contractAddr = TOKEN_CONTRACTS[token] || TOKEN_CONTRACTS.USDC;
      const recipient = "0x0000000000000000000000000000000000000001"; // Placeholder — in production, use actual recipient
      const amountWei = parseUnits(amount.toString(), 6); // USDC has 6 decimals
      const data = encodeFunctionData({ abi: ERC20_ABI, functionName: "transfer", args: [recipient, amountWei] });

      // Create a client to fetch the correct nonce
      const client = createPublicClient({ chain: baseSepolia, transport: http() });
      const nonce = await client.getTransactionCount({ address: account.address });

      // Sign the transaction with the correct nonce
      const gasEstimate = 100000n; // Simplified
      const signed = await account.signTransaction({
        to: contractAddr as `0x${string}`,
        data,
        value: 0n,
        gas: gasEstimate,
        gasPrice: 1000000000n, // 1 gwei for testnet
        chainId: 84532, // Base Sepolia
        nonce,
      });

      // Broadcast directly to Base Sepolia from browser
      const txHash = await client.sendRawTransaction({ serializedTransaction: signed });

      setResult({
        tx_hash: txHash,
        explorer_url: `https://sepolia.basescan.org/tx/${txHash}`,
      });

      setPrivateKeyInput("");
      setSending(false);
    } catch (err: any) {
      setError(err.message || "Failed to sign or send");
      setSending(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-500 p-8 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300">Transaction Sent ✓</h3>
          <p className="text-sm text-gray-500 mt-1">{amount} {token} on Base Sepolia</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-left space-y-1">
          <p className="text-xs text-gray-500">TX Hash:</p>
          <p className="text-xs font-mono break-all text-gray-700 dark:text-gray-300">{result.tx_hash}</p>
        </div>
        <a href={result.explorer_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700">
          View on Explorer <ExternalLink className="w-3 h-3" />
        </a>
        <button onClick={() => onSigned(result.tx_hash || "", result.tx_hash)}
          className="block mx-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700">
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-500 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Key className="w-5 h-5 text-blue-600" />
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Sign & Send Transaction</h3>
          <p className="text-sm text-gray-500">Sign with your private key. TX broadcasts to Base Sepolia.</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">Route:</span><span className="font-medium">{pathLabel}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-medium">{amount} {token}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Network:</span><span className="text-emerald-600 font-medium">Base Sepolia (Testnet)</span></div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
        <Shield className="w-4 h-4 shrink-0" />
        Private key used only in this browser. Never sent anywhere.
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Private Key</label>
        <div className="relative">
          <input type={showKey ? "text" : "password"} value={privateKeyInput} onChange={e => setPrivateKeyInput(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" placeholder="0x..." />
          <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">Cancel</button>
        <button onClick={handleSignAndSend} disabled={sending || privateKeyInput.length < 64}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50">
          {sending ? "Sending..." : "Sign & Send"}
        </button>
      </div>
    </div>
  );
}
