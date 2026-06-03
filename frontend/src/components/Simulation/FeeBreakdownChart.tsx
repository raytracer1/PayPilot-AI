import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { SimulationStep } from "../../types/api";

interface FeeBreakdownChartProps {
  steps: SimulationStep[];
  totalFee: number;
}

export default function FeeBreakdownChart({
  steps,
  totalFee,
}: FeeBreakdownChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Extract fees from steps
    const fees: { label: string; value: number }[] = [];
    for (const step of steps) {
      const d = step.details;
      if (d.fee_usd) {
        fees.push({
          label: step.name,
          value: Number(d.fee_usd),
        });
      }
      if (d.spread_usd) {
        fees.push({
          label: step.name.replace("Convert", "Spread"),
          value: Number(d.spread_usd),
        });
      }
      if (d.gas_fee_usd) {
        fees.push({
          label: `${step.name} Gas`,
          value: Number(d.gas_fee_usd),
        });
      }
    }

    const width = svgRef.current.clientWidth || 400;
    const height = 120;
    const margin = { left: 10, right: 10, top: 5, bottom: 5 };
    const barH = (height - margin.top - margin.bottom) / fees.length;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const maxFee = d3.max(fees, (d) => d.value) || 1;

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(fees.map((d) => d.label))
      .range(["#3b82f6", "#60a5fa", "#8b5cf6", "#a78bfa", "#10b981", "#34d399", "#f59e0b"]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    fees.forEach((fee, i) => {
      const barWidth = (fee.value / maxFee) * (width - margin.left - margin.right) * 0.8;

      // Label
      g.append("text")
        .attr("x", 0)
        .attr("y", i * barH + barH / 2 + 4)
        .attr("font-size", 10)
        .attr("fill", "#6b7280")
        .attr("text-anchor", "end")
        .text(fee.label.length > 18 ? fee.label.slice(0, 16) + "…" : fee.label);

      // Bar
      g.append("rect")
        .attr("x", 8)
        .attr("y", i * barH + 4)
        .attr("width", Math.max(barWidth, 4))
        .attr("height", barH - 8)
        .attr("rx", 3)
        .attr("fill", colorScale(fee.label))
        .attr("opacity", 0.8);

      // Value
      g.append("text")
        .attr("x", barWidth + 14)
        .attr("y", i * barH + barH / 2 + 4)
        .attr("font-size", 10)
        .attr("font-weight", 600)
        .attr("fill", "#374151")
        .text(`$${fee.value.toFixed(2)}`);
    });
  }, [steps]);

  return (
    <div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
        Fee Composition
      </h4>
      <svg
        ref={svgRef}
        width="100%"
        height="160"
        className="min-w-[300px]"
      />
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Total fees: ${totalFee.toFixed(2)}
      </div>
    </div>
  );
}
