interface AmountInputProps {
  value: number;
  onChange: (val: number) => void;
  currency: "USDC" | "USDT";
  onCurrencyChange: (c: "USDC" | "USDT") => void;
}

export default function AmountInput({ value, onChange, currency, onCurrencyChange }: AmountInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Amount
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">
            $
          </span>
          <input
            type="number"
            min={1}
            max={100000}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full pl-9 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-lg"
            placeholder="500.00"
          />
        </div>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as "USDC" | "USDT")}
          className="px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
      </div>
      {value > 10000 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          ⚠️ Large amounts may trigger additional KYC checks (simulated).
        </p>
      )}
    </div>
  );
}
