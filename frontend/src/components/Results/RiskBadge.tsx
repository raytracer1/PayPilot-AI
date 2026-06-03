import { RISK_COLORS } from "../../utils/constants";

interface RiskBadgeProps {
  score: number;
  level?: string;
}

export default function RiskBadge({ score, level }: RiskBadgeProps) {
  const colorClass =
    RISK_COLORS[score] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      title={`Risk Level: ${level || score}/5`}
    >
      🛡️ Risk {score}/5
    </span>
  );
}
