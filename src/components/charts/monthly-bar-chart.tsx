"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrencyCompact, formatMonthYear } from "@/lib/formatters";
import type { MonthSummary } from "@/types";

interface MonthlyBarChartProps {
  data: MonthSummary[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; fill: string; value: number }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-orbital-gold/20 bg-orbital-surface px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-orbital-white mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.fill }}>
            {entry.name}: {formatCurrencyCompact(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthYear(d.month, d.year).slice(0, 3),
    Receitas: d.totalIncome,
    Despesas: d.totalExpense,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,122,0.08)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#A7B0B8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCurrencyCompact}
          tick={{ fill: "#A7B0B8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(212,175,122,0.04)" }} />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#A7B0B8" }}
        />
        <Bar dataKey="Receitas" fill="#D4AF7A" radius={[4, 4, 0, 0]} animationDuration={800} />
        <Bar dataKey="Despesas" fill="#4B6A8A" radius={[4, 4, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}
