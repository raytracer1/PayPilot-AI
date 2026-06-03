import type { SimulationStep } from "../../types/api";
import { formatDuration, formatUSD, shortHash } from "../../utils/format";
import { CheckCircle, ArrowRight } from "lucide-react";

const PHASE_ICONS: Record<string, string> = {
  on_ramp: "🏦",
  network: "🔗",
  off_ramp: "🏧",
};

interface TransactionTimelineProps {
  steps: SimulationStep[];
}

export default function TransactionTimeline({
  steps,
}: TransactionTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.step_number} className="relative flex gap-4 pb-6">
          {/* Timeline line */}
          {i < steps.length - 1 && (
            <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Step indicator */}
          <div
            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              step.status === "completed"
                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            }`}
          >
            {step.status === "completed" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-bold">{step.step_number}</span>
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm">
                {PHASE_ICONS[step.phase] || "📋"}
              </span>
              <h5 className="font-semibold text-sm text-gray-900 dark:text-white">
                {step.name}
              </h5>
              <span className="text-xs text-gray-400">
                +{formatDuration(step.timestamp_offset_minutes)}
              </span>
            </div>

            {/* Details grid */}
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {Object.entries(step.details).map(([key, val]) => {
                const displayVal =
                  typeof val === "number" && key.includes("usd")
                    ? formatUSD(val as number)
                    : typeof val === "number" && key.includes("amount")
                    ? formatUSD(val as number)
                    : key.includes("tx_hash")
                    ? shortHash(String(val))
                    : String(val);

                return (
                  <div key={key} className="flex gap-1">
                    <span className="text-gray-400 capitalize">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono truncate">
                      {displayVal}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
