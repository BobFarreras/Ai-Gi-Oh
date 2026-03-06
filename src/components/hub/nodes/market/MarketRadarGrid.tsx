// src/components/hub/nodes/market/MarketRadarGrid.tsx - Retícula circular del radar táctico del mercado.
"use client";

import { useMemo } from "react";
import * as THREE from "three";

export function MarketRadarGrid() {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "rgba(245, 158, 11, 0.15)";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  if (!texture) return null;
  return (
    <mesh position={[0, 0, 0.01]}>
      <circleGeometry args={[1.38, 64]} />
      <meshBasicMaterial map={texture} transparent opacity={0.8} depthWrite={false} />
    </mesh>
  );
}
