// src/components/hub/nodes/HubNodeDecorTraining.tsx - Núcleo 3D de la sección Entrenamiento con anillos giroscópicos.
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function TrainingCore3D() {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const gyroRing1 = useRef<THREE.Mesh>(null);
  const gyroRing2 = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(t * 2) * 0.1;
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.x += delta * 0.5;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y -= delta * 0.35;
      shellRef.current.rotation.z += delta * 0.18;
    }
    if (gyroRing1.current) {
      gyroRing1.current.rotation.x += delta * 2;
      gyroRing1.current.rotation.y += delta * 1.5;
    }
    if (gyroRing2.current) {
      gyroRing2.current.rotation.y -= delta * 2.5;
      gyroRing2.current.rotation.z += delta * 2;
    }
  });

  return (
    <group scale={1.3} position={[0, 0, 0]}>
      <pointLight position={[2, 2, 2]} color="#60a5fa" intensity={2} />
      
      <mesh ref={coreRef}>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#3b82f6" emissive="#60a5fa" emissiveIntensity={2} />
      </mesh>
      <mesh ref={shellRef}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#93c5fd" wireframe transparent opacity={0.3} />
      </mesh>

      <mesh ref={gyroRing1}>
        <torusGeometry args={[0.6, 0.02, 16, 100]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.5} />
      </mesh>

      <mesh ref={gyroRing2}>
        <torusGeometry args={[0.8, 0.015, 16, 100]} />
        <meshStandardMaterial color="#93c5fd" emissive="#93c5fd" emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
