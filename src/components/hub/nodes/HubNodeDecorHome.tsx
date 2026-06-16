// src/components/hub/nodes/HubNodeDecorHome.tsx - Núcleo 3D de la sección Mi Home.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const innerGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 6);
const outerGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.8, 6);

export function HomeCore3D() {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const pulseTimeRef = useRef(0);
  const materials = useMemo(
    () => ({
      inner: new THREE.MeshStandardMaterial({ color: "#a7f3d0", emissive: "#10b981", emissiveIntensity: 1.5 }),
      outer: new THREE.MeshStandardMaterial({ color: "#059669", wireframe: true, emissive: "#34d399", emissiveIntensity: 1, transparent: true, opacity: 0.4 }),
    }),
    [],
  );

  useFrame((_, delta) => {
    if (outerMeshRef.current) outerMeshRef.current.rotation.y += delta * 0.2;
    if (innerMeshRef.current) {
      innerMeshRef.current.rotation.y -= delta * 0.4;
      pulseTimeRef.current += delta * 3;
      const scalePulse = 1 + Math.sin(pulseTimeRef.current) * 0.05;
      innerMeshRef.current.scale.set(scalePulse, scalePulse, scalePulse);
    }
  });

  return (
    <group scale={1.2} position={[0, -0.2, 0]}>
      <mesh ref={innerMeshRef} geometry={innerGeometry} material={materials.inner} />
      <mesh ref={outerMeshRef} geometry={outerGeometry} material={materials.outer} />
    </group>
  );
}
