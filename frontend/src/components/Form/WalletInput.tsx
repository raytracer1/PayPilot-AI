interface WalletInputProps {
  value: string;
  onChange: (val: string) => void;
}

export default function WalletInput({ value, onChange }: WalletInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Recipient Wallet / Bank Details{" "}
        <span className="text-gray-400 font-normal">(optional, simulated)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
        placeholder="e.g. 0x... or bank account ending in 1234"
      />
    </div>
  );
}
