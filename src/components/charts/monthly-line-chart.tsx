"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrencyCompact, formatMonthYear } from "@/lib/formatters";
import type { MonthSummary } from "@/types";

interface MonthlyLineChartProps {
  data: MonthSummary[];
  height?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; color: string; value: number }[];
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-orbital-gold/20 bg-orbital-deep/90 backdrop-blur-md px-4 py-3 text-xs shadow-xl">
        <p className="font-semibold text-orbital-white mb-2">{label}</p>
        {payload.map((entry) => (
          <p
            key={entry.name}
            className="flex items-center gap-2 py-0.5"
            style={{ color: entry.color }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}: {formatCurrencyCompact(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyLineChart({ data, height = 300 }: MonthlyLineChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthYear(d.month, d.year).slice(0, 3),
    Receitas: d.totalIncome,
    Despesas: d.totalExpense,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF7A" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#D4AF7A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4B6A8A" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#4B6A8A" stopOpacity={0} />
          </linearGradient>
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(212,175,122,0.06)"
          vertical={false}
        />
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
          width={65}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: "rgba(212,175,122,0.15)", strokeWidth: 1 }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: "#A7B0B8", paddingTop: "16px" }}
        />

        <Area
          type="monotone"
          dataKey="Receitas"
          stroke="#D4AF7A"
          strokeWidth={2.5}
          fill="url(#gradIncome)"
          dot={{ fill: "#D4AF7A", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: "#D4AF7A", strokeWidth: 2, stroke: "rgba(212,175,122,0.35)" }}
          filter="url(#glowGold)"
          animationDuration={1600}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="Despesas"
          stroke="#4B6A8A"
          strokeWidth={2.5}
          fill="url(#gradExpense)"
          dot={{ fill: "#4B6A8A", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: "#4B6A8A", strokeWidth: 2, stroke: "rgba(75,106,138,0.35)" }}
          filter="url(#glowBlue)"
          animationDuration={1600}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
