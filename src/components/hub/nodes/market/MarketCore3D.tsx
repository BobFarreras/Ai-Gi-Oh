// src/components/hub/nodes/market/MarketCore3D.tsx - Núcleo 3D del mercado con radar optimizado y ecos dinámicos.
"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MarketRadarBlip } from "./MarketRadarBlip";
import { MarketRadarGrid } from "./MarketRadarGrid";
import { MarketRadarSweep } from "./MarketRadarSweep";
import { generateRandomMarketBlips } from "./market-radar-utils";
import { IMarketRadarBlip, MARKET_SWEEP_DURATION } from "./market-radar-types";

export function MarketCore3D() {
  const coreRef = useRef<THREE.Group>(null);
  const [blips, setBlips] = useState<IMarketRadarBlip[]>(() => generateRandomMarketBlips(5));

  useEffect(() => {
    const interval = setInterval(() => {
      const amount = Math.floor(Math.random() * 4) + 3;
      setBlips(generateRandomMarketBlips(amount));
    }, MARKET_SWEEP_DURATION * 1000);
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    if (!coreRef.current) return;
    coreRef.current.position.y = -0.38 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });

  return (
    <group ref={coreRef} scale={1.65} rotation={[-1.2, 0, 0]} position={[0, -0.38, 0]}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[0, -5, 5]} intensity={1.1} color="#f59e0b" />
      <pointLight position={[0, 0, 2]} color="#f59e0b" intensity={0.75} />

      <group position={[0, 0, -0.05]}>
        <mesh>
          <torusGeometry args={[1.38, 0.06, 28, 56]} />
          <meshStandardMaterial color="#291300" roughness={0.62} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[1.38, 64]} />
          <meshStandardMaterial color="#050200" roughness={0.9} />
        </mesh>
      </group>

      <MarketRadarGrid />
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[1.35, 1.4, 64]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.85} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.7, 0.72, 32]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[2.8, 0.01]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.01, 2.8]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.26} depthWrite={false} />
      </mesh>

      <MarketRadarSweep />
      {blips.map((blip) => (
        <MarketRadarBlip key={blip.id} blip={blip} />
      ))}
    </group>
  );
}
