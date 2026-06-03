import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import AuthModal from "../components/Auth/AuthModal";
import { Zap, Wallet, Send, Shield, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="space-y-12">
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      {/* Hero */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm mb-6">
          <Zap className="w-4 h-4" />
          AI-Powered Cross-Border Payments
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Send Money
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Cheaper, Faster, Smarter
          </span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          AI finds the optimal payment route across banks, stablecoins, and blockchain
          networks. Save up to 80% on fees vs traditional remittance.
        </p>
        <div className="flex items-center justify-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/send")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
            >
              Send Money Now
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg">
              Get Started Free
            </button>
          )}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <Wallet className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Smart Wallet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Auto-created on sign-up. No seed phrases. Gas sponsored. One-click payments.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
          <Send className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI Routing</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Compares 24+ payment paths across banks, stablecoins, and L2 networks in real-time.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-green-300 dark:hover:border-green-700 transition-colors">
          <Shield className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Non-Custodial</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We never hold your funds. All transfers via regulated third-party providers.
          </p>
        </div>
      </div>
    </div>
  );
}
