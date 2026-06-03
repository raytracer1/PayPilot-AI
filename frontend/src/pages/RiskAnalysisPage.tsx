import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

const RISK_DATA = [
  { factor: "Regulatory Compliance", score: 2, desc: "Licensed providers in both US and LATAM jurisdictions" },
  { factor: "Network Reliability", score: 1, desc: "Base L2 — 99.9% uptime, 2000+ TPS" },
  { factor: "Exchange Liquidity", score: 2, desc: "Deep USDC/MXN liquidity on Bitso" },
  { factor: "Intermediary Count", score: 2, desc: "3 hops: On-ramp → L2 → Off-ramp" },
  { factor: "Counterparty Risk", score: 3, desc: "Standard KYC/AML checks apply" },
];

export default function RiskAnalysisPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Risk Analysis</h2>
      <p className="text-gray-500 dark:text-gray-400">
        Real-time risk scoring across all routing factors. Scale: 1 (lowest) to 5 (highest).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">67%</div>
          <div className="text-sm text-green-600 dark:text-green-400">Low Risk Routes</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">25%</div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Risk Routes</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <Shield className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">8%</div>
          <div className="text-sm text-red-600 dark:text-red-400">High Risk Routes</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {RISK_DATA.map((r, i) => (
          <div key={r.factor} className={`p-4 ${i < RISK_DATA.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">{r.factor}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                r.score <= 2 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                r.score <= 3 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}>{r.score}/5</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className={`h-full rounded-full ${r.score <= 2 ? "bg-green-500" : r.score <= 3 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${(r.score / 5) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
