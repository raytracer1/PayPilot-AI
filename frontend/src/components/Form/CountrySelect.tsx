import { COUNTRIES } from "../../utils/constants";

interface CountrySelectProps {
  value: string;
  onChange: (val: string) => void;
}

export default function CountrySelect({ value, onChange }: CountrySelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Destination Country
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-lg"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} ({c.currency_symbol}{c.currency})
          </option>
        ))}
      </select>
    </div>
  );
}
