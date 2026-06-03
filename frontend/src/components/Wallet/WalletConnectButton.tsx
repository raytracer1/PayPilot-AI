import { useWallet } from "../../context/WalletContext";
import { Wallet, LogOut, ChevronDown, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";

interface WalletConnectButtonProps {
  onWalletPage: () => void;
}

export default function WalletConnectButton({ onWalletPage }: WalletConnectButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    isAuthenticated,
    siweSignIn,
    chainName,
  } = useWallet();

  const [menuOpen, setMenuOpen] = useState(false);

  // Connected + authenticated: show address + menu
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-mono text-emerald-700 dark:text-emerald-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Connected Wallet</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                  {address}
                </p>
                <p className="text-xs text-gray-400 mt-1">{chainName}</p>
              </div>

              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    siweSignIn();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Sign In with Ethereum
                </button>
              ) : (
                <button
                  onClick={() => {
                    onWalletPage();
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  My Wallet
                </button>
              )}

              <button
                onClick={() => {
                  disconnectWallet();
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Not connected: show connect button
  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
