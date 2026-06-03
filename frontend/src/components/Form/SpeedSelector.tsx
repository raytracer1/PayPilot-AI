import { SPEED_LABELS } from "../../utils/constants";

interface SpeedSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SpeedSelector({
  value,
  onChange,
}: SpeedSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Delivery Preference
      </label>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(SPEED_LABELS).map(([key, { label, desc }]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              value === key
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
