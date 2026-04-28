"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./background-canvas-scene"), { ssr: false });

export function BackgroundCanvas() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden
    >
      <Scene />
    </div>
  );
}
