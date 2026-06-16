// src/components/hub/nodes/HubNodeDecorStory.tsx - Decorador visual del nodo Story en la escena 3D del hub.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const sphereGeometry = new THREE.SphereGeometry(1, 12, 12);

export function StoryCore3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0284c7",
        wireframe: true,
        emissive: "#10b981",
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.8,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group scale={1.8} position={[0, -0.2, 0]}>
      <mesh ref={meshRef} rotation={[0.2, 0, 0]} geometry={sphereGeometry} material={material} />
    </group>
  );
}
