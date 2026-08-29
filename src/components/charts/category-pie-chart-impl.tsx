"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { CategorySpending } from "@/types";

interface CategoryPieChartProps {
  data: CategorySpending[];
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { fill: string; percentage: number } }[] }) => {
  if (active && payload?.length) {
    const entry = payload[0];
    return (
      <div className="rounded-lg border border-orbital-gold/20 bg-orbital-surface px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-orbital-white">{entry.name}</p>
        <p className="text-orbital-muted">{formatCurrency(entry.value)}</p>
        <p style={{ color: entry.payload.fill }}>{formatPercent(entry.payload.percentage / 100)}</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoryName"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          labelLine={false}
          label={renderCustomLabel}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.categoryColor} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-orbital-muted">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
