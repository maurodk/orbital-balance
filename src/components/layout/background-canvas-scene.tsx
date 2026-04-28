"use client";

import { Canvas } from "@react-three/fiber";
import { ShaderPlane } from "@/components/ui/background-paper-shaders";

export default function BackgroundCanvasScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 1.8], fov: 75 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0A1628", 1);
      }}
    >
      {/* Primary deep-blue plane — covers full viewport */}
      <ShaderPlane
        position={[0, 0, 0]}
        color1="#0A1628"
        color2="#0D3B6E"
      />
      {/* Secondary accent — shifted, adds depth variation */}
      <ShaderPlane
        position={[0.6, 0.4, -0.6]}
        color1="#0B1829"
        color2="#1247A0"
      />
    </Canvas>
  );
}
