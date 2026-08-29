"use client";

import dynamic from "next/dynamic";

export const CategoryPieChart = dynamic(
  () => import("./category-pie-chart-impl").then((m) => m.CategoryPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-xl bg-orbital-surface/30" />
    ),
  }
);
