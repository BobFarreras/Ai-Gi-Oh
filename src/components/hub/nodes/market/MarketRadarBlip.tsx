// src/components/hub/nodes/market/MarketRadarBlip.tsx - Eco individual del radar con pulso sincronizado al barrido.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IMarketRadarBlip, MARKET_SWEEP_DURATION } from "./market-radar-types";

interface MarketRadarBlipProps {
  blip: IMarketRadarBlip;
}

const BLIP_COLORS: Record<IMarketRadarBlip["rarity"], string> = {
  legendary: "#ef4444",
  epic: "#22d3ee",
  common: "#f59e0b",
};

export function MarketRadarBlip({ blip }: MarketRadarBlipProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const color = BLIP_COLORS[blip.rarity];
  const { x, y, syncTime } = useMemo(() => {
    const radians = (blip.angle - 90) * (Math.PI / 180);
    const radius = (blip.distance / 50) * 1.3;
    return { x: Math.cos(radians) * radius, y: -Math.sin(radians) * radius, syncTime: (blip.angle / 360) * MARKET_SWEEP_DURATION };
  }, [blip.angle, blip.distance]);

  useFrame((state) => {
    if (!meshRef.current || !ringRef.current || !matRef.current || !ringMatRef.current) return;
    let diff = (state.clock.elapsedTime % MARKET_SWEEP_DURATION) - syncTime;
    if (diff < 0) diff += MARKET_SWEEP_DURATION;
    const progress = diff / MARKET_SWEEP_DURATION;
    const pulse = Math.max(0, 1 - progress * 1.1);
    matRef.current.opacity = 0.15 + pulse * 0.75;
    ringMatRef.current.opacity = pulse > 0.2 ? pulse * 0.55 : 0;
    const scale = 0.9 + pulse * 0.8;
    meshRef.current.scale.set(scale, scale, scale);
    ringRef.current.scale.set(1 + pulse * 1.7, 1 + pulse * 1.7, 1 + pulse * 1.7);
  });

  return (
    <group position={[x, y, 0.08]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial ref={matRef} color="#ffffff" emissive={color} emissiveIntensity={2.8} transparent />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.04, 0.05, 16]} />
        <meshStandardMaterial ref={ringMatRef} color={color} emissive={color} emissiveIntensity={1.6} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
