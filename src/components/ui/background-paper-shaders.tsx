"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vPosition = position;

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
  varying vec3 vPosition;

  void main() {
    vec2 uv = vUv;

    float noise = sin(uv.x * 20.0 + time) * cos(uv.y * 15.0 + time * 0.8);
    noise += sin(uv.x * 35.0 - time * 2.0) * cos(uv.y * 25.0 + time * 1.2) * 0.5;
    noise *= 0.5;

    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
    // very subtle highlight — stay dark/blue
    color = mix(color, color2 * 1.2, pow(abs(noise), 3.0) * intensity * 0.08);

    // soft center glow — does NOT go to zero at edges
    float glow = 1.0 - length(uv - 0.5) * 0.6;
    glow = clamp(glow, 0.55, 1.0);

    gl_FragColor = vec4(color * glow, 1.0);
  }
`;

export function ShaderPlane({
  position,
  color1 = "#0A1628",
  color2 = "#0D3B6E",
}: {
  position: [number, number, number];
  color1?: string;
  color2?: string;
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
    if (mesh.current) {
      // slow, cinematic animation
      uniforms.time.value = state.clock.elapsedTime * 0.35;
      uniforms.intensity.value = 0.7 + Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <planeGeometry args={[10, 7, 48, 48]} />
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
