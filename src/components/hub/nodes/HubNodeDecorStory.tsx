// src/components/hub/nodes/HubNodeDecorStory.tsx - Núcleo 3D de la sección Historia.
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StoryCore3D() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group scale={1.8} position={[0, -0.2, 0]}>
      <pointLight position={[2, 2, 2]} color="#0284c7" intensity={2} />
      <mesh ref={meshRef} rotation={[0.2, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#0284c7"
          wireframe={true}
          emissive="#10b981"
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
