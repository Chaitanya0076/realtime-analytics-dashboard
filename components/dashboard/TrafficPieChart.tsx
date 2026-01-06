"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function TrafficPieChart({
  domains,
}: {
  domains: { domain: string; views: number }[];
}) {
  return (
    <PieChart width={280} height={280}>
      <Pie
        data={domains}
        dataKey="views"
        nameKey="domain"
        outerRadius={100}
      >
        {domains.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  );
}
