import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Demo Only.</strong> All data is simulated. No real funds are
          transferred.
        </span>
      </div>
    </div>
  );
}
