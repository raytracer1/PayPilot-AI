import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon, Zap } from "lucide-react";

interface HeaderProps {
  onNewQuote: () => void;
}

export default function Header({ onNewQuote }: HeaderProps) {
  const { isDark, toggle } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={onNewQuote}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              PayPilot AI
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cross-Border Payment Router
            </p>
          </div>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
}
