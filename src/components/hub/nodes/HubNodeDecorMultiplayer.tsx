// src/components/hub/nodes/HubNodeDecorMultiplayer.tsx - Núcleo 3D de la sección Multijugador con trayectorias y enlaces.
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const coreGeometry = new THREE.OctahedronGeometry(0.5, 0);
const playerGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
const laserGeometry = new THREE.CylinderGeometry(0.015, 0.015, 1, 6);

const materials = {
  core: new THREE.MeshStandardMaterial({ color: "#10b981", wireframe: true, emissive: "#059669", emissiveIntensity: 1.5, transparent: true, opacity: 0.6 }),
  p1: new THREE.MeshStandardMaterial({ color: "#d946ef", emissive: "#d946ef", emissiveIntensity: 3, wireframe: true }),
  p2: new THREE.MeshStandardMaterial({ color: "#06b6d4", emissive: "#06b6d4", emissiveIntensity: 3, wireframe: true }),
  laser1: new THREE.MeshStandardMaterial({ color: "#d946ef", emissive: "#d946ef", emissiveIntensity: 6, transparent: true, opacity: 0 }),
  laser2: new THREE.MeshStandardMaterial({ color: "#06b6d4", emissive: "#06b6d4", emissiveIntensity: 6, transparent: true, opacity: 0 }),
};

export function MultiplayerCore3D() {
  const p1Ref = useRef<THREE.Mesh>(null);
  const p2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const laser1Ref = useRef<THREE.Mesh>(null);
  const laser2Ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Vectores temporales reutilizados para evitar .clone() y allocations por frame.
  const temp = useMemo(
    () => ({
      p1Pos: new THREE.Vector3(),
      p2Pos: new THREE.Vector3(),
      mid: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      cylinderAxis: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
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

      temp.p1Pos.copy(p1Ref.current.position);
      temp.p2Pos.copy(p2Ref.current.position);
      const dist = temp.p1Pos.distanceTo(temp.p2Pos);

      if (laser1Ref.current) {
        laser1Ref.current.position.copy(temp.p1Pos).lerp(temp.p2Pos, 0.5);
        const direction1 = temp.direction.copy(temp.p2Pos).sub(temp.p1Pos).normalize();
        laser1Ref.current.quaternion.setFromUnitVectors(temp.cylinderAxis, direction1);
        laser1Ref.current.scale.set(1, dist, 1);
        materials.laser1.opacity = Math.random() > 0.88 ? 1 : 0;
      }
      if (laser2Ref.current) {
        laser2Ref.current.position.copy(temp.p2Pos).lerp(temp.p1Pos, 0.5);
        const direction2 = temp.direction.copy(temp.p1Pos).sub(temp.p2Pos).normalize();
        laser2Ref.current.quaternion.setFromUnitVectors(temp.cylinderAxis, direction2);
        laser2Ref.current.scale.set(1, dist, 1);
        materials.laser2.opacity = Math.random() > 0.92 ? 1 : 0;
      }
    }
  });

  return (
    <group scale={1.2} position={[0, 0.2, 0]}>
      <mesh ref={coreRef} geometry={coreGeometry} material={materials.core} />
      <mesh ref={p1Ref} geometry={playerGeometry} material={materials.p1} />
      <mesh ref={p2Ref} geometry={playerGeometry} material={materials.p2} />
      <mesh ref={laser1Ref} geometry={laserGeometry} material={materials.laser1} />
      <mesh ref={laser2Ref} geometry={laserGeometry} material={materials.laser2} />
    </group>
  );
}
