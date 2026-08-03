// src/components/hub/academy/training/combat-modes/scene/internal/ModePedestal.tsx - Plataforma de luz que asienta cada módulo.
"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface IModePedestalProps {
  position: [number, number, number];
  accentColor: string;
  scale: number;
  lite?: boolean;
}

/**
 * La escenografía de cada modo la aporta su propia ilustración (anfiteatro, puesto avanzado, Olimpo),
 * así que aquí NO se construye arquitectura: solo el disco de luz que la asienta y le da color de modo.
 * Cualquier geometría más competiría con el dibujo en lugar de acompañarlo.
 */
export function ModePedestal({ position, accentColor, scale, lite = false }: IModePedestalProps) {
  const color = useMemo(() => new THREE.Color(accentColor), [accentColor]);

  return (
    <group position={position} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[2.34, 2.5, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Anillo interior tenue: da profundidad al halo sin encender otra luz. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.5, 1.56, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      {!lite ? <pointLight position={[0, 0.6, 0]} color={color} intensity={5} distance={7} /> : null}
    </group>
  );
}
