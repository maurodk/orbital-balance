"use client";

import dynamic from "next/dynamic";

export const MonthlyBarChart = dynamic(
  () => import("./monthly-bar-chart-impl").then((m) => m.MonthlyBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-xl bg-orbital-surface/30" />
    ),
  }
);
