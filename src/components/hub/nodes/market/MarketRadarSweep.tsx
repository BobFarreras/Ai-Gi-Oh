// src/components/hub/nodes/market/MarketRadarSweep.tsx - Haz giratorio principal del radar de mercado.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MARKET_SWEEP_DURATION } from "./market-radar-types";

export function MarketRadarSweep() {
  const sweepRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createConicGradient(Math.PI / 2, 256, 256);
    gradient.addColorStop(0, "rgba(245, 158, 11, 0)");
    gradient.addColorStop(0.8, "rgba(245, 158, 11, 0.05)");
    gradient.addColorStop(0.98, "rgba(245, 158, 11, 0.8)");
    gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!sweepRef.current) return;
    const angle = ((state.clock.elapsedTime % MARKET_SWEEP_DURATION) / MARKET_SWEEP_DURATION) * (Math.PI * 2);
    sweepRef.current.rotation.z = -angle;
  });

  if (!texture) return null;
  return (
    <mesh ref={sweepRef} position={[0, 0, 0.06]}>
      <circleGeometry args={[1.38, 64]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
