"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "@/components/ui/background-paper-shaders";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

export default function BackgroundCanvasScene() {
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const animate = !reducedMotion && pageVisible;

  return (
    <Canvas
      // Cap devicePixelRatio — retina/4K would otherwise render 4x the pixels.
      dpr={[1, 1.5]}
      // Stop the render loop entirely when animation is off (hidden tab or
      // reduced-motion). "demand" only re-renders on prop change / invalidate.
      frameloop={animate ? "always" : "demand"}
      camera={{ position: [0, 0, 1.8], fov: 75 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0A1628", 1);
      }}
    >
      {/* Single plane (was 2) — the second was barely visible behind the first */}
      <ShaderPlane
        position={[0, 0, 0]}
        color1="#0A1628"
        color2="#0D3B6E"
        animate={animate}
      />
    </Canvas>
  );
}
