"use client";

import dynamic from "next/dynamic";

// Loaded client-only, after hydration, so three.js never blocks first paint.
const Scene = dynamic(() => import("./background-canvas-scene"), { ssr: false });

export function BackgroundCanvas() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-0 pointer-events-none"
      // Solid fallback paint until the canvas mounts — no flash of nothing.
      style={{ background: "#0A1628" }}
    >
      <Scene />
    </div>
  );
}
