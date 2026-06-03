import { Building2, Wallet } from "lucide-react";

type RecipientType = "bank" | "wallet";

interface Props {
  type: RecipientType;
  onTypeChange: (t: RecipientType) => void;
}

export default function RecipientInput({ type, onTypeChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Recipient
      </label>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          type="button" onClick={() => onTypeChange("bank")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            type === "bank"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          <Building2 className="w-4 h-4" /> Bank Account
        </button>
        <button
          type="button" onClick={() => onTypeChange("wallet")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            type === "wallet"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500"
          }`}
        >
          <Wallet className="w-4 h-4" /> Wallet
        </button>
      </div>
    </div>
  );
}
