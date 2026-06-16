// src/components/hub/nodes/market/MarketCore3D.tsx - Núcleo 3D del mercado con radar optimizado y ecos dinámicos.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MarketRadarBlip } from "./MarketRadarBlip";
import { MarketRadarGrid } from "./MarketRadarGrid";
import { MarketRadarSweep } from "./MarketRadarSweep";
import { generateRandomMarketBlips } from "./market-radar-utils";
import { IMarketRadarBlip, MARKET_SWEEP_DURATION } from "./market-radar-types";

const outerTorusGeometry = new THREE.TorusGeometry(1.38, 0.06, 16, 32);
const baseCircleGeometry = new THREE.CircleGeometry(1.38, 32);
const outerRingGeometry = new THREE.RingGeometry(1.35, 1.4, 32);
const innerRingGeometry = new THREE.RingGeometry(0.7, 0.72, 24);
const crossPlaneGeometry = new THREE.PlaneGeometry(2.8, 0.01);

export function MarketCore3D() {
  const coreRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const [blips, setBlips] = useState<IMarketRadarBlip[]>(() => generateRandomMarketBlips(5));

  const materials = useMemo(
    () => ({
      outerTorus: new THREE.MeshStandardMaterial({ color: "#291300", roughness: 0.62, metalness: 0.88 }),
      baseCircle: new THREE.MeshStandardMaterial({ color: "#050200", roughness: 0.9 }),
      outerRing: new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.85, transparent: true, opacity: 0.8 }),
      innerRing: new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", transparent: true, opacity: 0.25, depthWrite: false }),
      cross: new THREE.MeshStandardMaterial({ color: "#f59e0b", transparent: true, opacity: 0.26, depthWrite: false }),
    }),
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const amount = Math.floor(Math.random() * 4) + 3;
      setBlips(generateRandomMarketBlips(amount));
    }, MARKET_SWEEP_DURATION * 1000);
    return () => clearInterval(interval);
  }, []);

  useFrame((_, delta) => {
    if (!coreRef.current) return;
    timeRef.current += delta;
    coreRef.current.position.y = -0.38 + Math.sin(timeRef.current * 2) * 0.03;
  });

  return (
    <group ref={coreRef} scale={1.65} rotation={[-1.2, 0, 0]} position={[0, -0.38, 0]}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[0, -5, 5]} intensity={1.1} color="#f59e0b" />

      <group position={[0, 0, -0.05]}>
        <mesh geometry={outerTorusGeometry} material={materials.outerTorus} />
        <mesh position={[0, 0, -0.05]} geometry={baseCircleGeometry} material={materials.baseCircle} />
      </group>

      <MarketRadarGrid />
      <mesh position={[0, 0, 0.02]} geometry={outerRingGeometry} material={materials.outerRing} />
      <mesh position={[0, 0, 0.02]} geometry={innerRingGeometry} material={materials.innerRing} />
      <mesh position={[0, 0, 0.03]} geometry={crossPlaneGeometry} material={materials.cross} />
      <mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={crossPlaneGeometry} material={materials.cross} />

      <MarketRadarSweep />
      {blips.map((blip) => (
        <MarketRadarBlip key={blip.id} blip={blip} />
      ))}
    </group>
  );
}
