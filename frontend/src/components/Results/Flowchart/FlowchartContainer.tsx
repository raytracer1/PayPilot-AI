import { useRef, useEffect } from "react";
import * as d3 from "d3";
import type { PathOption } from "../../../types/api";
import { formatUSD } from "../../../utils/format";

interface FlowchartContainerProps {
  path: PathOption;
}

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  phase: "start" | "on_ramp" | "network" | "off_ramp" | "end";
  x: number;
  y: number;
}

const PHASE_COLORS: Record<string, string> = {
  start: "#f59e0b",
  on_ramp: "#3b82f6",
  network: "#8b5cf6",
  off_ramp: "#10b981",
  end: "#f59e0b",
};

export default function FlowchartContainer({
  path,
}: FlowchartContainerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 200;

    // Define nodes
    const nodes: FlowNode[] = [
      {
        id: "usd",
        label: "USD",
        sublabel: `$${path.summary.usd_received_after_fees + path.summary.total_fee_usd}`,
        phase: "start",
        x: 60,
        y: height / 2,
      },
      {
        id: "onramp",
        label: path.on_ramp.provider,
        sublabel: `Fee: ${formatUSD(path.on_ramp.fee_usd)}`,
        phase: "on_ramp",
        x: width * 0.28,
        y: height / 2,
      },
      {
        id: "network",
        label: path.network.name,
        sublabel: `Gas: ${formatUSD(path.network.gas_fee_usd)}`,
        phase: "network",
        x: width * 0.50,
        y: height / 2,
      },
      {
        id: "offramp",
        label: path.off_ramp.provider,
        sublabel: `Fee: ${formatUSD(path.off_ramp.fee_usd)}`,
        phase: "off_ramp",
        x: width * 0.72,
        y: height / 2,
      },
      {
        id: "local",
        label: path.off_ramp.currency,
        sublabel: `${path.summary.received_local}`,
        phase: "end",
        x: width - 60,
        y: height / 2,
      },
    ];

    // Draw links
    const g = svg.append("g");

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      // Animated path
      g.append("line")
        .attr("x1", from.x + 64)
        .attr("y1", from.y)
        .attr("x2", to.x - 64)
        .attr("y2", to.y)
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "8,4")
        .attr("opacity", 0.6);

      // Arrow head
      const midX = (from.x + 64 + to.x - 64) / 2;
      g.append("polygon")
        .attr(
          "points",
          `${midX + 6},${from.y} ${midX - 4},${from.y - 5} ${midX - 4},${from.y + 5}`
        )
        .attr("fill", "#9ca3af");
    }

    // Draw node groups
    nodes.forEach((node) => {
      const ng = g
        .append("g")
        .attr("transform", `translate(${node.x}, ${node.y})`);

      // Background circle
      ng.append("circle")
        .attr("r", 32)
        .attr("fill", PHASE_COLORS[node.phase])
        .attr("opacity", 0.15);

      // Outer ring
      ng.append("circle")
        .attr("r", 32)
        .attr("fill", "none")
        .attr("stroke", PHASE_COLORS[node.phase])
        .attr("stroke-width", 2.5);

      // Phase label
      ng.append("text")
        .attr("y", -8)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .attr("fill", PHASE_COLORS[node.phase])
        .text(node.label);

      // Sublabel
      ng.append("text")
        .attr("y", 8)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#9ca3af")
        .text(node.sublabel);
    });

    // Phase labels at top
    const phases = ["1. On-Ramp", "2. Network", "3. Off-Ramp"];
    const phaseX = [nodes[1].x, nodes[2].x, nodes[3].x];
    phases.forEach((phase, i) => {
      g.append("text")
        .attr("x", phaseX[i])
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .attr("fill", "#6b7280")
        .text(phase);
    });
  }, [path]);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 overflow-x-auto">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
        Transfer Flow
      </h4>
      <svg
        ref={svgRef}
        width="100%"
        height="200"
        className="min-w-[600px]"
      />
    </div>
  );
}
