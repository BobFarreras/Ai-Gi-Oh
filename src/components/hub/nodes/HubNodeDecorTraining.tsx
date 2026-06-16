// src/components/hub/nodes/HubNodeDecorTraining.tsx - Núcleo 3D de la sección Entrenamiento con anillos giroscópicos.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const coreGeometry = new THREE.DodecahedronGeometry(0.3, 0);
const shellGeometry = new THREE.DodecahedronGeometry(0.35, 0);
const gyroRing1Geometry = new THREE.TorusGeometry(0.6, 0.02, 8, 32);
const gyroRing2Geometry = new THREE.TorusGeometry(0.8, 0.015, 8, 32);

export function TrainingCore3D() {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const gyroRing1 = useRef<THREE.Mesh>(null);
  const gyroRing2 = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const materials = useMemo(
    () => ({
      core: new THREE.MeshStandardMaterial({ color: "#3b82f6", emissive: "#60a5fa", emissiveIntensity: 2 }),
      shell: new THREE.MeshStandardMaterial({ color: "#93c5fd", wireframe: true, transparent: true, opacity: 0.3 }),
      ring1: new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "#3b82f6", emissiveIntensity: 1.5 }),
      ring2: new THREE.MeshStandardMaterial({ color: "#93c5fd", emissive: "#93c5fd", emissiveIntensity: 1, transparent: true, opacity: 0.6 }),
    }),
    [],
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
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
      <mesh ref={coreRef} geometry={coreGeometry} material={materials.core} />
      <mesh ref={shellRef} geometry={shellGeometry} material={materials.shell} />
      <mesh ref={gyroRing1} geometry={gyroRing1Geometry} material={materials.ring1} />
      <mesh ref={gyroRing2} geometry={gyroRing2Geometry} material={materials.ring2} />
    </group>
  );
}
