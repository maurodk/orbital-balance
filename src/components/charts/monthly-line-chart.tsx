"use client";

import dynamic from "next/dynamic";

// recharts is ~100kb gz — load it only when a chart actually renders,
// keeping it out of the route's critical JS.
export const MonthlyLineChart = dynamic(
  () => import("./monthly-line-chart-impl").then((m) => m.MonthlyLineChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-xl bg-orbital-surface/30" />
    ),
  }
);
