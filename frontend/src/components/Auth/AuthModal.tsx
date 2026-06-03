import { useState, type FormEvent } from "react";
import { useApp } from "../../context/AppContext";
import { X, Mail, Lock, User, Key, AlertTriangle, Copy, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const { login, register } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Private key reveal step (after registration)
  const [step, setStep] = useState<"form" | "key">("form");
  const [privateKey, setPrivateKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        closeAll();
      } else {
        const pk = await register(email, password, name || undefined);
        setPrivateKey(pk);
        setStep("key");
      }
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const closeAll = () => {
    setStep("form");
    setPrivateKey("");
    setCopied(false);
    setSaved(false);
    setEmail("");
    setPassword("");
    setName("");
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(privateKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ── Step 2: Private Key Reveal ──
  if (step === "key") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 p-6 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Key className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Save Your Private Key
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This is the ONLY time it will be shown. PayPilot never stores it.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-300">
              <strong>Do not share this key.</strong> Anyone with this key can
              control your wallet. Save it in a password manager or write it down.
              It cannot be recovered if lost.
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1 font-mono break-all select-all">
              {privateKey}
            </p>
            <button
              onClick={handleCopy}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I have securely saved my private key. I understand PayPilot cannot
              recover it.
            </span>
          </label>

          <button
            onClick={closeAll}
            disabled={!saved}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            Continue to Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Login / Register Form ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAll} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 p-6">
        <button onClick={closeAll} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white">
            {mode === "login" ? "Welcome Back" : "Create Wallet"}
          </h3>
          <p className="text-xs text-center text-gray-500 -mt-2">
            {mode === "login"
              ? "Sign in to access your smart wallet."
              : "A self-custody wallet will be created for you."}
          </p>

          {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}

          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Name" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@example.com" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Wallet"}
          </button>

          <p className="text-center text-sm text-gray-500">
            {mode === "login" ? "Don't have a wallet?" : "Already have a wallet?"}{" "}
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-blue-500 hover:text-blue-700 font-medium">
              {mode === "login" ? "Create One" : "Sign In"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
