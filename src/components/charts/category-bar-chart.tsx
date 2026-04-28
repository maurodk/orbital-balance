"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/formatters";
import type { CategorySpending } from "@/types";

interface CategoryBarChartProps {
  data: CategorySpending[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (!data.length) return null;

  const maxTotal = Math.max(...data.map((d) => d.total));

  return (
    <div className="space-y-4">
      {data.slice(0, 7).map((item, i) => (
        <div key={item.categoryId}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.categoryColor }}
              />
              <span className="text-xs font-medium text-orbital-white truncate max-w-[140px]">
                {item.categoryName}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-2">
              <span className="text-xs text-orbital-muted tabular-nums">
                {item.percentage.toFixed(1)}%
              </span>
              <span className="text-xs font-semibold text-orbital-white tabular-nums">
                {formatCurrency(item.total)}
              </span>
            </div>
          </div>

          <div className="h-2 rounded-full bg-orbital-deep overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.total / maxTotal) * 100}%` }}
              transition={{
                duration: 0.9,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="h-full rounded-full"
              style={{
                backgroundColor: item.categoryColor,
                boxShadow: `0 0 8px ${item.categoryColor}55`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
