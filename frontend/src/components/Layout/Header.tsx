import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import AuthModal from "../Auth/AuthModal";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { Sun, Moon, Zap, Send, Wallet, History, Settings, Shield, LogOut, User } from "lucide-react";

export default function Header() {
  const { isDark, toggle } = useTheme();
  const { isAuthenticated, user, logout, byoAddress, isByoConnected, walletAddress } = useApp();
  const { openConnectModal } = useConnectModal();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
              <div className="hidden sm:block text-left">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">PayPilot AI v5</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Smart Payment Routing</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/send" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1.5"><Send className="w-4 h-4" /> Send</Link>
              <Link to="/wallet" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Wallet</Link>
              <Link to="/risk" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1.5"><Shield className="w-4 h-4" /> Risk</Link>
              <Link to="/history" className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1.5"><History className="w-4 h-4" /> History</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Email auth: Smart Wallet mode */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                    {user?.displayName || user?.email}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-20 py-1">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
                        {walletAddress && <p className="text-xs text-gray-500 font-mono">{walletAddress.slice(0,10)}...{walletAddress.slice(-6)}</p>}
                      </div>
                      <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <Settings className="w-4 h-4 inline mr-2" />Settings
                      </Link>
                      <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button onClick={() => setAuthOpen(true)} className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700">
                Create Wallet
              </button>
            )}

            {/* BYO Wallet — hidden when Smart Wallet is active */}
            {!isAuthenticated && (
              isByoConnected && byoAddress ? (
                <ConnectButton />
              ) : (
                <button onClick={openConnectModal} className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm">
                  Connect Wallet
                </button>
              )
            )}

            <button onClick={toggle} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </header>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
