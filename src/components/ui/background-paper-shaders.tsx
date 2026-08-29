"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.08 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.04 * intensity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
    noise *= 0.5;

    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    color = mix(color, color2 * 1.2, pow(abs(noise), 3.0) * intensity * 0.08);

    float glow = 1.0 - length(uv - 0.5) * 0.6;
    glow = clamp(glow, 0.55, 1.0);

    gl_FragColor = vec4(color * glow, 1.0);
  }
`;

export function ShaderPlane({
  position,
  color1 = "#0A1628",
  color2 = "#0D3B6E",
  animate = true,
}: {
  position: [number, number, number];
  color1?: string;
  color2?: string;
  animate?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 0.8 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2]
  );

  useFrame((state) => {
    if (!animate || !mesh.current) return;
    uniforms.time.value = state.clock.elapsedTime * 0.35;
    uniforms.intensity.value =
      0.7 + Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
  });

  return (
    <mesh ref={mesh} position={position}>
      {/* Lower subdivision (was 48x48) — the vertex wave still reads fine */}
      <planeGeometry args={[10, 7, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
