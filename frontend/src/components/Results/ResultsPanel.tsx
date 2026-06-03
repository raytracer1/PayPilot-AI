import { useState } from "react";
import type { ScoredPath, PathOption } from "../../types/api";
import PathCard from "./PathCard";

interface ResultsPanelProps {
  paths: ScoredPath[];
  totalEvaluated: number;
  amount: number;
  preference: string;
  onPreferenceChange: (pref: string) => void;
  onSend: (path: PathOption) => void;
  onError: (msg: string) => void;
}

export default function ResultsPanel({
  paths,
  totalEvaluated,
  amount,
  preference,
  onPreferenceChange,
  onSend,
  onError,
}: ResultsPanelProps) {
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const destinationCountry = paths[0]?.off_ramp?.currency === "MXN" ? "MX" : "BR";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {paths.length} Routes Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Evaluated {totalEvaluated} paths · Sorted by {preference}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(["fast", "balanced", "cheapest"] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPreferenceChange(p)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                preference === p
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {paths.map((path, i) => (
        <PathCard
          key={path.id}
          path={path}
          rank={i + 1}
          score={path.score}
          amount={amount}
          destinationCountry={destinationCountry}
          onSend={(p) => onSend(p)}
          isExpanded={expandedPathId === path.id}
          onToggle={() => setExpandedPathId(expandedPathId === path.id ? null : path.id)}
        />
      ))}
    </div>
  );
}
