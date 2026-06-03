import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { Settings, Wallet, Sun, Moon, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { isAuthenticated, user, isByoConnected, byoAddress, logout } = useApp();
  const { openConnectModal } = useConnectModal();
  const { isDark, toggle } = useTheme();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {/* Account */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Account</div>
              <div className="text-sm text-gray-500">{isAuthenticated ? user?.email : "Not signed in"}</div>
            </div>
          </div>
          {isAuthenticated && (
            <button onClick={logout} className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"><LogOut className="w-3 h-3" /> Sign Out</button>
          )}
        </div>

        {/* Wallet */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Connected Wallet</div>
              <div className="text-sm text-gray-500">{isByoConnected ? `${byoAddress?.slice(0,6)}...${byoAddress?.slice(-4)}` : "No wallet connected"}</div>
            </div>
          </div>
          {isByoConnected ? (
            <ConnectButton />
          ) : (
            <button onClick={openConnectModal} className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700">
              Connect Wallet
            </button>
          )}
        </div>

        {/* Theme */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
            <div><div className="font-medium text-gray-900 dark:text-white">Theme</div><div className="text-sm text-gray-500">{isDark ? "Dark" : "Light"} mode</div></div>
          </div>
          <button onClick={toggle} className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? "bg-blue-600" : "bg-gray-300"}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-300">
        <strong>Demo Mode.</strong> All transactions are simulated. No real funds are used. Platform never stores private keys.
      </div>
    </div>
  );
}
