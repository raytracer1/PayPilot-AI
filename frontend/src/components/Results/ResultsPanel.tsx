import { useState } from "react";
import type { QuoteResponse, PathOption } from "../../types/api";
import PathCard from "./PathCard";

interface ResultsPanelProps {
  data: QuoteResponse;
  amount: number;
  onSimulate: (path: PathOption) => void;
  onError: (msg: string) => void;
}

export default function ResultsPanel({
  data,
  amount,
  onSimulate,
  onError,
}: ResultsPanelProps) {
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const destinationCountry =
    data.paths[0]?.off_ramp?.currency === "MXN"
      ? "MX"
      : "BR";

  const handleSimulate = (path: PathOption) => {
    onSimulate(path);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {data.meta.paths_returned} Routes Found
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Evaluated {data.meta.total_paths_evaluated} paths · Best picks
            shown below
          </p>
        </div>
      </div>

      {data.paths.map((path) => (
        <PathCard
          key={path.id}
          path={path}
          rank={path.rank}
          amount={amount}
          destinationCountry={destinationCountry}
          onSimulate={handleSimulate}
          isExpanded={expandedPathId === path.id}
          onToggle={() =>
            setExpandedPathId(
              expandedPathId === path.id ? null : path.id
            )
          }
        />
      ))}
    </div>
  );
}
