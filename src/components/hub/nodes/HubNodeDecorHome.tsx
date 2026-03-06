// src/components/hub/nodes/HubNodeDecorHome.tsx - Núcleo 3D de la sección Mi Home.
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function HomeCore3D() {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (outerMeshRef.current) outerMeshRef.current.rotation.y += delta * 0.2;
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * 0.4;
      const scalePulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      innerMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
    }
  });

  return (
    <group scale={1.2} position={[0, -0.2, 0]}>
      {/* Luces locales para el Home */}
      <pointLight position={[0, 0, 0]} color="#10b981" intensity={2} />

      <mesh ref={innerMeshRef}>
        <cylinderGeometry args={[0.4, 0.4, 1.5, 6]} />
        <meshStandardMaterial color="#a7f3d0" emissive="#10b981" emissiveIntensity={1.5} />
      </mesh>
      <mesh ref={outerMeshRef}>
        <cylinderGeometry args={[0.7, 0.7, 1.8, 6]} />
        <meshStandardMaterial color="#059669" wireframe emissive="#34d399" emissiveIntensity={1} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
