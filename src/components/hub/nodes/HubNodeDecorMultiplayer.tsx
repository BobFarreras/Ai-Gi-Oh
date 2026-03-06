// src/components/hub/nodes/HubNodeDecorMultiplayer.tsx - Núcleo 3D de la sección Multijugador con trayectorias y enlaces.
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function MultiplayerCore3D() {
  const p1Ref = useRef<THREE.Mesh>(null);
  const p2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const laser1Ref = useRef<THREE.Mesh>(null);
  const laser2Ref = useRef<THREE.Mesh>(null);

  const cylinderAxis = new THREE.Vector3(0, 1, 0);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.z += delta * 0.2;
    }
    if (p1Ref.current && p2Ref.current) {
      p1Ref.current.position.x = Math.sin(t * 2.5) * 1.2;
      p1Ref.current.position.y = Math.cos(t * 3.5) * 0.4;
      p1Ref.current.position.z = Math.cos(t * 2.2) * 1.2;

      p2Ref.current.position.x = Math.sin(t * 1.8 + Math.PI) * 1.3;
      p2Ref.current.position.y = Math.sin(t * 2.8) * 0.5;
      p2Ref.current.position.z = Math.cos(t * 1.9 + Math.PI) * 1.3;

      p1Ref.current.lookAt(p2Ref.current.position);
      p2Ref.current.lookAt(p1Ref.current.position);

      const dist = p1Ref.current.position.distanceTo(p2Ref.current.position);
      
      if (laser1Ref.current) {
        laser1Ref.current.position.copy(p1Ref.current.position).lerp(p2Ref.current.position, 0.5);
        const direction1 = p2Ref.current.position.clone().sub(p1Ref.current.position).normalize();
        laser1Ref.current.quaternion.setFromUnitVectors(cylinderAxis, direction1);
        laser1Ref.current.scale.set(1, dist, 1);
        (laser1Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.random() > 0.88 ? 1 : 0;
      }
      if (laser2Ref.current) {
        laser2Ref.current.position.copy(p2Ref.current.position).lerp(p1Ref.current.position, 0.5);
        const direction2 = p1Ref.current.position.clone().sub(p2Ref.current.position).normalize();
        laser2Ref.current.quaternion.setFromUnitVectors(cylinderAxis, direction2);
        laser2Ref.current.scale.set(1, dist, 1);
        (laser2Ref.current.material as THREE.MeshStandardMaterial).opacity = Math.random() > 0.92 ? 1 : 0;
      }
    }
  });

  return (
    <group scale={1.2} position={[0, 0.2, 0]}>
      <pointLight position={[0, 0, 0]} color="#10b981" intensity={2} />
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#10b981" wireframe emissive="#059669" emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>
      <mesh ref={p1Ref}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={3} wireframe />
      </mesh>
      <mesh ref={p2Ref}>
        <coneGeometry args={[0.15, 0.4, 4]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3} wireframe />
      </mesh>
      <mesh ref={laser1Ref}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
        <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={6} transparent opacity={0} />
      </mesh>
      <mesh ref={laser2Ref}>
        <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={6} transparent opacity={0} />
      </mesh>
    </group>
  );
}
